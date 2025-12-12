import type { Express } from "express";
import { type Server } from "http";
import multer from "multer";
import * as fs from "fs";
import * as path from "path";
import { storage } from "./storage";
import { simplifyDocument } from "./gemini";
import { extractTextFromImage, extractTextFromPDF, isImageFile, isPDFFile } from "./ocr";
import { generatePDF } from "./pdf-generator";
import { suggestionSchema, simplifyResponseSchema } from "@shared/schema";
import type { SimplifyResponse } from "@shared/schema";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, and PDF are allowed."));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/simplify", async (req, res) => {
    try {
      const { imageBase64, language = "en", fileName = "document" } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Extract base64 data (remove data URL prefix if present)
      const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      // Determine file type from the data URL or filename
      const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
      
      // Save to temporary file
      const ext = mimeType.includes("pdf") ? ".pdf" : 
                  mimeType.includes("png") ? ".png" : ".jpg";
      const tempFilePath = path.join(uploadDir, `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
      fs.writeFileSync(tempFilePath, buffer);

      let extractedText = "";

      try {
        if (isImageFile(fileName) || mimeType.startsWith("image/")) {
          extractedText = await extractTextFromImage(tempFilePath, language);
        } else if (isPDFFile(fileName) || mimeType.includes("pdf")) {
          extractedText = await extractTextFromPDF(tempFilePath, language);
        } else {
          fs.unlinkSync(tempFilePath);
          return res.status(400).json({ message: "Unsupported file type" });
        }

        if (!extractedText || extractedText.trim().length < 10) {
          fs.unlinkSync(tempFilePath);
          return res.status(400).json({ 
            message: "Could not extract text from the document. Please ensure the image is clear and contains readable text." 
          });
        }

        const simplificationResult = await simplifyDocument(extractedText, language);

        fs.unlinkSync(tempFilePath);

        const response: SimplifyResponse = {
          originalText: extractedText,
          simplifiedText: simplificationResult.simplifiedText || "Unable to simplify the document.",
          glossary: Array.isArray(simplificationResult.glossary) ? simplificationResult.glossary : [],
          targetLanguage: language,
        };

        const validated = simplifyResponseSchema.safeParse(response);
        if (!validated.success) {
          console.error("Response validation failed:", validated.error);
          return res.status(500).json({ 
            message: "Failed to generate valid simplified document" 
          });
        }

        try {
          await storage.saveDocument({
            originalText: validated.data.originalText,
            simplifiedText: validated.data.simplifiedText,
            targetLanguage: validated.data.targetLanguage,
            glossary: validated.data.glossary,
            fileName: fileName,
            expiresAt: null,
          });
        } catch (saveError) {
          console.error("Failed to save document to history:", saveError);
        }

        res.json(validated.data);
      } catch (innerError) {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        throw innerError;
      }
    } catch (error) {
      console.error("Simplify error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process document" 
      });
    }
  });

  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments(50);
      res.json(documents);
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ message: "Failed to get documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Get document error:", error);
      res.status(500).json({ message: "Failed to get document" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      await storage.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  app.post("/api/download/pdf", async (req, res) => {
    try {
      const validated = simplifyResponseSchema.safeParse(req.body);
      
      if (!validated.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      
      const result = validated.data;

      const pdfBuffer = await generatePDF(result);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=simplified-document.pdf");
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  app.post("/api/download/image", async (req, res) => {
    try {
      const validated = simplifyResponseSchema.safeParse(req.body);
      
      if (!validated.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      
      const result = validated.data;
      const { createCanvas } = await import("canvas");
      
      const padding = 60;
      const lineHeight = 28;
      const maxWidth = 800;
      const fontSize = 16;
      
      const tempCanvas = createCanvas(maxWidth, 100);
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.font = `${fontSize}px Arial`;
      
      const wrapText = (text: string, maxLineWidth: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = tempCtx.measureText(testLine);
          
          if (metrics.width > maxLineWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      };
      
      const textLines = wrapText(result.simplifiedText, maxWidth - padding * 2);
      
      let glossaryLines: string[] = [];
      if (result.glossary && result.glossary.length > 0) {
        glossaryLines.push("");
        glossaryLines.push("--- GLOSSARY ---");
        glossaryLines.push("");
        for (const term of result.glossary) {
          const termLines = wrapText(`${term.term}: ${term.definition}`, maxWidth - padding * 2);
          glossaryLines.push(...termLines);
          glossaryLines.push("");
        }
      }
      
      const disclaimerLines = wrapText(
        "DISCLAIMER: This simplified version is for understanding purposes only. Always use the original document for official purposes.",
        maxWidth - padding * 2
      );
      
      const totalLines = 4 + textLines.length + glossaryLines.length + 3 + disclaimerLines.length;
      const canvasHeight = Math.max(600, padding * 2 + totalLines * lineHeight);
      
      const canvas = createCanvas(maxWidth, canvasHeight);
      const ctx = canvas.getContext("2d");
      
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, maxWidth, canvasHeight);
      
      ctx.fillStyle = "#1a365d";
      ctx.fillRect(0, 0, maxWidth, 60);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px Arial";
      ctx.fillText("SaralDocs - Simplified Document", padding, 40);
      
      let y = 100;
      
      ctx.fillStyle = "#333333";
      ctx.font = `${fontSize}px Arial`;
      
      for (const line of textLines) {
        ctx.fillText(line, padding, y);
        y += lineHeight;
      }
      
      if (glossaryLines.length > 0) {
        y += lineHeight;
        ctx.font = "bold 18px Arial";
        ctx.fillStyle = "#1a365d";
        for (const line of glossaryLines) {
          if (line.includes("GLOSSARY")) {
            ctx.fillText(line, padding, y);
          } else {
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = "#333333";
            ctx.fillText(line, padding, y);
          }
          y += lineHeight;
        }
      }
      
      y += lineHeight;
      ctx.fillStyle = "#d97706";
      ctx.font = `${fontSize - 2}px Arial`;
      for (const line of disclaimerLines) {
        ctx.fillText(line, padding, y);
        y += lineHeight - 4;
      }
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.font = "bold 40px Arial";
      ctx.save();
      ctx.translate(maxWidth / 2, canvasHeight / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText("SIMPLIFIED VERSION", -180, 0);
      ctx.restore();
      
      const buffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });
      
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Disposition", "attachment; filename=simplified-document.jpg");
      res.send(buffer);
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({ message: "Failed to generate image" });
    }
  });

  app.post("/api/suggestions", async (req, res) => {
    try {
      const parsed = suggestionSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid suggestion. Please provide at least 10 characters." 
        });
      }

      const suggestion = await storage.createSuggestion({ message: parsed.data.message });
      res.json(suggestion);
    } catch (error) {
      console.error("Suggestion error:", error);
      res.status(500).json({ message: "Failed to submit suggestion" });
    }
  });

  app.get("/api/suggestions", async (req, res) => {
    try {
      const suggestions = await storage.getSuggestions();
      res.json(suggestions);
    } catch (error) {
      console.error("Get suggestions error:", error);
      res.status(500).json({ message: "Failed to get suggestions" });
    }
  });

  return httpServer;
}
