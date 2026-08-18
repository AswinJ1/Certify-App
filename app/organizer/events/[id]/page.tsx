'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Award,
  Users,
  Plus,
  ArrowLeft,
  X,
  ArrowRight,
  Clock,
  Edit2,
  Save,
} from 'lucide-react';

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
  logo: string | null;
  status: string;
  publicSlug: string;
  startDate: string | null;
  endDate: string | null;
  organization: { id: string; name: string };
  certificates: Certificate[];
}

export default function OrganizerEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [certName, setCertName] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit event state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadEvent = () => {
    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.event) {
          setEvent(d.event);
          setEditName(d.event.name || '');
          setEditDesc(d.event.description || '');
          setEditLogo(d.event.logo || '');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvent();
  }, [id]);

  const handleCreateCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/organizer/certificates', {
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

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDesc,
          logo: editLogo || null,
        }),
      });
      if (res.ok) {
        setShowEdit(false);
        loadEvent();
      }
    } finally {
      setSavingEdit(false);
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
        <h2 className="text-lg text-black">Event Not Found</h2>
        <button className="btn-secondary text-xs mt-4" onClick={() => router.push('/organizer/events')}>
          Back to Events
        </button>
      </div>
    );
  }

  const totalRecipients = event.certificates?.reduce((sum, c) => sum + (c._count?.recipients || 0), 0) || 0;

  return (
    <div className="space-y-6 animate-in text-black">
      {/* Back button */}
      <div>
        <button
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          onClick={() => router.push('/organizer/events')}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Events</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="materio-card p-6 bg-white border border-[#dbdade] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ebebed] pb-4">
          <div className="flex items-start gap-4">
            {event.logo ? (
              <img src={event.logo} alt={event.name} className="h-10 max-w-[120px] object-contain flex-shrink-0" />
            ) : (
              <Calendar className="w-6 h-6 text-[#a5a2ad] flex-shrink-0 mt-1" />
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-black">{event.status}</span>
                <span className="text-xs text-[#6f6b7d]">·</span>
                <span className="text-xs text-[#6f6b7d]">{event.organization.name}</span>
              </div>
              <h1 className="text-xl text-black">{event.name}</h1>
              {event.description && (
                <p className="text-xs text-black mt-1 max-w-2xl">{event.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
              onClick={() => setShowEdit(true)}
            >
              <Edit2 className="w-3.5 h-3.5 text-[#7367f0]" />
              <span>Edit Event / Logo</span>
            </button>
            <button
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Create Certificate</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 bg-[#f8f7fa] border border-[#dbdade]">
            <div className="text-xl text-black">{event.certificates.length}</div>
            <div className="text-xs text-[#6f6b7d] mt-0.5">
              Certificates Configured
            </div>
          </div>

          <div className="p-3.5 bg-[#f8f7fa] border border-[#dbdade]">
            <div className="text-xl text-black">{totalRecipients}</div>
            <div className="text-xs text-[#6f6b7d] mt-0.5">
              Total Recipients
            </div>
          </div>

          {event.startDate && (
            <div className="p-3.5 bg-[#f8f7fa] border border-[#dbdade]">
              <div className="text-sm text-black mt-1">
                {new Date(event.startDate).toLocaleDateString()}
              </div>
              <div className="text-xs text-[#6f6b7d] mt-0.5">
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
            <Award className="w-4 h-4 text-[#a5a2ad]" />
            <h2 className="text-sm text-black">
              Certificates ({event.certificates.length})
            </h2>
          </div>
        </div>

        {event.certificates.length === 0 ? (
          <div className="materio-card p-10 text-center bg-white border border-[#dbdade]">
            <Award className="w-8 h-8 text-[#a5a2ad] mx-auto mb-2" />
            <h3 className="text-sm text-black">No certificates configured yet</h3>
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
                href={`/organizer/certificates/${cert.id}`}
                className="no-underline text-inherit group"
              >
                <div className="materio-card bg-white border border-[#dbdade] hover:border-[#7367f0] transition-all p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-black">{cert.status}</span>
                      <Award className="w-4 h-4 text-[#a5a2ad]" />
                    </div>
                    <h3 className="text-sm text-black">
                      {cert.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#ebebed] flex items-center justify-between text-xs text-black">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#a5a2ad]" />
                      <span>{cert._count.recipients} recipients</span>
                    </span>
                    <span className="text-[#7367f0] flex items-center gap-1">
                      <span>Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
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
              <Award className="w-5 h-5 text-[#7367f0]" />
              <h2 className="text-base text-black">Create Certificate</h2>
            </div>
            <form onSubmit={handleCreateCert} className="space-y-4">
              <div>
                <label className="form-label">Certificate Title *</label>
                <input
                  className="form-input text-xs"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  placeholder="e.g. Certificate of Participation / Winner"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-3 border-t border-[#ebebed]">
                <button type="button" className="btn-secondary text-xs" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs" disabled={creating}>
                  {creating ? 'Creating...' : 'Create & Open Studio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event & Logo Modal */}
      {showEdit && (
        <div className="modal-overlay animate-in" onClick={() => setShowEdit(false)}>
          <div className="modal-content relative bg-white max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowEdit(false)}
              className="absolute top-4 right-4 p-1 text-[#6f6b7d] hover:text-[#2f2b3d] bg-transparent border-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#ebebed]">
              <Edit2 className="w-5 h-5 text-[#7367f0]" />
              <h2 className="text-base text-black">Edit Event & Logo</h2>
            </div>
            <form onSubmit={handleSaveEvent} className="space-y-3.5">
              <div>
                <label className="form-label">Event Title *</label>
                <input
                  className="form-input text-xs"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Event Logo</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      className="form-input text-xs flex-1"
                      value={editLogo}
                      onChange={(e) => setEditLogo(e.target.value)}
                      placeholder="Paste image URL (e.g. https://.../logo.png)"
                    />
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
                            if (typeof reader.result === 'string') setEditLogo(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>

                  {editLogo && (
                    <div className="p-2 bg-[#f8f7fa] border border-[#dbdade] flex items-center justify-between">
                      <img src={editLogo} alt="Event Logo" className="h-8 max-w-[120px] object-contain" />
                      <button
                        type="button"
                        onClick={() => setEditLogo('')}
                        className="text-xs text-[#ea5455] hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input text-xs"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-[#ebebed]">
                <button type="button" className="btn-secondary text-xs" onClick={() => setShowEdit(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs flex items-center gap-1.5" disabled={savingEdit}>
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
