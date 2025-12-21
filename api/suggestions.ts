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
        .from("suggestions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw new Error(error.message);
      
      const suggestions = (data || []).map(s => ({
        id: s.id,
        message: s.message,
        createdAt: s.created_at,
      }));
      
      return res.status(200).json(suggestions);
    } catch (error) {
      console.error("Get suggestions error:", error);
      return res.status(500).json({ message: "Failed to get suggestions" });
    }
  }

  if (req.method === 'POST') {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string' || message.length < 10) {
        return res.status(400).json({ 
          message: "Invalid suggestion. Please provide at least 10 characters." 
        });
      }

      const { data, error } = await supabase
        .from("suggestions")
        .insert({ message })
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      return res.status(200).json({
        id: data.id,
        message: data.message,
        createdAt: data.created_at,
      });
    } catch (error) {
      console.error("Suggestion error:", error);
      return res.status(500).json({ message: "Failed to submit suggestion" });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
