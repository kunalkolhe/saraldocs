# SaralDocs - Government Document Simplifier

A web application that converts complex government, legal, and official documents into simple, easy-to-understand language. Built to make official documents accessible to everyone, including senior citizens and people with varying literacy levels.

## Features

- **AI-Powered Simplification**: Uses Google Gemini AI to rewrite complex documents in simple language
- **12 Indian Languages**: Supports Hindi, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Marathi, Punjabi, Odia, Urdu, and English
- **Multiple File Formats**: Upload PDF, JPEG, or PNG documents
- **OCR Text Extraction**: Extracts text from scanned documents and images
- **Smart Glossary**: Automatically generates definitions for technical terms
- **Section Organization**: Organizes simplified content into clear, readable sections
- **Export Options**: Download as PDF or Image
- **User Authentication**: Optional login with Supabase for document history
- **Dark/Light Mode**: Theme toggle for comfortable reading
- **Mobile Responsive**: Works on all devices

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn/UI components (Radix UI)
- TanStack Query for state management
- Wouter for routing

### Backend
- Express.js with TypeScript
- Google Gemini AI (gemini-2.5-flash model)
- Tesseract.js for OCR
- pdf-parse for PDF text extraction
- Supabase for authentication

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/kunalkolhe/saraldocs.git
cd saraldocs
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_google_gemini_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Download OCR language files (optional, for local OCR)

Download `.traineddata` files from [Tesseract tessdata](https://github.com/tesseract-ocr/tessdata) for the languages you need.

5. Start the development server
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

### Production Build

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) |
| `SUPABASE_URL` | No | Supabase project URL (for authentication) |
| `SUPABASE_ANON_KEY` | No | Supabase anonymous key (for authentication) |

## Project Structure

```
saraldocs/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── pages/         # Page components
│   └── index.html
├── server/                 # Backend Express server
│   ├── gemini.ts          # AI integration
│   ├── ocr.ts             # OCR processing
│   ├── routes.ts          # API routes
│   └── index.ts           # Server entry point
├── shared/                 # Shared types and schemas
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/process` | Process a single document |
| POST | `/api/process-multiple` | Batch process multiple documents |
| POST | `/api/translate` | Translate processed document |
| GET | `/api/document/:id` | Retrieve processed document |

## Supported Languages

| Language | Code | Native Name |
|----------|------|-------------|
| English | en | English |
| Hindi | hi | हिन्दी |
| Marathi | mr | मराठी |
| Gujarati | gu | ગુજરાતી |
| Tamil | ta | தமிழ் |
| Telugu | te | తెలుగు |
| Kannada | kn | ಕನ್ನಡ |
| Malayalam | ml | മലയാളം |
| Bengali | bn | বাংলা |
| Punjabi | pa | ਪੰਜਾਬੀ |
| Odia | or | ଓଡ଼ିଆ |
| Urdu | ur | اردو |

## How It Works

1. **Upload**: User uploads a PDF or image of a government document
2. **Extract**: Text is extracted using OCR (for images) or PDF parsing
3. **Simplify**: Google Gemini AI rewrites the content in simple language
4. **Organize**: Content is organized into clear sections with headings
5. **Glossary**: Technical terms are identified and defined
6. **Download**: User can export as PDF or image

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Google Gemini AI for powering the simplification
- Tesseract.js for OCR capabilities
- Shadcn/UI for beautiful components
- All contributors and users

---

Made with care for accessible government services
