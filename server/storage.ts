import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { User, InsertUser, Suggestion, InsertSuggestion, Document, InsertDocument, GlossaryTerm } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion>;
  getSuggestions(): Promise<Suggestion[]>;
  saveDocument(doc: InsertDocument): Promise<Document>;
  getDocuments(limit?: number): Promise<Document[]>;
  getDocumentById(id: string): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<void>;
}

class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private suggestions: Map<string, Suggestion> = new Map();
  private documents: Map<string, Document> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createSuggestion(insertSuggestion: InsertSuggestion): Promise<Suggestion> {
    const id = randomUUID();
    const suggestion: Suggestion = {
      ...insertSuggestion,
      id,
      createdAt: new Date(),
    };
    this.suggestions.set(id, suggestion);
    return suggestion;
  }

  async getSuggestions(): Promise<Suggestion[]> {
    return Array.from(this.suggestions.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async saveDocument(doc: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const document: Document = {
      id,
      originalText: doc.originalText,
      simplifiedText: doc.simplifiedText || null,
      targetLanguage: doc.targetLanguage,
      glossary: (doc.glossary as GlossaryTerm[]) || null,
      fileName: doc.fileName || null,
      createdAt: new Date(),
      expiresAt,
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocuments(limit: number = 50): Promise<Document[]> {
    return Array.from(this.documents.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getDocumentById(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async deleteDocument(id: string): Promise<void> {
    this.documents.delete(id);
  }
}

class SupabaseStorage implements IStorage {
  private get supabase() {
    return getSupabase();
  }

  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await this.supabase
      .from("users")
      .insert(insertUser)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as User;
  }

  async createSuggestion(insertSuggestion: InsertSuggestion): Promise<Suggestion> {
    const { data, error } = await this.supabase
      .from("suggestions")
      .insert({ message: insertSuggestion.message })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return {
      ...data,
      createdAt: data.created_at ? new Date(data.created_at) : null,
    } as Suggestion;
  }

  async getSuggestions(): Promise<Suggestion[]> {
    const { data, error } = await this.supabase
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw new Error(error.message);
    return (data || []).map(s => ({
      ...s,
      createdAt: s.created_at ? new Date(s.created_at) : null,
    })) as Suggestion[];
  }

  async saveDocument(doc: InsertDocument): Promise<Document> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const { data, error } = await this.supabase
      .from("documents")
      .insert({
        original_text: doc.originalText,
        simplified_text: doc.simplifiedText,
        target_language: doc.targetLanguage,
        glossary: doc.glossary,
        file_name: doc.fileName,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      originalText: data.original_text,
      simplifiedText: data.simplified_text,
      targetLanguage: data.target_language,
      glossary: data.glossary as GlossaryTerm[],
      fileName: data.file_name,
      createdAt: data.created_at ? new Date(data.created_at) : null,
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
    } as Document;
  }

  async getDocuments(limit: number = 50): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(error.message);
    return (data || []).map(d => ({
      id: d.id,
      originalText: d.original_text,
      simplifiedText: d.simplified_text,
      targetLanguage: d.target_language,
      glossary: d.glossary as GlossaryTerm[],
      fileName: d.file_name,
      createdAt: d.created_at ? new Date(d.created_at) : null,
      expiresAt: d.expires_at ? new Date(d.expires_at) : null,
    })) as Document[];
  }

  async getDocumentById(id: string): Promise<Document | undefined> {
    const { data, error } = await this.supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error || !data) return undefined;
    return {
      id: data.id,
      originalText: data.original_text,
      simplifiedText: data.simplified_text,
      targetLanguage: data.target_language,
      glossary: data.glossary as GlossaryTerm[],
      fileName: data.file_name,
      createdAt: data.created_at ? new Date(data.created_at) : null,
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
    } as Document;
  }

  async deleteDocument(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("documents")
      .delete()
      .eq("id", id);
    
    if (error) throw new Error(error.message);
  }
}

function createStorage(): IStorage {
  if (isSupabaseConfigured()) {
    console.log("Storage initialized: Supabase");
    return new SupabaseStorage();
  } else {
    console.log("Storage initialized: In-Memory (Supabase not configured)");
    return new MemoryStorage();
  }
}

export const storage: IStorage = createStorage();
