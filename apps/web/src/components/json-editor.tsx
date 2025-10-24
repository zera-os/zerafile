'use client';

import { useState } from 'react';
import { Upload, Code, Copy, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { validateUriJson, DEFAULT_URI_JSON, type UriJson } from '@zerafile/shared';
import { config } from '../lib/config';

interface JsonEditorProps {
  contractId?: string;
  disabled?: boolean;
}

export function JsonEditor({ contractId, disabled = false }: JsonEditorProps) {
  const [jsonText, setJsonText] = useState(JSON.stringify(DEFAULT_URI_JSON, null, 2));
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const encodedContractId = contractId ? encodeURIComponent(contractId) : '';

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a JSON file
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Please select a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        validateUriJson(parsed); // Validate the JSON
        setJsonText(JSON.stringify(parsed, null, 2));
        setError(null);
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

    try {
      // Validate JSON
      const parsedJson = JSON.parse(jsonText);
      const validatedJson = validateUriJson(parsedJson);

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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish URI JSON');
      }

      const { url } = await response.json();
      setResult(url);
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        setError('Invalid JSON schema: ' + err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to publish URI JSON');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openResult = () => {
    if (result) {
      window.open(result, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* JSON Editor */}
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
              disabled={disabled}
            />
            <label htmlFor="json-file" className="cursor-pointer">
              <Button size="sm" variant="secondary" asChild disabled={disabled}>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload JSON
                </span>
              </Button>
            </label>
          </div>
        </div>
        <Textarea
          value={jsonText}
          onChange={(e) => handleJsonChange(e.target.value)}
          placeholder="Enter JSON metadata..."
          className="min-h-[300px] font-mono text-sm"
          disabled={disabled}
        />
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isUploading || !contractId || disabled}
        className="w-full"
      >
        {isUploading ? 'Publishing...' : 'Publish URI JSON'}
      </Button>

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

      {/* Result Display */}
      {result && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-500">
                <Check className="h-5 w-5" />
                <span className="font-semibold">URI JSON published successfully!</span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">URI URL</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={result}
                    readOnly
                    className="flex-1 px-3 py-2 bg-background-secondary border border-border rounded-lg text-sm"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyToClipboard(result)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={openResult}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
