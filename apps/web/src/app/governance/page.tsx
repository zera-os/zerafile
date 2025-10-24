import Link from 'next/link';
import { Upload, FileText, Copy, ExternalLink, Shield, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { UploadZone } from '../../components/upload-zone';

export default function GovernancePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-primary">zerafile</h1>
              <nav className="flex space-x-6">
                <Link href="/governance" className="text-primary font-medium">
                  Governance
                </Link>
                <Link href="/tokens" className="text-muted-foreground hover:text-foreground">
                  Tokens
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 gradient-bg organic-shape opacity-20 blur-3xl"></div>
              <div className="relative gradient-bg organic-shape p-10">
                <h2 className="text-3xl font-bold text-white mb-3">
                  Governance File Upload
                </h2>
                <p className="text-white/90 text-base max-w-md mx-auto">
                  Upload governance documents for ZERA Network proposals.
                </p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Upload Governance Files
              </CardTitle>
              <CardDescription>
                Upload PDF documents, images (PNG, JPG, JPEG, GIF, WebP), and office files (XLSX, DOCX) up to 5MB for governance proposals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadZone />
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Community Governance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Share supporting governance documents.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Copy className="h-4 w-4" />
                    <span>CDN access for fast and reliable sharing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4" />
                    <span>Easy sharing of complex governance documents</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Support for various formats and media types.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>PDF, DOCX, XLSX</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>PNG, JPG, JPEG, GIF, WebP</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
