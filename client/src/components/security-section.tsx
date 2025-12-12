import { Lock, Clock, Database, UserCheck, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const securityFeatures = [
  {
    icon: Lock,
    title: "Encrypted Upload",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Clock,
    title: "Auto-delete in 7 Days",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Database,
    title: "No Data Stored Permanently",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: UserCheck,
    title: "Private & Confidential",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
];

const notices = [
  "The simplified version is NOT a legal replacement",
  "Always use the original document for official purposes",
  "Consult a lawyer for legal matters",
];

export function SecuritySection() {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl" data-testid="text-security-title">
              Your Documents Are Safe With Us
            </h2>
            <p className="mb-8 text-muted-foreground">
              We understand that government documents contain personal information. 
              Your privacy and security is our top priority.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {securityFeatures.map((feature, index) => (
                <Card key={index} className="border-border" data-testid={`card-security-${index}`}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${feature.bgColor}`}>
                      <feature.icon className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <span className="text-sm font-medium">{feature.title}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-destructive">Important Notice</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                This service helps you <strong>understand</strong> your documents by 
                simplifying the language. Please note:
              </p>
              <ul className="space-y-3">
                {notices.map((notice, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span>{notice}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
