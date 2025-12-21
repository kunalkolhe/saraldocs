# SaralDocs - Government Document Simplifier

## Overview

SaralDocs is a web application that simplifies complex government, legal, and official documents into easy-to-understand language. Users can upload documents (images or PDFs), select from 12 Indian languages, and receive simplified versions with glossaries of technical terms. The application uses OCR for text extraction and AI (Groq/OpenAI-compatible API) for document simplification.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for page transitions
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Pattern**: RESTful endpoints under `/api/*`
- **File Processing**: Multer for file uploads, Tesseract.js for OCR
- **AI Integration**: Groq API (OpenAI-compatible) for text simplification
- **PDF Generation**: PDFKit for downloadable simplified documents

### Deployment Strategy
- **Development**: Express server with Vite middleware for HMR
- **Production (Replit)**: Bundled Express server serving static files
- **Production (Vercel)**: Serverless functions in `/api` directory with static frontend

### Data Storage
- **Primary**: Supabase (PostgreSQL) for documents, suggestions, and user data
- **Fallback**: In-memory storage when Supabase is not configured
- **Schema**: Drizzle ORM with PostgreSQL dialect
- **Document Retention**: Auto-deletion after 7 days for privacy

### Authentication
- **Provider**: Supabase Auth with email/password
- **Client Integration**: React context provider for auth state
- **Optional**: App works without auth in anonymous mode

## External Dependencies

### AI/ML Services
- **Groq API**: Primary AI provider for document simplification (requires `GROQ_API_KEY`)
- **Tesseract.js**: Client-side OCR for text extraction from images

### Database & Storage
- **Supabase**: PostgreSQL database and authentication
  - `SUPABASE_URL`: Project URL
  - `SUPABASE_SERVICE_ROLE_KEY`: Server-side admin key
  - `SUPABASE_ANON_KEY`: Client-side public key
  - `VITE_SUPABASE_URL`: Client-side project URL
  - `VITE_SUPABASE_ANON_KEY`: Client-side public key

### Database Schema
Tables defined in `shared/schema.ts`:
- `users`: User accounts (id, username, password)
- `documents`: Processed documents with original/simplified text, language, glossary
- `suggestions`: User feedback submissions

### Third-Party Libraries
- **PDFKit**: Server-side PDF generation
- **pdf-parse**: PDF text extraction
- **canvas**: Image processing support for OCR

### Supported Languages
12 Indian languages: English, Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Bengali, Punjabi, Odia, Urdu