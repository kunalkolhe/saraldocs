import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

function getSupabaseUrl(): string {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Supabase URL not configured. Please add SUPABASE_URL.");
  }
  return supabaseUrl;
}

function getSupabaseKey(): string {
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseKey) {
    throw new Error("Supabase key not configured. Please add SUPABASE_ANON_KEY.");
  }
  return supabaseKey;
}

export function createAuthClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return createClient(getSupabaseUrl(), getSupabaseKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createServiceClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return createClient(getSupabaseUrl(), getSupabaseKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export interface FileHistoryRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  original_text: string;
  simplified_text: string;
  glossary: { term: string; definition: string }[];
  sections: { heading: string; content: string }[];
  source_language: string;
  target_language: string;
  created_at: string;
}

export async function saveFileHistory(
  userId: string,
  fileName: string,
  fileType: string,
  originalText: string,
  simplifiedText: string,
  glossary: { term: string; definition: string }[],
  sections: { heading: string; content: string }[],
  sourceLanguage: string,
  targetLanguage: string
): Promise<FileHistoryRecord | null> {
  const client = createServiceClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("file_history")
    .insert({
      user_id: userId,
      file_name: fileName,
      file_type: fileType,
      original_text: originalText,
      simplified_text: simplifiedText,
      glossary: glossary,
      sections: sections,
      source_language: sourceLanguage,
      target_language: targetLanguage,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving file history:", error);
    return null;
  }

  return data;
}

export async function getUserFileHistory(userId: string): Promise<FileHistoryRecord[]> {
  const client = createServiceClient();
  if (!client) {
    return [];
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await client
    .from("file_history")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching file history:", error);
    return [];
  }

  return data || [];
}

export async function deleteUserFileHistory(userId: string): Promise<boolean> {
  const client = createServiceClient();
  if (!client) {
    return false;
  }

  const { error } = await client
    .from("file_history")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting file history:", error);
    return false;
  }

  return true;
}

export async function deleteExpiredHistory(): Promise<number> {
  const client = createServiceClient();
  if (!client) {
    return 0;
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await client
    .from("file_history")
    .delete()
    .lt("created_at", sevenDaysAgo.toISOString())
    .select();

  if (error) {
    console.error("Error deleting expired history:", error);
    return 0;
  }

  return data?.length || 0;
}

export async function getFileHistoryById(userId: string, historyId: string): Promise<FileHistoryRecord | null> {
  const client = createServiceClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("file_history")
    .select("*")
    .eq("id", historyId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching file history by id:", error);
    return null;
  }

  return data;
}

export async function deleteFileHistoryById(userId: string, historyId: string): Promise<boolean> {
  const client = createServiceClient();
  if (!client) {
    return false;
  }

  const { error } = await client
    .from("file_history")
    .delete()
    .eq("id", historyId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting file history by id:", error);
    return false;
  }

  return true;
}
