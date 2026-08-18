'use client';

import { useState, useRef } from 'react';
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
          <div className="flex items-center gap-2 text-sm font-bold text-[#2f2b3d]">
            <UploadCloud className="w-4 h-4 text-[#7367f0]" />
            <span>{title}</span>
          </div>
          {retryCount > 0 && (
            <span className="text-[11px] text-[#6f6b7d]">
              Retries attempted: {retryCount}
            </span>
          )}
        </div>
      )}

      {description && (
        <p className="text-xs text-[#6f6b7d] -mt-1">{description}</p>
      )}

      {uploadSuccess && (
        <div className="flex items-center gap-2 p-3 bg-[#28c76f]/10 border border-[#28c76f]/30 text-[#28c76f] text-xs font-semibold animate-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Upload & processing completed successfully! {lastUploadedName ? `(${lastUploadedName})` : ''}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-3 bg-[#ea5455]/10 border border-[#ea5455]/30 text-[#ea5455] text-xs space-y-2 animate-in">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Upload failed or file format unreadable</div>
              <div className="text-[11px] text-[#ea5455]/90 mt-0.5">{uploadError}</div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRetry}
              className="btn-danger text-xs py-1 px-3 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Upload</span>
            </button>
          </div>
        </div>
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

            <div className="w-12 h-12 bg-[#7367f0]/10 text-[#7367f0] group-hover:bg-[#7367f0] group-hover:text-white transition-colors flex items-center justify-center mb-1">
              <FileSpreadsheet className="w-6 h-6" />
            </div>

            <div className="text-sm font-bold text-[#2f2b3d]">
              Click to browse or drop spreadsheet file here
            </div>

            <div className="text-xs text-[#6f6b7d]">
              Supports Excel (<strong className="text-[#2f2b3d]">.XLSX, .XLS</strong>) & CSV (<strong className="text-[#2f2b3d]">.CSV</strong>) up to 32MB
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
          <div className="mt-4 flex items-center justify-center gap-2.5 text-xs text-[#7367f0] font-bold animate-in">
            <div className="spinner" style={{ width: '16px', height: '16px' }} />
            <span>Reading and parsing spreadsheet records into database...</span>
          </div>
        )}
      </div>
    </div>
  );
}
