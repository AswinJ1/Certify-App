'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  FileText,
  Image as ImageIcon,
  Type,
  Database,
  Link2,
  Sliders,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Users,
  Copy,
  Check,
  PauseCircle,
  PlayCircle,
  Archive,
  Eye,
  Calendar,
  Building2,
  ChevronRight,
  Sparkles,
  X,
  Save,
  Edit2,
} from 'lucide-react';
import UploadWithRetry from '@/app/components/UploadWithRetry';
import FieldEditor, { CertField } from '@/app/components/FieldEditor';

interface DatasetColumn {
  id: string;
  columnName: string;
  dataType: string;
  columnIndex: number;
}

interface Dataset {
  id: string;
  fileName: string;
  fileType: string;
  rowCount: number;
  status: string;
  columns: DatasetColumn[];
}

interface FieldMapping {
  id: string;
  datasetColumnId: string;
  certificateFieldId: string;
  datasetColumn: DatasetColumn;
  certificateField: CertField;
}

interface FormFieldConfig {
  id: string;
  label: string;
  inputType: string;
  required: boolean;
  sortOrder: number;
  datasetColumn: DatasetColumn;
}

interface CertificateDetail {
  id: string;
  name: string;
  status: string;
  publicSlug: string;
  publishedAt: string | null;
  event: {
    id: string;
    name: string;
    logo: string | null;
    organization: { id: string; name: string; logo: string | null };
  };
  template: { id: string; fileKey: string; metadata: Record<string, unknown> } | null;
  fields: CertField[];
  recipients?: { id: string; data: Record<string, unknown> }[];
  datasets: Dataset[];
  mappings: FieldMapping[];
  formFields: FormFieldConfig[];
  _count: { recipients: number };
}

type Step = 'overview' | 'template' | 'fields' | 'dataset' | 'mapping' | 'form' | 'publish';

interface CertificateConfigStudioProps {
  certificateId: string;
  basePath: '/admin' | '/organizer';
}

export default function CertificateConfigStudio({
  certificateId,
  basePath,
}: CertificateConfigStudioProps) {
  const router = useRouter();
  const [cert, setCert] = useState<CertificateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<Step>('overview');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Field editor state
  const [editFields, setEditFields] = useState<Partial<CertField>[]>([]);

  // Mapping state
  const [mappingPairs, setMappingPairs] = useState<{ columnId: string; fieldId: string }[]>([]);

  // Form field state
  const [formFieldSelections, setFormFieldSelections] = useState<{ columnId: string; label: string; required: boolean }[]>([]);

  // Event Logo edit state
  const [showEventLogoModal, setShowEventLogoModal] = useState(false);
  const [eventLogoInput, setEventLogoInput] = useState('');
  const [savingEventLogo, setSavingEventLogo] = useState(false);

  const handleCopyLink = () => {
    if (!cert?.publicSlug) return;
    const url = typeof window !== 'undefined' ? `${window.location.origin}/c/${cert.publicSlug}` : `/c/${cert.publicSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Public certificate link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const loadCert = useCallback(() => {
    fetch(`/api/certificates/${certificateId}`)
      .then((r) => r.json())
      .then((d) => {
        setCert(d.certificate);
        if (d.certificate) {
          setEditFields(d.certificate.fields || []);
          setMappingPairs(
            (d.certificate.mappings || []).map((m: FieldMapping) => ({
              columnId: m.datasetColumnId,
              fieldId: m.certificateFieldId,
            }))
          );
          setFormFieldSelections(
            (d.certificate.formFields || []).map((f: FormFieldConfig) => ({
              columnId: f.datasetColumn?.id || '',
              label: f.label,
              required: f.required,
            }))
          );
        }
      })
      .catch(() => toast.error('Unable to load certificate configuration'))
      .finally(() => setLoading(false));
  }, [certificateId]);

  useEffect(() => {
    loadCert();
  }, [loadCert]);

  // --- Template upload handler ---
  const handleTemplateUploaded = async (res: { ufsUrl: string; key: string; name: string }[]) => {
    if (!res[0]) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/certificates/${certificateId}/template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: res[0].ufsUrl, fileKey: res[0].key, fileName: res[0].name }),
      });
      if (response.ok) {
        toast.success('Certificate template uploaded and configured successfully');
        loadCert();
      } else {
        toast.error('Failed to register template with certificate');
      }
    } catch {
      toast.error('Error uploading certificate template. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  // --- Save fields ---
  const saveFields = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/certificates/${certificateId}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: editFields }),
      });
      if (res.ok) {
        toast.success('Certificate fields and layout saved successfully');
        loadCert();
      } else {
        toast.error('Failed to save certificate fields');
      }
    } catch {
      toast.error('Network error while saving certificate fields');
    } finally {
      setSaving(false);
    }
  };

  // --- Dataset upload handler ---
  const handleDatasetUploaded = async (res: { ufsUrl: string; key: string; name: string }[]) => {
    if (!res[0]) return;
    if (res[0].ufsUrl?.startsWith('local_')) {
      toast.success('Recipient dataset processed and records populated');
      loadCert();
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/certificates/${certificateId}/datasets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: res[0].ufsUrl, fileKey: res[0].key, fileName: res[0].name }),
      });
      if (response.ok) {
        toast.success('Recipient dataset processed and records populated');
        loadCert();
      } else {
        toast.error('Failed to process dataset file');
      }
    } catch {
      toast.error('Error uploading dataset');
    } finally {
      setSaving(false);
    }
  };

  // --- Save mappings ---
  const saveMappings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/certificates/${certificateId}/mappings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mappings: mappingPairs
            .filter((m) => m.columnId && m.fieldId)
            .map((m) => ({
              datasetColumnId: m.columnId,
              certificateFieldId: m.fieldId,
            })),
        }),
      });
      if (res.ok) {
        toast.success('Field mappings saved successfully');
        loadCert();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to save field mappings');
      }
    } catch {
      toast.error('Network error while saving field mappings');
    } finally {
      setSaving(false);
    }
  };

  // --- Save event logo ---
  const handleSaveEventLogo = async () => {
    if (!cert) return;
    setSavingEventLogo(true);
    try {
      const res = await fetch(`/api/events/${cert.event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: eventLogoInput || null }),
      });
      if (res.ok) {
        toast.success('Event logo saved successfully');
        setShowEventLogoModal(false);
        loadCert();
      } else {
        toast.error('Failed to update event logo');
      }
    } catch {
      toast.error('Network error while saving logo');
    } finally {
      setSavingEventLogo(false);
    }
  };

  // --- Save form config ---
  const saveFormFields = async () => {
    if (!cert) return;
    setSaving(true);
    try {
      const allColumns = cert.datasets.flatMap((d) => d.columns);
      const formFields = formFieldSelections
        .filter((s) => s.columnId)
        .map((s) => ({
          datasetColumnId: s.columnId,
          label: s.label || allColumns.find((c) => c.id === s.columnId)?.columnName || 'Field',
          required: s.required,
        }));

      const res = await fetch(`/api/certificates/${certificateId}/form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formFields }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Public lookup form configuration saved');
        loadCert();
      } else {
        toast.error(data.error || 'Failed to save form configuration');
      }
    } catch {
      toast.error('Network error while saving form configuration');
    } finally {
      setSaving(false);
    }
  };

  // --- Publish ---
  const handlePublish = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/certificates/${certificateId}/publish`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Certificate is now live and published!');
        loadCert();
      } else {
        toast.error(`Publishing failed: ${data.errors?.join(', ') || data.error}`);
      }
    } catch {
      toast.error('Network error during publishing');
    } finally {
      setSaving(false);
    }
  };

  // --- Status Change ---
  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/certificates/${certificateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Certificate status updated to ${newStatus}`);
        loadCert();
      } else {
        const data = await res.json();
        toast.error(`Failed to update status: ${data.error}`);
      }
    } catch {
      toast.error('Network error updating certificate status');
    } finally {
      setSaving(false);
    }
  };

  const copyPublicUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Public certificate link copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <div className="spinner" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="materio-card p-12 text-center bg-white border border-[#dbdade]">
        <AlertCircle className="w-10 h-10 text-[#ea5455] mx-auto mb-3" />
        <h2 className="">Certificate Not Found</h2>
        <p className=" mt-1 mb-4">The requested certificate configuration does not exist.</p>
        <button className="btn-secondary text-xs" onClick={() => router.push(`${basePath}/certificates`)}>
          Back to Certificates
        </button>
      </div>
    );
  }

  const allColumns = cert.datasets.flatMap((d) => d.columns);
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/c/${cert.publicSlug}` : `/c/${cert.publicSlug}`;

  const steps = [
    { key: 'overview' as Step, label: 'Overview', icon: FileText, done: true },
    { key: 'template' as Step, label: 'Template', icon: ImageIcon, done: !!cert.template },
    { key: 'dataset' as Step, label: 'Recipients Data', icon: Database, done: cert.datasets.length > 0 },
    { key: 'fields' as Step, label: 'Fields & Layout', icon: Type, done: cert.fields.length > 0 },
    { key: 'mapping' as Step, label: 'Field Mapping', icon: Link2, done: cert.mappings.length > 0 },
    { key: 'form' as Step, label: 'Public Form', icon: Sliders, done: cert.formFields.length > 0 },
    { key: 'publish' as Step, label: 'Publish & Live', icon: Send, done: cert.status === 'PUBLISHED' },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button
            onClick={() => router.push(`${basePath}/certificates`)}
            className="cursor-pointer py-1.5 px-3 mb-2 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Certificates</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl  tracking-tight">{cert.name}</h1>
          </div>
          <div className=" flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 ">
              {/* <Calendar className="w-3.5 h-3.5 " /> */}
              {cert.event.name}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              {/* <Building2 className="w-3.5 h-3.5 text-[#7367f0]" /> */}
              {cert.event.organization.name}
            </span>
          </div>
        </div>

        {cert.status === 'PUBLISHED' && (
          <div className="flex items-center gap-2">
            <a
              href={`/c/${cert.publicSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Public Page</span>
            </a>
          </div>
        )}
      </div>

      {/* Step Navigation Bar */}
      <div className="  p-1.5 flex gap-1 overflow-x-auto">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeStep === step.key;
          return (
            <button
              key={step.key}
              onClick={() => setActiveStep(step.key)}
              className={`flex items-center gap-2 px-3.5 py-2  whitespace-nowrap transition-colors border ${
                isActive
                  ? 'bg-[#7367f0] text-white border-[#7367f0]'
                  : ' text-[#6f6b7d] hover:text-[#2f2b3d] hover:bg-[#f8f7fa] border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#7367f0]'}`} />
              <span>
               {step.label}
              </span>
              {/* {step.done && step.key !== 'overview' && (
                <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#28c76f]'}`} />
              )} */}
            </button>
          );
        })}
      </div>

      {/* ── STEP 1: OVERVIEW ── */}
      {activeStep === 'overview' && (
        <div className="materio-card p-6 bg-white border border-[#dbdade] space-y-6">
          <div className="flex items-center justify-between border-b border-[#ebebed] pb-4">
            <div>
              <h2 className="">Certificate Snapshot</h2>
              <p className="mt-0.5">Summary of all configured certificate components</p>
            </div>
            <button
              onClick={() => setActiveStep('template')}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <span>Continue Setup</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 text-center">
              <div className="text-2xl">{cert._count.recipients}</div>
              <div className=" tracking-wider mt-1">Recipients</div>
            </div>
            <div className="p-4  text-center">
              <div className="text-2xl ">{cert.fields.length}</div>
              <div className=" tracking-wider mt-1">Dynamic Fields</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-2xl ">{cert.mappings.length}</div>
              <div className=" tracking-wider mt-1">Field Mappings</div>
            </div>
            <div className="p-4  text-center">
              <div className="text-2xl">{cert.formFields.length}</div>
              <div className="tracking-wider mt-1">Form Lookups</div>
            </div>
          </div>

          {/* Event & Organization Branding Banner */}
          <div className="p-4 bg-white border border-[#dbdade] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {cert.event.organization.logo ? (
                  <img
                    src={cert.event.organization.logo}
                    alt={cert.event.organization.name}
                    className="h-10 max-w-30 object-contain"
                  />
                ) : (
                  <div className="px-2.5 py-1 bg-[#7367f0]/10 text-[#7367f0] font-bold text-xs">
                    {cert.event.organization.name}
                  </div>
                )}
                {cert.event.logo ? (
                  <img
                    src={cert.event.logo}
                    alt={cert.event.name}
                    className="h-10 max-w-30 object-contain"
                  />
                ) : (
                  <div className="px-2.5 py-1 bg-[#f8f7fa] border border-dashed border-[#dbdade] text-[#a5a2ad] text-xs">
                    No Event Logo
                  </div>
                )}
              </div>
              <div>
                <div className=" text-[#2f2b3d]">{cert.event.name}</div>
                <div className="text-[10px]">
                  Both logos appear side-by-side on your public verification portal
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEventLogoInput(cert.event.logo || '');
                setShowEventLogoModal(true);
              }}
              className="cursor-pointer py-1.5 px-3 flex items-center gap-1.5 self-start md:self-auto"
            >
              <ImageIcon className="w-3.5 h-3.5 " />
              <span>{cert.event.logo ? 'Change Event Logo' : 'Upload Event Logo'}</span>
            </button>
          </div>

          {cert.status === 'PUBLISHED' && (
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 ">
                  {/* <CheckCircle2 className="w-4 h-4" /> */}
                  <span>Public Lookup Page Live</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyPublicUrl(publicUrl)}
                  className="cursor-pointer  py-1 px-2.5 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#28c76f]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
              <p className="text-xs text-[#2f2b3d] font-mono break-all bg-white p-2 border border-[#dbdade]">
                {publicUrl}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: TEMPLATE UPLOAD ── */}
      {activeStep === 'template' && (
        <div className="materio-card p-6 bg-white border border-[#dbdade] space-y-6">
          <div className="flex items-center justify-between border-b border-[#ebebed] pb-4">
            <div>
              <h2 className="text-lg">Certificate Background Template</h2>
              <p className="mt-0.5">
                Upload a single-page PDF or high-resolution image background for this certificate
              </p>
            </div>
            {cert.template && (
              <button
                onClick={() => setActiveStep('dataset')}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <span>Proceed to Recipients Upload</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <UploadWithRetry
            endpoint="templateUploader"
            title="Upload Certificate Template (PDF / Image)"
            description="Supports PDF, PNG, JPG files up to 16MB. High resolution landscape format is recommended."
            onUploadComplete={handleTemplateUploaded}
          />
        </div>
      )}

      {/* ── STEP 3: VISUAL DRAG & RESIZE FIELD EDITOR ── */}
      {activeStep === 'fields' && (
        <div className="materio-card p-6 bg-white border border-[#dbdade] space-y-5">
          <div className="flex items-center justify-between border-b border-[#ebebed] pb-4">
            <div>
              <h2 className="text-lg">Visual Certificate Field Editor</h2>
              <p className=" mt-0.5">
                Drag, resize, and position dynamic fields (Name, Event, Date, ID) directly on the template canvas
              </p>
            </div>
           <button
                onClick={() => setActiveStep('mapping')}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <span>Proceed to Field Mappings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
          </div>

          <FieldEditor
            fields={editFields}
            onChange={setEditFields}
            onSave={saveFields}
            saving={saving}
            templateUrl={cert.template?.fileKey}
            datasetColumns={allColumns}
            sampleRecipients={cert.recipients?.map((r) => r.data) || []}
          />
        </div>
      )}

      {/* ── STEP 4: DATASET UPLOAD ── */}
      {activeStep === 'dataset' && (
        <div className="materio-card p-6 bg-white border border-[#dbdade] space-y-6">
          <div className="flex items-center justify-between border-b border-[#ebebed] pb-4">
            <div>
              <h2 className="text-lg">Recipient Dataset Import</h2>
              <p className="mt-0.5">
                Upload recipient data spreadsheet (CSV or XLSX). Each row represents a certificate recipient.
              </p>
            </div>
            {cert.datasets.length > 0 && (
              <button
                onClick={() => setActiveStep('fields')}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <span>Proceed to Fields Editor</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {cert.datasets.length > 0 && (
            <div className="space-y-3">
              <div className=" tracking-wider">Uploaded Datasets</div>
              {cert.datasets.map((ds) => (
                <div key={ds.id} className="p-4 bg-[#f8f7fa] border border-[#dbdade]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-[#7367f0]" />
                      <span className="">{ds.fileName}</span>
                    </div>
                    <span className="">{ds.rowCount} Rows Present</span>
                  </div>
                  <div className="mt-2">
                    Detected Columns ({ds.columns.length}):{' '}
                    {ds.columns.map((c) => c.columnName).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}

          <UploadWithRetry
            endpoint="datasetUploader"
            directUploadUrl={`/api/certificates/${certificateId}/datasets/upload-direct`}
            title="Upload CSV / XLSX Recipient Data"
            description="Supports Excel (.xlsx, .xls) and CSV (.csv) spreadsheets up to 32MB. Each row represents a recipient."
            acceptedTypes=".csv, .xlsx, .xls"
            onUploadComplete={handleDatasetUploaded}
          />
        </div>
      )}

      {/* ── STEP 5: FIELD MAPPING ── */}
      {activeStep === 'mapping' && (
        <div className="materio-card p-6 bg-white border border-[#dbdade] space-y-6">
          <div className="flex items-center justify-between border-b border-[#ebebed] pb-4">
            <div>
              <h2 className="text-lg">Field Column Mapping</h2>
              <p className="mt-0.5">
                Connect spreadsheet columns to the dynamic text fields configured on the certificate
              </p>
            </div>
            <button
              onClick={() => setActiveStep('form')}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <span>Proceed to Form Fields</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {cert.fields.length === 0 || allColumns.length === 0 ? (
            <div className="p-8 text-center bg-[#f8f7fa] border border-[#dbdade] text-xs text-[#6f6b7d]">
              Please ensure you have configured certificate fields in Step 3 and uploaded a dataset in Step 4.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {cert.fields.map((field) => {
                  const currentMapping = mappingPairs.find((m) => m.fieldId === field.id);
                  return (
                    <div
                      key={field.id}
                      className="p-3.5 bg-white border border-[#dbdade] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 sm:w-1/2">
                        <div className="">{field.label || field.name}</div>
                        <div className="">Field Key: <code>{field.name}</code></div>
                      </div>

                      <div className="sm:w-1/2 flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-[#7367f0] shrink-0" />
                        <select
                          className="form-input text-xs"
                          value={currentMapping?.columnId || ''}
                          onChange={(e) => {
                            const updated = mappingPairs.filter((m) => m.fieldId !== field.id);
                            if (field.id && e.target.value) {
                              updated.push({ fieldId: field.id, columnId: e.target.value });
                            }
                            setMappingPairs(updated);
                          }}
                        >
                          <option value="">-- Choose Dataset Column --</option>
                          {allColumns.map((col) => (
                            <option key={col.id} value={col.id}>
                              {col.columnName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={saveMappings}
                  disabled={saving}
                  className="btn-primary text-xs py-2 px-5"
                >
                  {saving ? 'Saving Mappings...' : 'Save Field Mappings'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 6: PUBLIC FORM CONFIGURATION ── */}
      {activeStep === 'form' && (
        <div className="materio-card p-6 bg-white border border-[#dbdade] space-y-6">
          <div className="flex items-center justify-between border-b border-[#ebebed] pb-4">
            <div>
              <h2 className="text-lg">Public Recipient Lookup Form</h2>
              <p className="mt-0.5">
                Specify which dataset fields students/participants must provide to verify and download their certificate
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormFieldSelections([
                  ...formFieldSelections,
                  { columnId: '', label: '', required: true },
                ])
              }
              className="cursor-pointer py-1.5 px-3 flex items-center gap-1"
            >
              <span>+ Add Lookup Field</span>
            </button>
               <button
                onClick={() => setActiveStep('publish')}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <span>Proceed to Publish</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
          </div>

          {allColumns.length === 0 ? (
            <div className="p-8 text-center bg-[#f8f7fa] border border-[#dbdade] text-xs text-[#6f6b7d]">
              Upload a recipient dataset in Step 4 before configuring public search fields.
            </div>
          ) : (
            <div className="space-y-4">
              {formFieldSelections.map((sel, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white border border-[#dbdade] flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                >
                  <div className="flex-1">
                    <label className="form-label">Dataset Column *</label>
                    <select
                      className="form-input text-xs"
                      value={sel.columnId}
                      onChange={(e) => {
                        const col = allColumns.find((c) => c.id === e.target.value);
                        const updated = [...formFieldSelections];
                        updated[idx] = {
                          ...updated[idx],
                          columnId: e.target.value,
                          label: col?.columnName || '',
                        };
                        setFormFieldSelections(updated);
                      }}
                    >
                      <option value="">-- Select Column --</option>
                      {allColumns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.columnName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="form-label">Public Input Label</label>
                    <input
                      className="form-input text-xs"
                      placeholder="e.g. Registration ID / Email"
                      value={sel.label}
                      onChange={(e) => {
                        const updated = [...formFieldSelections];
                        updated[idx] = { ...updated[idx], label: e.target.value };
                        setFormFieldSelections(updated);
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-4 sm:pt-2">
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sel.required}
                        onChange={(e) => {
                          const updated = [...formFieldSelections];
                          updated[idx] = { ...updated[idx], required: e.target.checked };
                          setFormFieldSelections(updated);
                        }}
                      />
                      <span>Mandatory</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setFormFieldSelections(formFieldSelections.filter((_, i) => i !== idx))}
                      className="text-xs text-[#ea5455] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={saveFormFields}
                  disabled={saving}
                  className="btn-primary text-xs py-2 px-5"
                >
                  {saving ? 'Saving Configuration...' : 'Save Public Form'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 7: PUBLISH & LIFECYCLE ── */}
      {activeStep === 'publish' && (
  <div className="materio-card p-5 bg-white border border-[#dbdade] space-y-3">

    {/* Header */}
    <div className="border-b border-[#ebebed] pb-2">
      <h2 className="text-xl">Publishing & Lifecycle Control</h2>
      <p className="mt-0.5">
        Review configuration readiness and manage the live status of the certificate download portal
      </p>
    </div>

    {/* ── PRE-FLIGHT CHECKLIST ── */}
    <div>
      <div className="mb-1.5 text-lg tracking-wider text-[#2f2b3d]">
        Pre-flight Checklist
      </div>

    <div className="inline-block overflow-hidden border border-[#dbdade] align-top">
  <table className="w-[420px] table-fixed border-collapse  leading-tight text-[#2f2b3d]">
    <thead>
      <tr className="border-b border-[#d6d4dc] bg-white">
        <th className="w-[300px] px-3 py-[7px] text-left font-semibold">
          Checklist Item
        </th>
        <th className="w-[120px] px-3 py-[7px] text-left font-semibold">
          Status
        </th>
      </tr>
    </thead>

    <tbody>
      {steps.slice(1, -1).map((s) => (
        <tr
          key={s.key}
          className="border-b border-[#e3e1e8] bg-[#f8f7fa] last:border-b-0"
        >
          <td className="px-3 py-[7px]">
            {s.label}
          </td>

          <td className="px-3 py-[7px]">
            {s.done ? 'Ready' : 'Incomplete'}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
    </div>

    {/* ── ACTION AREA ── */}
    <div className="border-t border-[#ebebed] pt-2.5">

      {/* ── PUBLISHED ── */}
      {cert.status === 'PUBLISHED' ? (
        <div className="space-y-3">

          {/* Live Status */}
          <div className="border border-[#dbdade] p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#2f2b3d]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Certificate is Live & Searchable!</span>
            </div>

            <p className="mt-1 text-xs text-[#2f2b3d]">
              Participants can visit the public lookup page and generate their certificates directly.
            </p>

            {/* Public Link */}
            <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">

              <div className="flex-1 truncate select-all border border-[#dbdade] bg-white px-3 py-1.5 text-xs font-mono text-[#2f2b3d]">
                {typeof window !== 'undefined'
                  ? `${window.location.origin}/c/${cert.publicSlug}`
                  : `/c/${cert.publicSlug}`}
              </div>

              <a
                href={`/c/${cert.publicSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex items-center justify-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs no-underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Visit Public Page</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="btn-secondary flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[#28c76f]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}

                <span>{copied ? 'Copied!' : 'Copy URL'}</span>
              </button>
            </div>
          </div>

          {/* Published Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStatusChange('PAUSED')}
              disabled={saving}
              className="btn-secondary flex items-center gap-1.5 px-4 py-2 text-xs"
            >
              <PauseCircle className="w-4 h-4 text-[#ff9f43]" />
              <span>Pause Certificate</span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange('ARCHIVED')}
              disabled={saving}
              className="btn-danger flex items-center gap-1.5 px-4 py-2 text-xs"
            >
              <Archive className="w-4 h-4" />
              <span>Archive</span>
            </button>
          </div>
        </div>

      ) : cert.status === 'PAUSED' ? (

        /* ── PAUSED ── */
        <div className="space-y-3">

          {/* Paused Status */}
          <div className="border border-[#ff9f43]/30 bg-[#ff9f43]/10 p-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#d97706]">
              <PauseCircle className="w-4 h-4" />
              <span>Certificate is Paused</span>
            </div>

            <p className="mt-1 text-xs text-[#2f2b3d]">
              Public searches are temporarily disabled. You can resume publishing anytime.
            </p>
          </div>

          {/* Paused Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStatusChange('PUBLISHED')}
              disabled={saving}
              className="btn-success flex items-center gap-1.5 px-4 py-2 text-xs"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Resume Publishing</span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange('ARCHIVED')}
              disabled={saving}
              className="btn-danger flex items-center gap-1.5 px-4 py-2 text-xs"
            >
              <Archive className="w-4 h-4" />
              <span>Archive</span>
            </button>
          </div>
        </div>

      ) : (

        /* ── NOT PUBLISHED ── */
        <button
          type="button"
          onClick={handlePublish}
          disabled={saving}
          className="bg-[#7367f0]  text-white flex items-center gap-2 px-6 py-2.5 text-sm shadow-md"
        >
          {/* <Send className="w-4 h-4" /> */}

          <span>
            {saving ? 'Publishing...' : 'Publish Certificate Now'}
          </span>
        </button>
      )}
    </div>
  </div>
)}

      {/* Edit Event Logo Modal */}
      {showEventLogoModal && (
        <div className="modal-overlay animate-in" onClick={() => setShowEventLogoModal(false)}>
          <div className="modal-content relative bg-white max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowEventLogoModal(false)}
              className="absolute top-4 right-4 p-1 text-[#6f6b7d] hover:text-[#2f2b3d] bg-transparent border-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#ebebed]">
              <ImageIcon className="w-5 h-5 text-[#7367f0]" />
              <h2 className="text-base font-bold text-[#2f2b3d]">Update Event Logo</h2>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-[#6f6b7d]">
                This logo will appear side-by-side with your organization logo on the public certificate verification page for <strong>{cert.event.name}</strong>.
              </p>

              <div>
                <label className="form-label">Event Logo</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {/* <input
                      className="form-input text-xs flex-1"
                      value={eventLogoInput}
                      onChange={(e) => setEventLogoInput(e.target.value)}
                      placeholder="Paste image URL (e.g. https://.../logo.png)"
                    /> */}
                    <label className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') setEventLogoInput(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>

                  {eventLogoInput && (
                    <div className="p-2 bg-[#f8f7fa] border border-[#dbdade] flex items-center justify-between">
                      <img src={eventLogoInput} alt="Event Logo" className="h-8 max-w-30 object-contain" />
                      <button
                        type="button"
                        onClick={() => setEventLogoInput('')}
                        className="text-xs text-[#ea5455] hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-[#ebebed]">
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => setShowEventLogoModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary text-xs flex items-center gap-1.5"
                  onClick={handleSaveEventLogo}
                  disabled={savingEventLogo}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEventLogo ? 'Saving...' : 'Save Event Logo'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
