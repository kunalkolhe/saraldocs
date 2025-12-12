import { Globe } from "lucide-react";

const languages = [
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "en", name: "English", nativeName: "English" },
];

export function DemoSection() {
  return (
    <section className="bg-muted/50 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl">
            Available in 12 Indian Languages
          </h2>
          <p className="text-muted-foreground">
            Choose your preferred language for the simplified output
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className="group flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 transition-all hover:bg-accent hover:scale-105"
            >
              <span className="text-xl font-semibold mb-1">
                {lang.nativeName}
              </span>
              <span className="text-sm text-muted-foreground">
                {lang.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
