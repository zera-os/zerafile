'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Footer } from '../../components/footer';

export default function PrivacyPage() {
  const router = useRouter();

  const handleLogoClick = () => {
    router.replace('/governance');
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleLogoClick}
              className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer bg-transparent border-none p-0"
              style={{ transform: 'translateY(-1px)' }}
            >
              zerafile
            </button>
            <nav className="flex items-center space-x-6">
              <Link href="/governance" className="text-muted-foreground hover:text-foreground">
                Governance
              </Link>
              <Link href="/tokens" className="text-muted-foreground hover:text-foreground">
                Tokens
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">1. Information We May Collect</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>We reserve the right tocollect the following types of information:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Files and content you upload to our service</li>
                    <li>IP addresses and basic connection information</li>
                    <li>Usage data and analytics</li>
                    <li>Contact information when you reach out to support</li>
                    <li>Any information directly or indirectly relating to the content uploaded to the platform</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>We use collected information to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Provide and maintain our file storage service</li>
                    <li>Process and serve your uploaded files</li>
                    <li>Monitor service performance and security</li>
                    <li>Respond to support requests</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">3. File Storage and Access</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    <strong>Important:</strong> Files uploaded to our service are stored publicly and may be accessible to anyone with the direct URL. We do not provide private or restricted access to uploaded files.
                  </p>
                  <p>
                    By uploading files, you acknowledge that they will be publicly accessible and you are solely responsible for ensuring you have the right to make such content public.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">4. Data Retention</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    We retain uploaded files indefinitely unless removed for policy violations, legal requirements, or other reasons deemed necessary at our sole discretion. We may delete files at our sole discretion for:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Storage optimization</li>
                    <li>Policy violations</li>
                    <li>Legal compliance</li>
                    <li>Other business purposes</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">5. Third-Party Services</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    We use third-party services for file storage and delivery. These services may have their own privacy policies and data handling practices. We are not responsible for the privacy practices of these third parties.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">6. Security</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    While we implement reasonable security measures, no system is completely secure. You acknowledge that uploading files involves inherent risks and we cannot guarantee absolute security of your data. Remember, the data on this platform is publicly accessible.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">7. Your Rights</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>You have the right to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Request information about data we hold about you</li>
                    <li>Request deletion of your data (subject to legal and operational requirements)</li>
                    <li>Contact us with privacy concerns</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">8. Contact Us</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    For privacy-related questions or concerns, please contact us at:
                  </p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href="mailto:support@zerafile.io" className="text-primary hover:underline">
                      support@zerafile.io
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">9. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this privacy policy from time to time. Changes will be posted on this page and will be effective immediately. Your continued use of the service constitutes acceptance of any changes.
                </p>
              </div>

              <div className="bg-background-secondary p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  <strong>Last Updated:</strong> October 24 2025
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This privacy policy is governed exclusively by Swiss law and any disputes will be resolved through binding arbitration.
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  <strong>Related:</strong> Please also review our{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
                  {' '}for complete usage terms and conditions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
