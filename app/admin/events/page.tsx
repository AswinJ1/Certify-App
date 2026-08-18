'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Plus, Award, Building2, X, ArrowRight, Clock } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  description: string | null;
  status: string;
  publicSlug: string;
  startDate: string | null;
  organization: { id: string; name: string };
  _count: { certificates: number };
}

interface Organization {
  id: string;
  name: string;
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
          startDate: formStart || null,
          endDate: formEnd || null,
        }),
      });
      if (res.ok) {
        setFormName('');
        setFormDesc('');
        setFormStart('');
        setFormEnd('');
        setShowCreate(false);
        loadEvents();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2f2b3d] tracking-tight">Platform Events</h1>
          <p className="text-xs text-[#6f6b7d] mt-1">Conferences, hackathons, and programs across all organizations</p>
        </div>
        <button
          className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
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
          <div className="w-12 h-12 bg-[#00bad1]/10 text-[#00bad1] flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#2f2b3d] mb-1">No events found</h3>
          <p className="text-xs text-[#6f6b7d] mb-5">Create an event to start designing and issuing custom certificates.</p>
          <button className="btn-primary text-xs py-2 px-4" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            <span>Create First Event</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <Link key={event.id} href={`/admin/events/${event.id}`} className="no-underline text-inherit group">
              <div className="materio-card bg-white border border-[#dbdade] hover:border-[#7367f0] transition-all flex flex-col justify-between h-full">
                {/* Header Banner */}
                <div className="p-4 border-b border-[#ebebed] bg-[#f8f7fa]">
                  <div className="flex items-center justify-between">
                    <span className={`badge badge-${event.status.toLowerCase()}`}>{event.status}</span>
                    <div className="text-[11px] text-[#6f6b7d] font-semibold flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#7367f0]" />
                      <span className="truncate max-w-[140px]">{event.organization.name}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-[#2f2b3d] group-hover:text-[#7367f0] transition-colors mt-2 truncate">
                    {event.name}
                  </h3>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-[#6f6b7d] line-clamp-2 leading-relaxed">
                    {event.description || 'No description provided.'}
                  </p>

                  <div className="pt-3 mt-3 border-t border-[#ebebed] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[#6f6b7d]">
                        <Award className="w-3.5 h-3.5 text-[#00bad1]" />
                        <strong className="text-[#2f2b3d]">{event._count.certificates}</strong> Certs
                      </span>
                      {event.startDate && (
                        <span className="flex items-center gap-1 text-[#6f6b7d]">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(event.startDate).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#a5a2ad] group-hover:text-[#7367f0] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
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
              <Calendar className="w-5 h-5 text-[#00bad1]" />
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
                  placeholder="e.g. Vidyut 2026 / ICPC Regional"
                  required
                />
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
