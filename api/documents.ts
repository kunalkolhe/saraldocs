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
  
  if (!supabase) {
    return res.status(500).json({ message: "Database not configured" });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw new Error(error.message);
      
      const documents = (data || []).map(d => ({
        id: d.id,
        originalText: d.original_text,
        simplifiedText: d.simplified_text,
        targetLanguage: d.target_language,
        glossary: d.glossary,
        fileName: d.file_name,
        createdAt: d.created_at,
        expiresAt: d.expires_at,
      }));
      
      return res.status(200).json(documents);
    } catch (error) {
      console.error("Get documents error:", error);
      return res.status(500).json({ message: "Failed to get documents" });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
