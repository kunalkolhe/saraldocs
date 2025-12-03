# Design Guidelines: Government Document Simplifier

## Design Approach

**System Selection: Material Design 3** - Chosen for its robust accessibility standards, clear visual feedback systems, and proven patterns for information-dense applications. Material's elevation system and state management work exceptionally well for document processing workflows.

**Key Principles:**
- Trust & Clarity: Government-friendly aesthetic with clear visual hierarchy
- Progressive Disclosure: Show complexity only when needed
- Accessibility First: Design for senior citizens and diverse literacy levels
- Status Transparency: Always communicate processing state

---

## Typography System

**Font Stack:** Google Fonts - Inter (primary), Noto Sans (multi-language support)

**Hierarchy:**
- Page Headers: text-3xl md:text-4xl font-bold (36-48px)
- Section Titles: text-2xl md:text-3xl font-semibold (30-36px)
- Card Headers: text-xl font-semibold (24px)
- Body Text: text-base md:text-lg (16-18px) - larger for readability
- Glossary Terms: text-sm font-medium (14px)
- Helper Text: text-sm text-gray-600 (14px)
- Button Text: text-base font-medium (16px)

**Line Height:** Generous spacing for readability - leading-relaxed (1.625) for body text, leading-tight for headings

---

## Layout System

**Spacing Units:** Tailwind units of **4, 6, 8, 12, 16** (e.g., p-4, gap-6, my-8, py-12, px-16)

**Container Strategy:**
- Maximum width: max-w-7xl mx-auto
- Standard padding: px-4 md:px-6 lg:px-8
- Section spacing: py-12 md:py-16 lg:py-20

**Grid Patterns:**
- Upload page: Single column centered (max-w-2xl)
- Result page: Two-column split on desktop (grid-cols-1 lg:grid-cols-2 gap-6)
- Feature cards: Three columns on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6)
- Language selector grid: Four columns (grid-cols-2 md:grid-cols-4 gap-4)

---

## Component Library

### Navigation
- **Header:** Fixed top bar with logo left, language switcher + user menu right
- Height: h-16, backdrop-blur with shadow-sm
- Contents: Logo, "How it Works", "Supported Languages", CTA button, user avatar

### Upload Zone
- **Drag & Drop Area:** Large central focus (min-h-96)
- Dashed border (border-2 border-dashed) with rounded-xl
- Icon: Upload cloud icon (w-16 h-16)
- States: default, hover (scale transform), dragging (border-solid), error (red accent)
- File preview thumbnails below (grid-cols-2 md:grid-cols-4 gap-4)

### Cards & Containers
- **Document Cards:** rounded-lg shadow-md with p-6
- **Feature Cards:** Vertical layout with icon top (w-12 h-12), title, description
- **Result Cards:** Full height with sticky header, scrollable content area
- Elevation: Use shadow-sm (subtle), shadow-md (elevated), shadow-lg (modals)

### Forms & Inputs
- **Language Selector:** Radio cards in grid (p-4 border-2 rounded-lg)
- Selected state: border-blue-600 with background tint
- **Upload Button:** Large primary (px-8 py-4 text-lg rounded-lg)
- **Download Buttons:** Secondary style with icon prefix (flex items-center gap-2)

### Data Display
- **Split View (Result Page):** 
  - Left: "Original Text" card with monospace excerpt
  - Right: "Simplified Text" card with readable font
  - Both: max-h-screen overflow-y-auto with custom scrollbar
- **Glossary Section:** Accordion/expansion panels (border-l-4 pl-4) for each term
- **Highlighted Terms:** Inline badges (bg-yellow-100 px-2 py-1 rounded text-sm font-medium)

### Loading States
- **Progress Indicator:** Linear progress bar for OCR (0-50%) and AI processing (50-100%)
- **Processing Cards:** Skeleton loaders with pulse animation
- **Status Messages:** Toast notifications (fixed top-4 right-4 rounded-lg shadow-lg p-4)

### Modals & Overlays
- **File Preview:** Full-screen modal with close button, pagination for multi-page PDFs
- **Error Dialog:** Centered modal (max-w-md) with icon, message, retry action
- Backdrop: backdrop-blur-sm bg-black/30

---

## Page Layouts

### Landing Page (Marketing)
1. **Hero Section:** (min-h-screen) - Full-screen hero with:
   - Large heading + subheading (max-w-3xl mx-auto text-center)
   - Upload CTA button (large, prominent)
   - Trust indicators below: "Supports 12 languages • Secure & Private • Auto-delete in 7 days"
   - Background: Gradient with subtle document pattern overlay

2. **How It Works:** (py-20) - Four-step process cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
   - Each with numbered badge, icon, title, description

3. **Supported Languages:** (py-16) - Grid showcasing 12 language flags/icons (grid-cols-3 md:grid-cols-4 lg:grid-cols-6)

4. **Key Features:** (py-20) - Three columns (grid-cols-1 md:grid-cols-3)
   - OCR Extraction, AI Simplification, Multi-format Export
   - Each with icon, heading, bullet points

5. **Trust & Security:** (py-16) - Two columns (grid-cols-1 lg:grid-cols-2)
   - Left: Security features list
   - Right: Disclaimer card with legal text

6. **CTA Section:** (py-20) - Centered call-to-action with large button

### Upload Page
- **Centered Layout:** (max-w-4xl mx-auto py-12)
- Upload zone prominent at top
- Language selector grid below (grid-cols-2 md:grid-cols-4)
- Process button centered, full-width on mobile
- Recent uploads sidebar (optional, right side on desktop)

### Result Page
- **Two-Column Split:** (grid-cols-1 lg:grid-cols-2 gap-6)
- Sticky toolbar at top with download buttons
- Left: Original text card with copy button
- Right: Simplified text card with language switcher
- Glossary expansion panel below both columns (col-span-2)

---

## Images

**Hero Section:** Use a high-quality image showing diverse people (students, seniors, professionals) successfully understanding documents. Image should convey relief/clarity. Overlay with semi-transparent gradient for text readability. Image placement: background with h-screen, object-cover.

**Feature Illustrations:** Simple iconographic illustrations (not photos) for "How It Works" steps - document upload, OCR scanning, AI processing, download icons.

**Trust Section:** Consider a subtle background pattern of official document stamps/seals (very low opacity) to reinforce government document context.

---

## Accessibility Essentials

- Minimum touch targets: 44×44px for all interactive elements
- Color contrast ratio: 4.5:1 minimum for all text
- Keyboard navigation: Visible focus states (ring-2 ring-offset-2)
- Screen reader: Proper ARIA labels for all upload/processing states
- Multi-language: Proper font rendering with Noto Sans fallback
- Error messages: Icon + text, never color alone

---

## Responsive Behavior

**Mobile (base):** Single column, full-width cards, stacked layout
**Tablet (md: 768px):** Two-column grids, larger touch targets
**Desktop (lg: 1024px):** Multi-column layouts, split views, hover states

**Critical Mobile Adaptations:**
- Upload zone: Tappable full-width button alternative
- Result view: Tabbed interface instead of side-by-side
- Language grid: 2 columns maximum
- Download buttons: Sticky bottom bar