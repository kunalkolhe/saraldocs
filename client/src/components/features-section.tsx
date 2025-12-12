import { Globe, Shield, Clock, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Globe,
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

export function FeaturesSection() {
  return (
    <section className="bg-muted/50 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl" data-testid="text-features-title">
            Why Use This Service?
          </h2>
          <p className="text-muted-foreground">
            Designed to help every citizen understand official documents easily
          </p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="border-border" data-testid={`card-feature-${index}`}>
              <CardContent className="flex flex-col items-start p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
