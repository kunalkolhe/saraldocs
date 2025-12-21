import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { DemoSection } from "@/components/demo-section";
import { FeaturesSection } from "@/components/features-section";
import { SecuritySection } from "@/components/security-section";
import { SuggestionForm } from "@/components/suggestion-form";
import { Footer } from "@/components/footer";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  const handleUploadClick = () => {
    setLocation("/simplify");
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <Header />
      
      <main className="w-full overflow-x-hidden">
        <HeroSection onUploadClick={handleUploadClick} />
        <DemoSection />
        <FeaturesSection />
        <SecuritySection />
        <SuggestionForm />
      </main>
      
      <Footer />
    </div>
  );
}
