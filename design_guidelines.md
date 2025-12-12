# SaralDocs Design Guidelines

## Design Approach: Government Portal System

**Selected Approach**: Custom government portal design inspired by India's official digital platforms (Aadhaar, DigiLocker, UMANG) combined with Material Design principles for form controls and interactions.

**Core Principles**:
- Trust and credibility through clean, professional aesthetics
- Maximum clarity and accessibility for all user groups
- Functional efficiency over decorative elements
- Consistent, predictable interaction patterns

## Typography

**Font Stack**: 
- Primary: Inter or Noto Sans (Google Fonts) - excellent multilingual support
- Weights: 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold)

**Hierarchy**:
- H1 (Page Titles): 2.5rem/40px, Semi-bold - Upload Page, Results Page
- H2 (Section Headers): 1.875rem/30px, Semi-bold - "Upload Document", "Simplified Result"
- H3 (Subsections): 1.25rem/20px, Medium - "Glossary", "Download Options"
- Body Large: 1.125rem/18px, Regular - Instructions, explanations
- Body: 1rem/16px, Regular - Standard text, document content
- Small: 0.875rem/14px, Regular - Helper text, file size limits, disclaimers

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Component padding: p-6 or p-8
- Section spacing: mb-8, mb-12, mb-16
- Card gaps: gap-6
- Button spacing: px-8 py-3

**Container Strategy**:
- Max-width: max-w-6xl for main content areas
- Document viewer: max-w-7xl for split-view
- Upload zone: max-w-2xl centered
- Consistent px-6 on mobile, px-8 on desktop

## Component Library

### Navigation Header
- Full-width header with max-w-7xl inner container
- Logo + "SaralDocs" wordmark on left
- Language selector dropdown on right
- Height: h-16 with px-6 horizontal padding
- Border-bottom with subtle shadow

### Upload Page Components

**Upload Zone**:
- Large drag-and-drop area: min-h-80, border-2 dashed, rounded-xl
- Center-aligned content with upload icon (64px), heading, and supported formats text
- Active state: border-solid with subtle background shift
- File preview thumbnails: grid-cols-3 gap-4 below upload zone

**File Information Card**:
- Shows filename, size, format
- Remove button (icon-only) positioned top-right
- Rounded-lg with border, p-4

**Language Selector**:
- Prominent dropdown with all 12 languages
- Large click target (h-12), full-width on mobile
- Selected language highlighted with icon

**Action Button**:
- Primary CTA: "Simplify Document" - Large (h-14), full-width on mobile
- Rounded-lg, font-medium, prominent

### Processing States

**Progress Indicator**:
- Linear progress bar with percentage
- Status text: "Extracting text...", "Simplifying content...", "Generating explanations..."
- Centered modal overlay with semi-transparent background

### Results Page Components

**Split-View Layout**:
- Desktop: Two-column grid (grid-cols-2 gap-8)
- Mobile: Stacked single column with tabs
- Each panel: Rounded-lg card with p-6, scrollable content area
- Headers: "Original Document" | "Simplified Version"

**Document Viewer Panel**:
- White background with text container (max-w-prose)
- Line height: leading-relaxed for readability
- Highlighted terms link to glossary

**Glossary Sidebar**:
- Sticky position on desktop (right side or bottom drawer on mobile)
- Term cards with rounded borders, p-4, mb-3
- Term (bold) + Definition (regular)
- Max-height with scroll

**Download Section**:
- Horizontal button group on desktop, stacked on mobile
- Two download options: "Download PDF" | "Download Image"
- Secondary style buttons with icons
- Watermark disclaimer text below (small, muted)

### Supporting Components

**Alert/Notice Boxes**:
- Rounded-lg, p-4, border-left-4
- Info, Warning, Success variants
- Icon + Message layout

**Empty States**:
- Centered content with illustration or icon
- Heading + descriptive text + action button

**Loading Skeletons**:
- Animated placeholders for document content
- Pulse animation on rectangular blocks

## Images

**No Hero Image Required** - This is a utility application focused on document processing.

**Icon Usage**:
- Upload: Cloud upload or document upload icon
- Processing: Spinner or gear icon
- Success: Checkmark
- Download: Download arrow icon
- Language: Globe or translation icon
- Use Heroicons via CDN (outline style for consistency with government aesthetic)

**Document Previews**:
- Thumbnail images of uploaded documents (auto-generated)
- OCR-extracted document images in results view
- Max dimensions with object-fit: contain

## Animations

**Minimal, Purposeful Only**:
- Upload zone: Gentle scale on drag-over (scale-102)
- Button interactions: Standard hover/active states (no custom animations)
- Progress bar: Smooth width transition
- Modal overlays: Fade in/out (duration-200)
- No scroll-triggered or decorative animations

## Trust & Accessibility Features

**Visual Trust Indicators**:
- Government seal or verification badge in header
- "Secure & Private" badge with lock icon
- Auto-delete timer display: "Document expires in X days"

**Accessibility**:
- All interactive elements: min-h-12 touch target
- Form inputs: Clear labels above fields, h-12 consistent height
- High contrast text throughout
- ARIA labels on icon-only buttons
- Focus states: ring-2 ring-offset-2 on all interactive elements

**Information Clarity**:
- Step indicators showing process: Upload → Process → Review → Download
- Clear error messages with resolution steps
- File size/format limits displayed prominently
- Privacy policy link in footer

This design creates a trustworthy, efficient government-style interface optimized for document processing across all user groups and languages.