import OpenAI from "openai";

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

function getGroqClient(): OpenAI {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not configured. Please set it in your environment.");
  }
  
  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

// Function to chunk text for large documents
function chunkText(text: string, maxChars: number = 8000): string[] {
  const chunks: string[] = [];
  let currentChunk = "";
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      if (paragraph.length > maxChars) {
        // Split very long paragraphs by sentences
        const sentences = paragraph.split(/[।।.\n]/);
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length > maxChars) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence + "।";
          } else {
            currentChunk += sentence + "।";
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk ? "\n" : "") + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function simplifyDocument(
  originalText: string,
  targetLanguage: string
): Promise<SimplificationResult> {
  const groq = getGroqClient();
  const languageName = languageNames[targetLanguage] || "English";

  const systemPrompt = `You are an expert at simplifying government and legal documents into CLEAN, CLEAR, WELL-ORGANIZED text that's easy to understand.

CORE RULES:
1. INCLUDE SUBJECT - Put the document's subject/title at the beginning
2. NO REPETITION - Explain each idea ONCE clearly - do NOT repeat the same point
3. KEEP IMPORTANT DETAILS - Include all reference numbers, codes, dates with simple explanations
4. CLEAR ORGANIZATION - Use headers and logical flow for easy reading
5. SIMPLE LANGUAGE - Use words a child understands, short sentences, everyday examples
6. CONCISE BUT COMPLETE - Remove verbose explanations, avoid repetition, keep it organized
7. NATURAL TONE - Write like talking to a friend, not an official document

OUTPUT FORMAT (MUST BE VALID JSON):
{
  "simplifiedText": "Well-organized, clear, simple text without repetition",
  "glossary": [Important terms, numbers, codes from the document]
}

SIMPLIFICATION STEPS:

1. EXTRACT KEY INFORMATION:
   - What is the subject/topic?
   - What are the main sections or ideas?
   - What specific numbers, dates, references are mentioned?
   - What are the main problems or issues?
   - What actions/requirements are needed?

2. ORGANIZE WITH CLEAR STRUCTURE:
   Use simple headers like:
   - "What is this about?"
   - "Important Details"
   - "What the document says"
   - "What needs to happen"
   - "Key reference numbers"

3. WRITE SIMPLY (NO REPETITION):
   - Explain each section ONE TIME clearly
   - Include all important numbers and explain what they mean
   - Use examples and context
   - Do NOT repeat the same idea multiple times
   - Keep sentences short and simple
   - One main idea per paragraph

LANGUAGE STYLE:
- Use SIMPLE, child-friendly words
- Use SHORT, clear sentences
- Explain technical terms: "परिपत्रक (which means circular or official order)"
- Include dates/numbers with context: "29 June 2020 (that year)", "30 days (one month)"
- Use connecting words: "which means", "for example", "because", "so that"
- Write natural paragraphs - NOT bullet points or lists
- One main idea per paragraph

WHAT TO INCLUDE:
✓ Subject/title at the beginning
✓ All important numbers, codes, dates (with clear explanations)
✓ All department names (explain what they do)
✓ All main rules or requirements (explain in simple terms)
✓ All specific problems mentioned (explain simply)
✓ Why this document matters
✓ Document date and key details

WHAT TO AVOID:
✗ Repetition of the same idea
✗ Verbose or flowery language
✗ Repeating reference numbers unnecessarily
✗ Repeating department names multiple times
✗ Repeating the same explanation
✗ Formal or official tone
✗ Too much detail - keep it organized and readable

EXAMPLE - CLEAN AND ORGANIZED:

Original: "Circular मभावा-२०१९/प्र.क्र.२२/भाषा-२ issued on 29 June 2020 by Maharashtra Government directs that all government offices must utilize Marathi language. Previously, circulars मभावा-१०७९/२८ (1979), मभावा-१०८०/प्र.क्र.५४/२० (1982) were issued. Government offices have not been following this. Complaints come through 'Our Government' system."

Simplified: "SUBJECT: Government offices must use Marathi language

WHAT IS THIS ABOUT?
The government gave an official order (called a circular) on 29 June 2020. The order number is मभावा-२०१९/प्र.क्र.२२/भाषा-२. This order tells all government offices to use the Marathi language in their work.

WHY IS THIS IMPORTANT?
Marathi is the local language of Maharashtra. When officials use Marathi, people understand the government better. This rule has been given before - in 1979, 1982, and many other times - but many offices still don't follow it.

WHAT SHOULD OFFICES DO?
All government offices must:
- Speak Marathi to visitors
- Write official papers in Marathi
- Use Marathi in communications

WHEN OFFICES DON'T FOLLOW THE RULE
If an office doesn't use Marathi, people can complain through:
- 'Our Government' system
- Other channels"

GLOSSARY RULES:
- Include EVERY important number, code, date from the original
- Include key terms (departments, titles, official words)
- Define each in 1 simple sentence
- No repetition
- Order: Numbers/codes first, then terms
- Examples:
  * "मभावा-२०१९/प्र.क्र.२२/भाषा-२" → "The reference number for this official order"
  * "29 June 2020" → "The date this order was given"
  * "Marathi language" → "The official language of Maharashtra state"

RESPONSE RULES:
- Start with subject/title
- Use clear sections with simple headers
- Each section explains ONE idea thoroughly
- No repetition of information
- Include all important details but organize them clearly
- Make it easy to read and understand`;

  try {
    // For very large documents, use optimized settings
    const textLength = originalText.length;
    const maxTokens = textLength > 15000 ? 5000 : 6000;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: maxTokens,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `IMPORTANT: You MUST respond with ONLY valid JSON, nothing else. No markdown, no code blocks, no text outside the JSON object.

CRITICAL REQUIREMENTS:
1. Include the document's subject/title at the beginning
2. Use CLEAR SECTIONS with simple headers
3. Explain each idea ONCE - no repetition
4. Include all important numbers, codes, dates with explanations
5. Keep it organized, simple, and easy to read
6. Respond ONLY in ${languageName}

Please simplify this government document in clear, simple language:\n\n${originalText}`,
        },
      ],
    });

    const rawContent = response.choices[0].message.content || "";

    if (!rawContent) {
      throw new Error("Empty response from model");
    }

    let data: SimplificationResult;
    
    try {
      // First try: Direct JSON parse
      data = JSON.parse(rawContent);
    } catch {
      try {
        // Second try: Extract from markdown code block
        const codeBlockMatch = rawContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (codeBlockMatch) {
          data = JSON.parse(codeBlockMatch[1]);
        } else {
          // Third try: Extract JSON object {...}
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            data = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback: Create response with simplified text as-is
            console.warn("Could not parse JSON response, using fallback");
            data = {
              simplifiedText: rawContent,
              glossary: [
                {
                  term: "Note",
                  definition: "The AI model returned text instead of structured glossary. Please review the simplified text above.",
                }
              ]
            };
          }
        }
      } catch (innerError) {
        // Final fallback if all parsing fails
        console.warn("All JSON parsing attempts failed, using text as fallback:", innerError);
        data = {
          simplifiedText: rawContent,
          glossary: [
            {
              term: "Note",
              definition: "Document was simplified but structured glossary could not be generated.",
            }
          ]
        };
      }
    }

    return data;
  } catch (error) {
    console.error("Groq API error:", error);
    throw new Error(`Failed to simplify document: ${error}`);
  }
}
