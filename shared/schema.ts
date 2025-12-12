import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const supportedLanguages = [
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

export type LanguageCode = typeof supportedLanguages[number]["code"];

export const glossaryTermSchema = z.object({
  term: z.string(),
  definition: z.string(),
});

export type GlossaryTerm = z.infer<typeof glossaryTermSchema>;

export const simplifyRequestSchema = z.object({
  originalText: z.string().min(1, "Text is required"),
  targetLanguage: z.enum(["en", "hi", "mr", "gu", "ta", "te", "kn", "ml", "bn", "pa", "or", "ur"]),
});

export type SimplifyRequest = z.infer<typeof simplifyRequestSchema>;

export const simplifyResponseSchema = z.object({
  originalText: z.string(),
  simplifiedText: z.string(),
  glossary: z.array(glossaryTermSchema),
  targetLanguage: z.string(),
});

export type SimplifyResponse = z.infer<typeof simplifyResponseSchema>;

export const suggestionSchema = z.object({
  message: z.string().min(10, "Please provide at least 10 characters"),
});

export type SuggestionInput = z.infer<typeof suggestionSchema>;

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalText: text("original_text").notNull(),
  simplifiedText: text("simplified_text"),
  targetLanguage: varchar("target_language", { length: 5 }).notNull(),
  glossary: jsonb("glossary").$type<GlossaryTerm[]>(),
  fileName: text("file_name"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export const suggestions = pgTable("suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSuggestionSchema = createInsertSchema(suggestions).omit({
  id: true,
  createdAt: true,
});

export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type Suggestion = typeof suggestions.$inferSelect;
