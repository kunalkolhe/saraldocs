# SaralDocs - Government Document Simplifier

## Overview
SaralDocs is a web application that helps citizens understand government and legal documents by converting complex language into simple, easy-to-understand text. It supports 12 Indian languages.

## Project Structure
```
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions
│   └── public/          # Static assets (favicon)
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── gemini.ts        # Google Gemini AI integration
│   ├── ocr.ts           # OCR processing with Tesseract
│   ├── pdf-generator.ts # PDF generation with Noto Sans Devanagari font
│   ├── storage.ts       # Database storage interface
│   └── supabase.ts      # Supabase client
├── shared/              # Shared types and schemas
│   └── schema.ts        # Zod schemas and TypeScript types
├── fonts/               # Custom fonts for PDF generation
│   └── NotoSansDevanagari-Regular.ttf  # Hindi/Marathi font support
└── uploads/             # Temporary file uploads
```

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn/UI, Vite
- **Backend**: Vercel Serverless Functions (Express-compatible on Replit, API routes on Vercel)
- **AI**: Google Gemini API (gemini-2.0-flash) with Vision for OCR
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel (free tier)

## Environment Variables
Required environment variables (stored as secrets):
- `GOOGLE_API_KEY` - Google Gemini API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `VITE_SUPABASE_URL` - Supabase URL for frontend
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key for frontend

## Features
1. **Document Upload**: Upload images (JPG, PNG) or PDFs
2. **OCR Processing**: Extract text from uploaded documents (Tesseract for images, pdf-parse for PDFs)
3. **AI Simplification**: Convert complex language to simple text using Gemini
4. **Multi-language Support**: Output in 12 Indian languages (Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Bengali, Punjabi, Odia, Urdu, English)
5. **Localized Glossary**: All glossary terms and definitions in target language
6. **Number/Date Explanations**: Detailed explanation of important numbers, dates, amounts
7. **Download Options**: PDF and JPEG download with watermark
8. **History**: View previously simplified documents (login required)
9. **Authentication**: Sign up/Sign in with Supabase Auth

## User Interface
- Government-style design with blue/white/grey colors
- Clean, simple fonts (no italics)
- Three-section document processing flow with visual cards:
  1. Upload Document box (drag-and-drop, file format info)
  2. Select Output Language box (dropdown with 12 languages)
  3. Analyzing Document box (loading animation with progress)
- Login/logout functionality with user icon when logged in
- Upload available to all users (no login required)
- History section requires login

## User Preferences
- Dark theme with blue accents (matching SaralDocs branding)
- Clean, accessible interface
- Larger icons for better visibility

## Toast/Popup System
- Green popups: File uploaded, Language selected, Analysis complete, Download complete
- Red popups: Upload failed, Unsupported file, Analysis error, Missing language
- Auto-dismiss after 4 seconds
- Positioned at top-right corner

## Recent Changes (December 12, 2025)
- **Vercel Deployment Setup**: Created serverless API functions in `/api` directory
- Replaced Tesseract.js OCR with Gemini Vision API for serverless compatibility
- Downloads now serve formatted text files (PDFKit/Canvas removed for serverless)
- Added robust JSON parsing for Gemini responses (handles markdown fences, preamble text)
- Added 8MB file size limit to prevent serverless timeout issues
- Base64 data URL processing for images and PDFs
- Fixed nested folder structure (moved from saraldoczip-1zip/ to root)
- Multiple file upload support - all files displayed in a list below each other
- "Add More Files" button appears on the right side of heading only after first upload
- Green toast notification for multiple file selection
- PDF document support verified and working
- Added VITE_ prefixed Supabase environment variables for frontend

## Previous Changes (December 11, 2025)
- Fixed folder structure - moved from saraldoczip/ to root level
- Added Supabase configuration (URL, anon key, service role key)
- Added "Upload Another File" button in results view after document processing
- Added green checkmark tick to the logo icon (white tick in green circle)
- Enlarged header section (logo, navigation buttons, login)
- Moved document upload/simplify flow to separate /simplify page
- Redesigned 12 Languages section with muted gray background (matching features section)
- Added eye icon for password visibility toggle on login/signup forms
- Added colored success (green) and error (red) popup notifications for auth
- Fixed home button navigation to scroll to top
- Fixed image download functionality by installing required system libraries
- Three-section document processing flow (Upload → Language → Analyze)
- Smooth animations between sections using Framer Motion
- Toasts appear at top-right corner, auto-dismiss after 4 seconds
- Header now slightly darker blue (#3A5BC7) for visual distinction
- Footer now matches hero section blue color (#4169E1)
- Share Your Suggestions section now has muted gray background
- Switched to gemini-1.5-flash for higher quota limits
- Fixed PDF parsing (ESM/CommonJS compatibility)
- Added multiple file upload support (processes one at a time)
- Suggestion success messages now show in green

## Known Limitations
- Google Gemini API free tier has limits per model - check quota at https://ai.dev/usage
- Maximum file size: 8MB (serverless function limit)
- Large PDFs may fail - consider splitting into smaller parts
- Multiple files can be selected but are processed one at a time
- Downloads are text files (not formatted PDFs) for serverless compatibility

## Vercel Deployment
The app is configured for Vercel free tier deployment:

### Project Structure for Vercel
```
├── api/                 # Vercel serverless functions
│   ├── simplify.ts      # Main document simplification endpoint
│   ├── documents.ts     # Document history endpoint
│   ├── suggestions.ts   # User suggestions endpoint
│   └── download/
│       └── text.ts      # Text file download endpoint
├── vercel.json          # Vercel configuration
└── dist/public/         # Built frontend (output directory)
```

### Deployment Steps
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `GOOGLE_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

## Running the Project
```bash
npm install
npm run dev
```
The application runs on port 5000.

