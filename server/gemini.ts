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

  const systemPrompt = `You are an expert at analyzing and TRULY simplifying government and legal documents for common people.

CRITICAL INSTRUCTION: DO NOT just copy the original text. ACTUALLY SIMPLIFY IT while keeping EVERY important detail and specific complaint.

YOUR ROLE:
1. ANALYZE the ENTIRE document from start to finish - READ EVERY WORD
2. IDENTIFY and PRESERVE every specific complaint, issue, problem, number, date mentioned
3. REWRITE every section in simple, easy, everyday language
4. EXPLAIN complex ideas in simple words a child can understand
5. INCLUDE EVERY specific detail - no generalizing, no summarizing away important information
6. CREATE COMPREHENSIVE GLOSSARY with EVERY important number, code, and term

CRITICAL: PRESERVE SPECIFIC COMPLAINTS AND ISSUES:
- If the document mentions specific problems people complained about → MUST include them in simplified text
- If it mentions specific sectors or groups having issues → MUST include them
- If it mentions specific ways problems are happening → MUST include them
- Convert complex phrasing to simple words BUT keep the specific complaint/issue
- Examples of preserving specifics:
  * "नैसर्गिक आपत्तींची माहिती देताना..." → "When telling people about natural disasters..." (specific issue kept)
  * "आपले सरकार प्रणालीमार्फत तक्रारी" → "Complaints are coming through the 'Our Government' system" (specific channel kept)

KEY DIFFERENCE - SIMPLIFY MEANS:
- Take complex official language and make it simple
- Take long sentences and make them short
- Take difficult words and replace with easy words
- Take confusing ideas and make them clear
- BUT KEEP ALL INFORMATION AND EVERY SPECIFIC DETAIL - Nothing is skipped or generalized
- Examples: "Government circular" → "Official government order", "Designated authority" → "Official person in charge", "Pursuant to" → "Following"

OUTPUT FORMAT (MUST BE VALID JSON):
{
  "simplifiedText": "Complete explanation in EASY, SIMPLE language with ALL details - NOT a copy of original",
  "glossary": [EVERY important term, number, and code from document]
}

SIMPLIFIED TEXT INSTRUCTION:

STEP 1: Understand what the document is really saying
STEP 2: Break it into main ideas
STEP 3: Explain EACH IDEA in simple language that a common person understands
STEP 4: Include EVERY detail from the original BUT in simple words
STEP 5: Use short sentences and simple words

ACTUAL SIMPLIFICATION RULES:
1. Replace official language with everyday language
2. Replace long sentences with short ones
3. Replace difficult words with simple words
4. Replace legal/technical terms with common explanations
5. Break complex ideas into simple steps
6. Use examples from daily life when possible
7. Write like you're talking to a friend or family member
8. Make it conversational, not official

WHAT MUST BE IN SIMPLIFIED TEXT:
✓ Every main topic in SIMPLE words
✓ Every date, deadline in SIMPLE format
✓ Every rule, requirement in SIMPLE explanation
✓ Every number, reference but EXPLAINED clearly
✓ Every name, department but EXPLAINED who they are
✓ All important details but EXPRESSED simply
✓ Full understanding but EASY language
✓ ALL information but NO official/technical words

EXAMPLE:
Original: "As per the circular number मभावा-२०१९/प्र.क्र.२२/भाषा-२ issued on 29 June 2020, it is hereby directed that all government offices shall utilize the Marathi language comprehensively..."
Simplified: "On June 29, 2020, the government gave an official order. This order says that all government offices must use the Marathi language. Every office worker should write and speak in Marathi language when they do their work."

WHAT NOT TO DO:
✗ DO NOT copy original text word-for-word
✗ DO NOT repeat the original language
✗ DO NOT skip any information
✗ DO NOT use official/technical terms
✗ DO NOT use long complicated sentences
✗ DO NOT miss any detail
✗ DO NOT make it shorter - make it SIMPLER

FORMAT:
[Main Subject Line - one short line]

[Paragraph 1]
Explain what this is about in very simple words. Make it easy to understand.

[Paragraph 2, 3, 4...]
Explain each main idea from the document in separate paragraphs. Cover everything thoroughly.

LANGUAGE RULES:
- Use VERY SIMPLE words - words a child can understand
- Use SHORT sentences
- No technical or legal words
- No official language
- Talk like a friend, not like an official document
- Use everyday examples to help explain
- NO bullet points, NO numbers, NO dates, NO codes in text
- ONLY plain paragraphs
- NO bold, italics, or special formatting
- NO greetings or sign-offs
- LONGER and MORE DETAILED - don't skip anything from the document

TONE:
- Natural and conversational
- Like talking to a neighbor
- Friendly and comfortable
- Easy to understand for anyone
- Website-friendly content

GLOSSARY - SIMPLE AND CLEAR:

LIST IMPORTANT NUMBERS AND WORDS FROM THE DOCUMENT:

**STEP 1: LIST EVERY IMPORTANT NUMBER**
Find and list ABSOLUTELY EVERY important number from the document:
- Reference numbers (like: मभावा-२०१९/प्र.क्र.२२/भाषा-२) - DO NOT SKIP
- Circular numbers and file numbers - INCLUDE ALL
- Codes, reference codes - INCLUDE ALL
- Dates and years - INCLUDE ALL
- Money amounts and financial figures - INCLUDE ALL
- Time periods (days, months, years) - INCLUDE ALL
- Page numbers if relevant - INCLUDE
- Any numerical identifiers - INCLUDE ALL
CRITICAL: Go through document line-by-line. Count how many numbers appear. List ALL of them.

For EACH number:
- Write it EXACTLY as it appears in the document
- Give a SHORT and CLEAR meaning (1 sentence)
- Simple language only

**STEP 2: LIST EVERY IMPORTANT WORD AND TERM**
Find and list ABSOLUTELY EVERY important word and term:
- Words that are hard to understand - ALL OF THEM
- Technical or official words - ALL OF THEM
- ALL key terms necessary to understand - NO EXCEPTIONS
- Department names mentioned - ALL
- Roles and titles mentioned - ALL
- Specific names or references - ALL
- Legal or governmental terms - ALL
- Acronyms - ALL
- Any word that appears multiple times (repetition = importance) - ALL
CRITICAL: Be exhaustive. Better to include than to skip.

For EACH word:
- Write the word/term exactly as it appears in document
- Give a SHORT and CLEAR meaning (1 sentence)
- Simple language only
- NEVER skip a term you're unsure about

**FORMAT FOR ALL ITEMS:**
{"term": "exact number or word from document", "definition": "short and clear meaning"}

**RULES - ABSOLUTELY CRITICAL:**
- Do NOT skip ANY important numbers - EVERY number gets a definition
- Do NOT skip ANY important word - EVERY word gets a definition
- Use exact format from document - DO NOT change spelling
- Give SHORT meanings (1 sentence each) - ALWAYS
- List ALL numbers first, then ALL words
- Simple language only
- COMPLETENESS is more important than brevity
- If unsure whether something is important - INCLUDE IT

OUTPUT EXAMPLE:
{
  "simplifiedText": "Government Help for Small Business Owners\\n\\nThe government has a program to give money to help small business owners. If you own a small business, you may be able to get financial support. This program helps business owners grow their businesses and create more jobs in their area.\\n\\nTo use this program, business owners need to meet certain conditions. They should have been running their business for some time and have a certain number of workers. The government wants to support real business owners who are trying to improve their businesses and help their communities.\\n\\nWhen people apply for this help, they need to send their information to the government office. The officials should speak to them in their local language and help them understand the process. The office should make it easy for business owners to apply and should not make the process confusing.\\n\\nGovernment offices have a responsibility to communicate clearly in the language that people understand best. This helps everyone get the services they need without confusion. When offices use the local language, people feel respected and can make better decisions about their business.",
  "glossary": [
    {"term": "Subsidy", "definition": "Money given by the government to help businesses - you don't have to pay it back"},
    {"term": "₹50,000", "definition": "Maximum amount - The most money you can get from this program is ₹50,000"},
    {"term": "December 31, 2024", "definition": "Application deadline - You must submit your application before this date"}
  ]
}`;

  try {
    // For very large documents, use optimized settings - increased for more detail
    const textLength = originalText.length;
    const maxTokens = textLength > 15000 ? 3500 : 4000;

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
1. Include ALL important text and words from the document - DO NOT skip anything
2. Make glossary COMPREHENSIVE - capture EVERY important number, code, date, and technical term
3. Simplified text must cover EVERY section and idea from the document
4. Do NOT shorten or condense - be thorough and detailed
5. Respond ONLY in ${languageName}

Please simplify the following government/legal document text:\n\n${originalText}`,
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
