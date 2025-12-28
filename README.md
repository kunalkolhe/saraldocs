# SaralDocs

A document simplification application that converts complex government and legal documents into easy-to-understand text.

## Features

- **Document Simplification** - Converts complex government and legal documents into simple, easy-to-read language
- **Multiple Languages** - Supports Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Bengali, Punjabi, Odia, and Urdu
- **OCR Text Extraction** - Automatically extracts text from images and PDF files
- **Paragraph-wise Formatting** - Maintains original document structure while simplifying language
- **Downloadable Outputs** - Download simplified text as PDF or image format
- **Fast Processing** - Quick document analysis and simplification

## How It Works

1. **Upload a Document** - Upload an image or PDF file containing government or legal documents
2. **Select Language** - Choose your preferred language for simplification
3. **Get Simplified Text** - The document is automatically simplified into easy-to-understand language
4. **Download Results** - Download the simplified text as PDF or image

## Supported Languages

- Hindi (hi)
- Marathi (mr)
- Gujarati (gu)
- Tamil (ta)
- Telugu (te)
- Kannada (kn)
- Malayalam (ml)
- Bengali (bn)
- Punjabi (pa)
- Odia (or)
- Urdu (ur)
- English (en)

## Technology Stack

- **Frontend** - React with TypeScript
- **Backend** - Express.js
- **Text Extraction** - Tesseract OCR
- **Styling** - Tailwind CSS
- **PDF Generation** - PDFKit
- **Document Processing** - pdf-lib, pdf-parse

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Create a .env file with your configuration

# Start development server
npm run dev
```

## Environment Variables

```
GROQ_API_KEY=your_api_key_here
```

## Usage

1. Open the application in your browser
2. Upload a government or legal document (image or PDF)
3. Select your preferred language
4. Click "Simplify"
5. Read the simplified explanation
6. Download as PDF or image if needed

## Features in Detail

### Text Simplification
Documents are simplified while preserving all important information including:
- All reference numbers and codes
- Important dates and deadlines
- Key requirements and rules
- Administrative details

### Paragraph Structure
The simplified text maintains the original document's paragraph structure for easy reading and understanding.

### Glossary
Important terms, numbers, and codes are explained in a simple glossary for quick reference.

## License

MIT
