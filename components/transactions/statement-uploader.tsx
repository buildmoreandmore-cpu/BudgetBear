'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface StatementUploaderProps {
  onUploadComplete: () => void;
}

interface ImportResult {
  success: boolean;
  importId: string;
  totalParsed: number;
  duplicatesSkipped: number;
  transactionsImported: number;
}

export function StatementUploader({ onUploadComplete }: StatementUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to upload file');
        setUploading(false);
        return;
      }

      setResult(data);
      setTimeout(() => {
        onUploadComplete();
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          <CardTitle>Import Bank Statement</CardTitle>
        </div>
        <CardDescription>
          Upload your bank statement CSV file to automatically categorize your transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          onClick={handleClick}
          disabled={uploading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Select CSV File
            </>
          )}
        </Button>

        {result && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-green-900">Import Successful!</div>
                <div className="text-sm text-green-700 mt-2 space-y-1">
                  <div>✓ Parsed: {result.totalParsed} transactions</div>
                  <div>✓ Imported: {result.transactionsImported} new transactions</div>
                  {result.duplicatesSkipped > 0 && (
                    <div>✓ Skipped: {result.duplicatesSkipped} duplicates</div>
                  )}
                </div>
                <div className="text-xs text-green-600 mt-2">
                  Transactions have been categorized using AI. Please review and adjust as needed.
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-red-900">Upload Failed</div>
                <div className="text-sm text-red-700 mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/80 rounded-lg p-4 text-sm">
          <div className="font-semibold mb-2">Supported Format:</div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• CSV files from most banks (Chase, Bank of America, Wells Fargo, etc.)</li>
            <li>• Must include columns for: Date, Description, Amount</li>
            <li>• AI will automatically categorize as Income, Expense, Bill, etc.</li>
            <li>• Identifies Fixed, Flexible, and Discretionary spending</li>
            <li>• Duplicate transactions are automatically skipped</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
