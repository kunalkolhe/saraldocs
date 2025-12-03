import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { extractTextFromImage, extractTextFromPdf } from "./ocr";
import { simplifyDocument, translateDocument } from "./gemini";
import { isAuthenticated } from "./auth";
import {
  saveFileHistory,
  getUserFileHistory,
  deleteUserFileHistory,
  getFileHistoryById,
  deleteFileHistoryById,
  deleteExpiredHistory,
} from "./supabase";

interface FileData {
  fileData: string;
  fileName: string;
  fileType: string;
}

setInterval(async () => {
  try {
    const deleted = await deleteExpiredHistory();
    if (deleted > 0) {
      console.log(`Deleted ${deleted} expired file history records`);
    }
  } catch (error) {
    console.error("Error cleaning up expired history:", error);
  }
}, 24 * 60 * 60 * 1000);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/process", async (req: Request, res: Response) => {
    try {
      const { fileData, fileName, fileType, targetLanguage } = req.body;
      const userId = req.session?.userId;

      if (!fileData || !fileName || !fileType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      let extractedText: string;
      let detectedLanguage: string;

      if (fileType === "application/pdf") {
        const pdfResult = await extractTextFromPdf(fileData);
        extractedText = pdfResult.text;
        detectedLanguage = pdfResult.detectedLanguage;
      } else if (fileType.startsWith("image/")) {
        const ocrResult = await extractTextFromImage(fileData);
        extractedText = ocrResult.text;
        detectedLanguage = ocrResult.detectedLanguage;
      } else {
        return res.status(400).json({ message: "Unsupported file type" });
      }

      if (!extractedText || extractedText.length < 10) {
        return res.status(400).json({
          message: "Could not extract enough text from the document. Please try a clearer image or PDF.",
        });
      }

      const simplificationResult = await simplifyDocument(
        extractedText,
        targetLanguage || "en"
      );

      const document = await storage.saveDocument({
        originalText: extractedText,
        simplifiedText: simplificationResult.simplifiedText,
        glossary: simplificationResult.glossary,
        sourceLanguage: detectedLanguage,
        targetLanguage: targetLanguage || "en",
        processedAt: new Date().toISOString(),
      });

      if (userId) {
        try {
          await saveFileHistory(
            userId,
            fileName,
            fileType,
            extractedText,
            simplificationResult.simplifiedText,
            simplificationResult.glossary,
            simplificationResult.sections || [],
            detectedLanguage,
            targetLanguage || "en"
          );
        } catch (historyError) {
          console.error("Error saving file history:", historyError);
        }
      }

      res.json({
        id: document.id,
        originalText: document.originalText,
        simplifiedText: document.simplifiedText,
        sections: simplificationResult.sections,
        glossary: document.glossary,
        sourceLanguage: document.sourceLanguage,
        targetLanguage: document.targetLanguage,
        processedAt: document.processedAt,
      });
    } catch (error) {
      console.error("Processing error:", error);
      const message = error instanceof Error ? error.message : "Failed to process document";
      res.status(500).json({ message });
    }
  });

  app.post("/api/process-multiple", async (req: Request, res: Response) => {
    try {
      const { files, targetLanguage } = req.body as { files: FileData[]; targetLanguage: string };
      const userId = req.session?.userId;

      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      if (files.length > 10) {
        return res.status(400).json({ message: "Maximum 10 files allowed at once" });
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          if (!file.fileData || !file.fileName || !file.fileType) {
            errors.push({ index: i, fileName: file.fileName || `File ${i + 1}`, error: "Missing required fields" });
            continue;
          }

          let extractedText: string;
          let detectedLanguage: string;

          if (file.fileType === "application/pdf") {
            const pdfResult = await extractTextFromPdf(file.fileData);
            extractedText = pdfResult.text;
            detectedLanguage = pdfResult.detectedLanguage;
          } else if (file.fileType.startsWith("image/")) {
            const ocrResult = await extractTextFromImage(file.fileData);
            extractedText = ocrResult.text;
            detectedLanguage = ocrResult.detectedLanguage;
          } else {
            errors.push({ index: i, fileName: file.fileName, error: "Unsupported file type" });
            continue;
          }

          if (!extractedText || extractedText.length < 10) {
            errors.push({ index: i, fileName: file.fileName, error: "Could not extract enough text from the document" });
            continue;
          }

          const simplificationResult = await simplifyDocument(
            extractedText,
            targetLanguage || "en"
          );

          const document = await storage.saveDocument({
            originalText: extractedText,
            simplifiedText: simplificationResult.simplifiedText,
            glossary: simplificationResult.glossary,
            sourceLanguage: detectedLanguage,
            targetLanguage: targetLanguage || "en",
            processedAt: new Date().toISOString(),
          });

          if (userId) {
            try {
              await saveFileHistory(
                userId,
                file.fileName,
                file.fileType,
                extractedText,
                simplificationResult.simplifiedText,
                simplificationResult.glossary,
                simplificationResult.sections || [],
                detectedLanguage,
                targetLanguage || "en"
              );
            } catch (historyError) {
              console.error("Error saving file history:", historyError);
            }
          }

          results.push({
            id: document.id,
            fileName: file.fileName,
            originalText: document.originalText,
            simplifiedText: document.simplifiedText,
            sections: simplificationResult.sections,
            glossary: document.glossary,
            sourceLanguage: document.sourceLanguage,
            targetLanguage: document.targetLanguage,
            processedAt: document.processedAt,
          });
        } catch (error) {
          console.error(`Error processing file ${file.fileName}:`, error);
          const errorMessage = error instanceof Error ? error.message : "Failed to process document";
          errors.push({ index: i, fileName: file.fileName, error: errorMessage });
        }
      }

      if (results.length === 0) {
        return res.status(400).json({
          message: "No documents could be processed successfully",
          errors,
        });
      }

      res.json({
        results,
        errors: errors.length > 0 ? errors : undefined,
        totalProcessed: results.length,
        totalFailed: errors.length,
      });
    } catch (error) {
      console.error("Multiple processing error:", error);
      const message = error instanceof Error ? error.message : "Failed to process documents";
      res.status(500).json({ message });
    }
  });

  app.post("/api/translate", async (req: Request, res: Response) => {
    try {
      const { originalText, simplifiedText, glossary, sections, sourceLanguage, targetLanguage } = req.body;

      if (!originalText || !simplifiedText || !targetLanguage) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const translationResult = await translateDocument(
        originalText,
        simplifiedText,
        glossary || [],
        targetLanguage,
        sections || []
      );

      const document = await storage.saveDocument({
        originalText,
        simplifiedText: translationResult.simplifiedText,
        glossary: translationResult.glossary,
        sourceLanguage: sourceLanguage || "en",
        targetLanguage,
        processedAt: new Date().toISOString(),
      });

      res.json({
        id: document.id,
        originalText: document.originalText,
        simplifiedText: document.simplifiedText,
        sections: translationResult.sections,
        glossary: document.glossary,
        sourceLanguage: document.sourceLanguage,
        targetLanguage: document.targetLanguage,
        processedAt: document.processedAt,
      });
    } catch (error) {
      console.error("Translation error:", error);
      const message = error instanceof Error ? error.message : "Failed to translate document";
      res.status(500).json({ message });
    }
  });

  app.get("/api/document/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(document);
    } catch (error) {
      console.error("Get document error:", error);
      res.status(500).json({ message: "Failed to retrieve document" });
    }
  });

  app.get("/api/history", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const history = await getUserFileHistory(user.id);
      res.json(history);
    } catch (error) {
      console.error("Get history error:", error);
      res.status(500).json({ message: "Failed to retrieve history" });
    }
  });

  app.get("/api/history/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const record = await getFileHistoryById(user.id, id);

      if (!record) {
        return res.status(404).json({ message: "History record not found" });
      }

      res.json(record);
    } catch (error) {
      console.error("Get history record error:", error);
      res.status(500).json({ message: "Failed to retrieve history record" });
    }
  });

  app.delete("/api/history", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const success = await deleteUserFileHistory(user.id);

      if (!success) {
        return res.status(500).json({ message: "Failed to clear history" });
      }

      res.json({ message: "History cleared successfully" });
    } catch (error) {
      console.error("Clear history error:", error);
      res.status(500).json({ message: "Failed to clear history" });
    }
  });

  app.delete("/api/history/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const success = await deleteFileHistoryById(user.id, id);

      if (!success) {
        return res.status(404).json({ message: "History record not found" });
      }

      res.json({ message: "History record deleted successfully" });
    } catch (error) {
      console.error("Delete history record error:", error);
      res.status(500).json({ message: "Failed to delete history record" });
    }
  });

  return httpServer;
}
