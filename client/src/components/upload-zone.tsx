import { useState, useCallback, useRef } from "react";
import { Upload, File, X, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadedFile {
  file: File;
  preview?: string;
}

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: UploadedFile | null;
  onRemoveFile: () => void;
  isProcessing?: boolean;
}

export function UploadZone({ onFileSelect, selectedFile, onRemoveFile, isProcessing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

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

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return Image;
    return FileText;
  };

  if (selectedFile) {
    const FileIcon = getFileIcon(selectedFile.file.type);
    
    return (
      <div className="mx-auto max-w-xl">
        <div className="relative rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            {selectedFile.preview ? (
              <div className="h-20 w-20 overflow-hidden rounded-lg border">
                <img
                  src={selectedFile.preview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10">
                <FileIcon className="h-10 w-10 text-primary" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate" data-testid="text-filename">
                {selectedFile.file.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.file.size)}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemoveFile}
              disabled={isProcessing}
              className="shrink-0"
              data-testid="button-remove-file"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
        data-testid="upload-zone"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileChange}
          className="hidden"
          data-testid="input-file"
        />
        
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        
        <h3 className="mb-2 text-lg font-semibold">
          {isDragging ? "Drop your file here" : "Drag & Drop your document"}
        </h3>
        
        <p className="mb-4 text-sm text-muted-foreground">
          or click to browse from your device
        </p>
        
        <p className="text-xs text-muted-foreground">
          Supported formats: JPG, PNG, PDF (Max 10MB)
        </p>
      </div>
    </div>
  );
}
