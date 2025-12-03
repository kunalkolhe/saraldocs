import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { FileSearch, Sparkles, CheckCircle, Loader2 } from "lucide-react";
import type { ProcessingStatus } from "@shared/schema";

interface ProcessingStatusProps {
  status: ProcessingStatus;
  progress: number;
}

const statusConfig = {
  idle: {
    icon: FileSearch,
    label: "Ready to process",
    description: "Upload a document to get started",
    color: "text-muted-foreground",
  },
  uploading: {
    icon: Loader2,
    label: "Uploading...",
    description: "Preparing your document for processing",
    color: "text-primary",
    animate: true,
  },
  extracting: {
    icon: FileSearch,
    label: "Extracting Text",
    description: "Using OCR to read your document",
    color: "text-primary",
  },
  simplifying: {
    icon: Sparkles,
    label: "Simplifying",
    description: "AI is rewriting in simple language",
    color: "text-primary",
  },
  complete: {
    icon: CheckCircle,
    label: "Complete",
    description: "Your document has been simplified",
    color: "text-green-600 dark:text-green-500",
  },
  error: {
    icon: FileSearch,
    label: "Error",
    description: "Something went wrong",
    color: "text-destructive",
  },
};

export function ProcessingStatusDisplay({ status, progress }: ProcessingStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className="border-primary/20">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ${config.color}`}>
            <Icon className={`h-6 w-6 ${config.animate ? "animate-spin" : ""}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold ${config.color}`} data-testid="text-status-label">
              {config.label}
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-status-description">
              {config.description}
            </p>
          </div>
          {status !== "idle" && status !== "complete" && status !== "error" && (
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(progress)}%
            </span>
          )}
        </div>

        {status !== "idle" && (
          <Progress value={progress} className="h-2" data-testid="progress-bar" />
        )}

        {status !== "idle" && status !== "error" && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div className={`flex items-center gap-2 ${progress >= 10 ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}`}>
                <div className={`h-2 w-2 rounded-full ${progress >= 10 ? "bg-green-600 dark:bg-green-500" : "bg-muted"}`} />
                Upload
              </div>
              <div className={`flex items-center gap-2 ${progress >= 50 ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}`}>
                <div className={`h-2 w-2 rounded-full ${progress >= 50 ? "bg-green-600 dark:bg-green-500" : "bg-muted"}`} />
                OCR
              </div>
              <div className={`flex items-center gap-2 ${progress >= 100 ? "text-green-600 dark:text-green-500" : "text-muted-foreground"}`}>
                <div className={`h-2 w-2 rounded-full ${progress >= 100 ? "bg-green-600 dark:bg-green-500" : "bg-muted"}`} />
                Simplify
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
