import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Sparkles,
  Download,
  FileImage,
  Copy,
  Check,
  RefreshCw,
  Eye,
  File,
  X,
  ZoomIn,
  ZoomOut,
  Crop,
} from "lucide-react";
import { LanguageSelector } from "./language-selector";
import { GlossarySection } from "./glossary-section";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_LANGUAGES, type SimplificationResult, type LanguageCode, type DocumentSection } from "@shared/schema";
import { toJpeg } from "html-to-image";

interface ResultWithPreview extends SimplificationResult {
  filePreview?: string;
  fileName?: string;
  fileType?: string;
}

interface ResultViewerProps {
  result: ResultWithPreview;
  onLanguageChange: (lang: LanguageCode) => void;
  isChangingLanguage?: boolean;
}

function FormattedContent({ sections, simplifiedText }: { sections?: DocumentSection[]; simplifiedText: string }) {
  if (sections && sections.length > 0) {
    return (
      <div className="space-y-6">
        {sections.map((section, index) => (
          <div key={index} className="space-y-3">
            <h3 className="text-lg font-semibold text-primary border-b border-primary/20 pb-2">
              {section.heading}
            </h3>
            <p className="whitespace-pre-wrap leading-relaxed text-base pl-1">
              {section.content}
            </p>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <p className="whitespace-pre-wrap leading-relaxed text-base">
      {simplifiedText}
    </p>
  );
}

export function ResultViewer({ result, onLanguageChange, isChangingLanguage }: ResultViewerProps) {
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedSimplified, setCopiedSimplified] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);
  const simplifiedRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === result.targetLanguage);
  const sections = result.sections;

  const copyToClipboard = async (text: string, type: "original" | "simplified") => {
    await navigator.clipboard.writeText(text);
    if (type === "original") {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
      toast({
        title: "Copied!",
        description: "Original text copied to clipboard.",
        variant: "success",
      });
    } else {
      setCopiedSimplified(true);
      setTimeout(() => setCopiedSimplified(false), 2000);
      toast({
        title: "Copied!",
        description: "Simplified text copied to clipboard.",
        variant: "success",
      });
    }
  };

  const logoSvg = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 40px; height: 40px;">
    <rect width="40" height="40" rx="10" fill="url(#logoGradientExport)"/>
    <defs>
      <linearGradient id="logoGradientExport" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stop-color="#3B82F6"/>
        <stop offset="1" stop-color="#1D4ED8"/>
      </linearGradient>
    </defs>
    <path d="M10 12C10 10.8954 10.8954 10 12 10H22L28 16V28C28 29.1046 27.1046 30 26 30H12C10.8954 30 10 29.1046 10 28V12Z" fill="white" fill-opacity="0.95"/>
    <path d="M22 10V16H28" fill="white" fill-opacity="0.7"/>
    <path d="M22 10L28 16H22V10Z" fill="#E0E7FF"/>
    <path d="M13 17H25" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2"/>
    <path d="M13 20.5H23" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2"/>
    <circle cx="30" cy="26" r="8" fill="#10B981"/>
    <path d="M27 26L29 28L33 24" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  const createExportContent = () => {
    const sectionsHtml = sections && sections.length > 0 
      ? sections.map(section => `
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #1E40AF; border-bottom: 1px solid #DBEAFE; padding-bottom: 6px;">${section.heading}</h3>
            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #333; white-space: pre-wrap;">${section.content}</p>
          </div>
        `).join('')
      : `<div style="font-size: 13px; line-height: 1.6; color: #333; white-space: pre-wrap;">${result.simplifiedText.split(/\n\n+/).map(p => `<p style="margin: 0 0 10px 0;">${p.trim()}</p>`).join('')}</div>`;

    return `
      <div style="display: flex; align-items: center; gap: 12px; padding-bottom: 15px; margin-bottom: 20px; border-bottom: 2px solid #1E40AF;">
        ${logoSvg}
        <div>
          <h1 style="margin: 0; font-size: 22px; color: #1E40AF; font-weight: 700;">SaralDocs</h1>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748B;">Government Document Simplifier</p>
        </div>
      </div>
      
      <div style="margin-bottom: 15px; padding: 10px; background: #F0F9FF; border-radius: 6px; border-left: 3px solid #1E40AF;">
        <p style="margin: 0; font-size: 12px; color: #1E40AF;">
          <strong>Language:</strong> ${currentLang?.name || result.targetLanguage} (${currentLang?.nativeName || ''}) | 
          <strong>Generated:</strong> ${new Date(result.processedAt).toLocaleDateString()}
        </p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #1E40AF;">Simplified Document</h2>
        ${sectionsHtml}
      </div>
      
      ${result.glossary.length > 0 ? `
        <div style="border-top: 1px solid #E2E8F0; padding-top: 15px; margin-top: 20px;">
          <h2 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 500; color: #1E40AF;">Glossary of Terms</h2>
          <div>
            ${result.glossary.map((term, i) => `
              <div style="margin-bottom: 8px; padding: 8px 10px; background: #F8FAFC; border-radius: 4px;">
                <span style="font-weight: 400; font-size: 12px; color: #334155;">${i + 1}. ${term.term}:</span>
                <span style="font-weight: 400; font-size: 12px; color: #64748B; margin-left: 6px;">${term.definition}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #E2E8F0; text-align: center;">
        <p style="margin: 0; font-size: 10px; color: #94A3B8;">
          Simplified by SaralDocs - AI powered simplification (not a legal replacement for official documents)
        </p>
      </div>
    `;
  };

  const exportAsPDF = async () => {
    setIsExporting(true);
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Could not open print window');
      }

      const content = createExportContent();
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>SaralDocs - Simplified Document</title>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Sans+Gujarati:wght@400;500;600;700&family=Noto+Sans+Kannada:wght@400;500;600;700&family=Noto+Sans+Malayalam:wght@400;500;600;700&family=Noto+Sans+Gurmukhi:wght@400;500;600;700&family=Noto+Sans+Oriya:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Bengali', 'Noto Sans Gujarati', 'Noto Sans Kannada', 'Noto Sans Malayalam', 'Noto Sans Gurmukhi', 'Noto Sans Oriya', 'Noto Nastaliq Urdu', system-ui, sans-serif;
              padding: 30px;
              max-width: 800px;
              margin: 0 auto;
              background: white;
              color: #333;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            document.fonts.ready.then(() => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            });
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      toast({
        title: "PDF Ready!",
        description: "Your document is ready to print or save as PDF.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    }
    setIsExporting(false);
  };

  const generateImagePreview = async () => {
    setIsExporting(true);
    try {
      const container = document.createElement("div");
      container.id = "export-container";
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 794px;
        min-height: 1123px;
        padding: 40px;
        background: white;
        z-index: 99999;
        pointer-events: none;
        opacity: 0;
        font-family: 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Bengali', 'Noto Sans Gujarati', 'Noto Sans Kannada', 'Noto Sans Malayalam', 'Noto Sans Gurmukhi', 'Noto Sans Oriya', 'Noto Nastaliq Urdu', system-ui, sans-serif;
      `;
      
      container.innerHTML = createExportContent();
      document.body.appendChild(container);
      
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 500));
      
      container.style.opacity = "1";
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toJpeg(container, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        quality: 0.95,
        cacheBust: true,
        style: {
          opacity: "1",
        },
      });

      document.body.removeChild(container);
      
      setPreviewImage(dataUrl);
      setCroppedImage(null);
      setZoom(100);
      setIsCropping(false);
      setCropStart(null);
      setCropEnd(null);
      setShowImagePreview(true);
    } catch (error) {
      console.error("Error generating image:", error);
      const existingContainer = document.getElementById("export-container");
      if (existingContainer) {
        document.body.removeChild(existingContainer);
      }
      toast({
        title: "Could not create image",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
    setIsExporting(false);
  };

  const handleCropMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !previewImageRef.current) return;
    const rect = previewImageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCropStart({ x, y });
    setCropEnd({ x, y });
  }, [isCropping]);

  const handleCropMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !cropStart || !previewImageRef.current) return;
    const rect = previewImageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setCropEnd({ x, y });
  }, [isCropping, cropStart]);

  const handleCropMouseUp = useCallback(() => {
    if (!isCropping || !cropStart || !cropEnd || !previewImage || !previewImageRef.current) return;
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx || !previewImageRef.current) return;

      const displayRect = previewImageRef.current.getBoundingClientRect();
      const scaleX = img.width / displayRect.width;
      const scaleY = img.height / displayRect.height;

      const x = Math.min(cropStart.x, cropEnd.x) * scaleX;
      const y = Math.min(cropStart.y, cropEnd.y) * scaleY;
      const width = Math.abs(cropEnd.x - cropStart.x) * scaleX;
      const height = Math.abs(cropEnd.y - cropStart.y) * scaleY;

      if (width < 20 || height < 20) {
        setCropStart(null);
        setCropEnd(null);
        return;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
      
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCroppedImage(croppedDataUrl);
      setIsCropping(false);
      setCropStart(null);
      setCropEnd(null);
    };
    img.src = previewImage;
  }, [isCropping, cropStart, cropEnd, previewImage]);

  const downloadImage = () => {
    const imageToDownload = croppedImage || previewImage;
    if (!imageToDownload) return;
    
    const link = document.createElement("a");
    link.download = "saraldocs-simplified-document.jpg";
    link.href = imageToDownload;
    link.click();
    
    toast({
      title: "Image Downloaded!",
      description: "Your document has been saved as an image.",
      variant: "success",
    });
    setShowImagePreview(false);
  };

  const resetCrop = () => {
    setCroppedImage(null);
    setCropStart(null);
    setCropEnd(null);
    setIsCropping(false);
  };

  const isPdf = result.fileType === "application/pdf";
  const isImage = result.fileType?.startsWith("image/");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Document Simplified</h2>
          <p className="text-sm text-muted-foreground">
            Output in {currentLang?.name} ({currentLang?.nativeName})
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={exportAsPDF}
            disabled={isExporting}
            data-testid="button-export-pdf"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={generateImagePreview}
            disabled={isExporting}
            data-testid="button-export-image"
          >
            <FileImage className="h-4 w-4 mr-2" />
            Image
          </Button>
        </div>
      </div>

      {result.filePreview && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">
                Uploaded Document: {result.fileName || "Document"}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {isPdf ? "PDF" : isImage ? "Image" : "File"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-2 flex justify-center">
              {isImage ? (
                <img
                  src={result.filePreview}
                  alt={result.fileName || "Uploaded document"}
                  className="max-h-[300px] object-contain rounded-lg shadow-sm"
                />
              ) : isPdf ? (
                <div className="w-full">
                  <iframe
                    src={result.filePreview}
                    title={result.fileName || "PDF Preview"}
                    className="w-full h-[400px] rounded-lg border"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-6 text-muted-foreground">
                  <File className="h-8 w-8" />
                  <span>{result.fileName || "Document uploaded"}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="block lg:hidden">
        <Tabs defaultValue="simplified" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simplified" data-testid="tab-simplified">
              <Sparkles className="h-4 w-4 mr-2" />
              Simplified
            </TabsTrigger>
            <TabsTrigger value="original" data-testid="tab-original">
              <FileText className="h-4 w-4 mr-2" />
              Original
            </TabsTrigger>
          </TabsList>
          <TabsContent value="simplified">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Simplified Text
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result.simplifiedText, "simplified")}
                  >
                    {copiedSimplified ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copiedSimplified ? "Copied" : "Copy"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div 
                    ref={simplifiedRef}
                    className="p-4 bg-background rounded-lg"
                    data-testid="text-simplified"
                  >
                    <p className="text-xs text-muted-foreground mb-4 pb-2 border-b">
                      Simplified version - powered by AI (not a legal replacement)
                    </p>
                    <FormattedContent sections={sections} simplifiedText={result.simplifiedText} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="original">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Original Text
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result.originalText, "original")}
                  >
                    {copiedOriginal ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copiedOriginal ? "Copied" : "Copy"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <p 
                    className="whitespace-pre-wrap font-mono text-sm leading-relaxed p-4 bg-muted/30 rounded-lg"
                    data-testid="text-original"
                  >
                    {result.originalText}
                  </p>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="hidden lg:grid lg:grid-cols-2 gap-6">
        <Card className="h-[500px] flex flex-col">
          <CardHeader className="pb-2 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Original Text
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(result.originalText, "original")}
                data-testid="button-copy-original"
              >
                {copiedOriginal ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copiedOriginal ? "Copied" : "Copy"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <p 
                className="whitespace-pre-wrap font-mono text-sm leading-relaxed p-4 bg-muted/30 rounded-lg"
                data-testid="text-original-desktop"
              >
                {result.originalText}
              </p>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="h-[500px] flex flex-col">
          <CardHeader className="pb-2 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Simplified Text
                <Badge variant="secondary">{currentLang?.nativeName}</Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(result.simplifiedText, "simplified")}
                data-testid="button-copy-simplified"
              >
                {copiedSimplified ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copiedSimplified ? "Copied" : "Copy"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div 
                ref={simplifiedRef}
                className="p-4 bg-background rounded-lg"
                data-testid="text-simplified-desktop"
              >
                <p className="text-xs text-muted-foreground mb-4 pb-2 border-b">
                  Simplified version - powered by AI (not a legal replacement)
                </p>
                <FormattedContent sections={sections} simplifiedText={result.simplifiedText} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <GlossarySection terms={result.glossary} />

      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-medium flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${isChangingLanguage ? 'animate-spin' : ''}`} />
                Change Output Language
                {isChangingLanguage && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    Translating to new language...
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                Get the simplified version in a different language
              </p>
            </div>
          </div>
          <div className="mt-4">
            <LanguageSelector
              value={result.targetLanguage as LanguageCode}
              onChange={onLanguageChange}
              label=""
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Image Preview
            </DialogTitle>
            <DialogDescription>
              View, crop, and download your simplified document as an image
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-between gap-2 py-2 border-b">
            <div className="flex items-center gap-2">
              <Button
                variant={isCropping ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (croppedImage) {
                    resetCrop();
                  } else {
                    setIsCropping(!isCropping);
                  }
                }}
                disabled={!!croppedImage && !isCropping}
              >
                <Crop className="h-4 w-4 mr-1" />
                {croppedImage ? "Reset" : isCropping ? "Cancel Crop" : "Crop"}
              </Button>
              {croppedImage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetCrop}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                disabled={zoom <= 25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[50px] text-center">{zoom}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4 min-h-[400px]">
            <div 
              className="flex items-center justify-center"
              style={{ minHeight: '100%' }}
            >
              {isCropping && !croppedImage ? (
                <div
                  className="relative inline-block cursor-crosshair select-none"
                  onMouseDown={handleCropMouseDown}
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                  onMouseLeave={handleCropMouseUp}
                >
                  <img
                    ref={previewImageRef}
                    src={previewImage || undefined}
                    alt="Document preview"
                    className="rounded-lg shadow-lg"
                    style={{ 
                      width: `${zoom}%`,
                      maxWidth: 'none',
                      pointerEvents: 'none'
                    }}
                    draggable={false}
                  />
                  {cropStart && cropEnd && (
                    <div
                      className="absolute border-2 border-primary bg-primary/20 pointer-events-none"
                      style={{
                        left: Math.min(cropStart.x, cropEnd.x),
                        top: Math.min(cropStart.y, cropEnd.y),
                        width: Math.abs(cropEnd.x - cropStart.x),
                        height: Math.abs(cropEnd.y - cropStart.y),
                      }}
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/60 text-white px-3 py-1 rounded text-sm">
                      Click and drag to select area
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  ref={previewImageRef}
                  src={croppedImage || previewImage || undefined}
                  alt="Document preview"
                  className="rounded-lg shadow-lg"
                  style={{ 
                    width: `${zoom}%`,
                    maxWidth: 'none'
                  }}
                />
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowImagePreview(false)}>
              Cancel
            </Button>
            <Button onClick={downloadImage}>
              <Download className="h-4 w-4 mr-2" />
              Download {croppedImage ? "Cropped " : ""}Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
