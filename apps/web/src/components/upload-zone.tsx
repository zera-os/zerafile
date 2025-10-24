'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { isAllowedExt, ALLOWED_EXTENSIONS } from '@zerafile/shared';
import { config } from '../lib/config';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface UploadResult {
  id: string;
  filename: string;
  cdnUrl: string;
  uploadedAt: Date;
}

interface UploadZoneProps {
  pathHint?: string;
  contractId?: string;
  disabled?: boolean;
}

export function UploadZone({ pathHint = 'governance', contractId, disabled = false }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    // Check if contractId is required but not provided
    if (pathHint === 'tokens' && (!contractId || contractId.trim() === '')) {
      setError('Contract ID is required for token uploads');
      return;
    }

    // Additional validation for tokens pathHint
    if (pathHint === 'tokens' && contractId) {
      // Validate contract ID format
      const pattern = /^\$[a-zA-Z]+\+[0-9]{4}$|^\$sol-[a-zA-Z]+\+[0-9]{6}$/;
      if (!pattern.test(contractId)) {
        setError('Invalid contract ID format. Must be $ZRA+0000 or $sol-SOL+000000');
        return;
      }
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size must be less than 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Validate file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !isAllowedExt(ext)) {
      setError(`Invalid file type. Supported: PDF documents, images (PNG, JPG, JPEG, GIF, WebP), office files (XLSX, DOCX)`);
      return;
    }

    setIsUploading(true);

    try {
      console.log('Starting upload process...');
      
      // Step 1: Initialize upload
      console.log('Step 1: Initializing upload...');
      const initResponse = await fetch(`${config.apiBase}/v1/uploads/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ext,
          pathHint: contractId ? `${pathHint}/${contractId}` : pathHint,
        }),
      });

      console.log('Init response status:', initResponse.status);
      
      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.error || 'Failed to initialize upload');
      }

      const { presignedUrl, key, cdnUrl } = await initResponse.json();
      console.log('Step 1 complete. Presigned URL received:', presignedUrl);

      // Step 2: Upload file to presigned URL
      console.log('Step 2: Uploading file to presigned URL...');
      console.log('Presigned URL:', presignedUrl);
      
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      console.log('Upload response status:', uploadResponse.status);
      console.log('Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload error response:', errorText);
        throw new Error(`Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      // Step 3: Complete upload
      console.log('Step 3: Completing upload...');
      const completeResponse = await fetch(`${config.apiBase}/v1/uploads/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });

      console.log('Complete response status:', completeResponse.status);
      
      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || 'Failed to complete upload');
      }

      console.log('Upload completed successfully!');
      
      // Add to upload results
      const newResult: UploadResult = {
        id: key.split('/').pop()?.split('.')[0] || Date.now().toString(),
        filename: file.name,
        cdnUrl,
        uploadedAt: new Date(),
      };
      
      setUploadResults(prev => [newResult, ...prev]);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [contractId, pathHint]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
          disabled
            ? 'border-muted bg-muted/10 cursor-not-allowed'
            : isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDrop={disabled ? undefined : handleDrop}
        onDragOver={disabled ? undefined : (e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={disabled ? undefined : () => setIsDragOver(false)}
      >
        <input
          type="file"
          accept={ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
          onChange={disabled ? undefined : handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading || disabled}
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {disabled 
                ? 'Enter a valid Contract ID to upload files'
                : isUploading 
                ? 'Uploading...' 
                : 'Drop files here or click to upload'
              }
            </h3>
            <p className="text-muted-foreground">
              {disabled 
                ? 'Contract ID is required for token uploads'
                : 'Supports PDF documents, images (PNG, JPG, JPEG, GIF, WebP), and office files (XLSX, DOCX) up to 5MB'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-500">
                <Check className="h-5 w-5" />
                <span className="font-semibold">Uploaded Files ({uploadResults.length})</span>
              </div>
              
              <div className="space-y-3">
                {uploadResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{result.filename}</div>
                        <div className="text-xs text-muted-foreground">
                          {result.uploadedAt.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-xs text-muted-foreground max-w-xs truncate">
                        {result.cdnUrl}
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => copyToClipboard(result.cdnUrl, result.id)}
                      >
                        {copied === result.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
