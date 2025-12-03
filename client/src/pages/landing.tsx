import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Shield,
  Clock,
  Lock,
  Languages,
  FileText,
  CheckCircle,
  Users,
  HelpCircle,
  ArrowRight,
  Send,
} from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@shared/schema";

const features = [
  {
    icon: Languages,
    title: "12 Indian Languages",
    description: "Available in Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, and more.",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description: "Your documents are encrypted and automatically deleted after 7 days.",
  },
  {
    icon: Clock,
    title: "Quick Results",
    description: "Get your simplified document in just 1-2 minutes.",
  },
  {
    icon: HelpCircle,
    title: "Easy to Use",
    description: "Simple interface designed for everyone - no technical knowledge needed.",
  },
];

const securityPoints = [
  { icon: Lock, text: "Encrypted Upload" },
  { icon: Clock, text: "Auto-delete in 7 Days" },
  { icon: Shield, text: "No Data Stored Permanently" },
  { icon: Users, text: "Private & Confidential" },
];

export default function Landing() {
  const [suggestion, setSuggestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendSuggestion = async () => {
    if (!suggestion.trim()) {
      toast({
        title: "Please enter your suggestion",
        description: "The suggestion field cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    // Simulate sending (in real app, this would call an API)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Thank you for your suggestion!",
      description: "We appreciate your feedback and will review it carefully.",
      variant: "success",
    });
    
    setSuggestion("");
    setIsSending(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="govt-banner text-white">
        <div className="govt-container py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <p className="text-lg md:text-xl opacity-90 font-medium">
                Government Document Simplifier
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                Understand Your Government Documents in Simple Language
              </h1>
              <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
                Upload any government, legal, or official document. We will convert it into 
                simple, easy-to-understand language in your preferred Indian language.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/upload">
                <Button 
                  size="lg" 
                  className="govt-button bg-white text-primary hover:bg-gray-100 gap-3 text-lg"
                >
                  <Upload className="h-6 w-6" />
                  Upload Document Now
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-sm md:text-base">
              <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <CheckCircle className="h-5 w-5" />
                Free to Use
              </span>
              <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Languages className="h-5 w-5" />
                12 Languages
              </span>
              <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Shield className="h-5 w-5" />
                100% Secure
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Languages */}
      <section className="govt-section" id="languages">
        <div className="govt-container">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Available in 12 Indian Languages
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose your preferred language for the simplified output
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Card 
                key={lang.code} 
                className="govt-card hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-4 text-center space-y-1">
                  <p className="text-xl font-bold text-primary">{lang.nativeName}</p>
                  <p className="text-sm text-muted-foreground">{lang.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="govt-section bg-muted/30">
        <div className="govt-container">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Why Use This Service?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Designed to help every citizen understand official documents easily
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="govt-card">
                <CardContent className="p-6 space-y-4">
                  <div className="h-14 w-14 flex items-center justify-center rounded-full bg-primary/10">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="govt-section">
        <div className="govt-container">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Your Documents Are Safe With Us
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We understand that government documents contain personal information. 
                  Your privacy and security is our top priority.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {securityPoints.map((point) => (
                    <div 
                      key={point.text}
                      className="flex items-center gap-3 p-4 rounded-lg bg-accent/10 border border-accent/20"
                    >
                      <point.icon className="h-6 w-6 text-accent shrink-0" />
                      <span className="font-medium text-foreground">{point.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="border-2 border-destructive/30 bg-destructive/5">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-destructive" />
                    <h3 className="text-lg font-semibold text-destructive">Important Notice</h3>
                  </div>
                  <div className="space-y-3 text-muted-foreground">
                    <p className="leading-relaxed">
                      This service helps you <strong>understand</strong> your documents by 
                      simplifying the language. Please note:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                        <span>The simplified version is <strong>NOT</strong> a legal replacement</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                        <span>Always use the original document for official purposes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                        <span>Consult a lawyer for legal matters</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Suggestions Section */}
      <section className="govt-section bg-muted/30">
        <div className="govt-container">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Share Your Suggestions
            </h2>
            <p className="text-lg text-muted-foreground">
              Help us improve SaralDocs with your valuable feedback
            </p>
            <Card className="govt-card">
              <CardContent className="p-6 space-y-4">
                <Textarea
                  placeholder="Write your suggestion here..."
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <Button
                  onClick={handleSendSuggestion}
                  disabled={isSending}
                  className="w-full sm:w-auto gap-2"
                >
                  {isSending ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Suggestion
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
