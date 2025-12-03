# Government Document Simplifier - SaralDocs

## Overview

SaralDocs is a web application that converts complex government, legal, and official documents into simple, easy-to-understand language. The application accepts PDF and image files (JPEG, PNG), extracts text using OCR technology, and uses AI to simplify the content while preserving all original information. It supports 12 Indian languages including Hindi, Tamil, Telugu, Bengali, and others, making official documents accessible to diverse users including senior citizens and people with varying literacy levels.

## Recent Changes (December 2025)

- **Project Structure Fixed**: Moved all files from nested `LanguageFulfillerzip/` folder to root level
- **Vercel Deployment Configuration**: Added `vercel.json` with proper serverless function setup and static file handling
- **API Serverless Handler**: Created `api/index.ts` for Vercel serverless deployment
- **Environment Variables**: Configured SUPABASE_URL, SUPABASE_ANON_KEY, and GOOGLE_API_KEY
- **Supabase Authentication**: Integrated Supabase for email/password authentication (signup and login)
- **File History Feature**: Logged-in users can view their processed documents for 7 days with auto-delete
- **History Management**: Users can view, clear, or delete individual history records
- **Government-Style UI Redesign**: Complete visual overhaul using Indian government website design patterns with deep navy blue (#1E40AF) header, large readable typography, and accessibility-first design
- **No Login Required**: Users can upload and simplify documents without authentication - login is optional
- **Step-by-Step Guidance**: Upload page now shows numbered instructions (4 steps) to guide users through the process
- **Trust Indicators**: Added "Free to Use", "12 Languages", and "100% Secure" badges on landing page
- **Improved Navigation**: Simplified header with clear icons and mobile-responsive hamburger menu

## Vercel Deployment

The project is configured for Vercel deployment with:

1. **Static Frontend**: Built by Vite, served from `dist/public`
2. **Serverless API**: Express-based API handler in `api/index.ts`
3. **Configuration**: `vercel.json` handles routing between static files and API

**Important**: When deploying to Vercel, ensure these environment variables are set:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GOOGLE_API_KEY`
- `SESSION_SECRET`

## Supabase Database Setup

To enable file history, create the following table in your Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create file_history table
CREATE TABLE file_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  original_text TEXT NOT NULL,
  simplified_text TEXT NOT NULL,
  glossary JSONB DEFAULT '[]'::jsonb,
  sections JSONB DEFAULT '[]'::jsonb,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX idx_file_history_user_id ON file_history(user_id);
CREATE INDEX idx_file_history_created_at ON file_history(created_at);

-- Enable Row Level Security
ALTER TABLE file_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own data
CREATE POLICY "Users can view own history" ON file_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON file_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON file_history
  FOR DELETE USING (auth.uid() = user_id);

-- Allow service role to access all data (for server-side operations)
CREATE POLICY "Service role has full access" ON file_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

**Environment Variables Required:**
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `GOOGLE_API_KEY`: Google Gemini API key for AI features

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, built using Vite for fast development and optimized production builds.

**UI Component System**: The application uses shadcn/ui components (based on Radix UI primitives) with a Material Design 3 inspired approach. This choice was made for robust accessibility standards, clear visual feedback systems, and proven patterns for information-dense applications.

**Styling**: Tailwind CSS with a custom theme configuration supporting both light and dark modes. The design system emphasizes trust, clarity, and accessibility with generous spacing (units of 4, 6, 8, 12, 16) and larger text sizes for readability.

**State Management**: TanStack Query (React Query) for server state management, with local React state for UI interactions. This provides automatic caching, background refetching, and optimistic updates.

**Routing**: Wouter for lightweight client-side routing with two main pages:
- Landing page with features, how-it-works, and language information
- Upload page for document processing and results viewing

**Key Features**:
- Multi-file drag-and-drop upload (up to 10 files, 20MB each)
- Support for JPEG, PNG, and PDF documents
- Batch processing of multiple documents at once
- Real-time processing status with progress indicators
- Language selector with 12 Indian languages displayed in native scripts
- Result viewer with navigation between multiple processed documents
- Glossary accordion for technical term definitions
- Export functionality (PDF and JPEG)
- Theme toggle (light/dark mode)
- Partial failure handling with clear error feedback

### Backend Architecture

**Framework**: Express.js server with TypeScript, using ES modules.

**Document Processing Pipeline**:
1. **File Upload**: Receives base64-encoded file data (PDF or images)
2. **Text Extraction**: 
   - PDF: Uses pdf-parse library
   - Images: Uses Tesseract.js for OCR with multi-language support
3. **AI Simplification**: OpenAI GPT integration for text simplification and glossary generation
4. **Storage**: In-memory storage using Map data structure (MemStorage class)

**API Design**: RESTful endpoints:
- `/api/process` - Single document processing (POST) with file data and target language
- `/api/process-multiple` - Batch processing (POST) for up to 10 documents at once with partial failure support
- `/api/translate` - Language translation (POST) for already-processed documents
- `/api/document/:id` - Retrieve processed document (GET)

**Build System**: Custom esbuild configuration that bundles selected dependencies (allowlist approach) to reduce cold start times by minimizing file system calls.

**Development Tools**: 
- Vite middleware for HMR in development
- Source map support for debugging
- Request logging with timestamps

### Storage Architecture

**Current Implementation**: In-memory storage using JavaScript Map. Documents are stored with UUID identifiers and include:
- Original extracted text
- Simplified text
- Glossary terms with definitions
- Source and target language codes
- Processing timestamp

**Design Note**: The storage layer is abstracted through an IStorage interface, allowing future migration to persistent storage (PostgreSQL with Drizzle ORM) without changing application logic. The database configuration files (drizzle.config.ts, schema.ts) are present but not yet integrated.

### AI Integration

**Provider**: Google Gemini AI (gemini-2.5-flash model) - Free tier with generous limits

**Prompting Strategy**: Structured prompts that instruct the AI to:
- Preserve 100% of original information
- Break long sentences into shorter ones
- Replace complex terminology with simple words
- Generate glossary for technical terms
- Output in the target language
- JSON response format for reliable parsing

**Language Support**: 12 Indian languages with native language names and ISO codes mapped to appropriate OCR language codes.

## External Dependencies

### AI Services
- **Google Gemini AI**: Core simplification engine using gemini-2.5-flash model that rewrites complex text into simple language and generates glossaries. Requires GEMINI_API_KEY environment variable. Using Gemini for its generous free tier.

### OCR Services
- **Tesseract.js**: Client-side OCR for text extraction from images. Supports 12 Indian language scripts with language-specific models (eng, hin, mar, guj, tam, tel, kan, mal, ben, pan, ori, urd).

### PDF Processing
- **pdf-parse**: Server-side PDF text extraction library.

### Database (Configured but Not Active)
- **Neon Serverless PostgreSQL**: Connection configured via @neondatabase/serverless
- **Drizzle ORM**: TypeScript ORM with schema defined in shared/schema.ts
- Migration system ready via drizzle-kit

### UI Libraries
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library
- **TanStack Query**: Data fetching and state management
- **jsPDF & html-to-image**: Document export functionality

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety across client and server
- **esbuild**: Production bundling
- **Replit plugins**: Development banners, cartographer, and error overlay

### Fonts
- **Google Fonts**: Inter (primary), Noto Sans (multi-language support), JetBrains Mono (monospace)