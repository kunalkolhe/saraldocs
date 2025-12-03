import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FileDropzone } from "@/components/file-dropzone";
import { LanguageSelector } from "@/components/language-selector";
import { ProcessingStatusDisplay } from "@/components/processing-status";
import { ResultViewer } from "@/components/result-viewer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  CheckCircle,
  HelpCircle,
  Upload as UploadIcon,
  Languages,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  UploadedFile,
  LanguageCode,
  ProcessingStatus,
  SimplificationResult,
} from "@shared/schema";

interface ResultWithPreview extends SimplificationResult {
  id?: string | number;
  filePreview?: string;
  fileName?: string;
  fileType?: string;
}

const instructionSteps = [
  {
    number: "1",
    icon: UploadIcon,
    title: "Upload Document",
    description: "Select your PDF, JPEG, or PNG file",
  },
  {
    number: "2",
    icon: Languages,
    title: "Choose Language",
    description: "Select your preferred output language",
  },
  {
    number: "3",
    icon: Sparkles,
    title: "Click Simplify",
    description: "We will process your document",
  },
  {
    number: "4",
    icon: Download,
    title: "Download Result",
    description: "Get your simplified document",
  },
];

export default function UploadPage() {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("en");
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResultWithPreview[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  interface ProcessMultipleResponse {
    results: SimplificationResult[];
    errors?: { index: number; fileName: string; error: string }[];
    totalProcessed: number;
    totalFailed: number;
  }

  const processDocuments = useMutation({
    mutationFn: async (data: { files: UploadedFile[]; language: LanguageCode }) => {
      setStatus("uploading");
      setProgress(10);
      setError(null);

      const response = await apiRequest("POST", "/api/process-multiple", {
        files: data.files.map(f => ({
          fileData: f.dataUrl,
          fileName: f.name,
          fileType: f.type,
        })),
        targetLanguage: data.language,
      });

      return (await response.json()) as ProcessMultipleResponse;
    },
    onSuccess: (data) => {
      const resultsWithPreviews: ResultWithPreview[] = data.results.map((result, index) => {
        const matchingFile = selectedFiles.find(f => f.name === (result as any).fileName) || selectedFiles[index];
        return {
          ...result,
          filePreview: matchingFile?.dataUrl,
          fileName: matchingFile?.name || (result as any).fileName,
          fileType: matchingFile?.type,
        };
      });
      setResults(resultsWithPreviews);
      setCurrentResultIndex(0);
      setStatus("complete");
      setProgress(100);

      if (data.errors && data.errors.length > 0) {
        const failedNames = data.errors.map(e => e.fileName).join(', ');
        toast({
          title: "Some Documents Failed",
          description: `${data.totalProcessed} succeeded, ${data.totalFailed} failed: ${failedNames}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Document Simplified Successfully!",
          description: `${data.results.length} document${data.results.length > 1 ? 's have' : ' has'} been simplified.`,
          variant: "success",
        });
      }
    },
    onError: (err: Error) => {
      setStatus("error");
      setError(err.message || "Failed to process documents");
      toast({
        title: "Processing Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const changeLanguage = useMutation({
    mutationFn: async (newLanguage: LanguageCode) => {
      const currentResult = results[currentResultIndex];
      if (!currentResult) throw new Error("No result to translate");

      const response = await apiRequest("POST", "/api/translate", {
        originalText: currentResult.originalText,
        simplifiedText: currentResult.simplifiedText,
        sections: currentResult.sections,
        glossary: currentResult.glossary,
        sourceLanguage: currentResult.sourceLanguage,
        targetLanguage: newLanguage,
      });

      return (await response.json()) as SimplificationResult;
    },
    onSuccess: (data) => {
      const newResults = [...results];
      newResults[currentResultIndex] = data;
      setResults(newResults);
      setTargetLanguage(data.targetLanguage as LanguageCode);
      toast({
        title: "Translation Complete!",
        description: "Document translated to new language.",
        variant: "success",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Translation Failed",
        description: err.message || "Could not translate document.",
        variant: "destructive",
      });
    },
  });

  const handleProcess = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please upload at least one document first.",
        variant: "destructive",
      });
      return;
    }

    processDocuments.mutate({ files: selectedFiles, language: targetLanguage });
  };

  const handleNewDocument = () => {
    setSelectedFiles([]);
    setResults([]);
    setCurrentResultIndex(0);
    setStatus("idle");
    setProgress(0);
    setError(null);
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles(selectedFiles.filter(f => f.id !== id));
  };

  const navigateResult = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentResultIndex > 0) {
      setCurrentResultIndex(currentResultIndex - 1);
    } else if (direction === 'next' && currentResultIndex < results.length - 1) {
      setCurrentResultIndex(currentResultIndex + 1);
    }
  };

  if (processDocuments.isPending) {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) {
          setStatus("uploading");
          return prev + 2;
        }
        if (prev < 60) {
          setStatus("extracting");
          return prev + 1;
        }
        if (prev < 95) {
          setStatus("simplifying");
          return prev + 0.3;
        }
        clearInterval(timer);
        return prev;
      });
    }, 200);

    setTimeout(() => clearInterval(timer), 120000);
  }

  const currentResult = results[currentResultIndex];

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <div className="govt-banner text-white py-8">
          <div className="govt-container">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {results.length > 0 ? "Your Simplified Document" : "Upload Your Document"}
                </h1>
                <p className="text-white/80 mt-1">
                  {results.length > 0
                    ? "Review your simplified document below"
                    : "Upload a government or legal document to simplify it"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="govt-container py-8">
          {/* Instructions - Show only when no results */}
          {results.length === 0 && selectedFiles.length === 0 && (
            <Card className="mb-8 border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">How to Use</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {instructionSteps.map((step) => (
                    <div key={step.number} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                        {step.number}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{step.title}</p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {results.length > 0 && currentResult ? (
            <div className="space-y-6">
              {/* Success Banner */}
              <Card className="border-2 border-accent bg-accent/10">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-accent">Document Simplified Successfully!</h3>
                    <p className="text-muted-foreground">
                      Your document has been converted to simple language. You can download it below.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleNewDocument}
                    className="gap-2"
                  >
                    <UploadIcon className="h-4 w-4" />
                    Upload New Document
                  </Button>
                </CardContent>
              </Card>

              {/* Multi-document Navigation */}
              {results.length > 1 && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="font-medium">
                          Viewing Document {currentResultIndex + 1} of {results.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigateResult('prev')}
                          disabled={currentResultIndex === 0}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex gap-1">
                          {results.map((_, index) => (
                            <Button
                              key={index}
                              variant={index === currentResultIndex ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentResultIndex(index)}
                              className="w-8 h-8 p-0"
                            >
                              {index + 1}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigateResult('next')}
                          disabled={currentResultIndex === results.length - 1}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <ResultViewer
                result={currentResult}
                onLanguageChange={(lang) => changeLanguage.mutate(lang)}
                isChangingLanguage={changeLanguage.isPending}
              />
            </div>
          ) : (
            <div className="space-y-8 max-w-4xl mx-auto">
              {/* Step 1: Upload */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="step-number">1</div>
                  <h2 className="text-xl font-semibold">Upload Your Document</h2>
                </div>
                <FileDropzone
                  onFilesSelect={(newFiles) => setSelectedFiles(prev => [...prev, ...newFiles])}
                  selectedFiles={selectedFiles}
                  onRemoveFile={handleRemoveFile}
                  onClearAll={() => setSelectedFiles([])}
                />
              </div>

              {selectedFiles.length > 0 && (
                <>
                  {/* Step 2: Select Language */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="step-number">2</div>
                      <h2 className="text-xl font-semibold">Select Output Language</h2>
                    </div>
                    <Card className="govt-card">
                      <CardContent className="p-6">
                        <LanguageSelector
                          value={targetLanguage}
                          onChange={setTargetLanguage}
                          label="Choose the language for your simplified document"
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Processing Status */}
                  {(status !== "idle" || processDocuments.isPending) && (
                    <Card className="govt-card border-primary/30">
                      <CardContent className="p-6">
                        <ProcessingStatusDisplay status={status} progress={progress} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Error Display */}
                  {error && (
                    <Card className="border-2 border-destructive bg-destructive/5">
                      <CardContent className="p-4 flex items-start gap-4">
                        <AlertCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-destructive">Error Processing Document</p>
                          <p className="text-muted-foreground mt-1">{error}</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Please try again. If the problem continues, try a different file format.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 3: Process Button */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="step-number">3</div>
                      <h2 className="text-xl font-semibold">Simplify Your Document</h2>
                    </div>
                    <Button
                      size="lg"
                      className="w-full govt-button govt-button-primary gap-3"
                      onClick={handleProcess}
                      disabled={processDocuments.isPending || selectedFiles.length === 0}
                    >
                      {processDocuments.isPending ? (
                        <>
                          <Sparkles className="h-6 w-6 animate-pulse" />
                          Processing... Please Wait
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-6 w-6" />
                          Simplify {selectedFiles.length} Document{selectedFiles.length > 1 ? 's' : ''} Now
                        </>
                      )}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      This usually takes 1-2 minutes depending on document size
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
