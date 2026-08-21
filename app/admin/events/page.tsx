'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Calendar, Plus, Award, Building2, X, ArrowRight } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  description: string | null;
  status: string;
  logo: string | null;
  publicSlug: string;
  startDate: string | null;
  endDate: string | null;
  organization: { id: string; name: string; logo?: string | null };
  _count: { certificates: number };
}

interface Organization {
  id: string;
  name: string;
  logo?: string | null;
}

function EventsContent() {
  const searchParams = useSearchParams();
  const preselectedOrgId = searchParams.get('orgId');
  const [events, setEvents] = useState<Event[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(!!preselectedOrgId);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLogo, setFormLogo] = useState('');
  const [formOrgId, setFormOrgId] = useState(preselectedOrgId || '');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [creating, setCreating] = useState(false);

  const loadEvents = () => {
    Promise.all([
      fetch('/api/events').then((r) => r.json()),
      fetch('/api/organizations').then((r) => r.json()),
    ])
      .then(([evtData, orgData]) => {
        setEvents(evtData.events || []);
        setOrgs(orgData.organizations || []);
        if (preselectedOrgId && !formOrgId) setFormOrgId(preselectedOrgId);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDesc,
          organizationId: formOrgId,
          logo: formLogo || null,
          startDate: formStart || null,
          endDate: formEnd || null,
        }),
      });
      if (res.ok) {
        toast.success('Event created successfully');
        setFormName('');
        setFormDesc('');
        setFormLogo('');
        setFormStart('');
        setFormEnd('');
        setShowCreate(false);
        loadEvents();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to create event');
      }
    } catch {
      toast.error('Network error while creating event');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in text-black">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-black">Platform Events</h1>
          <p className="text-black mt-0.5">
            Conferences, workshops, hackathons, and programs across all institutions
          </p>
        </div>
        <button
          className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm cursor-pointer"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="spinner" style={{ width: '36px', height: '36px' }} />
        </div>
      ) : events.length === 0 ? (
        <div className="materio-card p-12 text-center bg-white border border-[#dbdade] max-w-lg mx-auto mt-8">
          <Calendar className="w-8 h-8 text-[#a5a2ad] mx-auto mb-2" />
          <h3 className="text-sm text-black mb-1">No events found</h3>
          <p className="text-xs text-black mb-5">Create an event to start designing and issuing custom certificates.</p>
          <button className="btn-primary text-xs py-2 px-4 cursor-pointer" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            <span>Create First Event</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <Link key={event.id} href={`/admin/events/${event.id}`} className="no-underline text-inherit group">
              <div className="materio-card bg-white border border-[#dbdade] hover:border-[#7367f0] transition-all flex flex-col justify-between h-full">
                {/* Header Banner with Logo or Icon */}
                <div className="p-4 border-b border-[#ebebed] bg-[#f8f7fa]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {event.logo ? (
                        <img src={event.logo} alt={event.name} className="h-7 max-w-[80px] object-contain flex-shrink-0" />
                      ) : (
                        <Calendar className="w-4 h-4 text-[#a5a2ad] flex-shrink-0" />
                      )}
                    </div>

                    <div className="text-[11px] text-[#6f6b7d] flex items-center gap-1.5 truncate max-w-[150px]">
                      {event.organization.logo ? (
                        <img src={event.organization.logo} alt={event.organization.name} className="h-4 max-w-[50px] object-contain" />
                      ) : (
                        <Building2 className="w-3.5 h-3.5 text-[#7367f0]" />
                      )}
                      <span className="truncate">{event.organization.name}</span>
                    </div>
                  </div>

                  <h3 className="text-black mt-2 truncate font-semibold">
                    {event.name}
                  </h3>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <p className="text-black text-xs line-clamp-2">
                    {event.description || 'No description provided.'}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-[#ebebed]">
                    <div className="flex items-center justify-between text-black text-xs">
                      <span className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#a5a2ad]" />
                        <span>Certificates</span>
                      </span>
                      <span className="font-semibold text-black">{event._count.certificates}</span>
                    </div>

                    {(event.startDate || event.endDate) && (
                      <div className="flex items-center gap-1.5 text-xs text-[#6f6b7d]">
                        <span>
                          {event.startDate ? new Date(event.startDate).toLocaleDateString() : ''}
                          {event.endDate ? ` to ${new Date(event.endDate).toLocaleDateString()}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 py-2.5 bg-[#f8f7fa] border-t border-[#ebebed] flex items-center justify-between text-xs group-hover:bg-[#7367f0]/5 transition-colors">
                  <span>Manage Event</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#7367f0]" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay animate-in" onClick={() => setShowCreate(false)}>
          <div className="modal-content relative bg-white max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowCreate(false)}
              className="absolute top-4 right-4 p-1 text-[#6f6b7d] hover:text-[#2f2b3d] bg-transparent border-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#ebebed]">
              <Calendar className="w-5 h-5 text-[#7367f0]" />
              <h2 className="text-base font-bold text-[#2f2b3d]">Create New Event</h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="form-label">Host Organization *</label>
                <select
                  className="form-input text-xs"
                  value={formOrgId}
                  onChange={(e) => setFormOrgId(e.target.value)}
                  required
                >
                  <option value="">Select organization</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Event Title *</label>
                <input
                  className="form-input text-xs"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Vidyut 2026 / ICPC West Regional"
                  required
                />
              </div>

              <div>
                <label className="form-label">Event Logo</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                      <span className="text-[#7367f0] font-semibold">Upload Logo</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>

                  {formLogo && (
                    <div className="flex items-center gap-2 p-2 bg-[#f8f7fa] border border-[#dbdade]">
                      <img src={formLogo} alt="Logo preview" className="h-8 max-w-[100px] object-contain" />
                      <button
                        type="button"
                        onClick={() => setFormLogo('')}
                        className="text-xs text-[#ea5455] hover:underline ml-auto cursor-pointer"
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
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Event background or details..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    className="form-input text-xs"
                    type="date"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">End Date</label>
                  <input
                    className="form-input text-xs"
                    type="date"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-[#ebebed]">
                <button type="button" className="btn-secondary text-xs" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-24">
          <div className="spinner" style={{ width: '36px', height: '36px' }} />
        </div>
      }
    >
      <EventsContent />
    </Suspense>
  );
}
