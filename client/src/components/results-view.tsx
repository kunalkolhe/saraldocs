import { useState } from "react";
import { Download, FileText, ArrowLeft, BookOpen, Languages, Upload, Image as ImageIcon, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { SimplifyResponse, GlossaryTerm } from "@shared/schema";
import { supportedLanguages } from "@shared/schema";

interface ResultsViewProps {
  result: SimplifyResponse;
  onBack: () => void;
  onDownloadPDF: () => void;
  onDownloadImage: () => void;
  onAnalyzeInAnotherLanguage?: () => void;
  onUploadAnother?: () => void;
  hasLastFile?: boolean;
}

export function ResultsView({ result, onBack, onDownloadPDF, onDownloadImage, onAnalyzeInAnotherLanguage, onUploadAnother, hasLastFile }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState("simplified");
  
  const language = supportedLanguages.find(l => l.code === result.targetLanguage);
  const languageDisplay = language ? `${language.nativeName} (${language.name})` : result.targetLanguage;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} data-testid="button-back" className="shrink-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-results-title">
              Simplified Document
            </h1>
            <p className="text-sm text-muted-foreground">
              Output Language: {languageDisplay}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {onUploadAnother && (
            <Button 
              variant="default" 
              onClick={onUploadAnother}
              data-testid="button-upload-another"
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Upload className="h-4 w-4" />
              Upload Another File
            </Button>
          )}
          {hasLastFile && onAnalyzeInAnotherLanguage && (
            <Button 
              variant="outline" 
              onClick={onAnalyzeInAnotherLanguage}
              data-testid="button-analyze-another-language"
              className="gap-2"
            >
              <Languages className="h-4 w-4" />
              Analyze in Another Language
            </Button>
          )}
          <Button 
            variant="default" 
            onClick={onDownloadPDF} 
            data-testid="button-download-pdf" 
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <File className="h-4 w-4" />
            Download PDF
          </Button>
          <Button 
            variant="default" 
            onClick={onDownloadImage} 
            data-testid="button-download-image" 
            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <ImageIcon className="h-4 w-4" />
            Download Image
          </Button>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="text-sm text-amber-600 dark:text-amber-400">
          <strong>Disclaimer:</strong> This simplified version is for understanding purposes only 
          and is NOT a legal replacement. Always use the original document for official purposes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simplified" data-testid="tab-simplified">
                Simplified Version
              </TabsTrigger>
              <TabsTrigger value="original" data-testid="tab-original">
                Original Text
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="simplified" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                  <CardTitle className="text-lg">Simplified Text</CardTitle>
                  <Badge variant="secondary">{language?.nativeName}</Badge>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed"
                      data-testid="text-simplified-content"
                    >
                      {result.simplifiedText}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="original" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Original Text</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-muted-foreground"
                      data-testid="text-original-content"
                    >
                      {result.originalText}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Glossary</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {result.glossary && result.glossary.length > 0 ? (
                  <div className="space-y-4">
                    {result.glossary.map((term: GlossaryTerm, index: number) => {
                      // Determine styling based on term content
                      const isDate = term.term.includes("📅") || term.term.includes("[DEADLINE]") || term.term.includes("[EFFECTIVE DATE]") || term.term.includes("Date") || term.term.includes("date");
                      const isMoney = term.term.includes("₹") || term.term.includes("[FEE]") || term.term.includes("[PENALTY]") || term.term.includes("[SUBSIDY]") || term.term.includes("[AMOUNT]");
                      const isTime = term.term.includes("⏰") || term.term.includes("[VALIDITY]") || term.term.includes("[PERIOD]") || term.term.includes("[DEADLINE]") || /\d+\s*(days|weeks|months|years)/.test(term.term);
                      const isContact = term.term.includes("📞") || term.term.includes("[HELPLINE]") || term.term.includes("[CONTACT]") || /\d{4,}/.test(term.term);
                      const isId = term.term.includes("Form ") || term.term.includes("[FORM]") || term.term.includes("No.") || term.term.includes("[ID]");
                      
                      let bgColor = "bg-muted/50";
                      let borderColor = "border-muted";
                      
                      if (isDate) {
                        bgColor = "bg-blue-50 dark:bg-blue-950/30";
                        borderColor = "border-blue-200 dark:border-blue-800";
                      } else if (isMoney) {
                        bgColor = "bg-green-50 dark:bg-green-950/30";
                        borderColor = "border-green-200 dark:border-green-800";
                      } else if (isTime) {
                        bgColor = "bg-amber-50 dark:bg-amber-950/30";
                        borderColor = "border-amber-200 dark:border-amber-800";
                      } else if (isContact) {
                        bgColor = "bg-purple-50 dark:bg-purple-950/30";
                        borderColor = "border-purple-200 dark:border-purple-800";
                      } else if (isId) {
                        bgColor = "bg-orange-50 dark:bg-orange-950/30";
                        borderColor = "border-orange-200 dark:border-orange-800";
                      }
                      
                      return (
                        <div 
                          key={index} 
                          className={`rounded-lg border ${borderColor} ${bgColor} p-3`}
                          data-testid={`glossary-term-${index}`}
                        >
                          <p className="font-semibold text-sm text-primary leading-snug">{term.term}</p>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {term.definition}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    No complex terms or numbers found in this document.
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
