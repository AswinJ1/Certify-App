'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Award, Users, Plus, ArrowLeft, X, ArrowRight, Building2 } from 'lucide-react';

interface Certificate {
  id: string;
  name: string;
  status: string;
  publicSlug: string;
  _count: { recipients: number };
}

interface EventDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  publicSlug: string;
  startDate: string | null;
  endDate: string | null;
  organization: { id: string; name: string };
  certificates: Certificate[];
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [certName, setCertName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadEvent = () => {
    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then((d) => setEvent(d.event))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvent();
  }, [id]);

  const handleCreateCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: certName, eventId: id }),
      });
      if (res.ok) {
        setCertName('');
        setShowCreate(false);
        loadEvent();
      }
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <div className="spinner" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="materio-card p-12 text-center bg-white border border-[#dbdade]">
        <h2 className="text-lg font-bold text-[#2f2b3d]">Event Not Found</h2>
        <button className="btn-secondary text-xs mt-4" onClick={() => router.push('/admin/events')}>
          Back to Events
        </button>
      </div>
    );
  }

  const totalRecipients = event.certificates?.reduce((sum, c) => sum + (c._count?.recipients || 0), 0) || 0;

  return (
    <div className="space-y-6 animate-in">
      {/* Back button */}
      <div>
        <button
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          onClick={() => router.push('/admin/events')}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Events</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="materio-card p-6 bg-white border border-[#dbdade] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ebebed] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`badge badge-${event.status.toLowerCase()}`}>{event.status}</span>
              <span className="text-xs text-[#6f6b7d] flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#7367f0]" />
                {event.organization.name}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#2f2b3d] tracking-tight">{event.name}</h1>
            {event.description && (
              <p className="text-xs text-[#6f6b7d] mt-1 max-w-2xl">{event.description}</p>
            )}
          </div>

          <button
            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 self-start md:self-auto shadow-sm"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Create Certificate</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 bg-[#f8f7fa] border border-[#dbdade]">
            <div className="text-xl font-extrabold text-[#7367f0]">{event.certificates.length}</div>
            <div className="text-xs font-semibold text-[#6f6b7d] uppercase tracking-wider mt-0.5">
              Certificates Configured
            </div>
          </div>

          <div className="p-3.5 bg-[#f8f7fa] border border-[#dbdade]">
            <div className="text-xl font-extrabold text-[#00bad1]">{totalRecipients}</div>
            <div className="text-xs font-semibold text-[#6f6b7d] uppercase tracking-wider mt-0.5">
              Total Recipients
            </div>
          </div>

          {event.startDate && (
            <div className="p-3.5 bg-[#f8f7fa] border border-[#dbdade]">
              <div className="text-sm font-bold text-[#2f2b3d] mt-1">
                {new Date(event.startDate).toLocaleDateString()}
              </div>
              <div className="text-xs font-semibold text-[#6f6b7d] uppercase tracking-wider mt-0.5">
                Event Date
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Certificates Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#00bad1]" />
            <h2 className="text-base font-bold text-[#2f2b3d]">
              Certificates ({event.certificates.length})
            </h2>
          </div>
        </div>

        {event.certificates.length === 0 ? (
          <div className="materio-card p-10 text-center bg-white border border-[#dbdade]">
            <Award className="w-10 h-10 text-[#a5a2ad] mx-auto mb-2" />
            <h3 className="text-sm font-bold text-[#2f2b3d]">No certificates configured yet</h3>
            <p className="text-xs text-[#6f6b7d] mt-1 mb-4">
              Add a certificate template to start issuing dynamic credentials for this event.
            </p>
            <button className="btn-primary text-xs py-2 px-4" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" />
              <span>Create Certificate</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.certificates.map((cert) => (
              <Link
                key={cert.id}
                href={`/admin/certificates/${cert.id}`}
                className="no-underline text-inherit group"
              >
                <div className="materio-card p-4 bg-white border border-[#dbdade] hover:border-[#7367f0] transition-all flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 bg-[#00bad1]/10 text-[#00bad1] flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-[#2f2b3d] group-hover:text-[#7367f0] transition-colors truncate">
                          {cert.name}
                        </h3>
                        <div className="text-[10px] text-[#6f6b7d]">
                          {cert._count.recipients} recipient(s)
                        </div>
                      </div>
                    </div>
                    <span className={`badge badge-${cert.status.toLowerCase()}`}>{cert.status}</span>
                  </div>

                  <div className="pt-2.5 border-t border-[#ebebed] flex items-center justify-between text-xs text-[#6f6b7d]">
                    <span className="text-[11px] group-hover:text-[#7367f0] font-medium">Configure template</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#a5a2ad] group-hover:text-[#7367f0] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Certificate Modal */}
      {showCreate && (
        <div className="modal-overlay animate-in" onClick={() => setShowCreate(false)}>
          <div className="modal-content relative bg-white" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowCreate(false)}
              className="absolute top-4 right-4 p-1 text-[#6f6b7d] hover:text-[#2f2b3d] bg-transparent border-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#ebebed]">
              <Award className="w-5 h-5 text-[#00bad1]" />
              <h2 className="text-base font-bold text-[#2f2b3d]">Create Certificate Template</h2>
            </div>
            <form onSubmit={handleCreateCert} className="space-y-4">
              <div>
                <label className="form-label">Certificate Title *</label>
                <input
                  className="form-input text-xs"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  placeholder="e.g. Certificate of Excellence / Participant"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-3 border-t border-[#ebebed]">
                <button type="button" className="btn-secondary text-xs" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
