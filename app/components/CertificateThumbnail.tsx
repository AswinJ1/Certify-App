'use client';

import { useState, useEffect, useRef } from 'react';
import { Award, FileText } from 'lucide-react';

interface CertificateThumbnailProps {
  url?: string | null;
  name: string;
  className?: string;
}

export default function CertificateThumbnail({ url, name, className = 'w-full h-full' }: CertificateThumbnailProps) {
  const [renderMode, setRenderMode] = useState<'image' | 'pdf' | 'fallback'>('image');
  const [pdfRendered, setPdfRendered] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isPdfUrl = !!url && (url.toLowerCase().split('?')[0].endsWith('.pdf') || renderMode === 'pdf');

  useEffect(() => {
    if (!url) {
      setRenderMode('fallback');
      return;
    }

    const clean = url.split('?')[0].toLowerCase();
    if (clean.endsWith('.pdf')) {
      setRenderMode('pdf');
      return;
    }

    // Probe if it's an image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setRenderMode('image');
    };
    img.onerror = () => {
      // If image loading fails (e.g. UploadThing PDF URL without .pdf extension), switch to PDF mode
      setRenderMode('pdf');
    };
    img.src = url;
  }, [url]);

  // Render PDF thumbnail onto canvas if PDF.js is available or loads
  useEffect(() => {
    if (renderMode !== 'pdf' || !url || !canvasRef.current) return;

    let isMounted = true;

    const renderPdfThumbnail = async () => {
      try {
        if (!(window as unknown as { pdfjsLib?: { getDocument: (url: string) => { promise: Promise<unknown> }; GlobalWorkerOptions: { workerSrc: string } } }).pdfjsLib) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
              const win = window as unknown as { pdfjsLib: { GlobalWorkerOptions: { workerSrc: string } } };
              win.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              resolve(true);
            };
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const pdfjs = (window as unknown as {
          pdfjsLib: {
            getDocument: (url: string) => {
              promise: Promise<{
                getPage: (num: number) => Promise<{
                  getViewport: (opts: { scale: number }) => { width: number; height: number };
                  render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
                }>;
              }>;
            };
          };
        }).pdfjsLib;

        const loadingTask = pdfjs.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        if (!isMounted || !canvasRef.current) return;

        const unscaledViewport = page.getViewport({ scale: 1 });
        const canvas = canvasRef.current;
        const targetWidth = canvas.clientWidth || 300;
        const scale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d');
        if (!context) return;

        await page.render({ canvasContext: context, viewport }).promise;
        if (isMounted) setPdfRendered(true);
      } catch {
        if (isMounted) setPdfRendered(false);
      }
    };

    renderPdfThumbnail();

    return () => {
      isMounted = false;
    };
  }, [renderMode, url]);

  if (!url || renderMode === 'fallback') {
    return (
      <div className={`bg-[#f8f7fa] flex flex-col items-center justify-center text-[#a5a2ad] ${className}`}>
        <Award className="w-8 h-8" />
        <span className="text-[10px] text-[#6f6b7d] mt-1">No Template</span>
      </div>
    );
  }

  if (renderMode === 'image') {
    return (
      <img
        src={url}
        alt={name}
        className={`${className} object-cover object-top`}
        onError={() => setRenderMode('pdf')}
      />
    );
  }

  // PDF rendering mode
  return (
    <div className={`relative bg-[#f8f7fa] overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-cover object-top ${pdfRendered ? 'block' : 'hidden'}`}
      />
      {!pdfRendered && (
        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-[#f8f7fa] to-[#ebebed]">
          <FileText className="w-7 h-7 text-[#7367f0] mb-1" />
          <span className="text-[11px] text-[#2f2b3d] font-medium truncate max-w-full">
            PDF Template
          </span>
        </div>
      )}
    </div>
  );
}
