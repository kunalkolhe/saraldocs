import Tesseract from "tesseract.js";
import * as fs from "fs";
import * as path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const languageMap: Record<string, string> = {
  en: "eng",
  hi: "hin",
  mr: "mar",
  gu: "guj",
  ta: "tam",
  te: "tel",
  kn: "kan",
  ml: "mal",
  bn: "ben",
  pa: "pan",
  or: "ori",
  ur: "urd",
};

export async function extractTextFromImage(
  imagePath: string,
  targetLanguage: string = "en"
): Promise<string> {
  const tesseractLang = languageMap[targetLanguage] || "eng";
  
  try {
    const result = await Tesseract.recognize(imagePath, tesseractLang, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    return result.data.text.trim();
  } catch (error) {
    console.error("OCR error:", error);
    throw new Error(`Failed to extract text from image: ${error}`);
  }
}

export async function extractTextFromPDF(
  pdfPath: string,
  targetLanguage: string = "en"
): Promise<string> {
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: pdfBuffer });
    const result = await parser.getText();
    
    const extractedText = result.text.trim();
    
    if (extractedText && extractedText.length > 10) {
      return extractedText;
    }
    
    throw new Error("No readable text found in PDF. The PDF might be scanned/image-based. Please convert to image format.");
  } catch (error) {
    console.error("PDF text extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : error}`);
  }
}

export function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff"].includes(ext);
}

export function isPDFFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ext === ".pdf";
}
