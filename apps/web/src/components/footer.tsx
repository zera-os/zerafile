import Link from 'next/link';
import { Mail, Shield, Scale } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-background-secondary border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Legal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Legal
            </h3>
            <div className="space-y-2">
              <Link 
                href="/terms" 
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                href="/privacy" 
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Support
            </h3>
            <div className="space-y-2">
              <a 
                href="mailto:support@zerafile.io" 
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                support@zerafile.io
              </a>
            </div>
          </div>

          {/* Content Policy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Content Policy
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                We reserve the right to remove any content at any time at our sole discretion for business purposes, storage purposes, or other legal purposes. Read more in our <Link href="/terms" className="text-primary hover:underline ml-1">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline ml-1">Privacy Policy</Link>.
              </p>
              <p>
                This includes but is not limited to copyright infringement, complaints, or any other violations. We comply with all applicable laws, regulations, and take down requests. Please contact us for swift resolution.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            © 2025 zerafile.io. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
