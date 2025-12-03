import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@shared/schema";

interface LanguageSelectorProps {
  value: LanguageCode;
  onChange: (value: LanguageCode) => void;
  label?: string;
}

export function LanguageSelector({ value, onChange, label = "Select Output Language" }: LanguageSelectorProps) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">{label}</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = value === lang.code;
          return (
            <Card
              key={lang.code}
              onClick={() => onChange(lang.code)}
              className={`
                cursor-pointer transition-all duration-200 hover-elevate
                ${isSelected 
                  ? "border-primary bg-primary/5 ring-1 ring-primary" 
                  : "hover:border-primary/50"
                }
              `}
              data-testid={`button-lang-${lang.code}`}
            >
              <CardContent className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{lang.nativeName}</p>
                  <p className="text-xs text-muted-foreground">{lang.name}</p>
                </div>
                {isSelected && (
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
