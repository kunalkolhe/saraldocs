import type { SimplifyResponse, GlossaryTerm } from "@shared/schema";
import * as path from "path";

const languageNames: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  gu: "Gujarati",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  bn: "Bengali",
  pa: "Punjabi",
  or: "Odia",
  ur: "Urdu",
};

const devanagariLanguages = ["hi", "mr", "sa"];

export function generatePDF(result: SimplifyResponse): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    import("pdfkit").then(({ default: PDFDocument }) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const fontPath = path.join(process.cwd(), "fonts", "NotoSansDevanagari-Regular.ttf");
        const useDevanagari = devanagariLanguages.includes(result.targetLanguage);
        
        try {
          if (useDevanagari) {
            doc.registerFont("Devanagari", fontPath);
          }
        } catch (fontError) {
          console.log("Devanagari font not available, using default font");
        }

        doc
          .fontSize(20)
          .font("Helvetica-Bold")
          .text("SaralDocs - Simplified Document", { align: "center" });

        doc.moveDown();

        const languageName = languageNames[result.targetLanguage] || "English";
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#666666")
          .text(`Output Language: ${languageName}`, { align: "center" });

        doc.moveDown(2);

        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#000000")
          .text("Simplified Version", { underline: true });

        doc.moveDown(0.5);

        if (useDevanagari) {
          try {
            doc
              .fontSize(11)
              .font("Devanagari")
              .fillColor("#333333")
              .text(result.simplifiedText, {
                align: "left",
                lineGap: 6,
              });
          } catch {
            doc
              .fontSize(11)
              .font("Helvetica")
              .fillColor("#333333")
              .text(result.simplifiedText, {
                align: "left",
                lineGap: 4,
              });
          }
        } else {
          doc
            .fontSize(11)
            .font("Helvetica")
            .fillColor("#333333")
            .text(result.simplifiedText, {
              align: "left",
              lineGap: 4,
            });
        }

        if (result.glossary && result.glossary.length > 0) {
          doc.moveDown(2);

          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#000000")
            .text("Glossary / Important Terms", { underline: true });

          doc.moveDown(0.5);

          result.glossary.forEach((term: GlossaryTerm, index: number) => {
            if (useDevanagari) {
              try {
                doc
                  .fontSize(11)
                  .font("Devanagari")
                  .fillColor("#0066cc")
                  .text(`${index + 1}. ${term.term}`, { continued: false });
                doc
                  .fontSize(10)
                  .font("Devanagari")
                  .fillColor("#333333")
                  .text(`   ${term.definition}`, { indent: 20 });
              } catch {
                doc
                  .fontSize(11)
                  .font("Helvetica")
                  .fillColor("#0066cc")
                  .text(`${index + 1}. ${term.term}`, { continued: false });
                doc
                  .fontSize(10)
                  .font("Helvetica")
                  .fillColor("#333333")
                  .text(`   ${term.definition}`, { indent: 20 });
              }
            } else {
              doc
                .fontSize(11)
                .font("Helvetica-Bold")
                .fillColor("#0066cc")
                .text(`${index + 1}. ${term.term}`, { continued: false });
              doc
                .fontSize(10)
                .font("Helvetica")
                .fillColor("#333333")
                .text(`   ${term.definition}`, { indent: 20 });
            }
            doc.moveDown(0.5);
          });
        }

        doc.moveDown(2);

        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor("#999999")
          .text(
            "DISCLAIMER: This simplified version is for understanding purposes only and is NOT a legal replacement. Always use the original document for official purposes. Consult a lawyer for legal matters.",
            { align: "center" }
          );

        doc.moveDown();

        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor("#cccccc")
          .text("Simplified Version - Not Legally Verified | Generated by SaralDocs", {
            align: "center",
          });

        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.save();
          doc.fillColor("#000000");
          doc.opacity(0.05);
          doc.fontSize(60);
          doc.font("Helvetica-Bold");
          doc.rotate(-30, { origin: [300, 400] });
          doc.text("SIMPLIFIED VERSION", 80, 350, { width: 600, align: "center" });
          doc.restore();
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    }).catch(reject);
  });
}
