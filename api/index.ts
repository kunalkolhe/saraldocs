import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { createClient } from "@supabase/supabase-js";

const app = express();

const MemoryStoreSession = MemoryStore(session);

app.use(
  express.json({
    limit: "50mb",
  })
);

app.use(express.urlencoded({ extended: false, limit: "50mb" }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "saraldocs-session-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000,
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

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

app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const client = getSupabaseClient();
    
    if (!client) {
      return res.status(500).json({ message: "Authentication not configured" });
    }

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "Registration successful", user: data.user });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const client = getSupabaseClient();
    
    if (!client) {
      return res.status(500).json({ message: "Authentication not configured" });
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ message: error.message });
    }

    (req.session as any).userId = data.user?.id;
    (req.session as any).user = data.user;

    res.json({ user: data.user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

app.post("/api/auth/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

app.get("/api/auth/me", (req: Request, res: Response) => {
  const user = (req.session as any)?.user;
  if (!user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  res.json({ user });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API Error:", err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
