'use client';

import { useEffect, useState, Fragment } from 'react';
import { Users, Search, ChevronLeft, ChevronRight, Download, CheckCircle2, Award, ChevronDown, ChevronUp, Building2, Calendar } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

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
            <Table className="w-full text-left text-xs">
              <TableHeader>
                <TableRow className="bg-[#f8f7fa] border-b border-[#dbdade]">
                  <TableHead className="py-3 px-4 text-black font-semibold uppercase text-xs">Recipient Name</TableHead>
                  <TableHead className="py-3 px-4 text-black font-semibold uppercase text-xs">Certificate</TableHead>
                  <TableHead className="py-3 px-4 text-black font-semibold uppercase text-xs">Event / Org</TableHead>
                  <TableHead className="py-3 px-4 text-black font-semibold uppercase text-xs">Downloads</TableHead>
                  <TableHead className="py-3 px-4 text-black font-semibold uppercase text-xs">Status</TableHead>
                  <TableHead className="py-3 px-4 text-black font-semibold uppercase text-xs">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((r) => (
                  <Fragment key={r.id}>
                    <TableRow
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      className="cursor-pointer hover:bg-[#f8f7fa] border-b border-[#ebebed]"
                    >
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-[#7367f0]/10 text-[#7367f0] flex items-center justify-center flex-shrink-0 font-bold text-xs">
                            {r.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-black">{r.displayName}</div>
                            <div className="text-[10px] text-[#6f6b7d]">
                              {Object.keys(r.data).length} data field(s)
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <div className="text-xs text-black font-medium">
                          <span>{r.certificateName}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <div className="text-xs text-[#6f6b7d]">
                          <div className="font-medium text-black">{r.eventName}</div>
                          <div className="text-[10px] text-[#6f6b7d]">{r.orgName}</div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <div className="text-xs font-semibold text-black font-mono">
                          <span>{r.downloads}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <span className="text-[11px] font-semibold border border-[#dbdade] px-2 py-0.5 bg-[#f8f7fa]">
                          {r.hasGenerated ? 'DOWNLOADED' : 'READY'}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <div className="text-[#a5a2ad] flex items-center">
                          {expandedId === r.id ? (
                            <ChevronUp className="w-4 h-4 text-[#7367f0]" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Key-Value Preview */}
                    {expandedId === r.id && (
                      <TableRow key={`${r.id}-expanded`} className="bg-[#f8f7fa] border-b border-[#dbdade]">
                        <TableCell colSpan={6} className="p-4">
                          <div className="text-[11px] font-semibold text-black uppercase tracking-wider mb-2">
                            Imported Recipient Fields
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {Object.entries(r.data).map(([key, val]) => (
                              <div key={key} className="p-2.5 bg-white border border-[#dbdade]">
                                <div className="text-[10px] font-semibold text-[#7367f0] uppercase truncate">
                                  {key}
                                </div>
                                <div className="text-xs font-medium text-black mt-0.5 truncate">
                                  {val || '—'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
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
