import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabase();
  const { id } = req.query;
  
  if (!supabase) {
    return res.status(500).json({ message: "Database not configured" });
  }

  if (typeof id !== 'string') {
    return res.status(400).json({ message: "Invalid document ID" });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error || !data) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      return res.status(200).json({
        id: data.id,
        originalText: data.original_text,
        simplifiedText: data.simplified_text,
        targetLanguage: data.target_language,
        glossary: data.glossary,
        fileName: data.file_name,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
      });
    } catch (error) {
      console.error("Get document error:", error);
      return res.status(500).json({ message: "Failed to get document" });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);
      
      if (error) throw new Error(error.message);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Delete document error:", error);
      return res.status(500).json({ message: "Failed to delete document" });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
