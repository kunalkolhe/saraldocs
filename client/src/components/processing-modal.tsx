import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProcessingModalProps {
  isOpen: boolean;
  stage: "uploading" | "extracting" | "simplifying" | "generating";
  progress: number;
}

const stageMessages = {
  uploading: "Uploading document...",
  extracting: "Extracting text from document...",
  simplifying: "Simplifying content...",
  generating: "Generating explanations...",
};

export function ProcessingModal({ isOpen, stage, progress }: ProcessingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-lg">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
        
        <h3 className="mb-2 text-lg font-semibold" data-testid="text-processing-stage">
          {stageMessages[stage]}
        </h3>
        
        <p className="mb-6 text-sm text-muted-foreground">
          Please wait while we process your document
        </p>
        
        <div className="space-y-2">
          <Progress value={progress} className="h-2" data-testid="progress-bar" />
          <p className="text-xs text-muted-foreground">{progress}% complete</p>
        </div>
      </div>
    </div>
  );
}
