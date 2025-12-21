import { Upload, Check, Globe, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onUploadClick: () => void;
}

export function HeroSection({ onUploadClick }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-[#4169E1] w-full">
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-20 lg:py-28 text-center">
        <p className="mb-4 sm:mb-6 text-xs sm:text-sm font-medium tracking-wide text-white/80 uppercase">
          Government Document Simplifier
        </p>
        
        <h1 className="mb-4 sm:mb-6 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-white" data-testid="text-hero-title">
          Understand Your Government
          <br />
          Documents in Simple Language
        </h1>
        
        <p className="mx-auto mb-6 sm:mb-10 max-w-2xl text-sm sm:text-base text-white/80 px-2" data-testid="text-hero-description">
          Upload any government, legal, or official document. We will convert it into simple, 
          easy-to-understand language in your preferred Indian language.
        </p>
        
        <Button
          size="lg"
          className="mb-6 sm:mb-10 gap-2 bg-white text-[#4169E1] hover:bg-white/90 rounded-full px-5 sm:px-8 py-4 sm:py-6 text-sm sm:text-base font-medium shadow-lg"
          onClick={onUploadClick}
          data-testid="button-upload-document"
        >
          <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
          Upload Document Now
          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/10 border border-white/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white">
            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
            Free to Use
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/10 border border-white/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white">
            <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
            12 Languages
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/10 border border-white/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
            100% Secure
          </div>
        </div>
      </div>
    </section>
  );
}
