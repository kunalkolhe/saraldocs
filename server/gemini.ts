import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Using Google Gemini AI for document simplification
// Note that the newest Gemini model series is "gemini-2.5-flash"
// do not change this unless explicitly requested by the user

let ai: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Please add your GOOGLE_API_KEY to continue.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export interface VisionOcrResult {
  text: string;
  detectedLanguage: string;
}

export async function extractTextWithVision(
  fileData: string,
  mimeType: string
): Promise<VisionOcrResult> {
  const client = getGeminiClient();
  
  const base64Match = fileData.match(/^data:[^;]+;base64,(.+)$/);
  const base64Data = base64Match ? base64Match[1] : fileData;
  
  const prompt = `Extract ALL text from this document image/PDF exactly as it appears. 
Include every word, number, date, and symbol visible in the document.
Preserve the original structure and formatting as much as possible.
Do not summarize or skip any content - extract EVERYTHING.
If text is in multiple languages, extract all of them.
Output only the extracted text, nothing else.`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const extractedText = response.text?.trim() || "";
    
    if (!extractedText || extractedText.length < 10) {
      throw new Error("Could not extract text from the document. The image may be unclear.");
    }

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
    const marathiPattern = /[\u0900-\u097F]/;

    if (hindiPattern.test(extractedText) || marathiPattern.test(extractedText)) detectedLanguage = "hi";
    else if (tamilPattern.test(extractedText)) detectedLanguage = "ta";
    else if (teluguPattern.test(extractedText)) detectedLanguage = "te";
    else if (bengaliPattern.test(extractedText)) detectedLanguage = "bn";
    else if (gujaratiPattern.test(extractedText)) detectedLanguage = "gu";
    else if (kannadaPattern.test(extractedText)) detectedLanguage = "kn";
    else if (malayalamPattern.test(extractedText)) detectedLanguage = "ml";
    else if (punjabiPattern.test(extractedText)) detectedLanguage = "pa";
    else if (odiaPattern.test(extractedText)) detectedLanguage = "or";
    else if (urduPattern.test(extractedText)) detectedLanguage = "ur";

    return {
      text: extractedText,
      detectedLanguage,
    };
  } catch (error) {
    console.error("Gemini Vision OCR error:", error);
    const message = error instanceof Error ? error.message : "Failed to extract text from document.";
    throw new Error(message);
  }
}

interface DocumentSection {
  heading: string;
  content: string;
}

interface SimplificationResult {
  simplifiedText: string;
  sections: DocumentSection[];
  glossary: { term: string; definition: string }[];
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  gu: "Gujarati",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  bn: "Bengali",
  pa: "Punjabi",
  or: "Odia",
  ur: "Urdu",
};

export async function simplifyDocument(
  text: string,
  targetLanguage: string
): Promise<SimplificationResult> {
  const langName = LANGUAGE_NAMES[targetLanguage] || "English";

  const systemPrompt = `You are an expert at simplifying complex government, legal, and official documents for common people.
You help common people understand complex government and legal documents by rewriting them in simple ${langName} language while preserving ALL information.
You organize the simplified content into clear sections with proper headings for easy reading.
Respond only with valid JSON.`;

  const prompt = `Your task is to:
1. Rewrite the following document text in VERY SIMPLE, easy-to-understand ${langName} language
2. ORGANIZE the content into CLEAR SECTIONS with descriptive headings
3. Each section should have a clear heading that describes what that part is about
4. Break long sentences into shorter ones
5. Replace complex terminology with simple words
6. PRESERVE 100% of the original information - do NOT remove or add any content
7. Identify difficult/technical terms and provide clear definitions in the glossary
8. Include IMPORTANT NUMBERS in the glossary (like amounts, fees, reference numbers, form numbers, application numbers, account numbers, percentages, quantities) with their meaning/context

SECTION STRUCTURE:
- Create logical sections based on the document content (e.g., "Document Details", "About This Document", "Important Information", "What You Need to Do", "Key Dates", "Amounts and Fees", etc.)
- Each section should have a clear, simple heading
- The content under each section should be easy to read

IMPORTANT RULES:
- Do NOT add any information that wasn't in the original
- Do NOT remove any information from the original
- Keep all dates, numbers, names, and specific details exactly as they are
- Make it understandable for someone with basic education
- Output in ${langName} language
- Create at least 2-5 sections with meaningful headings
- In glossary, DO NOT include: page numbers, serial numbers, dates, or trivial numbers
- In glossary, DO include: monetary amounts (like ₹5000, $100), percentages (like 18% GST), reference/form numbers (like Form 16, ITR-1), important quantities

Respond with JSON in this exact format:
{
  "simplifiedText": "The complete simplified version as plain text for backwards compatibility",
  "sections": [
    {"heading": "Section Heading in ${langName}", "content": "The simplified content for this section in ${langName}"},
    {"heading": "Another Section Heading", "content": "Content for this section"}
  ],
  "glossary": [
    {"term": "term from document", "definition": "simple explanation"}
  ]
}

GLOSSARY RULES:
- Only include terms/numbers that ACTUALLY appear in the document
- Include technical terms that need explanation
- Include important amounts, percentages, reference numbers found in the document
- Do NOT include page numbers, dates, or trivial numbers
- Do NOT add any terms that are not in the original document

Document to simplify:
${text}`;

  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const content = response.text;
    if (!content) {
      throw new Error("No response from AI");
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error("AI response was malformed. Please try again.");
        }
      } else {
        throw new Error("AI response was malformed. Please try again.");
      }
    }

    if (!result.simplifiedText || result.simplifiedText.trim().length === 0) {
      throw new Error("AI failed to simplify the document. Please try again.");
    }

    return {
      simplifiedText: result.simplifiedText,
      sections: Array.isArray(result.sections) ? result.sections : [],
      glossary: Array.isArray(result.glossary) ? result.glossary : [],
    };
  } catch (error) {
    console.error("Gemini simplification error:", error);
    const message = error instanceof Error ? error.message : "Failed to simplify document. Please try again.";
    throw new Error(message);
  }
}

export async function translateDocument(
  originalText: string,
  simplifiedText: string,
  glossary: { term: string; definition: string }[],
  targetLanguage: string,
  sections?: DocumentSection[]
): Promise<SimplificationResult> {
  const langName = LANGUAGE_NAMES[targetLanguage] || "English";

  const systemPrompt = `You are a translation expert specializing in ${langName}. 
Translate document content while keeping it simple and accessible. 
Respond only with valid JSON.`;

  const sectionsToTranslate = sections && sections.length > 0 ? sections : [];

  const prompt = `Translate the following simplified document, sections, and glossary to ${langName}.

IMPORTANT RULES:
- Preserve ALL information exactly
- Keep numbers, dates, and proper nouns unchanged
- Translate the glossary terms and definitions too
- Translate section headings and content
- Keep the text simple and easy to understand
- Use proper paragraph breaks for readability
- Keep important numbers (amounts, reference numbers, percentages) in the glossary with their translated explanations

Respond with JSON in this exact format:
{
  "simplifiedText": "The translated simplified text with proper paragraphs in ${langName}",
  "sections": [
    {"heading": "Translated section heading", "content": "Translated section content"}
  ],
  "glossary": [
    {"term": "translated term", "definition": "translated definition"}
  ]
}

Note: Translate all sections and glossary terms from the original. Keep important numbers unchanged but translate their explanations.

Simplified Text to translate:
${simplifiedText}

Sections to translate:
${JSON.stringify(sectionsToTranslate)}

Glossary to translate:
${JSON.stringify(glossary)}`;

  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const content = response.text;
    if (!content) {
      throw new Error("No response from AI");
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI translation response:", content);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error("AI translation response was malformed. Please try again.");
        }
      } else {
        throw new Error("AI translation response was malformed. Please try again.");
      }
    }

    if (!result.simplifiedText || result.simplifiedText.trim().length === 0) {
      throw new Error("AI failed to translate the document. Please try again.");
    }

    return {
      simplifiedText: result.simplifiedText,
      sections: Array.isArray(result.sections) ? result.sections : sectionsToTranslate,
      glossary: Array.isArray(result.glossary) ? result.glossary : glossary,
    };
  } catch (error) {
    console.error("Gemini translation error:", error);
    const message = error instanceof Error ? error.message : "Failed to translate document. Please try again.";
    throw new Error(message);
  }
}
