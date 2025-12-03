import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import type { GlossaryTerm } from "@shared/schema";

interface GlossarySectionProps {
  terms: GlossaryTerm[];
}

export function GlossarySection({ terms }: GlossarySectionProps) {
  if (terms.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <BookOpen className="h-4 w-4 text-primary" />
          Glossary of Terms
          <Badge variant="secondary" className="ml-auto text-xs">
            {terms.length} {terms.length === 1 ? "term" : "terms"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion type="single" collapsible className="w-full">
          {terms.map((term, index) => (
            <AccordionItem 
              key={`${term.term}-${index}`} 
              value={`term-${index}`}
              className="border-l-4 border-l-primary/30 pl-4"
            >
              <AccordionTrigger 
                className="hover:no-underline py-2 text-sm"
                data-testid={`button-glossary-term-${index}`}
              >
                <span className="font-medium text-left text-sm">{term.term}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <p 
                  className="text-muted-foreground leading-relaxed text-sm"
                  data-testid={`text-glossary-definition-${index}`}
                >
                  {term.definition}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
