'use client';

import { useEffect, useState, Fragment } from 'react';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  Award,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
  FileSpreadsheet,
  Building2,
  Mail,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

interface RecipientEntry {
  id: string;
  displayName: string;
  email: string;
  data: Record<string, string>;
  certificateId: string;
  certificateName: string;
  publicSlug: string;
  eventName: string;
  orgName: string;
  downloads: number;
  hasGenerated: boolean;
  createdAt: string;
}

interface CertificateOption {
  id: string;
  name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function OrganizerRecipientsPage() {
  const [recipients, setRecipients] = useState<RecipientEntry[]>([]);
  const [certificates, setCertificates] = useState<CertificateOption[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCert, setSelectedCert] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadRecipients = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '25' });
    if (selectedCert) params.append('certificateId', selectedCert);
    if (searchQuery.trim()) params.append('search', searchQuery.trim());

    fetch(`/api/recipients?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setRecipients(data.recipients || []);
        if (data.certificates) setCertificates(data.certificates);
        if (data.pagination) setPagination(data.pagination);
      })
      .catch((err) => console.error('Failed to load recipients:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRecipients(1);
  }, [selectedCert]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecipients(1);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedCert('');
    setLoading(true);
    fetch('/api/recipients?page=1&limit=25')
      .then((r) => r.json())
      .then((data) => {
        setRecipients(data.recipients || []);
        if (data.pagination) setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  };

  const claimedCount = recipients.filter((r) => r.hasGenerated).length;
  const totalDownloads = recipients.reduce((sum, r) => sum + r.downloads, 0);

  return (
    <div className="space-y-6 animate-in text-black">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl text-black">Recipients Directory</h1>
          <p className="text-xs text-black mt-0.5">
            Browse and inspect all participant records imported from your Excel and CSV datasets
          </p>
        </div>
        <Link href="/organizer/certificates" className="no-underline">
          <button className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm">
            <Award className="w-3.5 h-3.5" />
            <span>Configure Certificates</span>
          </button>
        </Link>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="materio-card p-4 bg-white border border-[#dbdade] flex items-center gap-3">
          <div className="p-2.5 bg-[#7367f0]/10 text-[#7367f0] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-black">Total Recipients</div>
            <div className="text-xl text-black mt-0.5">{pagination.total}</div>
          </div>
        </div>

        <div className="materio-card p-4 bg-white border border-[#dbdade] flex items-center gap-3">
          <div className="p-2.5 bg-[#28c76f]/10 text-[#28c76f] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-black">Certificates Claimed</div>
            <div className="text-xl text-black mt-0.5">{claimedCount}</div>
          </div>
        </div>

        <div className="materio-card p-4 bg-white border border-[#dbdade] flex items-center gap-3">
          <div className="p-2.5 bg-[#00bad1]/10 text-[#00bad1] flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-black">Total PDF Downloads</div>
            <div className="text-xl text-black mt-0.5">{totalDownloads}</div>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="materio-card p-4 bg-white border border-[#dbdade] flex flex-col sm:flex-row items-center gap-3">
        {/* Certificate Dropdown Filter */}
        <div className="relative w-full sm:w-64">
          <Filter className="w-3.5 h-3.5 text-[#a5a2ad] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            className="form-input text-xs pl-8 pr-3 py-2 w-full text-black bg-white border border-[#dbdade]"
            value={selectedCert}
            onChange={(e) => setSelectedCert(e.target.value)}
          >
            <option value="">All Certificates</option>
            {certificates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full">
          <input
            className="form-input text-xs px-3 py-2 flex-1 text-black bg-white border border-[#dbdade] placeholder:text-[#888888]"
            placeholder="Search by participant name, email, roll number, or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
          {(searchQuery || selectedCert) && (
            <button
              type="button"
              className="btn-secondary text-xs py-2 px-3"
              onClick={handleClear}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* ── Main Data Table ── */}
      <div className="materio-card bg-white border border-[#dbdade] overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="spinner" style={{ width: '32px', height: '32px' }} />
          </div>
        ) : recipients.length === 0 ? (
          <div className="p-12 text-center text-xs text-black">
            <FileSpreadsheet className="w-10 h-10 text-[#a5a2ad] mx-auto mb-2" />
            <div className="text-sm text-black">No recipient records found</div>
            <p className="text-xs text-black mt-1">
              {searchQuery
                ? `No participants matched "${searchQuery}". Try a different name or email.`
                : 'Upload an Excel or CSV file in Certificate Studio to populate recipient data.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8f7fa] border-b border-[#dbdade]">
                  <th className="py-3 px-4 text-black">PARTICIPANT DETAILS</th>
                  <th className="py-3 px-4 text-black">CERTIFICATE & EVENT</th>
                  <th className="py-3 px-4 text-black">DOWNLOADS</th>
                  <th className="py-3 px-4 text-black">STATUS</th>
                  <th className="py-3 px-4 text-black">DATA FIELDS</th>
                  <th className="py-3 px-4 text-black">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebed]">
                {recipients.map((r) => {
                  const initials = r.displayName
                    ? r.displayName
                        .split(' ')
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'P';

                  return (
                    <Fragment key={r.id}>
                      <tr
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        className="cursor-pointer hover:bg-[#f8f7fa] transition-colors"
                      >
                        {/* Name & Contact */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#7367f0]/10 text-[#7367f0] text-xs flex items-center justify-center flex-shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="text-xs text-black">{r.displayName}</div>
                              {r.email ? (
                                <div className="text-[11px] text-black flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-[#a5a2ad]" />
                                  <span>{r.email}</span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-[#a5a2ad]">ID: {r.id.slice(0, 8)}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Certificate & Event */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs text-black">
                              <Award className="w-3.5 h-3.5 text-[#7367f0]" />
                              <span>{r.certificateName}</span>
                            </div>
                            <div className="text-[11px] text-[#6f6b7d] flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-[#a5a2ad]" />
                              <span>{r.eventName}</span>
                            </div>
                          </div>
                        </td>

                        {/* Downloads */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-black">
                            <Download className="w-3.5 h-3.5 text-[#a5a2ad]" />
                            <span>{r.downloads}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {r.hasGenerated ? (
                            <span className="badge badge-published">CLAIMED</span>
                          ) : (
                            <span className="badge badge-ready">AVAILABLE</span>
                          )}
                        </td>

                        {/* Data Column Pill */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            className="text-xs text-[#7367f0] hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(expandedId === r.id ? null : r.id);
                            }}
                          >
                            <span>{Object.keys(r.data).length} columns</span>
                            {expandedId === r.id ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={`/c/${r.publicSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-[#6f6b7d] hover:text-[#7367f0] transition-colors"
                              title="Open Public Certificate Lookup"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Recipient Data Sheet */}
                      {expandedId === r.id && (
                        <tr>
                          <td colSpan={6} className="bg-[#f8f7fa] p-4 border-b border-[#dbdade]">
                            <div className="text-[11px] text-black mb-2 flex items-center justify-between">
                              <span>Imported Spreadsheet Values for this Recipient:</span>
                              <span className="text-[10px] text-[#a5a2ad]">Record ID: {r.id}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {Object.entries(r.data).map(([key, val]) => (
                                <div key={key} className="p-2.5 bg-white border border-[#dbdade]">
                                  <div className="text-[10px] text-[#7367f0] truncate">
                                    {key}
                                  </div>
                                  <div className="text-xs text-black mt-0.5 truncate">
                                    {val || '—'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-[#dbdade] bg-white">
            <div className="text-xs text-black">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total recipients)
            </div>
            <div className="flex items-center gap-1">
              <button
                className="btn-secondary text-xs p-1.5"
                disabled={pagination.page <= 1}
                onClick={() => loadRecipients(pagination.page - 1)}
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-black px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                className="btn-secondary text-xs p-1.5"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadRecipients(pagination.page + 1)}
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
