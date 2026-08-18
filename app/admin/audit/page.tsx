'use client';

import { useEffect, useState } from 'react';
import {
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Building2,
  Calendar,
  Award,
  User as UserIcon,
  Users,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
  organization: { id: string; name: string } | null;
  event: { id: string; name: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const loadLogs = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25' });
    if (filterEntity) params.set('entityType', filterEntity);
    if (filterAction) params.set('action', filterAction);

    fetch(`/api/audit?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.logs) {
          setLogs(d.logs);
          setPagination(d.pagination);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs(1);
  }, [filterEntity, filterAction]);

  const getActionBadge = (action: string) => {
    const classMap: Record<string, string> = {
      CREATE: 'badge-published',
      UPDATE: 'badge-ready',
      DELETE: 'badge-archived',
      PUBLISH: 'badge-published',
      PAUSE: 'badge-paused',
      ARCHIVE: 'badge-draft',
    };
    return <span className={`badge ${classMap[action] || 'badge-ready'}`}>{action}</span>;
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'ORGANIZATION':
        return <Building2 className="w-4 h-4 text-[#7367f0]" />;
      case 'EVENT':
        return <Calendar className="w-4 h-4 text-[#00bad1]" />;
      case 'CERTIFICATE':
        return <Award className="w-4 h-4 text-[#28c76f]" />;
      case 'USER':
        return <UserIcon className="w-4 h-4 text-[#ff9f43]" />;
      case 'RECIPIENT':
        return <Users className="w-4 h-4 text-[#7367f0]" />;
      case 'TEMPLATE':
        return <ImageIcon className="w-4 h-4 text-[#00bad1]" />;
      default:
        return <FileText className="w-4 h-4 text-[#6f6b7d]" />;
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2f2b3d] tracking-tight flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-[#7367f0]" />
            <span>Platform Audit Logs</span>
          </h1>
          <p className="text-xs text-[#6f6b7d] mt-1">
            Immutable tracking and history of administrative operations across organizations
          </p>
        </div>
        <div className="text-xs font-semibold text-[#6f6b7d] bg-white border border-[#dbdade] px-3 py-1.5 self-start md:self-auto">
          {pagination.total} total log entries
        </div>
      </div>

      {/* Filters */}
      <div className="materio-card p-4 bg-white border border-[#dbdade] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#6f6b7d] uppercase mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          className="form-input text-xs"
          style={{ width: 'auto', minWidth: '170px' }}
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
        >
          <option value="">All Entity Types</option>
          <option value="ORGANIZATION">Organization</option>
          <option value="EVENT">Event</option>
          <option value="CERTIFICATE">Certificate</option>
          <option value="USER">User</option>
          <option value="RECIPIENT">Recipient</option>
        </select>

        <select
          className="form-input text-xs"
          style={{ width: 'auto', minWidth: '150px' }}
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="PUBLISH">Publish</option>
          <option value="PAUSE">Pause</option>
          <option value="ARCHIVE">Archive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
        </div>
      ) : logs.length === 0 ? (
        <div className="materio-card p-12 text-center bg-white border border-[#dbdade]">
          <ScrollText className="w-12 h-12 text-[#a5a2ad] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#2f2b3d] mb-1">No audit logs found</h3>
          <p className="text-xs text-[#6f6b7d]">Platform administrative actions will be recorded here.</p>
        </div>
      ) : (
        <div className="materio-card bg-white border border-[#dbdade] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor / User</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Context Context</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="text-xs text-[#2f2b3d] font-bold">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-[#6f6b7d] font-mono">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td>
                      {log.user ? (
                        <div>
                          <div className="text-xs font-bold text-[#2f2b3d]">{log.user.name}</div>
                          <div className="text-[10px] text-[#6f6b7d]">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-[#6f6b7d]">System</span>
                      )}
                    </td>

                    <td>{getActionBadge(log.action)}</td>

                    <td>
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-[#f8f7fa] border border-[#dbdade]">{getEntityIcon(log.entityType)}</div>
                        <div>
                          <div className="text-xs font-bold text-[#2f2b3d]">{log.entityType}</div>
                          {log.entityId && (
                            <div className="text-[10px] text-[#6f6b7d] font-mono">{log.entityId.slice(0, 8)}…</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="text-xs text-[#6f6b7d]">
                        {log.organization && <span>Org: <strong className="text-[#2f2b3d]">{log.organization.name}</strong></span>}
                        {log.event && <span> · Event: <strong className="text-[#2f2b3d]">{log.event.name}</strong></span>}
                      </div>
                    </td>
                  </tr>
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
                  onClick={() => loadLogs(pagination.page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  className="btn-secondary text-xs p-1.5"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadLogs(pagination.page + 1)}
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
