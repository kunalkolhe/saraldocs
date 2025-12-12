import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

export interface SimplificationResult {
  simplifiedText: string;
  glossary: Array<{ term: string; definition: string }>;
}

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

export async function simplifyDocument(
  originalText: string,
  targetLanguage: string
): Promise<SimplificationResult> {
  const languageName = languageNames[targetLanguage] || "English";

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
    {"term": "कठिन शब्द", "definition": "${languageName} में सरल व्याख्या"},
    {"term": "₹50,000", "definition": "${languageName} में बताएं यह राशि किसके लिए है"},
    {"term": "15/01/2024", "definition": "${languageName} में बताएं यह तारीख किस लिए महत्वपूर्ण है"},
    {"term": "केस नंबर/संदर्भ संख्या", "definition": "${languageName} में बताएं इस नंबर का क्या मतलब है"}
  ]
}

GLOSSARY REQUIREMENTS (5-15 items, ALL IN ${languageName.toUpperCase()}):
- Include ALL difficult legal/technical terms with simple explanations in ${languageName}
- Include ALL important numbers (amounts, fees, percentages) with explanation in ${languageName}
- Include ALL important dates with their significance in ${languageName}
- Include reference numbers, case numbers, document IDs with their meaning in ${languageName}
- Include any acronyms or abbreviations with full forms in ${languageName}`;

  try {
    const response = await ai.models.generateContent({
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
      contents: `Please simplify the following government/legal document text. Remember: ALL output including glossary definitions must be in ${languageName}:\n\n${originalText}`,
    });

    const rawJson = response.text;

    if (rawJson) {
      const data: SimplificationResult = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(`Failed to simplify document: ${error}`);
  }
}
