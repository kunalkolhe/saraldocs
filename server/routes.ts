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
import { isSupabaseConfigured, getSupabase } from "./supabase";

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

        // Check if text is too large and handle it gracefully
        if (extractedText.length > 50000) {
          console.warn("Large document detected:", extractedText.length, "characters");
        }

        let simplificationResult;
        try {
          simplificationResult = await simplifyDocument(extractedText, language);
        } catch (error) {
          console.error("Simplification error:", error);
          fs.unlinkSync(tempFilePath);
          return res.status(500).json({ 
            message: error instanceof Error ? error.message : "Failed to analyze document" 
          });
        }

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
      
      // Handle specific errors gracefully
      let errorMessage = "Failed to process document";
      if (error instanceof Error) {
        if (error.message.includes("rate_limit")) {
          errorMessage = "API rate limit reached. Please wait a moment and try again.";
        } else if (error.message.includes("token")) {
          errorMessage = "Document is too large to process. Please upload a smaller document.";
        } else {
          errorMessage = error.message;
        }
      }
      
      res.status(500).json({ message: errorMessage });
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

  app.delete("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments(1000);
      for (const doc of documents) {
        await storage.deleteDocument(doc.id);
      }
      res.json({ success: true, deletedCount: documents.length });
    } catch (error) {
      console.error("Clear all documents error:", error);
      res.status(500).json({ message: "Failed to clear documents" });
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
      
      // Check if result data is valid before processing
      if (!result.simplifiedText || result.simplifiedText.trim().length === 0) {
        return res.status(400).json({ message: "No simplified text available to download" });
      }

      let createCanvas: any;
      let registerFont: any;
      
      try {
        const canvasModule = await import("canvas");
        createCanvas = canvasModule.createCanvas;
        registerFont = canvasModule.registerFont;
      } catch (importError) {
        console.error("Canvas import error:", importError);
        return res.status(500).json({ message: "Image generation library not available" });
      }
      
      // Register Noto Sans Devanagari font for Indian scripts
      try {
        registerFont(path.join(process.cwd(), "fonts", "NotoSansDevanagari-Regular.ttf"), {
          family: "NotoSansDevanagari"
        });
      } catch (fontError) {
        console.warn("Could not register Devanagari font:", fontError);
      }
      
      const padding = 40;
      const lineHeight = 28;
      const maxWidth = 1200;
      const fontSize = 11;
      const contentWidth = maxWidth - padding * 2;
      
      // Temporary canvas for measuring text
      const tempCanvas = createCanvas(maxWidth, 100);
      const tempCtx = tempCanvas.getContext("2d");
      
      // Try default font first, then with Devanagari fallback
      try {
        tempCtx.font = `${fontSize}px "NotoSansDevanagari", Arial, sans-serif`;
      } catch {
        tempCtx.font = `${fontSize}px Arial, sans-serif`;
      }
      
      // Better text wrapping that handles words and breaks long lines
      const wrapText = (text: string, maxLineWidth: number): string[] => {
        const paragraphs = text.split('\n');
        const lines: string[] = [];
        
        for (const paragraph of paragraphs) {
          if (paragraph.trim() === '') {
            lines.push('');
            continue;
          }
          
          const words = paragraph.split(' ');
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = tempCtx.measureText(testLine);
            
            if (metrics.width > maxLineWidth) {
              if (currentLine) {
                lines.push(currentLine);
              }
              
              // Handle very long words by character breaking
              if (tempCtx.measureText(word).width > maxLineWidth) {
                let charLine = '';
                for (let i = 0; i < word.length; i++) {
                  const charTest = charLine + word[i];
                  if (tempCtx.measureText(charTest).width > maxLineWidth) {
                    if (charLine) lines.push(charLine);
                    charLine = word[i];
                  } else {
                    charLine = charTest;
                  }
                }
                if (charLine) currentLine = charLine;
              } else {
                currentLine = word;
              }
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) lines.push(currentLine);
        }
        return lines;
      };
      
      // Process main text - preserve structure
      const textLines = wrapText(result.simplifiedText, contentWidth);
      
      let glossaryLines: string[] = [];
      if (result.glossary && result.glossary.length > 0) {
        glossaryLines.push("");
        glossaryLines.push("=== DETAILED GLOSSARY ===");
        glossaryLines.push("");
        
        for (const term of result.glossary) {
          const termLabel = `• ${term.term}`;
          glossaryLines.push(termLabel);
          
          const defLines = wrapText(term.definition, contentWidth - 30);
          for (const defLine of defLines) {
            glossaryLines.push(`  ${defLine}`);
          }
          glossaryLines.push("");
        }
      }
      
      const disclaimerText = "DISCLAIMER: This simplified version is for understanding only. Use original document for official purposes.";
      const disclaimerLines = wrapText(disclaimerText, contentWidth);
      
      const totalLines = textLines.length + glossaryLines.length + disclaimerLines.length + 5;
      const canvasHeight = Math.max(700, padding * 2 + totalLines * lineHeight);
      
      const canvas = createCanvas(maxWidth, canvasHeight);
      const ctx = canvas.getContext("2d");
      
      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, maxWidth, canvasHeight);
      
      // Header background
      ctx.fillStyle = "#2c5aa0";
      ctx.fillRect(0, 0, maxWidth, 50);
      
      // Header text
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 20px sans-serif`;
      ctx.fillText("SaralDocs - Simplified", padding, 32);
      
      let y = 80;
      
      // Main text
      ctx.fillStyle = "#000000";
      ctx.font = `${fontSize}px "NotoSansDevanagari", sans-serif`;
      
      for (const line of textLines) {
        ctx.fillText(line, padding, y);
        y += lineHeight;
      }
      
      // Glossary
      if (glossaryLines.length > 0) {
        y += 10;
        ctx.fillStyle = "#2c5aa0";
        ctx.font = `bold 14px "NotoSansDevanagari", sans-serif`;
        
        for (const line of glossaryLines) {
          if (line.includes("GLOSSARY")) {
            ctx.fillText(line, padding, y);
            ctx.fillStyle = "#000000";
            ctx.font = `${fontSize}px "NotoSansDevanagari", sans-serif`;
          } else if (line === "") {
            // Empty line
          } else {
            ctx.fillText(line, padding, y);
          }
          y += lineHeight;
        }
      }
      
      // Disclaimer
      y += 8;
      ctx.fillStyle = "#d97706";
      ctx.font = `${fontSize - 1}px "NotoSansDevanagari", sans-serif`;
      for (const line of disclaimerLines) {
        ctx.fillText(line, padding, y);
        y += lineHeight;
      }
      
      // Watermark
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.font = `bold 48px sans-serif`;
      ctx.save();
      ctx.translate(maxWidth / 2, canvasHeight / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText("SIMPLIFIED", -130, 0);
      ctx.restore();
      
      const buffer = canvas.toBuffer("image/png");
      
      // Ensure headers are set correctly for image download
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", "attachment; filename=simplified-document.png");
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      
      // Send the buffer
      return res.send(buffer);
    } catch (error) {
      console.error("Image generation error:", error);
      
      // Graceful error handling for image generation
      let errorMsg = "Failed to generate image";
      if (error instanceof Error) {
        if (error.message.includes("memory")) {
          errorMsg = "Document is too large to generate image. Try a smaller document.";
        } else if (error.message.includes("canvas")) {
          errorMsg = "Image generation service error. Please try again.";
        }
      }
      
      res.status(500).json({ message: errorMsg });
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

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, full_name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (!isSupabaseConfigured()) {
        return res.status(500).json({ message: "Authentication service not configured" });
      }

      const supabase = getSupabase();
      
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || "",
        },
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      res.json({ user: data.user, message: "Account created successfully" });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  return httpServer;
}
