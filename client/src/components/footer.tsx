import { Logo } from "./logo";
import { Shield, Clock, Lock, Phone, Mail, HelpCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Logo className="h-10 w-10" />
              <div>
                <h3 className="font-bold text-lg">SaralDocs</h3>
                <p className="text-sm opacity-80">Document Simplifier</p>
              </div>
            </div>
            <p className="text-sm opacity-80 leading-relaxed">
              Helping citizens understand government and legal documents by converting 
              complex language into simple, easy-to-understand text.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <a href="/" className="hover:opacity-100 hover:underline">Home</a>
              </li>
              <li>
                <a href="/upload" className="hover:opacity-100 hover:underline">Upload Document</a>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:opacity-100 hover:underline">How It Works</a>
              </li>
              <li>
                <a href="/#languages" className="hover:opacity-100 hover:underline">Supported Languages</a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Your Privacy</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 opacity-80">
                <Shield className="h-4 w-4 shrink-0" />
                <span>Encrypted Processing</span>
              </li>
              <li className="flex items-center gap-2 opacity-80">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Auto-delete in 7 Days</span>
              </li>
              <li className="flex items-center gap-2 opacity-80">
                <Lock className="h-4 w-4 shrink-0" />
                <span>No Permanent Storage</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Help & Support</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 opacity-80">
                <Phone className="h-4 w-4 shrink-0" />
                <span>1800-XXX-XXXX (Toll Free)</span>
              </li>
              <li className="flex items-center gap-2 opacity-80">
                <Mail className="h-4 w-4 shrink-0" />
                <span>help@saraldocs.gov.in</span>
              </li>
              <li className="flex items-center gap-2 opacity-80">
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span>9 AM - 6 PM (Mon-Sat)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <p className="text-xs opacity-70 text-center leading-relaxed">
            <strong>Disclaimer:</strong> This service simplifies documents for understanding purposes only. 
            The simplified version is NOT a legal replacement for the original document. 
            Always use the original document for official purposes and consult legal professionals for legal advice.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 bg-primary/80">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-80">
            <p>&copy; {new Date().getFullYear()} SaralDocs. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:opacity-100 hover:underline">Terms of Use</a>
              <a href="#" className="hover:opacity-100 hover:underline">Privacy Policy</a>
              <a href="#" className="hover:opacity-100 hover:underline">Accessibility</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
