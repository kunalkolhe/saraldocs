import Tesseract from "tesseract.js";
import { extractTextWithVision } from "./gemini";

const LANGUAGE_CODES: Record<string, string> = {
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

export interface OcrResult {
  text: string;
  confidence: number;
  detectedLanguage: string;
}

function stripDataUri(dataUri: string): string {
  const match = dataUri.match(/^data:[^;]+;base64,(.+)$/);
  if (match) {
    return match[1];
  }
  return dataUri;
}

export async function extractTextFromImage(
  imageData: string
): Promise<OcrResult> {
  try {
    const langCode = "eng+hin+mar+tam+tel+ben+guj+kan+mal+pan+ori+urd";

    const base64Data = stripDataUri(imageData);
    const buffer = Buffer.from(base64Data, "base64");

    const result = await Tesseract.recognize(buffer, langCode, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const text = result.data.text.trim();
    const confidence = result.data.confidence;

    let detectedLanguage = "en";
    const hindiPattern = /[\u0900-\u097F]/;
    const tamilPattern = /[\u0B80-\u0BFF]/;
    const teluguPattern = /[\u0C00-\u0C7F]/;
    const bengaliPattern = /[\u0980-\u09FF]/;
    const gujaratiPattern = /[\u0A80-\u0AFF]/;
    const kannadaPattern = /[\u0C80-\u0CFF]/;
    const malayalamPattern = /[\u0D00-\u0D7F]/;
    const punjabiPattern = /[\u0A00-\u0A7F]/;
    const odiaPattern = /[\u0B00-\u0B7F]/;
    const urduPattern = /[\u0600-\u06FF]/;

    if (hindiPattern.test(text)) detectedLanguage = "hi";
    else if (tamilPattern.test(text)) detectedLanguage = "ta";
    else if (teluguPattern.test(text)) detectedLanguage = "te";
    else if (bengaliPattern.test(text)) detectedLanguage = "bn";
    else if (gujaratiPattern.test(text)) detectedLanguage = "gu";
    else if (kannadaPattern.test(text)) detectedLanguage = "kn";
    else if (malayalamPattern.test(text)) detectedLanguage = "ml";
    else if (punjabiPattern.test(text)) detectedLanguage = "pa";
    else if (odiaPattern.test(text)) detectedLanguage = "or";
    else if (urduPattern.test(text)) detectedLanguage = "ur";

    return {
      text,
      confidence,
      detectedLanguage,
    };
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to extract text from image. Please try a clearer image.");
  }
}

export async function extractTextFromPdf(pdfData: string): Promise<OcrResult> {
  try {
    const pdfParseModule = await import("pdf-parse") as any;
    const pdfParse = pdfParseModule.default || pdfParseModule;
    
    const base64Match = pdfData.match(/^data:[^;]+;base64,(.+)$/);
    const base64Data = base64Match ? base64Match[1] : pdfData;
    const buffer = Buffer.from(base64Data, "base64");
    
    const data = await pdfParse(buffer);
    
    if (data.text && data.text.trim().length > 50) {
      let detectedLanguage = "en";
      const text = data.text;
      
      const hindiPattern = /[\u0900-\u097F]/;
      const tamilPattern = /[\u0B80-\u0BFF]/;
      const teluguPattern = /[\u0C00-\u0C7F]/;
      const bengaliPattern = /[\u0980-\u09FF]/;
      const gujaratiPattern = /[\u0A80-\u0AFF]/;
      const kannadaPattern = /[\u0C80-\u0CFF]/;
      const malayalamPattern = /[\u0D00-\u0D7F]/;
      const punjabiPattern = /[\u0A00-\u0A7F]/;
      const odiaPattern = /[\u0B00-\u0B7F]/;
      const urduPattern = /[\u0600-\u06FF]/;

      if (hindiPattern.test(text)) detectedLanguage = "hi";
      else if (tamilPattern.test(text)) detectedLanguage = "ta";
      else if (teluguPattern.test(text)) detectedLanguage = "te";
      else if (bengaliPattern.test(text)) detectedLanguage = "bn";
      else if (gujaratiPattern.test(text)) detectedLanguage = "gu";
      else if (kannadaPattern.test(text)) detectedLanguage = "kn";
      else if (malayalamPattern.test(text)) detectedLanguage = "ml";
      else if (punjabiPattern.test(text)) detectedLanguage = "pa";
      else if (odiaPattern.test(text)) detectedLanguage = "or";
      else if (urduPattern.test(text)) detectedLanguage = "ur";

      return {
        text: data.text.trim(),
        confidence: 95,
        detectedLanguage,
      };
    }

    console.log("PDF text extraction returned minimal text, trying AI Vision OCR...");
    const visionResult = await extractTextWithVision(pdfData, "application/pdf");
    return {
      text: visionResult.text,
      confidence: 90,
      detectedLanguage: visionResult.detectedLanguage,
    };
  } catch (error) {
    console.error("PDF extraction error, trying AI Vision OCR:", error);
    
    try {
      console.log("Attempting AI Vision OCR for scanned PDF...");
      const visionResult = await extractTextWithVision(pdfData, "application/pdf");
      return {
        text: visionResult.text,
        confidence: 90,
        detectedLanguage: visionResult.detectedLanguage,
      };
    } catch (visionError) {
      console.error("AI Vision OCR also failed:", visionError);
      const message = visionError instanceof Error ? visionError.message : "Failed to extract text from PDF.";
      throw new Error(message);
    }
  }
}
