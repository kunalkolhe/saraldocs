import { useState, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ResultsView } from "@/components/results-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { LanguageCode, SimplifyResponse } from "@shared/schema";
import { supportedLanguages } from "@shared/schema";
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle, 
  Image, 
  X,
  ChevronRight,
  ArrowLeft,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

interface UploadedFile {
  file: File;
  preview?: string;
  id: string;
}

type FlowStep = "upload" | "language" | "analyzing" | "complete";

export default function SimplifyPage() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<FlowStep>("upload");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [result, setResult] = useState<SimplifyResponse | null>(null);
  const [lastFile, setLastFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const resultRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, language }: { file: File; language: LanguageCode }) => {
      setProcessingProgress(10);

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setProcessingProgress(20);

      const response = await fetch("/api/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          language,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process document");
      }

      setProcessingProgress(30);
      await new Promise(resolve => setTimeout(resolve, 500));
      setProcessingProgress(60);
      await new Promise(resolve => setTimeout(resolve, 500));
      setProcessingProgress(90);

      const data = await response.json();
      setProcessingProgress(100);
      
      return data as SimplifyResponse;
    },
    onSuccess: (data) => {
      setResult(data);
      if (selectedFiles.length > 0) {
        setLastFile(selectedFiles[currentFileIndex]);
      }
      setCurrentStep("complete");
      toast({
        title: "Analysis Complete",
        description: "Your document has been successfully simplified.",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      setCurrentStep("language");
      setProcessingProgress(0);
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to process document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isValidFile = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    return validTypes.includes(file.type);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFilesSelect = useCallback((files: File[], isAddMore: boolean = false) => {
    const uploadedFiles: UploadedFile[] = [];
    let processedCount = 0;
    
    if (files.length > 1) {
      toast({
        title: "Multiple Files Selected",
        description: `${files.length} files selected. You can process them one by one.`,
        className: "bg-green-500 text-white border-green-600",
      });
    }
    
    files.forEach((file) => {
      const uploadedFile: UploadedFile = { 
        file, 
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}-${Math.random().toString(36).substring(7)}` 
      };
      
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
          uploadedFiles.push(uploadedFile);
          processedCount++;
          
          if (processedCount === files.length) {
            setSelectedFiles((prev) => {
              const merged = isAddMore ? [...prev, ...uploadedFiles] : uploadedFiles;
              return merged;
            });
            if (!isAddMore) {
              setCurrentFileIndex(0);
            }
            setCurrentStep("language");
          }
        };
        reader.readAsDataURL(file);
      } else {
        uploadedFiles.push(uploadedFile);
        processedCount++;
        
        if (processedCount === files.length) {
          setSelectedFiles((prev) => {
            const merged = isAddMore ? [...prev, ...uploadedFiles] : uploadedFiles;
            return merged;
          });
          if (!isAddMore) {
            setCurrentFileIndex(0);
          }
          setCurrentStep("language");
        }
      }
    });
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        if (isValidFile(files[i])) {
          validFiles.push(files[i]);
        } else {
          invalidFiles.push(files[i].name);
        }
      }
      
      if (invalidFiles.length > 0) {
        toast({
          title: "Some Files Not Supported",
          description: `${invalidFiles.length} file(s) skipped. Only PDF, JPG, PNG supported.`,
          variant: "destructive",
        });
      }
      
      if (validFiles.length > 0) {
        handleFilesSelect(validFiles);
      }
    }
  }, [toast, handleFilesSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        if (isValidFile(files[i])) {
          validFiles.push(files[i]);
        } else {
          invalidFiles.push(files[i].name);
        }
      }
      
      if (invalidFiles.length > 0) {
        toast({
          title: "Some Files Not Supported",
          description: `${invalidFiles.length} file(s) skipped. Only PDF, JPG, PNG supported.`,
          variant: "destructive",
        });
      }
      
      if (validFiles.length > 0) {
        handleFilesSelect(validFiles);
      }
    }
    if (e.target) {
      e.target.value = '';
    }
  }, [toast, handleFilesSelect]);

  const handleAddMoreFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        if (isValidFile(files[i])) {
          validFiles.push(files[i]);
        } else {
          invalidFiles.push(files[i].name);
        }
      }
      
      if (invalidFiles.length > 0) {
        toast({
          title: "Some Files Not Supported",
          description: `${invalidFiles.length} file(s) skipped. Only PDF, JPG, PNG supported.`,
          variant: "destructive",
        });
      }
      
      if (validFiles.length > 0) {
        handleFilesSelect(validFiles, true);
        
        toast({
          title: "Files Added",
          description: `${validFiles.length} file(s) added successfully.`,
          className: "bg-green-500 text-white border-green-600",
        });
      }
    }
    if (e.target) {
      e.target.value = '';
    }
  }, [toast, handleFilesSelect]);

  const handleRemoveFile = useCallback((fileId: string) => {
    setSelectedFiles((prev) => {
      const newFiles = prev.filter((f) => f.id !== fileId);
      if (newFiles.length === 0) {
        setSelectedLanguage(null);
        setCurrentStep("upload");
        setProcessingProgress(0);
      }
      return newFiles;
    });
  }, []);

  const handleRemoveAllFiles = useCallback(() => {
    setSelectedFiles([]);
    setSelectedLanguage(null);
    setCurrentStep("upload");
    setProcessingProgress(0);
  }, []);

  const handleLanguageSelect = useCallback((language: LanguageCode) => {
    setSelectedLanguage(language);
  }, []);

  const handleStartAnalysis = useCallback(() => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No File Selected",
        description: "Please upload a document first.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedLanguage) {
      toast({
        title: "Missing Language",
        description: "Please select an output language.",
        variant: "destructive",
      });
      return;
    }

    setProcessingProgress(0);
    setCurrentStep("analyzing");
    uploadMutation.mutate({
      file: selectedFiles[currentFileIndex].file,
      language: selectedLanguage,
    });
  }, [selectedFiles, currentFileIndex, selectedLanguage, uploadMutation, toast]);

  const handleBack = useCallback(() => {
    setResult(null);
    setSelectedFiles([]);
    setCurrentFileIndex(0);
    setSelectedLanguage(null);
    setCurrentStep("upload");
    setProcessingProgress(0);
  }, []);

  const handleAnalyzeInAnotherLanguage = useCallback(() => {
    if (lastFile) {
      setResult(null);
      setSelectedFiles([lastFile]);
      setCurrentFileIndex(0);
      setSelectedLanguage(null);
      setCurrentStep("language");
      setProcessingProgress(0);
    }
  }, [lastFile]);

  const handleDownloadPDF = useCallback(async () => {
    if (!result) return;
    
    try {
      const response = await fetch("/api/download/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "simplified-document.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Downloaded",
        description: "Document saved as PDF successfully.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Download Failed",
        description: "Could not download PDF. Please try again.",
        variant: "destructive",
      });
    }
  }, [result, toast]);

  const handleDownloadImage = useCallback(async () => {
    if (!result) return;
    
    try {
      const response = await fetch("/api/download/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Download failed");
      }
      
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("Image file is empty");
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "simplified-document.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Image Downloaded",
        description: "Document saved as image successfully.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Could not download image. Please try again.",
        variant: "destructive",
      });
    }
  }, [result, toast]);

  const handleUploadAnother = useCallback(() => {
    setResult(null);
    setSelectedFiles([]);
    setCurrentFileIndex(0);
    setSelectedLanguage(null);
    setLastFile(null);
    setCurrentStep("upload");
    setProcessingProgress(0);
  }, []);

  if (result) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden w-full" ref={resultRef}>
        <Header />
        <ResultsView
          result={result}
          onBack={handleBack}
          onDownloadPDF={handleDownloadPDF}
          onDownloadImage={handleDownloadImage}
          onAnalyzeInAnotherLanguage={handleAnalyzeInAnotherLanguage}
          onUploadAnother={handleUploadAnother}
          hasLastFile={!!lastFile}
        />
        <Footer />
      </div>
    );
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return Image;
    return FileText;
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <Header />
      
      <main className="py-6 sm:py-10 overflow-x-hidden">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>

          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Simplify Your Document</h1>
            <p className="text-muted-foreground">
              Follow these simple steps to understand your documents better
            </p>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={cn(
                "transition-all duration-300",
                currentStep === "upload" ? "ring-2 ring-primary" : "",
                selectedFiles.length > 0 ? "border-green-500 bg-green-50/50 dark:bg-green-950/20" : ""
              )}>
                <CardContent className="p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-white",
                        selectedFiles.length > 0 ? "bg-green-500" : "bg-primary"
                      )}>
                        {selectedFiles.length > 0 ? <CheckCircle className="h-5 w-5" /> : <span className="font-bold">1</span>}
                      </div>
                      <h3 className="text-lg font-semibold">Upload Document</h3>
                      {selectedFiles.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          ({selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                    {selectedFiles.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addMoreInputRef.current?.click()}
                        disabled={uploadMutation.isPending}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add More Files
                      </Button>
                    )}
                  </div>

                  <input
                    ref={addMoreInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleAddMoreFiles}
                    className="hidden"
                    multiple
                  />

                  {selectedFiles.length > 0 ? (
                    <div className="space-y-3">
                      {selectedFiles.map((uploadedFile, index) => (
                        <div 
                          key={uploadedFile.id} 
                          className={cn(
                            "flex items-center gap-4 rounded-lg border bg-card p-4",
                            index === currentFileIndex ? "ring-2 ring-primary" : ""
                          )}
                        >
                          {uploadedFile.preview ? (
                            <div className="h-16 w-16 overflow-hidden rounded-lg border flex-shrink-0">
                              <img
                                src={uploadedFile.preview}
                                alt="Preview"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                              {(() => {
                                const FileIcon = getFileIcon(uploadedFile.file.type);
                                return <FileIcon className="h-8 w-8 text-primary" />;
                              })()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{uploadedFile.file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(uploadedFile.file.size)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(uploadedFile.id)}
                            disabled={uploadMutation.isPending}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => inputRef.current?.click()}
                      className={cn(
                        "cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all",
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <input
                        ref={inputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                      />
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="mb-1 text-base font-semibold">
                        {isDragging ? "Drop your files here" : "Drag & Drop your documents"}
                      </h4>
                      <p className="mb-2 text-sm text-muted-foreground">
                        or click to browse from your device
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported: PDF, JPG, PNG (Max 10MB) - Multiple files supported
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <AnimatePresence>
              {(currentStep === "language" || currentStep === "analyzing" || selectedFiles.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card className={cn(
                    "transition-all duration-300",
                    currentStep === "language" ? "ring-2 ring-primary" : "",
                    selectedLanguage ? "border-green-500 bg-green-50/50 dark:bg-green-950/20" : "",
                    selectedFiles.length === 0 ? "opacity-50 pointer-events-none" : ""
                  )}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-white",
                          selectedLanguage ? "bg-green-500" : selectedFiles.length > 0 ? "bg-primary" : "bg-muted-foreground"
                        )}>
                          {selectedLanguage ? <CheckCircle className="h-5 w-5" /> : <span className="font-bold">2</span>}
                        </div>
                        <h3 className="text-lg font-semibold">Select Output Language</h3>
                      </div>

                      <p className="mb-4 text-sm text-muted-foreground">
                        Choose your preferred language for the simplified output
                      </p>

                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                        {supportedLanguages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            disabled={selectedFiles.length === 0 || uploadMutation.isPending}
                            className={cn(
                              "group relative flex flex-col items-center justify-center rounded-lg border p-3 transition-all hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed",
                              selectedLanguage === lang.code
                                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary"
                                : "border-border bg-card"
                            )}
                          >
                            <span className="text-base font-medium">{lang.nativeName}</span>
                            <span className="text-xs text-muted-foreground">{lang.name}</span>
                          </button>
                        ))}
                      </div>

                      {selectedFiles.length > 0 && selectedLanguage && currentStep === "language" && (
                        <div className="mt-6 text-center">
                          <Button
                            size="lg"
                            onClick={handleStartAnalysis}
                            className="gap-2"
                          >
                            <FileText className="h-5 w-5" />
                            Analyze Document
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {currentStep === "analyzing" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Card className="ring-2 ring-primary">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                          <span className="font-bold">3</span>
                        </div>
                        <h3 className="text-lg font-semibold">Analyzing Document</h3>
                      </div>

                      <div className="flex flex-col items-center py-8">
                        <div className="relative mb-6">
                          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          </div>
                        </div>
                        
                        <h4 className="mb-2 text-lg font-semibold">Analyzing document...</h4>
                        <p className="mb-6 text-sm text-muted-foreground">
                          Please wait while we simplify your document
                        </p>
                        
                        <div className="w-full max-w-md space-y-2">
                          <Progress value={processingProgress} className="h-2" />
                          <p className="text-center text-xs text-muted-foreground">
                            {processingProgress}% complete
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
