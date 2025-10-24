import Link from 'next/link';
import { Shield } from 'lucide-react';

export function LegalNotice() {
  return (
    <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
      <div className="flex items-start gap-3">
        <Shield className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-orange-500 mb-2">
            Important Legal Notice
          </p>
          <p className="text-muted-foreground">
            By using this service, you agree and accept the<Link href="/terms" className="text-primary hover:underline ml-1">Terms of Service</Link> and<Link href="/privacy" className="text-primary hover:underline ml-1">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
