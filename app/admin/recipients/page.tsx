'use client';

import { useEffect, useState } from 'react';
import { Users, Search, ChevronLeft, ChevronRight, Download, CheckCircle2, Award, ChevronDown, ChevronUp, Building2, Calendar } from 'lucide-react';

interface RecipientEntry {
  id: string;
  displayName: string;
  data: Record<string, string>;
  certificateId: string;
  certificateName: string;
  eventName: string;
  orgName: string;
  downloads: number;
  hasGenerated: boolean;
  createdAt: string;
}

interface CertOption {
  id: string;
  name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<RecipientEntry[]>([]);
  const [certificates, setCertificates] = useState<CertOption[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filterCertId, setFilterCertId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadRecipients = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25' });
    if (filterCertId) params.set('certificateId', filterCertId);
    if (searchQuery) params.set('search', searchQuery);

    fetch(`/api/recipients?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.recipients) {
          setRecipients(d.recipients);
          setCertificates(d.certificates || []);
          setPagination(d.pagination);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRecipients(1);
  }, [filterCertId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecipients(1);
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2f2b3d] tracking-tight">All Platform Recipients</h1>
          <p className="text-xs text-[#6f6b7d] mt-1">Browse all certificate recipient records across all organizations and events</p>
        </div>
        <div className="text-xs font-semibold text-[#6f6b7d] bg-white border border-[#dbdade] px-3 py-1.5 self-start md:self-auto">
          Total: {pagination.total} recipients
        </div>
      </div>

      {/* Filters Bar */}
      <div className="materio-card p-4 bg-white border border-[#dbdade] flex flex-wrap items-center gap-3">
        <select
          className="form-input text-xs"
          style={{ width: 'auto', minWidth: '200px' }}
          value={filterCertId}
          onChange={(e) => setFilterCertId(e.target.value)}
        >
          <option value="">All Certificates</option>
          {certificates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#a5a2ad] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              className="form-input text-xs pl-9"
              placeholder="Search recipients by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary text-xs py-2 px-4">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : recipients.length === 0 ? (
        <div className="materio-card p-12 text-center bg-white border border-[#dbdade]">
          <Users className="w-12 h-12 text-[#a5a2ad] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#2f2b3d] mb-1">No recipients found</h3>
          <p className="text-xs text-[#6f6b7d]">Upload dataset CSV/XLSX files through certificate configuration to populate recipients.</p>
        </div>
      ) : (
        <div className="materio-card bg-white border border-[#dbdade] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Recipient Name</th>
                  <th>Certificate</th>
                  <th>Event / Org</th>
                  <th>Downloads</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <>
                    <tr
                      key={r.id}
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      className="cursor-pointer hover:bg-[#f8f7fa]"
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-[#7367f0]/10 text-[#7367f0] flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#2f2b3d]">{r.displayName}</div>
                            <div className="text-[10px] text-[#6f6b7d]">
                              {Object.keys(r.data).length} data field(s)
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-[#2f2b3d] font-medium">
                          <Award className="w-3.5 h-3.5 text-[#00bad1]" />
                          <span>{r.certificateName}</span>
                        </div>
                      </td>

                      <td>
                        <div className="text-xs text-[#6f6b7d]">
                          <div className="font-medium text-[#2f2b3d]">{r.eventName}</div>
                          <div className="text-[10px]">{r.orgName}</div>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#2f2b3d]">
                          <Download className="w-3.5 h-3.5 text-[#7367f0]" />
                          <span>{r.downloads}</span>
                        </div>
                      </td>

                      <td>
                        {r.hasGenerated ? (
                          <span className="badge badge-published">Downloaded</span>
                        ) : (
                          <span className="badge badge-draft">Ready</span>
                        )}
                      </td>

                      <td>
                        <div className="text-[#a5a2ad] flex items-center">
                          {expandedId === r.id ? (
                            <ChevronUp className="w-4 h-4 text-[#7367f0]" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Key-Value Preview */}
                    {expandedId === r.id && (
                      <tr key={`${r.id}-expanded`}>
                        <td colSpan={6} className="bg-[#f8f7fa] p-4 border-b border-[#dbdade]">
                          <div className="text-[11px] font-bold text-[#6f6b7d] uppercase tracking-wider mb-2">
                            Imported Recipient Fields
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {Object.entries(r.data).map(([key, val]) => (
                              <div key={key} className="p-2.5 bg-white border border-[#dbdade]">
                                <div className="text-[10px] font-bold text-[#7367f0] uppercase truncate">
                                  {key}
                                </div>
                                <div className="text-xs font-medium text-[#2f2b3d] mt-0.5 truncate">
                                  {val || '—'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-[#dbdade] bg-white">
              <div className="text-xs text-[#6f6b7d]">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="btn-secondary text-xs p-1.5"
                  disabled={pagination.page <= 1}
                  onClick={() => loadRecipients(pagination.page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  className="btn-secondary text-xs p-1.5"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadRecipients(pagination.page + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
