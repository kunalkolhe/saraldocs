import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { createAuthClient, isSupabaseConfigured } from "./supabase";

const sessionSecret = process.env.SESSION_SECRET || "saraldocs-session-secret-2024";

declare module "express-session" {
  interface SessionData {
    userId: string;
    userEmail: string;
    userName: string;
  }
}

export function setupAuth(app: Express) {
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      if (!isSupabaseConfigured()) {
        return res.status(503).json({ 
          message: "Authentication is not configured. Please contact the administrator to set up Supabase." 
        });
      }

      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ message: "Email, password, and name are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const supabase = createAuthClient();
      if (!supabase) {
        return res.status(503).json({ message: "Authentication service unavailable" });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) {
        console.error("Supabase signup error:", error);
        return res.status(400).json({ message: error.message });
      }

      if (!data.user) {
        return res.status(400).json({ message: "Failed to create account" });
      }

      if (data.session) {
        req.session.userId = data.user.id;
        req.session.userEmail = data.user.email || email;
        req.session.userName = name;
      }

      res.json({
        id: data.user.id,
        email: data.user.email,
        name: name,
        needsEmailConfirmation: !data.session,
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      if (!isSupabaseConfigured()) {
        return res.status(503).json({ 
          message: "Authentication is not configured. Please contact the administrator to set up Supabase." 
        });
      }

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const supabase = createAuthClient();
      if (!supabase) {
        return res.status(503).json({ message: "Authentication service unavailable" });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Supabase login error:", error);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!data.user || !data.session) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const userName = data.user.user_metadata?.name || email.split("@")[0];

      req.session.userId = data.user.id;
      req.session.userEmail = data.user.email || email;
      req.session.userName = userName;

      res.json({
        id: data.user.id,
        email: data.user.email,
        name: userName,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  app.get("/api/auth/user", (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.json({ user: null, message: "Please log in to access your account" });
    }

    res.json({
      user: {
        id: req.session.userId,
        email: req.session.userEmail,
        name: req.session.userName,
      }
    });
  });
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  (req as any).user = {
    id: req.session.userId,
    email: req.session.userEmail,
    name: req.session.userName,
  };

  next();
}
