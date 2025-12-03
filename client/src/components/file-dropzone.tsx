import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileImage, FileText, X, AlertCircle, Plus, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UploadedFile } from "@shared/schema";

interface FileDropzoneProps {
  onFilesSelect: (files: UploadedFile[]) => void;
  selectedFiles: UploadedFile[];
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
}

const MAX_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 10;
const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/pdf": [".pdf"],
};

export function FileDropzone({ onFilesSelect, selectedFiles, onRemoveFile, onClearAll }: FileDropzoneProps) {
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        let errorMessage = "Could not upload file.";
        if (rejection.errors[0]?.code === "file-too-large") {
          errorMessage = "File is too large. Maximum size allowed is 20MB per file.";
        } else if (rejection.errors[0]?.code === "file-invalid-type") {
          errorMessage = "This file type is not supported. Please upload JPEG, PNG, or PDF files only.";
        } else if (rejection.errors[0]?.code === "too-many-files") {
          errorMessage = `You can only upload up to ${MAX_FILES} files at once.`;
        }
        setError(errorMessage);
        toast({
          title: "Upload Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (acceptedFiles.length + selectedFiles.length > MAX_FILES) {
        const errorMessage = `Maximum ${MAX_FILES} files allowed. You already have ${selectedFiles.length} file(s) selected.`;
        setError(errorMessage);
        toast({
          title: "Upload Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      const readFilePromises = acceptedFiles.map((file) => {
        return new Promise<UploadedFile>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const uploadedFile: UploadedFile = {
              id: crypto.randomUUID(),
              name: file.name,
              type: file.type,
              size: file.size,
              dataUrl,
              preview: file.type.startsWith("image/") ? dataUrl : undefined,
            };
            resolve(uploadedFile);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readFilePromises).then((newFiles) => {
        onFilesSelect(newFiles);
        toast({
          title: "File Uploaded Successfully!",
          description: `${newFiles.length} file${newFiles.length > 1 ? 's' : ''} added.`,
          variant: "success",
        });
      });
    },
    [onFilesSelect, selectedFiles, toast]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true,
    maxFiles: MAX_FILES,
    noClick: selectedFiles.length > 0,
    noKeyboard: selectedFiles.length > 0,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedFiles.length > 0) {
    return (
      <div className="space-y-4" {...getRootProps()}>
        <input {...getInputProps()} />
        
        <Card className="border-2 border-accent bg-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-accent">
                    {selectedFiles.length} File{selectedFiles.length > 1 ? "s" : ""} Selected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFiles.length < MAX_FILES 
                      ? `You can add up to ${MAX_FILES - selectedFiles.length} more files`
                      : "Maximum files reached"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                  disabled={selectedFiles.length >= MAX_FILES}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add More
                </Button>
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearAll();
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid gap-3">
          {selectedFiles.map((file, index) => (
            <Card key={file.id} className="govt-card border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    {file.type.startsWith("image/") ? (
                      <FileImage className="h-7 w-7 text-primary" />
                    ) : (
                      <FileText className="h-7 w-7 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground shrink-0">
                        File {index + 1}
                      </Badge>
                    </div>
                    <p className="font-medium truncate" data-testid={`text-filename-${index}`}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant="outline">
                        {file.type.split("/")[1].toUpperCase()}
                      </Badge>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(file.id);
                    }}
                    data-testid={`button-remove-file-${index}`}
                    className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {file.preview && (
                  <div className="mt-4 rounded-lg overflow-hidden border-2 border-muted bg-muted/30">
                    <img
                      src={file.preview}
                      alt={`Preview of ${file.name}`}
                      className="w-full max-h-40 object-contain"
                      data-testid={`img-preview-${index}`}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <Card className="border-2 border-destructive bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <span className="text-destructive font-medium" data-testid="text-error">{error}</span>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`
          border-3 border-dashed cursor-pointer transition-all duration-200
          ${isDragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/30"
          }
        `}
        data-testid="dropzone-upload"
      >
        <CardContent className="p-10 md:p-16">
          <input {...getInputProps()} data-testid="input-file" />
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <div className={`
              flex h-20 w-20 items-center justify-center rounded-full
              transition-colors duration-200
              ${isDragActive ? "bg-primary text-primary-foreground" : "bg-primary/10"}
            `}>
              <Upload className={`h-10 w-10 ${isDragActive ? "" : "text-primary"}`} />
            </div>
            <div className="space-y-3">
              <p className="text-xl md:text-2xl font-semibold text-foreground">
                {isDragActive ? "Drop your file here" : "Drag & Drop Your Document Here"}
              </p>
              <p className="text-lg text-muted-foreground">
                or <button type="button" className="text-primary font-semibold hover:underline">click to browse</button> your files
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Accepted formats:</span>
                <Badge variant="outline" className="text-base px-3 py-1">PDF</Badge>
                <Badge variant="outline" className="text-base px-3 py-1">JPEG</Badge>
                <Badge variant="outline" className="text-base px-3 py-1">PNG</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Maximum file size: 20MB | Up to {MAX_FILES} files at once
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-2 border-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <span className="text-destructive font-medium" data-testid="text-error">{error}</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
