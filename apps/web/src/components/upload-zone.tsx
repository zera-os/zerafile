'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { isAllowedExt, ALLOWED_EXTENSIONS } from '@zerafile/shared';
import { config } from '../lib/config';
import { clientRateLimiter, formatBytes, formatTimeUntilReset } from '../lib/rate-limiter';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface UploadResult {
  id: string;
  filename: string;
  cdnUrl: string;
  uploadedAt: Date;
  fileSize: number;
}

interface UploadProgress {
  filename: string;
  progress: number;
  stage: 'init' | 'upload' | 'complete';
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
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
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

    // Check client-side rate limits
    const fileLimitCheck = clientRateLimiter.checkFileLimit();
    if (!fileLimitCheck.allowed) {
      setError(`Rate limit exceeded: ${fileLimitCheck.remaining} files remaining. Reset in ${formatTimeUntilReset(fileLimitCheck.resetTime)}`);
      return;
    }

    const dataLimitCheck = clientRateLimiter.checkDataLimit(file.size);
    if (!dataLimitCheck.allowed) {
      setError(`Rate limit exceeded: ${formatBytes(dataLimitCheck.remaining)} remaining. Reset in ${formatTimeUntilReset(dataLimitCheck.resetTime)}`);
      return;
    }

    // Validate file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !isAllowedExt(ext)) {
      setError(`Invalid file type. Supported: PDF documents, images (PNG, JPG, JPEG, GIF, WebP), office files (XLSX, DOCX), JSON files`);
      return;
    }

    setIsUploading(true);
    setUploadProgress({ filename: file.name, progress: 0, stage: 'init' });

    try {
      // Step 1: Initialize upload
      setUploadProgress({ filename: file.name, progress: 10, stage: 'init' });
      const initResponse = await fetch(`${config.apiBase}/v1/uploads/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ext,
          filename: file.name,
          pathHint: contractId ? `${pathHint}/${contractId}` : pathHint,
        }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to initialize upload');
      }

      const { presignedUrl, key, cdnUrl } = await initResponse.json() as { presignedUrl: string; key: string; cdnUrl: string };

      // Step 2: Upload file to presigned URL
      setUploadProgress({ filename: file.name, progress: 20, stage: 'upload' });
      
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
      }

      // Step 3: Complete upload
      setUploadProgress({ filename: file.name, progress: 80, stage: 'complete' });
      
      const completeResponse = await fetch(`${config.apiBase}/v1/uploads/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to complete upload');
      }

      setUploadProgress({ filename: file.name, progress: 100, stage: 'complete' });
      
      // Record the upload for client-side rate limiting
      clientRateLimiter.recordUpload(file.size);
      
      // Add to upload results
      const newResult: UploadResult = {
        id: key.split('/').pop()?.split('.')[0] || Date.now().toString(),
        filename: file.name,
        cdnUrl,
        uploadedAt: new Date(),
        fileSize: file.size,
      };
      
      setUploadResults(prev => [newResult, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [contractId, pathHint]);

  const handleFiles = useCallback(async (files: File[]) => {
    // Process files sequentially to avoid overwhelming the server
    for (const file of files) {
      await handleFile(file);
    }
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files as File[]);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files || []);
    if (files.length > 0) {
      handleFiles(files as File[]);
    }
  }, [handleFiles]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await (globalThis as any).navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
        } catch (err) {
          // Silently fail clipboard copy
        }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
          disabled
            ? 'border-red-500/30 bg-red-500/5 cursor-not-allowed'
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
             multiple
             accept={ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
             onChange={disabled ? undefined : handleFileInput}
             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
             disabled={isUploading || disabled}
           />
        
        <div className="space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
            disabled 
              ? 'bg-red-500/10 border-2 border-red-500/30' 
              : 'bg-primary/10'
          }`}>
            <Upload className={`h-8 w-8 ${
              disabled 
                ? 'text-red-500' 
                : 'text-primary'
            }`} />
          </div>
          
          <div>
                 <h3 className={`text-lg font-semibold mb-2 ${
                   disabled ? 'text-red-500' : ''
                 }`}>
                   {disabled 
                     ? '⚠️ Contract ID Required'
                     : isUploading 
                     ? 'Uploading...' 
                     : 'Drop files here or click to upload'
                   }
                 </h3>
                 <p className={`text-sm ${
                   disabled 
                     ? 'text-red-400' 
                     : 'text-muted-foreground'
                 }`}>
                   {disabled 
                     ? 'Please enter a valid Contract ID above to enable file uploads'
                     : 'Supports multiple files: PDF documents, images (PNG, JPG, JPEG, GIF, WebP), and office files (XLSX, DOCX) up to 5MB each'
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

      {/* Upload Progress */}
      {uploadProgress && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-500">
                <Upload className="h-4 w-4" />
                <span className="font-medium">Uploading {uploadProgress.filename}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {uploadProgress.stage === 'init' && 'Initializing...'}
                    {uploadProgress.stage === 'upload' && 'Uploading file...'}
                    {uploadProgress.stage === 'complete' && 'Finalizing...'}
                  </span>
                  <span>{uploadProgress.progress}%</span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
              </div>
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
                          {result.uploadedAt.toLocaleTimeString()} • {formatFileSize(result.fileSize)}
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
