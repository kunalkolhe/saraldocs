import { randomUUID } from "crypto";

export interface ProcessedDocument {
  id: string;
  originalText: string;
  simplifiedText: string;
  glossary: { term: string; definition: string }[];
  sourceLanguage: string;
  targetLanguage: string;
  processedAt: string;
}

export interface IStorage {
  saveDocument(doc: Omit<ProcessedDocument, "id">): Promise<ProcessedDocument>;
  getDocument(id: string): Promise<ProcessedDocument | undefined>;
}

export class MemStorage implements IStorage {
  private documents: Map<string, ProcessedDocument>;

  constructor() {
    this.documents = new Map();
  }

  async saveDocument(doc: Omit<ProcessedDocument, "id">): Promise<ProcessedDocument> {
    const id = randomUUID();
    const document: ProcessedDocument = { ...doc, id };
    this.documents.set(id, document);
    return document;
  }

  async getDocument(id: string): Promise<ProcessedDocument | undefined> {
    return this.documents.get(id);
  }
}

export const storage = new MemStorage();
