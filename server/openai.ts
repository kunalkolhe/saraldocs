import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured. Please add your OPENAI_API_KEY to continue.");
  }
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

interface SimplificationResult {
  simplifiedText: string;
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

  const prompt = `You are an expert at simplifying complex government, legal, and official documents for common people.

Your task is to:
1. Rewrite the following document text in VERY SIMPLE, easy-to-understand ${langName} language
2. Break long sentences into shorter ones
3. Replace complex terminology with simple words
4. PRESERVE 100% of the original information - do NOT remove or add any content
5. Identify difficult/technical terms and provide clear definitions

IMPORTANT RULES:
- Do NOT add any information that wasn't in the original
- Do NOT remove any information from the original
- Keep all dates, numbers, names, and specific details exactly as they are
- Make it understandable for someone with basic education
- Output in ${langName} language

Respond with JSON in this exact format:
{
  "simplifiedText": "The complete simplified version of the document in ${langName}",
  "glossary": [
    {"term": "Technical Term", "definition": "Simple explanation of what this means"}
  ]
}

Document to simplify:
${text}`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a document simplification expert. You help common people understand complex government and legal documents by rewriting them in simple ${langName} language while preserving ALL information. Respond only with valid JSON.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    const content = response.choices[0].message.content;
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
      glossary: Array.isArray(result.glossary) ? result.glossary : [],
    };
  } catch (error) {
    console.error("OpenAI simplification error:", error);
    const message = error instanceof Error ? error.message : "Failed to simplify document. Please try again.";
    throw new Error(message);
  }
}

export async function translateDocument(
  originalText: string,
  simplifiedText: string,
  glossary: { term: string; definition: string }[],
  targetLanguage: string
): Promise<SimplificationResult> {
  const langName = LANGUAGE_NAMES[targetLanguage] || "English";

  const prompt = `Translate the following simplified document and glossary to ${langName}.

IMPORTANT RULES:
- Preserve ALL information exactly
- Keep numbers, dates, and proper nouns unchanged
- Translate the glossary terms and definitions too
- Keep the text simple and easy to understand

Respond with JSON in this exact format:
{
  "simplifiedText": "The translated simplified text in ${langName}",
  "glossary": [
    {"term": "Translated Term", "definition": "Translated definition in ${langName}"}
  ]
}

Simplified Text to translate:
${simplifiedText}

Glossary to translate:
${JSON.stringify(glossary)}`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a translation expert specializing in ${langName}. Translate document content while keeping it simple and accessible. Respond only with valid JSON.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    const content = response.choices[0].message.content;
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
      glossary: Array.isArray(result.glossary) ? result.glossary : glossary,
    };
  } catch (error) {
    console.error("OpenAI translation error:", error);
    const message = error instanceof Error ? error.message : "Failed to translate document. Please try again.";
    throw new Error(message);
  }
}
