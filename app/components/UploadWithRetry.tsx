'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { UploadDropzone } from '@/lib/uploadthing';
import { RefreshCw, AlertCircle, CheckCircle2, UploadCloud, FileSpreadsheet, FileText, ArrowUpCircle } from 'lucide-react';

interface UploadResult {
  ufsUrl: string;
  key: string;
  name: string;
}

interface UploadWithRetryProps {
  endpoint: 'templateUploader' | 'datasetUploader' | 'logoUploader';
  directUploadUrl?: string; // Direct server-side upload endpoint (instant & reliable for XLSX/CSV)
  onUploadComplete: (res: UploadResult[]) => void;
  title?: string;
  description?: string;
  acceptedTypes?: string;
}

export default function UploadWithRetry({
  endpoint,
  directUploadUrl,
  onUploadComplete,
  title,
  description,
  acceptedTypes = '.csv, .xlsx, .xls, .pdf, .png, .jpg',
}: UploadWithRetryProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [lastUploadedName, setLastUploadedName] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'direct' | 'cloud'>(directUploadUrl ? 'direct' : 'cloud');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneKeyRef = useRef(0);

  // Direct server-side multipart upload (super fast for XLSX/CSV)
  const handleDirectFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !directUploadUrl) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(directUploadUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server rejected file upload');
      }

      setIsUploading(false);
      setUploadSuccess(true);
      setLastUploadedName(file.name);

      // Return synthetic upload result for caller
      onUploadComplete([
        {
          ufsUrl: data.dataset?.fileKey || `local_${file.name}`,
          key: data.dataset?.id || file.name,
          name: file.name,
        },
      ]);
    } catch (err: unknown) {
      setIsUploading(false);
      const msg = err instanceof Error ? err.message : 'Upload failed. Please retry.';
      setUploadError(msg);
      toast.error(msg);
    }
  };

  const handleRetry = () => {
    setUploadError(null);
    setRetryCount((prev) => prev + 1);
    dropzoneKeyRef.current += 1;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-3">
      {title && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-[#7367f0]" />
            <span className="text-xs font-semibold text-[#2f2b3d]">{title}</span>
          </div>
        </div>
      )}

      {description && (
        <p className="text-xs text-[#6f6b7d] -mt-1">{description}</p>
      )}

      {/* Main Dropzone Box */}
      <div className="border border-[#dbdade] bg-white p-5 text-center">
        {directUploadUrl ? (
          /* Direct Fast Server File Drop / Select Area */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#dbdade] hover:border-[#7367f0] bg-[#f8f7fa] hover:bg-[#f3f2f8] transition-all p-8 cursor-pointer flex flex-col items-center justify-center space-y-2 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes}
              onChange={handleDirectFileSelect}
              className="hidden"
            />

            <div>
              Click to browse or drop spreadsheet file here
            </div>

            <div className="">
              Supports Excel (<strong >.XLSX, .XLS</strong>) & CSV (<strong >.CSV</strong>) up to 32MB
            </div>

            <button
              type="button"
              className="btn-primary text-xs font-bold px-4 py-2 mt-2 pointer-events-none"
            >
              Select Spreadsheet File
            </button>
          </div>
        ) : (
          /* UploadThing Dropzone */
          <UploadDropzone
            key={dropzoneKeyRef.current}
            endpoint={endpoint}
            onUploadBegin={() => {
              setIsUploading(true);
              setUploadError(null);
            }}
            onClientUploadComplete={(res) => {
              setIsUploading(false);
              setUploadError(null);
              setUploadSuccess(true);
              if (res && res[0]) {
                setLastUploadedName(res[0].name);
              }
              onUploadComplete(res as UploadResult[]);
            }}
            onUploadError={(err: Error) => {
              setIsUploading(false);
              const msg = err?.message || 'Upload timed out. Please check network connection and retry.';
              setUploadError(msg);
              toast.error(msg);

              // Auto-retry with backoff if first failure
              if (retryCount < 2) {
                const backoffTime = (retryCount + 1) * 1500;
                setTimeout(() => {
                  setRetryCount((prev) => prev + 1);
                  dropzoneKeyRef.current += 1;
                }, backoffTime);
              }
            }}
            appearance={{
              container: "border-2 border-dashed border-[#dbdade] bg-[#f8f7fa] hover:bg-[#f3f2f8] transition-colors p-6",
              label: "text-sm font-semibold text-[#2f2b3d]",
              allowedContent: "text-xs text-[#6f6b7d] mt-1",
              button: "btn-primary text-xs font-semibold px-4 py-2 mt-3 cursor-pointer",
            }}
          />
        )}

        {isUploading && (
          <div className="mt-4 flex items-center justify-center gap-2.5 text-xs text-[#7367f0] font-semibold animate-in">
            <div className="spinner" style={{ width: '16px', height: '16px' }} />
            <span>
              {endpoint === 'datasetUploader'
                ? 'Uploading and processing recipient records...'
                : endpoint === 'templateUploader'
                ? 'Uploading certificate template image...'
                : endpoint === 'logoUploader'
                ? 'Uploading branding logo...'
                : 'Uploading and processing file...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
