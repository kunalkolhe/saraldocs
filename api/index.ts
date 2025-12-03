import express, { type Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { randomUUID } from "node:crypto";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }
  return new GoogleGenAI({ apiKey });
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

async function extractTextWithVision(fileData: string, mimeType: string) {
  const client = getGeminiClient();
  const base64Match = fileData.match(/^data:[^;]+;base64,(.+)$/);
  const base64Data = base64Match ? base64Match[1] : fileData;
  
  const prompt = `Extract ALL text from this document image/PDF exactly as it appears. 
Include every word, number, date, and symbol visible in the document.
Preserve the original structure and formatting as much as possible.
Do not summarize or skip any content - extract EVERYTHING.
If text is in multiple languages, extract all of them.
Output only the extracted text, nothing else.`;

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
          { text: prompt },
        ],
      },
    ],
  });

  const extractedText = response.text?.trim() || "";
  
  let detectedLanguage = "en";
  const hindiPattern = /[\u0900-\u097F]/;
  const tamilPattern = /[\u0B80-\u0BFF]/;
  const teluguPattern = /[\u0C00-\u0C7F]/;
  const bengaliPattern = /[\u0980-\u09FF]/;
  
  if (hindiPattern.test(extractedText)) detectedLanguage = "hi";
  else if (tamilPattern.test(extractedText)) detectedLanguage = "ta";
  else if (teluguPattern.test(extractedText)) detectedLanguage = "te";
  else if (bengaliPattern.test(extractedText)) detectedLanguage = "bn";

  return { text: extractedText, detectedLanguage };
}

async function simplifyDocument(text: string, targetLanguage: string) {
  const langName = LANGUAGE_NAMES[targetLanguage] || "English";
  const client = getGeminiClient();

  const systemPrompt = `You are an expert at simplifying complex government, legal, and official documents for common people.
You help common people understand complex government and legal documents by rewriting them in simple ${langName} language while preserving ALL information.
Respond only with valid JSON.`;

  const prompt = `Your task is to:
1. Rewrite the following document text in VERY SIMPLE, easy-to-understand ${langName} language
2. ORGANIZE the content into CLEAR SECTIONS with descriptive headings
3. Break long sentences into shorter ones
4. Replace complex terminology with simple words
5. PRESERVE 100% of the original information
6. Identify difficult/technical terms and provide clear definitions in the glossary

Respond with JSON in this exact format:
{
  "simplifiedText": "The complete simplified version as plain text",
  "sections": [
    {"heading": "Section Heading in ${langName}", "content": "The simplified content for this section"}
  ],
  "glossary": [
    {"term": "term from document", "definition": "simple explanation"}
  ]
}

Document to simplify:
${text}`;

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
    },
    contents: prompt,
  });

  const content = response.text;
  if (!content) throw new Error("No response from AI");

  const result = JSON.parse(content);
  return {
    simplifiedText: result.simplifiedText,
    sections: Array.isArray(result.sections) ? result.sections : [],
    glossary: Array.isArray(result.glossary) ? result.glossary : [],
  };
}

app.post("/api/auth/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const client = getSupabaseClient();
    
    if (!client) {
      return res.status(503).json({ message: "Authentication not configured" });
    }

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ 
      id: data.user?.id,
      email: data.user?.email, 
      name,
      needsEmailConfirmation: !data.session 
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Failed to create account" });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const client = getSupabaseClient();
    
    if (!client) {
      return res.status(503).json({ message: "Authentication not configured" });
    }

    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({ 
      id: data.user?.id,
      email: data.user?.email, 
      name: data.user?.user_metadata?.name || email.split("@")[0],
      token: data.session?.access_token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to login" });
  }
});

app.get("/api/auth/user", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.json({ user: null, message: "Please log in to access your account" });
  }
  
  const token = authHeader.substring(7);
  const client = getSupabaseClient();
  
  if (!client) {
    return res.json({ user: null, message: "Authentication not configured" });
  }

  try {
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) {
      return res.json({ user: null, message: "Please log in to access your account" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split("@")[0],
      }
    });
  } catch (error) {
    console.error("Auth user error:", error);
    res.json({ user: null, message: "Please log in to access your account" });
  }
});

app.post("/api/auth/logout", (_req: Request, res: Response) => {
  res.json({ message: "Logged out successfully" });
});

app.post("/api/process", async (req: Request, res: Response) => {
  try {
    const { fileData, fileName, fileType, targetLanguage } = req.body;

    if (!fileData || !fileName || !fileType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const visionResult = await extractTextWithVision(
      fileData, 
      fileType.startsWith("image/") ? fileType : "application/pdf"
    );
    
    if (!visionResult.text || visionResult.text.length < 10) {
      return res.status(400).json({
        message: "Could not extract enough text from the document. Please try a clearer image or PDF.",
      });
    }

    const simplificationResult = await simplifyDocument(
      visionResult.text,
      targetLanguage || "en"
    );

    res.json({
      id: randomUUID(),
      originalText: visionResult.text,
      simplifiedText: simplificationResult.simplifiedText,
      sections: simplificationResult.sections,
      glossary: simplificationResult.glossary,
      sourceLanguage: visionResult.detectedLanguage,
      targetLanguage: targetLanguage || "en",
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Processing error:", error);
    const message = error instanceof Error ? error.message : "Failed to process document";
    res.status(500).json({ message });
  }
});

app.post("/api/translate", async (req: Request, res: Response) => {
  try {
    const { simplifiedText, glossary, sections, targetLanguage } = req.body;

    if (!simplifiedText || !targetLanguage) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const langName = LANGUAGE_NAMES[targetLanguage] || "English";
    const client = getGeminiClient();

    const prompt = `Translate the following to ${langName}:

Text: ${simplifiedText}

Sections: ${JSON.stringify(sections || [])}

Glossary: ${JSON.stringify(glossary || [])}

Respond with JSON:
{
  "simplifiedText": "translated text",
  "sections": [...],
  "glossary": [...]
}`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      config: { responseMimeType: "application/json" },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");

    res.json({
      id: randomUUID(),
      simplifiedText: result.simplifiedText,
      sections: result.sections || sections,
      glossary: result.glossary || glossary,
      targetLanguage,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Translation error:", error);
    res.status(500).json({ message: "Failed to translate document" });
  }
});

const documentStorage = new Map<string, any>();

interface FileData {
  fileData: string;
  fileName: string;
  fileType: string;
}

app.post("/api/process-multiple", async (req: Request, res: Response) => {
  try {
    const { files, targetLanguage } = req.body as { files: FileData[]; targetLanguage: string };

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: "No files provided" });
    }

    if (files.length > 10) {
      return res.status(400).json({ message: "Maximum 10 files allowed at once" });
    }

    const results: any[] = [];
    const errors: { index: number; fileName: string; error: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        if (!file.fileData || !file.fileName || !file.fileType) {
          errors.push({ index: i, fileName: file.fileName || `File ${i + 1}`, error: "Missing required fields" });
          continue;
        }

        const visionResult = await extractTextWithVision(
          file.fileData,
          file.fileType.startsWith("image/") ? file.fileType : "application/pdf"
        );

        if (!visionResult.text || visionResult.text.length < 10) {
          errors.push({ index: i, fileName: file.fileName, error: "Could not extract enough text" });
          continue;
        }

        const simplificationResult = await simplifyDocument(visionResult.text, targetLanguage || "en");

        const doc = {
          id: randomUUID(),
          fileName: file.fileName,
          originalText: visionResult.text,
          simplifiedText: simplificationResult.simplifiedText,
          sections: simplificationResult.sections,
          glossary: simplificationResult.glossary,
          sourceLanguage: visionResult.detectedLanguage,
          targetLanguage: targetLanguage || "en",
          processedAt: new Date().toISOString(),
        };

        documentStorage.set(doc.id, doc);
        results.push(doc);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to process document";
        errors.push({ index: i, fileName: file.fileName, error: errorMessage });
      }
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "No documents could be processed successfully", errors });
    }

    res.json({
      results,
      errors: errors.length > 0 ? errors : undefined,
      totalProcessed: results.length,
      totalFailed: errors.length,
    });
  } catch (error) {
    console.error("Multiple processing error:", error);
    res.status(500).json({ message: "Failed to process documents" });
  }
});

app.get("/api/document/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const document = documentStorage.get(id);
  
  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }
  
  res.json(document);
});

app.get("/api/history", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.json([]);
  }
  
  const token = authHeader.substring(7);
  const client = getSupabaseClient();
  
  if (!client) {
    return res.json([]);
  }

  try {
    const { data: { user } } = await client.auth.getUser(token);
    if (!user) {
      return res.json([]);
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data } = await client
      .from("file_history")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    res.json(data || []);
  } catch (error) {
    console.error("Get history error:", error);
    res.json([]);
  }
});

app.delete("/api/history", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const token = authHeader.substring(7);
  const client = getSupabaseClient();
  
  if (!client) {
    return res.status(503).json({ message: "Service unavailable" });
  }

  try {
    const { data: { user } } = await client.auth.getUser(token);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await client.from("file_history").delete().eq("user_id", user.id);
    res.json({ message: "History cleared successfully" });
  } catch (error) {
    console.error("Clear history error:", error);
    res.status(500).json({ message: "Failed to clear history" });
  }
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API Error:", err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
