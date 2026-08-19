'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Move,
  Plus,
  Trash2,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sliders,
  Grid,
  Sparkles,
  Layers,
  ExternalLink,
  Table,
  FileSpreadsheet,
  PlusCircle,
  Eye,
  EyeOff,
  Shuffle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface CertField {
  id?: string;
  name: string;
  label: string;
  type: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  alignment: string;
  required: boolean;
  sortOrder: number;
}

interface FieldEditorProps {
  fields: Partial<CertField>[];
  onChange: (fields: Partial<CertField>[]) => void;
  onSave: () => void;
  saving?: boolean;
  templateUrl?: string | null;
  datasetColumns?: { id: string; columnName: string }[];
  sampleRecipients?: Record<string, unknown>[];
}

// Standard A4 Landscape Dimensions in Points (842 x 595 pt)
const CANVAS_WIDTH = 842;
const CANVAS_HEIGHT = 595;

/**
 * High-fidelity PDF Canvas renderer with zero iframe margins or letterboxing
 */
function PdfTemplateCanvas({ url, width, height }: { url: string; width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const renderPdf = async () => {
      try {
        setLoading(true);

        // Load PDF.js from reliable CDN if not on window
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
        const scale = width / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) return;

        await page.render({ canvasContext: context, viewport }).promise;
        if (isMounted) setLoading(false);
      } catch (err) {
        console.error('PDF.js render error:', err);
        if (isMounted) setLoading(false);
      }
    };

    renderPdf();
    return () => {
      isMounted = false;
    };
  }, [url, width, height]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
          <div className="spinner" style={{ width: '24px', height: '24px' }} />
        </div>
      )}
    </>
  );
}

/**
 * Universal Template Canvas:
 * Automatically probes whether the uploaded template URL is a JPG/PNG image or a PDF document,
 * and renders it reliably regardless of file extension or URL structure (e.g. UploadThing hashes).
 */
function UniversalTemplateCanvas({ url, width, height }: { url: string; width: number; height: number }) {
  const [renderType, setRenderType] = useState<'loading' | 'image' | 'pdf' | 'fallback'>('loading');

  useEffect(() => {
    if (!url) {
      setRenderType('fallback');
      return;
    }

    let isMounted = true;
    setRenderType('loading');

    // 1. Fast check file extension
    const cleanUrl = url.split('?')[0].toLowerCase();
    if (cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.png') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.svg')) {
      setRenderType('image');
      return;
    }
    if (cleanUrl.endsWith('.pdf')) {
      setRenderType('pdf');
      return;
    }

    // 2. Dynamic probe: test if browser can load it as an image
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (isMounted) setRenderType('image');
    };

    img.onerror = () => {
      // If it fails to load as an image, load via PDF.js renderer
      if (isMounted) setRenderType('pdf');
    };

    img.src = url;

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (renderType === 'image') {
    return (
      <img
        src={url}
        alt="Certificate Template"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
      />
    );
  }

  if (renderType === 'pdf') {
    return <PdfTemplateCanvas url={url} width={width} height={height} />;
  }

  if (renderType === 'loading') {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
        <div className="spinner" style={{ width: '24px', height: '24px' }} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none opacity-30">
      <div className="text-3xl font-extrabold tracking-wider uppercase text-[#7367f0] border-2 border-[#7367f0] px-6 py-2 mb-2">
        Certificate Template
      </div>
      <p className="text-xs text-[#6f6b7d]">
        Upload a PDF or image background in Step 2 to preview actual design
      </p>
    </div>
  );
}

/**
 * Resolves live recipient data from the uploaded dataset or realistic fallback data
 * so organizers can immediately preview the certificate output before publishing.
 */
function getSampleValue(
  field: Partial<CertField>,
  sampleData: Record<string, unknown> | null,
  sampleIdx: number
): string {
  if (sampleData) {
    // 1. Direct match by field.name
    if (field.name && sampleData[field.name] !== undefined && sampleData[field.name] !== null) {
      return String(sampleData[field.name]);
    }
    // 2. Direct match by field.label
    if (field.label && sampleData[field.label] !== undefined && sampleData[field.label] !== null) {
      return String(sampleData[field.label]);
    }
    // 3. Case-insensitive / normalized match
    const cleanFieldName = (field.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanFieldLabel = (field.label || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [k, v] of Object.entries(sampleData)) {
      const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanK === cleanFieldName || cleanK === cleanFieldLabel) {
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
      }
    }
  }

  // 4. Fallback realistic mock values if no dataset uploaded yet
  const nameLower = (field.name || field.label || '').toLowerCase();
  if (nameLower.includes('name') || nameLower.includes('student') || nameLower.includes('recipient')) {
    const mockNames = ['Aswin J', 'Aravind BL', 'Dr. Radhika Menon', 'Siddharth V', 'Pooja Nair'];
    return mockNames[sampleIdx % mockNames.length];
  }
  if (nameLower.includes('rank') || nameLower.includes('position')) {
    const mockRanks = ['1st Place', '2nd Place', '3rd Place', 'Finalist', 'Rank 12'];
    return mockRanks[sampleIdx % mockRanks.length];
  }
  if (nameLower.includes('score') || nameLower.includes('points') || nameLower.includes('count')) {
    return String(98 + (sampleIdx % 5));
  }
  if (nameLower.includes('inst') || nameLower.includes('college') || nameLower.includes('org') || nameLower.includes('univ')) {
    return 'Amrita Vishwa Vidyapeetham';
  }
  if (nameLower.includes('date')) {
    return 'August 19, 2026';
  }
  if (nameLower.includes('time')) {
    return '01:45:20';
  }
  if (nameLower.includes('event')) {
    return 'ICPC Asia West Regionals';
  }
  if (nameLower.includes('id') || nameLower.includes('roll') || nameLower.includes('reg')) {
    return `AM.EN.U4CSE${20000 + sampleIdx}`;
  }

  return field.label || field.name || 'Sample Data';
}

export default function FieldEditor({
  fields,
  onChange,
  onSave,
  saving = false,
  templateUrl,
  datasetColumns = [],
  sampleRecipients = [],
}: FieldEditorProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(fields.length > 0 ? 0 : null);
  const [zoom, setZoom] = useState<number>(1);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<'properties' | 'list' | 'columns'>('properties');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [sampleIndex, setSampleIndex] = useState<number>(0);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; fieldX: number; fieldY: number; fieldW: number; fieldH: number }>({
    x: 0,
    y: 0,
    fieldX: 0,
    fieldY: 0,
    fieldW: 0,
    fieldH: 0,
  });

  // Calculate default responsive zoom based on container width
  useEffect(() => {
    const updateZoom = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const parentWidth = canvasRef.current.parentElement.clientWidth - 40;
        if (parentWidth > 0 && parentWidth < CANVAS_WIDTH) {
          setZoom(Math.max(0.6, Number((parentWidth / CANVAS_WIDTH).toFixed(2))));
        }
      }
    };
    updateZoom();
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, []);

  const snap = useCallback((val: number) => {
    if (!snapToGrid) return Math.round(val);
    return Math.round(val / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  // Update a single field property
  const updateField = (idx: number, updates: Partial<CertField>) => {
    const updated = [...fields];
    updated[idx] = { ...updated[idx], ...updates };
    onChange(updated);
  };

  // Add new generic field
  const handleAddField = () => {
    const newIdx = fields.length;
    const newField: Partial<CertField> = {
      name: `field_${newIdx + 1}`,
      label: `Field ${newIdx + 1}`,
      type: 'TEXT',
      positionX: 200,
      positionY: 200 + (newIdx * 35) % 220,
      width: 250,
      height: 38,
      fontFamily: 'HelveticaBold',
      fontSize: 18,
      fontColor: '#000000',
      alignment: 'CENTER',
      required: false,
      sortOrder: newIdx,
    };
    onChange([...fields, newField]);
    setSelectedIdx(newIdx);
    setActiveTab('properties');
  };

  // Add field from specific dataset column
  const handleAddColumnField = (colName: string) => {
    const rawName = colName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '') || `col_${fields.length + 1}`;
    const newIdx = fields.length;
    const newField: Partial<CertField> = {
      name: rawName,
      label: colName,
      type: 'TEXT',
      positionX: 180,
      positionY: Math.min(500, 200 + (newIdx * 45)),
      width: 480,
      height: 38,
      fontFamily: newIdx === 0 ? 'HelveticaBold' : 'Helvetica',
      fontSize: newIdx === 0 ? 22 : 16,
      fontColor: '#1a1824',
      alignment: 'CENTER',
      required: newIdx === 0,
      sortOrder: newIdx,
    };
    onChange([...fields, newField]);
    setSelectedIdx(newIdx);
    setActiveTab('properties');
  };

  // Import all dataset columns as fields with 1 click
  const handleImportAllColumns = () => {
    const existingNames = new Set(fields.map((f) => f.name?.toLowerCase()));
    const newFields: Partial<CertField>[] = [...fields];

    datasetColumns.forEach((col, i) => {
      const rawName = col.columnName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '') || `col_${i + 1}`;
      if (!existingNames.has(rawName)) {
        const idx = newFields.length;
        newFields.push({
          name: rawName,
          label: col.columnName,
          type: 'TEXT',
          positionX: 180,
          positionY: Math.min(500, 200 + (idx * 45)),
          width: 480,
          height: 38,
          fontFamily: idx === 0 ? 'HelveticaBold' : 'Helvetica',
          fontSize: idx === 0 ? 22 : 16,
          fontColor: '#1a1824',
          alignment: 'CENTER',
          required: idx === 0,
          sortOrder: idx,
        });
      }
    });

    onChange(newFields);
    if (newFields.length > 0) {
      setSelectedIdx(0);
    }
  };

  // Delete field
  const handleDeleteField = (idx: number) => {
    const updated = fields.filter((_, i) => i !== idx);
    onChange(updated);
    if (selectedIdx === idx) {
      setSelectedIdx(updated.length > 0 ? 0 : null);
    } else if (selectedIdx !== null && selectedIdx > idx) {
      setSelectedIdx(selectedIdx - 1);
    }
  };

  // Mouse event handlers for Drag & Resize
  const handleMouseDown = (e: React.MouseEvent, idx: number, resizeHandle: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIdx(idx);

    const field = fields[idx];
    if (!field) return;

    if (resizeHandle) {
      isResizingRef.current = resizeHandle;
      isDraggingRef.current = false;
    } else {
      isDraggingRef.current = true;
      isResizingRef.current = null;
    }

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      fieldX: field.positionX || 0,
      fieldY: field.positionY || 0,
      fieldW: field.width || 200,
      fieldH: field.height || 36,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (selectedIdx === null || (!isDraggingRef.current && !isResizingRef.current)) return;

      const deltaX = (e.clientX - dragStartRef.current.x) / zoom;
      const deltaY = (e.clientY - dragStartRef.current.y) / zoom;

      if (isDraggingRef.current) {
        let newX = snap(dragStartRef.current.fieldX + deltaX);
        let newY = snap(dragStartRef.current.fieldY + deltaY);

        newX = Math.max(0, Math.min(CANVAS_WIDTH - 20, newX));
        newY = Math.max(0, Math.min(CANVAS_HEIGHT - 20, newY));

        updateField(selectedIdx, { positionX: newX, positionY: newY });
      } else if (isResizingRef.current) {
        const handle = isResizingRef.current;
        let newW = dragStartRef.current.fieldW;
        let newH = dragStartRef.current.fieldH;
        let newX = dragStartRef.current.fieldX;
        let newY = dragStartRef.current.fieldY;

        if (handle.includes('right')) {
          newW = snap(Math.max(40, dragStartRef.current.fieldW + deltaX));
        }
        if (handle.includes('left')) {
          const maxDelta = dragStartRef.current.fieldW - 40;
          const clampedDelta = Math.min(maxDelta, deltaX);
          newW = snap(dragStartRef.current.fieldW - clampedDelta);
          newX = snap(dragStartRef.current.fieldX + clampedDelta);
        }
        if (handle.includes('bottom')) {
          newH = snap(Math.max(16, dragStartRef.current.fieldH + deltaY));
        }
        if (handle.includes('top')) {
          const maxDelta = dragStartRef.current.fieldH - 16;
          const clampedDelta = Math.min(maxDelta, deltaY);
          newH = snap(dragStartRef.current.fieldH - clampedDelta);
          newY = snap(dragStartRef.current.fieldY + clampedDelta);
        }

        updateField(selectedIdx, {
          positionX: Math.max(0, newX),
          positionY: Math.max(0, newY),
          width: newW,
          height: newH,
        });
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectedIdx, zoom, fields, snap]);

  // Keyboard navigation & precision arrow key nudging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIdx === null || !fields[selectedIdx]) return;
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const step = e.shiftKey ? 10 : 1;
      const field = fields[selectedIdx];
      let newX = field.positionX || 0;
      let newY = field.positionY || 0;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        newX = Math.max(0, newX - step);
        updateField(selectedIdx, { positionX: newX });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        newX = Math.min(CANVAS_WIDTH - 20, newX + step);
        updateField(selectedIdx, { positionX: newX });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        newY = Math.max(0, newY - step);
        updateField(selectedIdx, { positionY: newY });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        newY = Math.min(CANVAS_HEIGHT - 20, newY + step);
        updateField(selectedIdx, { positionY: newY });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteField(selectedIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, fields]);

  const selectedField = selectedIdx !== null ? fields[selectedIdx] : null;

  return (
    <div className="space-y-4">
      {/* Top Studio Toolbar */}
      <div className="materio-card p-3 bg-white border border-[#dbdade] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAddField}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Field</span>
          </button>

          {datasetColumns.length > 0 && (
            <button
              type="button"
              onClick={handleImportAllColumns}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-[#7367f0] border-[#7367f0]/30 hover:bg-[#7367f0]/10"
              title="Import all spreadsheet columns as draggable certificate fields"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Import Dataset Columns ({datasetColumns.length})</span>
            </button>
          )}

          <div className="h-5 w-[1px] bg-[#dbdade] mx-1" />

          {/* Live Data Sample Preview Toggle */}
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 transition-all ${
              isPreviewMode
                ? 'bg-[#7367f0] text-white border-[#7367f0] shadow-sm font-semibold'
                : 'hover:bg-[#7367f0]/10 text-[#7367f0] border-[#7367f0]/40'
            }`}
            title="Preview real Excel/CSV recipient data directly on canvas"
          >
            {isPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isPreviewMode ? 'Exit Sample Preview' : 'Live Data Preview'}</span>
          </button>

          {/* Sample Recipient Stepper (when in Preview Mode) */}
          {isPreviewMode && (
            <div className="flex items-center gap-1 bg-[#f8f7fa] border border-[#dbdade] px-2 py-0.5 text-xs rounded-none animate-in">
              <span className="text-[#6f6b7d] text-[11px] mr-1 select-none">
                Sample {sampleIndex + 1} of {Math.max(1, sampleRecipients.length || 5)}
              </span>
              <button
                type="button"
                onClick={() => setSampleIndex((i) => Math.max(0, i - 1))}
                disabled={sampleIndex === 0}
                className="p-1 hover:bg-white text-[#2f2b3d] disabled:opacity-30 cursor-pointer"
                title="Previous Sample Recipient"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSampleIndex((i) => (i + 1) % Math.max(1, sampleRecipients.length || 5))}
                className="p-1 hover:bg-white text-[#2f2b3d] cursor-pointer"
                title="Next Sample Recipient"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSampleIndex(Math.floor(Math.random() * Math.max(1, sampleRecipients.length || 5)))}
                className="p-1 hover:bg-white text-[#7367f0] cursor-pointer ml-0.5"
                title="Random Sample Row"
              >
                <Shuffle className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Grid Snap Toggle */}
          <button
            type="button"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5 ${
              snapToGrid ? 'border-[#7367f0] text-[#7367f0] bg-[#7367f0]/5' : ''
            }`}
            title="Toggle Grid Snapping (10px)"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Snap {snapToGrid ? 'ON' : 'OFF'}</span>
          </button>

          {/* Open Template In New Tab */}
          {templateUrl && (
            <a
              href={templateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5 no-underline text-inherit"
              title="Open Template File in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#7367f0]" />
              <span>Template File</span>
            </a>
          )}
        </div>

        {/* Zoom Controls & Save */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[#dbdade] bg-[#f8f7fa]">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
              className="p-1.5 text-[#6f6b7d] hover:text-[#2f2b3d] hover:bg-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold px-2 text-[#2f2b3d] min-w-[45px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(1))))}
              className="p-1.5 text-[#6f6b7d] hover:text-[#2f2b3d] hover:bg-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="btn-success text-xs py-1.5 px-4 flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Fields'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Canvas & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Visual Canvas (8 cols on lg) */}
        <div className="lg:col-span-8 materio-card bg-[#eef0f4] p-4 border border-[#dbdade] overflow-auto min-h-[520px] flex items-center justify-center relative">
          <div
            ref={canvasRef}
            style={{
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
            className="materio-card relative bg-white border border-[#b5b3be] shadow-xl select-none flex-shrink-0 overflow-hidden"
            onClick={() => setSelectedIdx(null)}
          >
            {/* Template Background Layer: Auto-detects JPG, PNG, and PDF templates */}
            <UniversalTemplateCanvas
              url={templateUrl || ''}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
            />

            {/* Grid Overlay if enabled */}
            {snapToGrid && (
              <div
                className="absolute inset-0 pointer-events-none opacity-10 z-10"
                style={{
                  backgroundImage: `linear-gradient(to right, #7367f0 1px, transparent 1px), linear-gradient(to bottom, #7367f0 1px, transparent 1px)`,
                  backgroundSize: `${gridSize}px ${gridSize}px`,
                }}
              />
            )}

            {/* Field Draggable Elements Overlay */}
            {fields.map((field, idx) => {
              const isSelected = selectedIdx === idx;
              const posX = field.positionX || 0;
              const posY = field.positionY || 0;
              const width = field.width || 200;
              const height = field.height || 36;
              const currentSample = sampleRecipients.length > 0 ? sampleRecipients[sampleIndex % sampleRecipients.length] : null;
              const displayValue = isPreviewMode
                ? getSampleValue(field, currentSample, sampleIndex)
                : `{{ ${field.name || field.label || `Field ${idx + 1}`} }}`;

              return (
                <div
                  key={idx}
                  onMouseDown={(e) => handleMouseDown(e, idx)}
                  style={{
                    position: 'absolute',
                    left: `${posX}px`,
                    top: `${posY}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    cursor: 'move',
                    color: field.fontColor || '#000000',
                    fontFamily: field.fontFamily?.includes('Times') ? 'Times New Roman, serif' : 'Inter, sans-serif',
                    fontWeight: field.fontFamily?.includes('Bold') ? 700 : 500,
                    fontSize: `${field.fontSize || 16}px`,
                    textAlign: (field.alignment?.toLowerCase() as 'left' | 'center' | 'right') || 'center',
                    lineHeight: `${height}px`,
                  }}
                  className={`transition-shadow flex items-center justify-center px-2 group ${
                    isSelected
                      ? 'border-2 border-[#7367f0] bg-[#7367f0]/15 shadow-lg ring-2 ring-[#7367f0]/30 z-30'
                      : isPreviewMode
                      ? 'border border-transparent hover:border-[#7367f0]/50 hover:bg-[#7367f0]/5 z-20'
                      : 'border border-dashed border-[#7367f0]/80 bg-[#7367f0]/10 hover:border-[#7367f0] hover:bg-[#7367f0]/15 z-20'
                  }`}
                >
                  {/* Dynamic Value Label (Live Sample vs Placeholders) */}
                  <span className="truncate w-full block pointer-events-none select-none font-semibold">
                    {displayValue}
                  </span>

                  {/* Coordinate Tag Badge on Select / Hover (pointer-events-none so it never blocks dragging/clicks) */}
                  <div
                    className={`absolute -top-6 left-0 bg-[#2f2b3d] text-white text-[10px] px-1.5 py-0.5 whitespace-nowrap font-sans font-medium flex items-center gap-1 shadow-xs pointer-events-none select-none z-30 ${
                      isSelected ? 'block' : 'hidden group-hover:block'
                    }`}
                  >
                    <span>{field.label || field.name}</span>
                    <span className="text-[#a5a2ad]">
                      ({posX}, {posY})
                    </span>
                  </div>

                  {/* 8 Resize Handles with generous clickable areas */}
                  {isSelected && (
                    <>
                      {/* Corners */}
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, idx, 'top-left');
                        }}
                        className="absolute -top-2 -left-2 w-4 h-4 bg-[#7367f0] border-2 border-white cursor-nwse-resize z-40 shadow-sm"
                        title="Resize Top-Left"
                      />
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, idx, 'top-right');
                        }}
                        className="absolute -top-2 -right-2 w-4 h-4 bg-[#7367f0] border-2 border-white cursor-nesw-resize z-40 shadow-sm"
                        title="Resize Top-Right"
                      />
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, idx, 'bottom-left');
                        }}
                        className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#7367f0] border-2 border-white cursor-nesw-resize z-40 shadow-sm"
                        title="Resize Bottom-Left"
                      />
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, idx, 'bottom-right');
                        }}
                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#7367f0] border-2 border-white cursor-nwse-resize z-40 shadow-sm"
                        title="Resize Bottom-Right"
                      />

                      {/* Edges */}
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, idx, 'top');
                        }}
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-3 bg-[#7367f0] border-2 border-white cursor-ns-resize z-40 shadow-sm"
                        title="Resize Height (Top)"
                      />
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, idx, 'bottom');
                        }}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-3 bg-[#7367f0] border-2 border-white cursor-ns-resize z-40 shadow-sm"
                        title="Resize Height (Bottom)"
                      />
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, idx, 'left');
                        }}
                        className="absolute top-1/2 -left-2 -translate-y-1/2 w-3 h-4 bg-[#7367f0] border-2 border-white cursor-ew-resize z-40 shadow-sm"
                        title="Resize Width (Left)"
                      />
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMouseDown(e, idx, 'right');
                        }}
                        className="absolute top-1/2 -right-2 -translate-y-1/2 w-3 h-4 bg-[#7367f0] border-2 border-white cursor-ew-resize z-40 shadow-sm"
                        title="Resize Width (Right)"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Properties Inspector Panel (4 cols on lg) */}
        <div className="lg:col-span-4 materio-card p-5 bg-white border border-[#dbdade] flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header Tabs */}
            <div className="flex border-b border-[#dbdade]">
              <button
                type="button"
                onClick={() => setActiveTab('properties')}
                className={`py-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  activeTab === 'properties'
                    ? 'border-b-2 border-[#7367f0]'
                    : 'hover:text-[#2f2b3d]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Inspector</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`py-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  activeTab === 'list'
                    ? 'border-b-2 border-[#7367f0] text-[#7367f0]'
                    : 'text-[#6f6b7d] hover:text-[#2f2b3d]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Fields ({fields.length})</span>
              </button>
              {datasetColumns.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('columns')}
                  className={`py-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                    activeTab === 'columns'
                      ? 'border-b-2 border-[#7367f0] text-[#7367f0]'
                      : 'text-[#6f6b7d] hover:text-[#2f2b3d]'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#28c76f]" />
                  <span>Columns</span>
                </button>
              )}
            </div>

            {/* Tab 1: Inspector Tab Content */}
            {activeTab === 'properties' && selectedIdx !== null && selectedField && (
              <div className="space-y-3.5 animate-in">
                <div className="flex items-center justify-between pb-2 border-b border-[#ebebed]">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-[#7367f0]" />
                    <span className="font-bold text-sm text-[#2f2b3d]">
                      Field 
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteField(selectedIdx)}
                    className="p-1 text-[#ea5455] hover:bg-[#ea5455]/10 transition-colors"
                    title="Delete field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {isPreviewMode && (
                  <div className="p-2.5 bg-[#f8f7fa] border border-[#7367f0]/30 text-xs">
                    <div className="text-[10px] uppercase font-bold text-[#7367f0] flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>Live Output (Sample {sampleIndex + 1})</span>
                    </div>
                    <div className="font-semibold text-black mt-1 break-words">
                      &ldquo;{getSampleValue(selectedField, sampleRecipients.length > 0 ? sampleRecipients[sampleIndex % sampleRecipients.length] : null, sampleIndex)}&rdquo;
                    </div>
                  </div>
                )}

                <div>
                  <label className="form-label">Field Name (Key) *</label>
                  <input
                    className="form-input"
                    value={selectedField.name || ''}
                    onChange={(e) => updateField(selectedIdx, { name: e.target.value })}
                    placeholder="e.g. student_name"
                  />
                </div>

                <div>
                  <label className="form-label">Display Label</label>
                  <input
                    className="form-input"
                    value={selectedField.label || ''}
                    onChange={(e) => updateField(selectedIdx, { label: e.target.value })}
                    placeholder="e.g. Student Full Name"
                  />
                </div>

                {/* Coordinates & Dimensions */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="form-label">X Position (pt)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={selectedField.positionX || 0}
                      onChange={(e) => updateField(selectedIdx, { positionX: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Y Position (pt)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={selectedField.positionY || 0}
                      onChange={(e) => updateField(selectedIdx, { positionY: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="form-label">Box Width (pt)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={selectedField.width || 200}
                      onChange={(e) => updateField(selectedIdx, { width: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Box Height (pt)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={selectedField.height || 36}
                      onChange={(e) => updateField(selectedIdx, { height: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Typography */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="form-label">Font Family</label>
                    <select
                      className="form-input"
                      value={selectedField.fontFamily || 'Helvetica'}
                      onChange={(e) => updateField(selectedIdx, { fontFamily: e.target.value })}
                    >
                      <option value="Helvetica">Helvetica</option>
                      <option value="HelveticaBold">Helvetica Bold</option>
                      <option value="TimesRoman">Times Roman</option>
                      <option value="TimesRomanBold">Times Roman Bold</option>
                      <option value="Courier">Courier</option>
                      <option value="CourierBold">Courier Bold</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Font Size (pt)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={selectedField.fontSize || 16}
                      onChange={(e) => updateField(selectedIdx, { fontSize: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Alignment & Color */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="form-label">Alignment</label>
                    <div className="flex border border-[#dbdade]">
                      {(['LEFT', 'CENTER', 'RIGHT'] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => updateField(selectedIdx, { alignment: align })}
                          className={`flex-1 py-1.5 flex items-center justify-center transition-colors ${
                            selectedField.alignment === align
                              ? 'bg-[#7367f0] text-white'
                              : 'bg-white text-[#6f6b7d] hover:bg-[#f8f7fa]'
                          }`}
                        >
                          {align === 'LEFT' && <AlignLeft className="w-3.5 h-3.5" />}
                          {align === 'CENTER' && <AlignCenter className="w-3.5 h-3.5" />}
                          {align === 'RIGHT' && <AlignRight className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Font Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedField.fontColor || '#000000'}
                        onChange={(e) => updateField(selectedIdx, { fontColor: e.target.value })}
                        className="w-10 h-8 p-0 border border-[#dbdade] cursor-pointer"
                      />
                      <input
                        className="form-input text-xs"
                        value={selectedField.fontColor || '#000000'}
                        onChange={(e) => updateField(selectedIdx, { fontColor: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state when no field is selected in Inspector */}
            {activeTab === 'properties' && (selectedIdx === null || !selectedField) && (
              <div className="text-center py-10 text-[#6f6b7d] text-xs">
                <Move className="w-8 h-8 mx-auto mb-2 text-[#dbdade]" />
                <p className="font-semibold text-[#2f2b3d]">No field selected</p>
                <p className="mt-1">Click on a field on the canvas or click "Add Field" / "Import Columns" to begin.</p>
              </div>
            )}

            {/* Tab 2: Field List Tab */}
            {activeTab === 'list' && (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 animate-in">
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#6f6b7d]">No fields created yet.</div>
                ) : (
                  fields.map((f, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedIdx(idx);
                        setActiveTab('properties');
                      }}
                      className={`p-2.5 border cursor-pointer flex items-center justify-between transition-colors ${
                        selectedIdx === idx
                          ? 'border-[#7367f0] bg-[#7367f0]/5'
                          : 'border-[#ebebed] bg-white hover:border-[#dbdade]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-[#2f2b3d] truncate">
                          {f.label || f.name || `Field ${idx + 1}`}
                        </div>
                        <div className="text-[10px] text-[#6f6b7d]">
                          {f.name} · {f.width}x{f.height}pt @ ({f.positionX}, {f.positionY})
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteField(idx);
                        }}
                        className="p-1 text-[#ea5455] hover:bg-[#ea5455]/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Dataset Spreadsheet Columns Tab */}
            {activeTab === 'columns' && (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 animate-in">
                <div className="flex items-center justify-between pb-1 text-xs text-[#6f6b7d]">
                  <span>Available columns from uploaded spreadsheet:</span>
                </div>
                {datasetColumns.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#6f6b7d]">
                    No dataset uploaded yet. Upload a CSV/XLSX file in Step 4.
                  </div>
                ) : (
                  datasetColumns.map((col) => {
                    const isAlreadyAdded = fields.some(
                      (f) =>
                        f.label?.toLowerCase() === col.columnName.toLowerCase() ||
                        f.name?.toLowerCase() === col.columnName.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                    );
                    return (
                      <div
                        key={col.id}
                        className="p-2.5 bg-[#f8f7fa] border border-[#dbdade] flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#2f2b3d] truncate">
                            {col.columnName}
                          </div>
                          <div className="text-[10px] text-[#6f6b7d]">Spreadsheet Column</div>
                        </div>
                        {isAlreadyAdded ? (
                          <span className="text-[10px] px-2 py-0.5">
                            Added on Canvas
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddColumnField(col.columnName)}
                            className="btn-secondary text-[11px] py-1 px-2 flex items-center gap-1 text-[#7367f0]"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>Add to Canvas</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#ebebed] flex items-center justify-between text-xs text-[#6f6b7d]">
            <span>Canvas: {CANVAS_WIDTH} x {CANVAS_HEIGHT} pt</span>
            <span>{fields.length} dynamic field(s)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
