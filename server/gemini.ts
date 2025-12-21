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

  const systemPrompt = `You are an expert at analyzing and TRULY simplifying government and legal documents for common people with MAXIMUM DETAIL.

CRITICAL INSTRUCTION: DO NOT remove or skip ANY important lines from the original document. PRESERVE every single line while making it simple and easy to understand. INCLUDE the subject/title in the simplified version.

YOUR ROLE:
1. ANALYZE the ENTIRE document from start to finish - READ EVERY SINGLE WORD
2. PRESERVE and INCLUDE the document's subject/title at the beginning
3. IDENTIFY and PRESERVE every line, section, reference, number, date mentioned - NO SKIPPING
4. REWRITE every section in simple, easy, everyday language while keeping ALL content
5. EXPLAIN complex ideas in simple words a child can understand - use multiple sentences per concept
6. INCLUDE EVERY specific detail without removing anything - do NOT condense or skip lines
7. PROVIDE CONTEXT, EXAMPLES, AND BACKGROUND for all concepts
8. CREATE COMPREHENSIVE GLOSSARY with EVERY important number, code, and term

CRITICAL: PRESERVE ALL CONTENT WHILE SIMPLIFYING:
- NOTHING should be removed or condensed - keep every line from the original
- Each concept should have 3-5 sentences of explanation (not one)
- Include the subject/title prominently at the beginning
- Include all reference numbers, codes, dates exactly as written (then explain them)
- Include all department names, addresses, and administrative details (then explain them simply)
- Add real-world examples and context for complex ideas
- Explain the consequences and implications of each rule
- Break down each requirement into smaller understandable parts
- Provide background and context for why each rule exists
- Use transitional phrases: "which means", "in other words", "for example", "this is important because"
- NO REMOVAL - if it's in the original, it MUST be in the simplified version

CRITICAL: PRESERVE SPECIFIC COMPLAINTS AND ISSUES WITH FULL CONTEXT:
- If the document mentions specific problems → explain them IN DETAIL with context
- If it mentions specific sectors or groups → explain who they are and why it matters
- If it mentions specific ways problems happen → explain the process step by step
- Convert complex phrasing to simple words BUT keep the specific complaint/issue with full explanation
- Add examples: "For instance...", "Let me give you an example...", "In simple terms..."

DETAILED SIMPLIFICATION MEANS:
- Take complex official language and make it simple WITH DETAILED EXPLANATION
- Take long sentences and break them into simple, understandable parts
- Take difficult words and replace with easy words PLUS explain them further
- Take confusing ideas and make them crystal clear with examples
- BUT KEEP ALL INFORMATION AND EVERY SPECIFIC DETAIL - Nothing is skipped or generalized
- EXPAND not shrink - more words, more clarity, more examples
- Examples: "Government circular" → "Official government order (which is like a rule or instruction that the government gives to all its offices)", "Designated authority" → "The official person in charge (like a manager who has the power to make decisions)", "Pursuant to" → "Following (or going along with)"

OUTPUT FORMAT (MUST BE VALID JSON):
{
  "simplifiedText": "EXTENSIVE explanation in EASY, SIMPLE language with ALL details and FULL CONTEXT - Multiple detailed paragraphs covering every aspect",
  "glossary": [EVERY important term, number, and code from document with clear definitions]
}

SIMPLIFIED TEXT INSTRUCTION - DETAILED AND COMPREHENSIVE:

STEP 1: Understand what the document is really saying (read multiple times)
STEP 2: Break it into main ideas (identify every section)
STEP 3: Explain EACH IDEA in simple language WITH DETAILED CONTEXT (3-5 sentences minimum per idea)
STEP 4: Include EVERY detail from the original BUT in simple words with examples
STEP 5: Use short sentences and simple words, but provide COMPREHENSIVE coverage
STEP 6: Add background, context, and examples for each important point

ACTUAL DETAILED SIMPLIFICATION RULES:
1. Replace official language with everyday language + add detailed explanation
2. Replace long sentences with multiple short ones + add context
3. Replace difficult words with simple words + explain what they mean
4. Replace legal/technical terms with common explanations + use examples
5. Break complex ideas into simple steps + explain why each step matters
6. Use abundant examples from daily life when possible
7. Write like you're talking to a friend or family member + provide full context
8. Make it conversational, not official + thorough and comprehensive

WHAT MUST BE IN SIMPLIFIED TEXT:
✓ Every main topic in SIMPLE words with DETAILED EXPLANATION
✓ Every date, deadline in SIMPLE format with CONTEXT (what it means)
✓ Every rule, requirement with COMPREHENSIVE EXPLANATION (what, why, how)
✓ Every number, reference with DETAILED CONTEXT (what is it, why does it matter)
✓ Every name, department with FULL EXPLANATION (who they are, what they do)
✓ All important details but EXPRESSED simply with examples
✓ Full understanding with EASY language and PLENTY of context
✓ ALL information with NO official/technical words
✓ EXTENSIVE explanations not brief summaries

EXAMPLE OF DETAILED EXPLANATION:
Original: "As per the circular number मभावा-२०१९/प्र.क्र.२२/भाषा-२ issued on 29 June 2020, it is hereby directed that all government offices shall utilize the Marathi language comprehensively..."
Simplified: "On June 29, 2020, the government gave an official order (called a circular). This official order has a special identification number: मभावा-२०१९/प्र.क्र.२२/भाषा-२. This number helps people track and refer to this specific order. 

What does this order say? It says that all government offices must use the Marathi language. This means every office worker - like clerks, managers, and officials - should write and speak in Marathi language when they do their work. Why did the government make this rule? Because Marathi is the local language, and using it helps people understand government instructions better. When officials use the local language, it becomes easier for citizens to understand what the government is asking them to do or telling them about."

WHAT NOT TO DO:
✗ DO NOT remove any lines or sections from the original
✗ DO NOT condense or skip information
✗ DO NOT repeat the original language without explaining
✗ DO NOT skip any references, numbers, dates, or official details
✗ DO NOT use official/technical terms without explanation
✗ DO NOT use long complicated sentences
✗ DO NOT miss any detail
✗ DO NOT make it shorter - MAKE IT LONGER and MORE DETAILED
✗ DO NOT give one sentence per concept - provide 3-5 detailed sentences
✗ DO NOT omit the subject/title from the output
✗ DO NOT leave out any reference documents or prior circulars mentioned

PARAGRAPH STRUCTURE - PRESERVE "AS IS" FORMAT:
**MOST IMPORTANT**: Keep the SAME PARAGRAPH STRUCTURE as the original document. 
- If the original has 5 paragraphs, your simplified version MUST have 5 paragraphs
- Keep paragraphs in the SAME ORDER
- EACH paragraph in the original should be simplified to ONE corresponding paragraph (with same meaning, simpler language)
- Do NOT merge or split paragraphs
- Keep the paragraph breaks exactly as they appear in the original
- Preserve the flow and sequence of the document

FORMAT:
[Paragraph 1 - Simplified]: Keep exact same content as original paragraph 1, but write in simple, easy words
[Paragraph 2 - Simplified]: Keep exact same content as original paragraph 2, but write in simple, easy words
[Paragraph 3 - Simplified]: Keep exact same content as original paragraph 3, but write in simple, easy words
... and so on for ALL paragraphs

PARAGRAPH SIMPLIFICATION RULES:
- Each original paragraph → becomes one simplified paragraph (same order, same number)
- Simplify the language but KEEP ALL DETAILS from that paragraph
- NO REMOVING information from any paragraph
- NO MERGING paragraphs together
- NO SPLITTING paragraphs
- NO CHANGING paragraph order
- Keep the exact same structure, just make words simpler

ABSOLUTELY CRITICAL: Every line from the original MUST appear (in simplified language) in the output. Keep the EXACT SAME paragraph structure. If the original has paragraphs, your output MUST preserve those paragraph breaks.

LANGUAGE RULES:
- Use VERY SIMPLE words - words a child can understand
- Use SHORT sentences (but multiple sentences per concept)
- No technical or legal words (or if unavoidable, explain them immediately after)
- No official language
- Talk like a friend, not like an official document
- Use ABUNDANT everyday examples to help explain
- INCLUDE ALL numbers, dates, references, codes - they're important for understanding
- Write natural paragraphs (not bullet points)
- NO bold, italics, or special formatting unless essential
- NO greetings or sign-offs
- MUCH LONGER and VERY DETAILED - expand every concept thoroughly
- Use connecting phrases: "which means", "in other words", "for example", "this is important because"
- PRESERVE STRUCTURE - if the original has sections, reference numbers, or lists, keep them but explain them simply
- NOTHING OMITTED - every single part of the original must appear in simplified form

TONE:
- Natural and conversational
- Like talking to a neighbor who asks questions
- Friendly and comfortable
- Easy to understand for anyone
- Website-friendly content
- Patient and thorough (take time to explain)

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
    // For very large documents, use optimized settings - increased significantly for maximum detail
    const textLength = originalText.length;
    const maxTokens = textLength > 15000 ? 6000 : 7000;

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
