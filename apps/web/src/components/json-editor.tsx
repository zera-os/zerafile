'use client';

import { useState } from 'react';
import { Upload, Code, Copy, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { validateUriJson, DEFAULT_URI_JSON, type UriJson } from '@zerafile/shared';
import { config } from '../lib/config';
import { clientRateLimiter, formatBytes, formatTimeUntilReset } from '../lib/rate-limiter';

interface JsonEditorProps {
  contractId?: string;
  disabled?: boolean;
}

interface UploadProgress {
  progress: number;
  stage: 'import' | 'publish';
}

export function JsonEditor({ contractId, disabled = false }: JsonEditorProps) {
  const defaultJson = {
    ...DEFAULT_URI_JSON,
    image: contractId 
      ? `https://cdn.zerafile.io/token/${encodeURIComponent(contractId)}/image.png`
      : DEFAULT_URI_JSON.image
  };
  
  const [jsonText, setJsonText] = useState(JSON.stringify(defaultJson, null, 2));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [results, setResults] = useState<Array<{url: string, size: number, uploadedAt: Date}>>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  const encodedContractId = contractId ? encodeURIComponent(contractId) : '';

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    // Check if it's a JSON file
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Please select a JSON file');
      return;
    }

    const reader = new (globalThis as any).FileReader();
    reader.onload = (event: any) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        validateUriJson(parsed); // Validate the JSON
        setJsonText(JSON.stringify(parsed, null, 2));
        setError(null);
        setImportSuccess(true);
      } catch (err) {
        setError('Invalid JSON file or schema');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!contractId || contractId.trim() === '') {
      setError('Contract ID is required');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress({ progress: 0, stage: 'publish' });
    setImportSuccess(false); // Clear import success when publishing

    try {
      // Validate JSON
      const parsedJson = JSON.parse(jsonText);
      const validatedJson = validateUriJson(parsedJson);
      
      // Calculate JSON size
      const jsonSize = new Blob([JSON.stringify(validatedJson, null, 2)]).size;
      
      // Check client-side rate limits
      const fileLimitCheck = clientRateLimiter.checkFileLimit();
      if (!fileLimitCheck.allowed) {
        setError(`Rate limit exceeded: ${fileLimitCheck.remaining} files remaining. Reset in ${formatTimeUntilReset(fileLimitCheck.resetTime)}`);
        return;
      }

      const dataLimitCheck = clientRateLimiter.checkDataLimit(jsonSize);
      if (!dataLimitCheck.allowed) {
        setError(`Rate limit exceeded: ${formatBytes(dataLimitCheck.remaining)} remaining. Reset in ${formatTimeUntilReset(dataLimitCheck.resetTime)}`);
        return;
      }

      setUploadProgress({ progress: 50, stage: 'publish' });

      // Submit to API
      const response = await fetch(`${config.apiBase}/v1/uri`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId,
          json: validatedJson,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to publish URI JSON');
      }

      setUploadProgress({ progress: 100, stage: 'publish' });
      const { url } = await response.json() as { url: string };
      
      // Record the upload for client-side rate limiting
      clientRateLimiter.recordUpload(jsonSize);
      
      const newResult = {
        url,
        size: jsonSize,
        uploadedAt: new Date()
      };
      
      setResults(prev => [newResult, ...prev]);
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        setError('Invalid JSON schema: ' + err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to publish URI JSON');
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await (globalThis as any).navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* JSON Editor */}
      {disabled ? (
        <div
          className="border-2 border-dashed rounded-2xl p-12 text-center border-red-500/30 bg-red-500/5 cursor-not-allowed"
        >
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center">
              <Code className="h-8 w-8 text-red-500" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-red-500">
                ⚠️ Contract ID Required
              </h3>
              <p className="text-sm text-red-400">
                Please enter a valid Contract ID above to enable JSON metadata creation
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">JSON Metadata</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="json-file"
              />
              <label htmlFor="json-file" className="cursor-pointer">
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => {
                    document.getElementById('json-file')?.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import JSON
                </Button>
              </label>
            </div>
          </div>
          <Textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.currentTarget.value)}
            placeholder="Enter JSON metadata with image, url, and description..."
            className="min-h-[300px] font-mono text-sm"
          />
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isUploading || !contractId || disabled}
        className="w-full"
      >
        {isUploading ? 'Publishing...' : 'Publish URI JSON'}
      </Button>

      {/* Upload Progress */}
      {uploadProgress && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-500">
                <Upload className="h-4 w-4" />
                <span className="font-medium">
                  {uploadProgress.stage === 'publish' && 'Publishing URI JSON...'}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {uploadProgress.stage === 'publish' && 'Uploading to CDN...'}
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

      {/* Import Success Message */}
      {importSuccess && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-500">
              <Check className="h-4 w-4" />
              <span className="font-medium">Successfully imported! Review, edit, and publish!</span>
            </div>
          </CardContent>
        </Card>
      )}

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
      {results.length > 0 && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-500">
                <Check className="h-5 w-5" />
                <span className="font-semibold">Published URI JSON ({results.length})</span>
              </div>
              
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Code className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">URI JSON #{index + 1}</div>
                        <div className="text-xs text-muted-foreground">
                          {result.uploadedAt.toLocaleTimeString()} • {formatFileSize(result.size)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-xs text-muted-foreground max-w-xs truncate">
                        {result.url}
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => copyToClipboard(result.url, index.toString())}
                      >
                        {copied === index.toString() ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
