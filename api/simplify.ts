import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from "openai";
import Tesseract from "tesseract.js";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

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
    
    if (simpleMatch) {
      return {
        simplifiedText: simpleMatch[1],
        glossary: []
      };
    }
    
    throw new Error('Unable to extract JSON from response');
  }
}

async function extractTextFromImage(imagePath: string, targetLanguage: string = "en"): Promise<string> {
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

async function extractTextFromPDF(pdfPath: string, targetLanguage: string = "en"): Promise<string> {
  throw new Error("PDF uploads are not currently supported in the web version. Please convert your PDF to an image (JPG or PNG) and try again.");
}

function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff"].includes(ext);
}

function isPDFFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ext === ".pdf";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let tempFilePath: string | null = null;

  try {
    const { imageBase64, language = 'en', fileName } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'GROQ_API_KEY not configured' });
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const languageName = languageNames[language] || "English";
    const { mimeType, data: base64Data } = parseDataUrl(imageBase64);
    
    const isPDF = mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');
    
    if (!isImage) {
      return res.status(400).json({ message: 'Please upload an image (JPG or PNG). PDF uploads are not currently supported in the web version.' });
    }

    const estimatedSize = (base64Data.length * 3) / 4;
    const maxSize = 8 * 1024 * 1024;
    if (estimatedSize > maxSize) {
      return res.status(400).json({ 
        message: 'File is too large. Please upload a file smaller than 8MB or split the PDF into smaller parts.' 
      });
    }

    // Save base64 to temporary file
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = isPDF ? '.pdf' : (mimeType.includes('png') ? '.png' : '.jpg');
    tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
    fs.writeFileSync(tempFilePath, buffer);

    // Extract text using OCR (Tesseract for images)
    let extractedText = "";
    try {
      if (!isImage) {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        return res.status(400).json({
          message: "PDF uploads are not currently supported in the web version. Please convert your PDF to an image (JPG or PNG) and try again."
        });
      }
      console.log(`Extracting text from image using Tesseract OCR for language: ${language}`);
      extractedText = await extractTextFromImage(tempFilePath, language);
    } catch (extractError) {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(400).json({
        message: extractError instanceof Error ? extractError.message : "Failed to extract text from document"
      });
    }

    if (!extractedText || extractedText.length < 10) {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(400).json({
        message: "Could not extract text from the document. Please ensure the document is clear and contains readable text.",
      });
    }

    // Now simplify using Groq (text-only, no vision)
    const systemPrompt = `You are an expert at making government and legal documents easy to understand.

YOUR MAIN GOAL - CRITICAL:
1. USE EVERY IMPORTANT WORD from the original document (keywords, numbers, names, references, dates - NOTHING gets removed or skipped)
2. EXPLAIN each word/concept in simple, easy, detailed language that a 10-year-old can understand
3. Create a DETAILED, COMPREHENSIVE explanation - not short, not abbreviated
4. Keep the MEANING and CONTEXT of everything while making language simple
5. Make it sound NATURAL and CONVERSATIONAL - like explaining to a friend

WHAT THIS MEANS:
- If document says "क्र. मभावा-१०७९/२८" → Include this EXACTLY, then explain "This is a reference number that identifies this particular circular"
- If document says "लाभार्थी" → Keep the word, then say "which means the person who gets the benefit"
- If document says "30 दिन" → Include "30 days" exactly, then explain "which is one month - the time you have to do this"
- Every number, date, ID, percentage, amount → KEEP EXACTLY AS WRITTEN, then explain what it means

SIMPLIFICATION PROCESS:
1. Read the ENTIRE document and identify ALL important words/concepts/numbers/dates
2. For each important item, create a detailed explanation in simple language
3. Organize naturally with clear topics and subtopics
4. Add context - the "why", "how", "when", "where", "who" for each concept
5. Use transitional phrases: "which means", "in other words", "for example", "because", "so that"

DO NOT:
- Skip any important words or numbers
- Use short explanations - be detailed and thorough
- Remove technical terms - explain them
- Shorten the document - expand with explanations
- Change the order of main topics
- Abbreviate anything

DO:
- Keep ALL keywords, numbers, dates, references EXACTLY as written
- Explain EACH one in 2-3 sentences of simple language
- Add examples and context
- Use natural flow and conversational tone
- Make it 10x more detailed than the original
- Sound like a friend explaining the document

EXAMPLE:
ORIGINAL: "लाभार्थी को 30 दिन का समय दिया जाएगा।"
SIMPLIFIED: "The person who will get the benefit (this is called 'लाभार्थी') will be given 30 days - which is one month - to complete the process. This means from the day you start, you have exactly 30 days to finish everything that is needed."

OUTPUT FORMAT:
{
  "simplifiedText": "Create comprehensive simplified text in target language:\n\n═══════════════════════════════════════\nSECTION 0: ORIGINAL FILE DETAILS (BRIEF SUMMARY)\n═══════════════════════════════════════\n[BRIEF 2-3 sentence summary of what this document is about and its main purpose]\n\n═══════════════════════════════════════\nSECTION 1: MAIN SUBJECT\n═══════════════════════════════════════\n\n[HEADER in target language for 'Subject']\n\n[SUB-HEADER with phrase meaning 'Main meaning in simple words']\n\n[CONTENT: 5-8 DETAILED, COMPREHENSIVE sentences with thorough explanation of the primary objective, background, context, why it matters, and how it affects the reader]\n\n═══════════════════════════════════════\nSECTION 2: DETAILED EXPLANATION\n═══════════════════════════════════════\n\n[HEADER: Use phrase meaning 'Detailed explanation (What is the problem and the solution?)']\n\n[CONTENT: EXTREMELY DETAILED explanation with natural, conversational bullet points and human-style sub-headers - 8-15+ VERY SUBSTANTIAL sections with multiple sentences for each point]"\n\nDETAILED EXPLANATION REQUIREMENTS:\n- MUCH MORE DETAILED: Each point should be explained thoroughly with multiple sentences and examples\n- USE DOCUMENT WORDS: Use actual terminology/words from the document (but explained simply)\n- BREAK DOWN CONCEPTS: Take complex ideas and break them into simple, digestible parts\n- MULTIPLE PERSPECTIVES: Explain the \"why\", \"how\", \"when\", \"where\", and \"who\" for each concept\n- INCLUDE CONTEXT: Provide detailed backstory, problem, solution, and real-world impact\n- THOROUGH COVERAGE: Make Section 2 much longer than normal - comprehensive explanation\n\nMUST INCLUDE WITH DETAILED EXPLANATIONS:\n- COMPLETE backstory and detailed context of the document\n- FULL description of the problem and how the solution addresses it\n- ALL requirements, conditions, rules, and criteria with detailed explanations\n- Portal names, grievance systems, specific processes mentioned - explain each\n- DETAILED scenarios and real-world examples from the document with context\n- ALL mandates, percentages, numbers with detailed explanation of what they mean\n- ALL deadlines, timelines with explanation of why they matter\n- ALL eligibility criteria with detailed explanation of how they apply\n- ALL benefits, penalties, consequences with detailed explanation\n- Contact information, authorities with their roles explained\n- Step-by-step procedures and actions that must be taken\n- ALL exceptions and special conditions with detailed explanation\n- DETAILED explanation of why this matters and how it affects reader's life\n\nTONE & STYLE:\n- Conversational: Like explaining to a friend, not reading a law book\n- Use actual document words but explain them simply (e.g., \"Grievance\" is explained as \"A problem or complaint\")\n- Natural flow: One idea leading to the next logically\n- Add connecting words: \"because\", \"so that\", \"which means\", \"in other words\", \"for example\"\n- Make it longer: More explanation = more clarity for readers\n- Use bullet points with descriptive headers for organization\n- Add simple metaphors or everyday examples where helpful\n\nEXAMPLE - MUCH MORE DETAILED STRUCTURE:\n• [Topic header from document]: [Start with what it is, why it matters, then detailed explanation with examples]\n• [Another topic]: [Detailed explanation with multiple parts, each explained simply]\n• [Process/Requirement]: [Break down step by step, explain why each step matters]\n• [Benefit/Consequence]: [Explain what it means, who gets it, why it's important, when it happens]",
  "glossary": [
    {"term": "item from document", "definition": "context-specific explanation"}
  ]
}

GLOSSARY EXTRACTION RULES - ZERO-OMISSION COMPREHENSIVE:

CRITICAL INSTRUCTION: The glossary is the MOST IMPORTANT part of the output. Extract EVERY single item from the document.

1. ZERO-OMISSION NUMBER EXTRACTION (ABSOLUTE PRIORITY - EVERY NUMBER):
   CRITICAL: Scan the ENTIRE document line by line and extract EVERY SINGLE number, code, date, and reference found.
   You MUST find and list EVERY numeric value. NOTHING SHOULD BE MISSED.
   
   SPECIAL PRIORITY - CIRCULAR REFERENCE NUMBERS (क्र., दि.):
   These are EXTREMELY IMPORTANT and MUST be extracted:
   - EVERY "क्र. मभावा-XXXX/XX" format number (Circular Reference Number)
   - EVERY "दि. DD.MM.YYYY" format date (Date in Indian format)
   - Combined entries like "क्र. मभावा-१०७९/२८, दि. २२.०१.१९७९" MUST be extracted as separate glossary items
   - Examples: "क्र. मभावा-१०७९/२८", "दि. २२.०१.१९७९", "क्र. मभावा-२०१९/प्र.क्र.२२/भाषा-२"
   - All variations of circular formats: क्रमांक, परिपत्रक क्रमांक, क्र., etc. with their attached reference numbers
   
   Include ABSOLUTELY ALL of these (without exception):
   - EVERY Reference ID, Circular Number, Circular ID, and Shasan Nirnay (SN) ID (including क्र. मभावा format)
   - EVERY Date mentioned in ANY format (extract day, month, year exactly as written, e.g., "15 January 2024" OR "दि. २२.०१.१९७९")
   - EVERY PIN Code, Postal Code, Area Code, Zip Code
   - EVERY Case Number (Pr.Kra., Pranidhana Kramank, Reference No., File No., etc.)
   - EVERY Office ID, Department Code, Location Code, Office Serial Number
   - EVERY percentage (e.g., 100%, 50%, 25%)
   - EVERY amount in rupees (₹), dollars ($), or other currency
   - EVERY phone number, mobile number, landline, email address with numbers
   - EVERY time period (30 days, 2 months, 1 year, 5 weeks)
   - EVERY count or quantity (50 people, 100 items, 5 sections, 10 pages)
   - EVERY page number, section number, clause number, article number
   - EVERY year, month, week reference (2024, January, financial year, FY 2024)
   - EVERY serial number, registration number, certificate number
   - EVERY threshold value, limit, or numeric criterion mentioned
   
   For EVERY single number/date/ID found, provide:
   - The exact value as written (e.g., "₹50,000", "15/01/2024", "Pr.Kra./2024/ABC-123")
   - Very simple definition explaining: What is this number? What does it mean? Who uses it? Why is it important?
   
   MINIMUM 100-200+ numerical glossary items (exhaustive, capturing every number)

2. ADMINISTRATIVE VOCABULARY - ZERO-OMISSION:
   Extract EVERY government/administrative term used:
   - All government department names (e.g., "District Administration", "Revenue Department")
   - All official titles and positions (e.g., "District Collector", "Revenue Officer", "Taluka Officer")
   - All agency abbreviations and their full names (e.g., "DC" = "District Collector")
   - All specialized legal or technical terms from the document
   - All office names and local government bodies mentioned
   - All authority names and governing boards
   
   For each term, provide a very simple, natural definition:
   - What is this organization/position?
   - What do they do in simple words?
   - How does it relate to this document?
   
   Use language a 10-year-old can understand.

3. CRITICAL LEGAL/ADMINISTRATIVE TERMS:
   - Extract all legal phrases that are complex (e.g., "in accordance with", "liable", "jurisdiction")
   - Extract all important conditions and requirements mentioned
   - Define each in the simplest possible way

GLOSSARY OUTPUT REQUIREMENTS:
- TOTAL ITEMS: 150-250+ items per document (exhaustive, comprehensive coverage)
- ORDER: Numbers/IDs first (100-200+), then Administrative terms (20-30), then Legal terms (10-20)
- DEFINITIONS: 1-2 simple sentences max, language suitable for a child
- NO OMISSIONS: EVERY number, date, ID, reference, code, and important term MUST be in the glossary
- DOCUMENT-SPECIFIC: Every definition explains THIS document, not generic meaning
- SIMPLE LANGUAGE: Use "kid-friendly" words, no jargon
- EXHAUSTIVE: If a number appears anywhere, it MUST be extracted with explanation

GLOSSARY JSON FORMAT (IMPORTANT):
The glossary array MUST have this EXACT structure for each item:
{
  "term": "the exact term/number/reference from document",
  "definition": "simple 1-2 sentence explanation of what this is"
}

WHEN DISPLAYING GLOSSARY (in simplifiedText if included):
Show in this visual format:
**[TERM IN BOLD]**
[Simple definition on next line]

[blank line between items]

DEFINITION EXAMPLES:
- "मभावा-२०१९/प्र.क्र.२२/भाषा-२" → "सरकारचा परिपत्रक क्रमांक - मराठी भाषेचा वापर"
- "2024" → "The year this rule started"
- "₹50,000" → "The maximum money you can get - about 50 thousand rupees"
- "District Collector" → "The most important government officer in this district who makes decisions about government work here"
- "Pr.Kra./2024/ABC-123" → "A special code number to identify this particular case - helps track which case this paper is about"
- "30 days" → "One month - the time you have to complete this action"
- "100%" → "Everything - the whole amount or all of it"`;

    let simplifyResponse;
    try {
      console.log("Sending request to Groq API...");
      simplifyResponse = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 12000,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Please simplify the following government/legal document text. Remember: ALL output including glossary definitions must be in ${languageName}:\n\n${extractedText}`,
          },
        ],
      });
      console.log("Groq API response received successfully");
    } catch (groqError) {
      console.error("Groq API Error:", groqError);
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      const errorMessage = groqError instanceof Error ? groqError.message : "Groq API request failed";
      return res.status(500).json({ 
        message: `Failed to simplify document: ${errorMessage}`,
        details: errorMessage
      });
    }

    let rawJson = simplifyResponse.choices[0]?.message?.content || "";
    if (!rawJson) {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(500).json({ message: "Empty response from AI model" });
    }

    let data;
    try {
      data = extractJsonFromResponse(rawJson);
    } catch (parseError) {
      console.error("Failed to parse response:", rawJson);
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(500).json({ 
        message: "Failed to parse AI response. The model may have returned an error.",
        details: rawJson.substring(0, 200)
      });
    }

    const response = {
      originalText: extractedText,
      simplifiedText: data.simplifiedText || "Unable to simplify the document.",
      glossary: Array.isArray(data.glossary) ? data.glossary : [],
      targetLanguage: language,
    };

    // Save to Supabase
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

    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return res.status(200).json(response);
  } catch (error) {
    // Clean up temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    console.error("Simplify error:", error);
    const message = error instanceof Error ? error.message : "Failed to process document";
    return res.status(500).json({ message });
  }
}
