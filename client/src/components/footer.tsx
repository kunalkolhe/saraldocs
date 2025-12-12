import { FileText, Phone, Mail, Clock, Shield, Lock, Database } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-[#4169E1] py-8 sm:py-12 w-full overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/20">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-semibold text-white">SaralDocs</span>
                <p className="text-xs text-white/70">Document Simplifier</p>
              </div>
            </div>
            <p className="text-sm text-white/80">
              Helping citizens understand government and legal documents by converting 
              complex language into simple, easy-to-understand text.
            </p>
          </div>
          
          <div>
            <h3 className="mb-4 font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-white/80 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/" className="text-white/80 hover:text-white transition-colors">
                  Upload Document
                </Link>
              </li>
              <li>
                <Link href="/" className="text-white/80 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/" className="text-white/80 hover:text-white transition-colors">
                  Supported Languages
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 font-semibold text-white">Your Privacy</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-white/80">
                <Shield className="h-4 w-4" />
                Encrypted Processing
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <Clock className="h-4 w-4" />
                Auto-delete in 7 Days
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <Database className="h-4 w-4" />
                No Permanent Storage
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 font-semibold text-white">Help & Support</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-white/80">
                <Phone className="h-4 w-4" />
                1800-XXX-XXXX (Toll Free)
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <Mail className="h-4 w-4" />
                help@saraldocs.gov.in
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <Clock className="h-4 w-4" />
                9 AM - 6 PM (Mon-Sat)
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-10 border-t border-white/20 pt-6 text-center text-sm text-white/70">
          <p>&copy; {new Date().getFullYear()} SaralDocs. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
