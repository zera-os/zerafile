'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scale, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Footer } from '../../components/footer';

export default function TermsPage() {
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
                <Scale className="h-6 w-6 text-primary" />
                Terms of Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using Zerafile, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">2. Service Description</h2>
                <p className="text-muted-foreground">
                  Zerafile provides file upload and storage services for governance documents and token metadata. The service allows users to upload, store, and share files through our platform.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">3. User Responsibilities</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>• You are solely responsible for all content you upload, store, or distribute through our service</p>
                  <p>• You must ensure you have all necessary rights and permissions for any content you upload</p>
                  <p>• You agree not to upload content that violates any laws, regulations, or third-party rights</p>
                  <p>• You are responsible for maintaining the confidentiality of your account and activities</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">4. Content Policy and Removal Rights</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    We reserve the right to remove any content at any time at our sole discretion for:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Business purposes</li>
                    <li>Storage purposes</li>
                    <li>Legal purposes</li>
                    <li>Copyright infringement</li>
                    <li>Complaints or violations</li>
                    <li>Any other reason we deem necessary</li>
                  </ul>
                  <p>
                    This right is not limited to the above examples and may be exercised for any reason at any time.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">5. Limitation of Liability</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    <strong>ALL LIABILITY FOR UPLOADED CONTENT RESTS SOLELY WITH THE USER/UPLOADER.</strong>
                  </p>
                  <p>
                    Zerafile assumes no responsibility or liability for any content uploaded, stored, or distributed through this service. We provide no warranties, express or implied, regarding the service or any content.
                  </p>
                  <p>
                    In no event shall Zerafile be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the service.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">6. Dispute Resolution</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    Any disputes arising from the use of this service shall be governed exclusively by Swiss law and resolved through binding arbitration only. You waive any right to a jury trial or to participate in a class action lawsuit.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">7. Contact Information</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    For any issues, complaints, or concerns regarding these terms or the service, please contact us at:
                  </p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href="mailto:support@zerafile.io" className="text-primary hover:underline">
                      support@zerafile.io
                    </a>
                  </div>
                  <p>
                    We comply with all applicable laws, regulations, and take down requests. Please contact us for swift resolution.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">8. Modifications</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the service constitutes acceptance of any modifications.
                </p>
              </div>

              <div className="bg-background-secondary p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  <strong>Last Updated:</strong> October 24 2025
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  By using this service, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions.
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  <strong>Related:</strong> Please also review our{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  {' '}to understand how we handle your data.
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
