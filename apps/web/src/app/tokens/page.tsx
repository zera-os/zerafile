'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Copy, ExternalLink, Coins, Image, Code } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { UploadZone } from '../../components/upload-zone';
import { JsonEditor } from '../../components/json-editor';
import { Footer } from '../../components/footer';
import { LegalNotice } from '../../components/legal-notice';
import { useState } from 'react';

export default function TokensPage() {
  const router = useRouter();
  const [contractId, setContractId] = useState('');
  const [contractIdError, setContractIdError] = useState('');

  const handleLogoClick = () => {
    router.replace('/governance');
  };

  const validateContractId = (id: string): boolean => {
    // Pattern: $[letters]+[4n] or $sol-[letters]+[6n]
    const pattern = /^\$[a-zA-Z]+\+[0-9]{4}$|^\$sol-[a-zA-Z]+\+[0-9]{6}$/;
    return pattern.test(id);
  };

  const handleContractIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    setContractId(value);
    
    if (value && !validateContractId(value)) {
      setContractIdError('Contract ID must be in format: $ZRA+0000 or $sol-SOL+000000');
    } else if (value && validateContractId(value)) {
      setContractIdError('');
    } else {
      setContractIdError('');
    }
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
              <Link href="/tokens" className="text-primary font-medium">
                Tokens
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center">
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 gradient-bg organic-shape opacity-20 blur-3xl"></div>
              <div className="relative gradient-bg organic-shape p-10">
                <h2 className="text-3xl font-bold text-white mb-3">
                  Token Assets
                </h2>
                <p className="text-white/90 text-base max-w-md mx-auto">
                  Upload token assets and create URI metadata for ZERA tokens.
                </p>
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <LegalNotice />

          {/* Contract ID Input */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-6 w-6" />
                Contract ID
              </CardTitle>
              <CardDescription>
                Enter your contract ID to create a folder for your token assets. Required format: $ZRA+0000 or $sol-SOL+000000
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input
                  placeholder="Enter contract ID (e.g., $ZRA+0000, $sol-SOL+000000)"
                  value={contractId}
                  onChange={handleContractIdChange}
                  className={contractIdError ? 'border-red-500' : ''}
                />
                {contractIdError && (
                  <p className="text-red-500 text-sm">{contractIdError}</p>
                )}
                {contractId && !contractIdError && (
                  <p className="text-green-500 text-sm">✓ Valid contract ID format</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-6 w-6" />
                Upload Token Files
              </CardTitle>
              <CardDescription>
                Upload PDF documents, images (PNG, JPG, JPEG, GIF, WebP), and office files (XLSX, DOCX) up to 5MB for token assets and metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadZone 
                pathHint="tokens" 
                contractId={contractId}
                disabled={!contractId || !!contractIdError}
              />
            </CardContent>
          </Card>

          {/* URI JSON Builder */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-6 w-6" />
                Create Token URI Metadata
              </CardTitle>
              <CardDescription>
                Create JSON metadata for your token contracts with name, description, image, and attributes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JsonEditor 
                contractId={contractId}
                disabled={!contractId || !!contractIdError}
              />
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Token Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Host token images, logos, and visual assets with CDN acceleration for fast loading.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Copy className="h-4 w-4" />
                    <span>Optimized image delivery</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4" />
                    <span>Direct CDN URLs</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Asset Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Support for various token asset formats and documentation types.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Token logos and icons</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>NFT artwork and metadata</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Other documentation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
