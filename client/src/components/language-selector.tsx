import { supportedLanguages, type LanguageCode } from "@shared/schema";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  selectedLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  compact?: boolean;
}

export function LanguageSelector({ selectedLanguage, onLanguageChange, compact = false }: LanguageSelectorProps) {
  if (compact) {
    return (
      <div className="text-center">
        <h3 className="mb-3 text-lg font-semibold" data-testid="text-languages-title">
          Select Output Language
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Choose your preferred language for the simplified output
        </p>
        
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className={cn(
                "group relative flex flex-col items-center justify-center rounded-lg border p-3 transition-all hover:bg-accent",
                selectedLanguage === lang.code
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card"
              )}
              data-testid={`button-language-${lang.code}`}
            >
              <span className="text-base font-medium">{lang.nativeName}</span>
              <span className="text-xs text-muted-foreground">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="bg-muted/50 py-16">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="mb-3 text-2xl font-bold sm:text-3xl" data-testid="text-languages-title">
          Available in 12 Indian Languages
        </h2>
        <p className="mb-10 text-muted-foreground">
          Choose your preferred language for the simplified output
        </p>
        
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className={cn(
                "group relative flex flex-col items-center justify-center rounded-lg border p-4 transition-all hover:bg-accent",
                selectedLanguage === lang.code
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card"
              )}
              data-testid={`button-language-${lang.code}`}
            >
              <span className="text-lg font-medium">{lang.nativeName}</span>
              <span className="text-xs text-muted-foreground">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
