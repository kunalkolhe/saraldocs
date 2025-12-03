import { z } from "zod";

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

export const glossaryTermSchema = z.object({
  term: z.string(),
  definition: z.string(),
});

export type GlossaryTerm = z.infer<typeof glossaryTermSchema>;

export const documentSectionSchema = z.object({
  heading: z.string(),
  content: z.string(),
});

export type DocumentSection = z.infer<typeof documentSectionSchema>;

export const documentProcessingRequestSchema = z.object({
  extractedText: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
});

export type DocumentProcessingRequest = z.infer<typeof documentProcessingRequestSchema>;

export const simplificationResultSchema = z.object({
  originalText: z.string(),
  simplifiedText: z.string(),
  sections: z.array(documentSectionSchema).optional(),
  glossary: z.array(glossaryTermSchema),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  processedAt: z.string(),
});

export type SimplificationResult = z.infer<typeof simplificationResultSchema>;

export const ocrResultSchema = z.object({
  text: z.string(),
  confidence: z.number(),
  detectedLanguage: z.string(),
});

export type OcrResult = z.infer<typeof ocrResultSchema>;

export const uploadedFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  preview: z.string().optional(),
  dataUrl: z.string(),
});

export type UploadedFile = z.infer<typeof uploadedFileSchema>;

export const processingStatusSchema = z.enum([
  "idle",
  "uploading",
  "extracting",
  "simplifying",
  "complete",
  "error",
]);

export type ProcessingStatus = z.infer<typeof processingStatusSchema>;

export const users = {
  id: "varchar",
  username: "text",
  password: "text",
};

export type User = {
  id: string;
  username: string;
  password: string;
};

export type InsertUser = Omit<User, "id">;
