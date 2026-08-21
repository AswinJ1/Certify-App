'use client';

import { useEffect, useState, use } from 'react';
import { toast } from 'sonner';
import { Download, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  inputType: string;
  required: boolean;
  columnName: string;
}

interface CertificatePublicInfo {
  id: string;
  name: string;
  publicSlug: string;
  event: {
    name: string;
    description: string | null;
    logo: string | null;
    organization: {
      id: string;
      name: string;
      logo: string | null;
      email?: string | null;
    };
  };
  formFields: FormField[];
}

interface SearchResult {
  found: boolean;
  certificateNumber: string;
  recipientId: string;
  certificateId: string;
  generatedCertificateId: string;
  data: Record<string, string>;
  displayData?: Record<string, string>;
}

export default function PublicCertificatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [certInfo, setCertInfo] = useState<CertificatePublicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/public/${slug}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.certificate) {
          setCertInfo(data.certificate);
          const initial: Record<string, string> = {};
          data.certificate.formFields.forEach((f: FormField) => {
            initial[f.columnName] = '';
          });
          setFormValues(initial);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const res = await fetch(`/api/public/${slug}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });
      const data = await res.json();

      if (!res.ok || !data.found) {
        const errorMsg = data.error || 'No matching certificate found. Please check your credentials.';
        setSearchError(errorMsg);
        toast.error(errorMsg);
      } else {
        setSearchResult(data);
        toast.success('Certificate record found and verified');
      }
    } catch {
      const errorMsg = 'Network error. Please check your internet connection.';
      setSearchError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSearching(false);
    }
  };

  const handleDownload = async () => {
    if (!searchResult) return;
    setDownloading(true);
    toast.info('Generating high-resolution PDF certificate...');

    try {
      const res = await fetch(`/api/public/${slug}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: searchResult.recipientId,
          certificateId: searchResult.certificateId,
          generatedCertificateId: searchResult.generatedCertificateId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        const errorMsg = err.error || 'Download failed';
        setSearchError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${certInfo?.name || 'Certificate'}_${searchResult.certificateNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Certificate downloaded successfully');
    } catch {
      const errorMsg = 'Failed to generate certificate PDF';
      setSearchError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7fa] flex items-center justify-center">
        <div className="spinner" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }

  if (notFound || !certInfo) {
    return (
      <div className="min-h-screen bg-[#f8f7fa] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#dbdade] p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-[#ea5455]/10 text-[#ea5455] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg text-black">Certificate Not Found</h2>
          <p className="text-xs text-black">
            The certificate verification link is invalid, expired, or unpublished.
          </p>
        </div>
      </div>
    );
  }

  const orgLogo = certInfo.event.organization.logo;
  const eventLogo = certInfo.event.logo;
  const supportEmail = certInfo.event.organization.email || 'support@amrita.edu';
  const resultData = searchResult ? (searchResult.data || searchResult.displayData || {}) : {};

  return (
    <div className="min-h-screen bg-[#f8f7fa] py-16 px-4 flex flex-col justify-center items-center text-black">
      <div className="max-w-md w-full space-y-6 my-auto">
        {/* ── Top Header & Dual Logos ── */}
        <div className="text-center space-y-3">
          {/* Side-by-side Logos without container box */}
          <div className="flex items-center justify-center gap-6 min-h-[56px]">
            {orgLogo && (
              <img
                src={orgLogo}
                alt={certInfo.event.organization.name}
                className="h-12 max-w-[160px] object-contain"
              />
            )}
            {eventLogo && (
              <img
                src={eventLogo}
                alt={certInfo.event.name}
                className="h-12 max-w-[160px] object-contain"
              />
            )}
            {!orgLogo && !eventLogo && (
              <div className="text-xs text-black">
                {certInfo.event.organization.name}
              </div>
            )}
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl text-black">
              {certInfo.event.name} Certificate Verification
            </h1>
            <div className="text-base text-black mt-0.5">
              {certInfo.name}
            </div>
            <p className="text-xs text-black mt-1">
              Enter your details to verify and download your certificate
            </p>
          </div>
        </div>

        {/* ── Form Card ── */}
        {!searchResult ? (
          <div className="bg-white border border-[#dbdade] p-7 space-y-5 shadow-sm">
            {searchError && (
              <div className="p-3 bg-[#ea5455]/10 border border-[#ea5455]/30 text-[#ea5455] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{searchError}</span>
              </div>
            )}

            <form onSubmit={handleSearch} className="space-y-4">
              {certInfo.formFields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <label className="text-xs text-black block">
                    {field.label} {field.required && <span className="text-[#ea5455]">*</span>}
                  </label>

                  {/* Clean standard input without overlapping icons */}
                  <input
                    className="w-full px-3 py-2.5 bg-white border border-[#dbdade] focus:border-[#7367f0] outline-none text-xs text-black placeholder:text-[#888888]"
                    type={field.inputType || 'text'}
                    value={formValues[field.columnName] || ''}
                    onChange={(e) =>
                      setFormValues({ ...formValues, [field.columnName]: e.target.value })
                    }
                    placeholder={`Enter your ${field.label.toLowerCase()}`}
                  />

                  <p className="text-[11px] text-black">
                    {field.label.toLowerCase().includes('email')
                      ? 'Enter the email you used during registration.'
                      : `Enter your ${field.label.toLowerCase()} exactly as registered.`}
                  </p>
                </div>
              ))}

              <button
                type="submit"
                disabled={searching}
                className="w-full py-3 bg-[#7367f0] hover:bg-[#685dd8] text-white text-xs flex items-center justify-center gap-2 shadow-sm transition-colors mt-2 cursor-pointer border-0"
              >
                {searching ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#ffffff' }} />
                    <span>Verifying details...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Verify & Download Certificate</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* ── Search Result Card ── */
          <div className="bg-white border border-[#dbdade] p-7 space-y-5 shadow-sm">
            <div className="flex items-center gap-3 p-3 bg-[#f8f7fa] border border-[#dbdade] text-black">
              <CheckCircle2 className="w-5 h-5 text-[#28c76f] flex-shrink-0" />
              <div>
                <div className="text-xs text-black font-medium">Verified Credential Found</div>
                <div className="text-[11px] text-[#6f6b7d]">Certificate #{searchResult.certificateNumber}</div>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-2 py-2 border-y border-[#ebebed]">
              {Object.entries(resultData).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center text-xs py-1">
                  <span className="text-black">{key}</span>
                  <span className="text-black text-right font-medium">{val}</span>
                </div>
              ))}
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-3 bg-[#7367f0] hover:bg-[#685dd8] text-white text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer border-0"
            >
              {downloading ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#ffffff' }} />
                  <span>Generating Official PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Official Certificate PDF</span>
                </>
              )}
            </button>

            {/* Reset / Search Another */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setSearchResult(null);
                  setSearchError('');
                }}
                className="text-xs text-black hover:underline bg-transparent border-0 cursor-pointer inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Search another certificate</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="text-center text-xs text-black space-y-1">
          <div>
            Having trouble? Mail to{' '}
            <a href={`mailto:${supportEmail}`} className="text-black underline font-medium">
              {supportEmail}
            </a>
          </div>
          <div className="text-[11px] text-black">
            Powered by {certInfo.event.organization.name}
          </div>
        </div>
      </div>
    </div>
  );
}
