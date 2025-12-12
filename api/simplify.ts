import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const languageNames: Record<string, string> = {
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

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: 'application/octet-stream', data: dataUrl };
}

function extractJsonFromResponse(text: string): { simplifiedText: string; glossary: Array<{term: string; definition: string}> } {
  let cleaned = text.trim();
  
  cleaned = cleaned.replace(/^\uFEFF/, '');
  
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  cleaned = cleaned.trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const simpleMatch = cleaned.match(/"simplifiedText"\s*:\s*"([^"]+)"/);
    const glossaryMatch = cleaned.match(/"glossary"\s*:\s*\[([^\]]*)\]/);
    
    if (simpleMatch) {
      return {
        simplifiedText: simpleMatch[1],
        glossary: []
      };
    }
    
    throw new Error('Unable to extract JSON from response');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { imageBase64, language = 'en', fileName } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'API key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const languageName = languageNames[language] || "English";

    const { mimeType, data: base64Data } = parseDataUrl(imageBase64);
    
    const isPDF = mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');
    
    if (!isPDF && !isImage) {
      return res.status(400).json({ message: 'Unsupported file type. Only images and PDFs are allowed.' });
    }

    const estimatedSize = (base64Data.length * 3) / 4;
    const maxSize = 8 * 1024 * 1024;
    if (estimatedSize > maxSize) {
      return res.status(400).json({ 
        message: 'File is too large. Please upload a file smaller than 8MB or split the PDF into smaller parts.' 
      });
    }

    const extractPrompt = isPDF
      ? `Extract ALL text from this PDF document. Return ONLY the raw text content, preserving the structure and formatting. Do not add any commentary or analysis.`
      : `Extract ALL text from this document image. Return ONLY the raw text content, preserving the structure and formatting. Do not add any commentary or analysis.`;

    const extractResponse = await ai.models.generateContent({
      model: "models/gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: extractPrompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    });

    const extractedText = extractResponse.text?.trim();

    if (!extractedText || extractedText.length < 10) {
      return res.status(400).json({
        message: "Could not extract text from the document. Please ensure the document is clear and contains readable text.",
      });
    }

    const systemPrompt = `You are an expert document simplifier specializing in government and legal documents. Your task is to:

1. Take complex government/legal text and convert it into simple, easy-to-understand language
2. Preserve ALL original meaning - do not add or remove any information
3. Break down complex sentences into shorter, clearer ones
4. Convert official tone to conversational, friendly tone
5. Identify and explain ALL difficult terms, numbers, dates, amounts, and reference numbers

CRITICAL RULES:
- Do NOT hallucinate or add any information not present in the original
- Do NOT remove any important details
- Maintain 100% accuracy of the original meaning
- Use simple vocabulary that anyone can understand
- ALL OUTPUT MUST BE IN ${languageName.toUpperCase()} LANGUAGE (including glossary definitions)

Output the ENTIRE response in ${languageName} language. This includes:
- The simplified text must be in ${languageName}
- ALL glossary terms and their definitions must be in ${languageName}
- Even if the term is a number or date, the definition/explanation must be in ${languageName}

Respond with JSON in this exact format:
{
  "simplifiedText": "The simplified version in ${languageName}",
  "glossary": [
    {"term": "difficult term", "definition": "simple explanation in ${languageName}"}
  ]
}

GLOSSARY REQUIREMENTS (5-15 items, ALL IN ${languageName.toUpperCase()}):
- Include ALL difficult legal/technical terms with simple explanations in ${languageName}
- Include ALL important numbers (amounts, fees, percentages) with explanation in ${languageName}
- Include ALL important dates with their significance in ${languageName}
- Include reference numbers, case numbers, document IDs with their meaning in ${languageName}
- Include any acronyms or abbreviations with full forms in ${languageName}`;

    const simplifyResponse = await ai.models.generateContent({
      model: "models/gemini-2.0-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            simplifiedText: { type: "string" },
            glossary: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  term: { type: "string" },
                  definition: { type: "string" },
                },
                required: ["term", "definition"],
              },
            },
          },
          required: ["simplifiedText", "glossary"],
        },
      },
      contents: `Please simplify the following government/legal document text. Remember: ALL output including glossary definitions must be in ${languageName}:\n\n${extractedText}`,
    });

    let rawJson = simplifyResponse.text;
    if (!rawJson) {
      return res.status(500).json({ message: "Empty response from AI model" });
    }

    let data;
    try {
      data = extractJsonFromResponse(rawJson);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", rawJson);
      return res.status(500).json({ message: "Failed to parse AI response" });
    }

    const response = {
      originalText: extractedText,
      simplifiedText: data.simplifiedText || "Unable to simplify the document.",
      glossary: Array.isArray(data.glossary) ? data.glossary : [],
      targetLanguage: language,
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        await supabase.from("documents").insert({
          original_text: response.originalText,
          simplified_text: response.simplifiedText,
          target_language: response.targetLanguage,
          glossary: response.glossary,
          file_name: fileName || null,
          expires_at: expiresAt.toISOString(),
        });
      } catch (saveError) {
        console.error("Failed to save document:", saveError);
      }
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Simplify error:", error);
    const message = error instanceof Error ? error.message : "Failed to process document";
    return res.status(500).json({ message });
  }
}
