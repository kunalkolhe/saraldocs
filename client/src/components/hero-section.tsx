import { Upload, Check, Globe, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onUploadClick: () => void;
}

export function HeroSection({ onUploadClick }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-[#4169E1]">
      <div className="relative mx-auto max-w-4xl px-6 py-20 sm:py-28 text-center">
        <p className="mb-6 text-sm font-medium tracking-wide text-white/80 uppercase">
          Government Document Simplifier
        </p>
        
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl" data-testid="text-hero-title">
          Understand Your Government
          <br />
          Documents in Simple Language
        </h1>
        
        <p className="mx-auto mb-10 max-w-2xl text-base text-white/80" data-testid="text-hero-description">
          Upload any government, legal, or official document. We will convert it into simple, 
          easy-to-understand language in your preferred Indian language.
        </p>
        
        <Button
          size="lg"
          className="mb-10 gap-2 bg-white text-[#4169E1] hover:bg-white/90 rounded-full px-8 py-6 text-base font-medium shadow-lg"
          onClick={onUploadClick}
          data-testid="button-upload-document"
        >
          <Upload className="h-5 w-5" />
          Upload Document Now
          <ArrowRight className="h-4 w-4" />
        </Button>
        
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white">
            <Check className="h-4 w-4" />
            Free to Use
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white">
            <Globe className="h-4 w-4" />
            12 Languages
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white">
            <Shield className="h-4 w-4" />
            100% Secure
          </div>
        </div>
      </div>
    </section>
  );
}
