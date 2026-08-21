'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Plus, Award, X, ArrowRight, Clock, Image as ImageIcon } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  status: string;
  publicSlug: string;
  startDate: string | null;
  endDate: string | null;
  organization: { id: string; name: string };
  _count: { certificates: number };
}

export default function OrganizerEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLogo, setFormLogo] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [creating, setCreating] = useState(false);

  const loadEvents = () => {
    fetch('/api/organizer/events')
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/organizer/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDesc,
          logo: formLogo || null,
          startDate: formStart || null,
          endDate: formEnd || null,
        }),
      });
      if (res.ok) {
        setFormName('');
        setFormDesc('');
        setFormLogo('');
        setFormStart('');
        setFormEnd('');
        setShowCreate(false);
        loadEvents();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-in text-black">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-black">Organization Events</h1>
          <p className=" text-black mt-0.5">
            Conferences, workshops, hackathons, and programs hosted by your organization
          </p>
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
          <Calendar className="w-8 h-8 text-[#a5a2ad] mx-auto mb-2" />
          <h3 className="text-sm text-black mb-1">No events created yet</h3>
          <p className="text-xs text-black mb-5">
            Create an event to start designing and issuing custom certificates.
          </p>
          <button className="btn-primary text-xs py-2 px-4" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            <span>Create First Event</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <Link key={event.id} href={`/organizer/events/${event.id}`} className="no-underline text-inherit group">
              <div className="materio-card bg-white border border-[#dbdade] hover:border-[#7367f0] transition-all flex flex-col justify-between h-full">
                {/* Header Banner with Logo or Icon */}
                <div className="p-4 border-b border-[#ebebed] bg-[#f8f7fa]">
                  <div className="flex items-center justify-between">
                    {/* <span className="text-xs text-black">{event.status}</span> */}
                    {event.logo ? (
                      <img src={event.logo} alt={event.name} className="h-7 max-w-[80px] object-contain" />
                    ) : (
                      <Calendar className="w-4 h-4 text-[#a5a2ad]" />
                    )}
                  </div>
                  <h3 className=" text-black mt-2 truncate">
                    {event.name}
                  </h3>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <p className=" text-black line-clamp-2">
                    {event.description || 'No description provided.'}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-[#ebebed]">
                    <div className="flex items-center justify-between text-black">
                      <span className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#a5a2ad]" />
                        <span>Certificates</span>
                      </span>
                      <span className="text-black">{event._count.certificates}</span>
                    </div>

                    {(event.startDate || event.endDate) && (
                      <div className="flex items-center gap-1.5  ">
                        {/* <Clock className="w-3 h-3 text-[#a5a2ad]" /> */}
                        <span>
                          {event.startDate ? new Date(event.startDate).toLocaleDateString() : ''} 
                          {event.endDate ? ` to ${new Date(event.endDate).toLocaleDateString()}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 py-2.5 bg-[#f8f7fa] border-t border-[#ebebed] flex items-center justify-between  group-hover:bg-[#7367f0]/5 transition-colors">
                  <span>Manage Event</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Event Modal - Vertically Centered */}
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
              {/* <Calendar className="w-5 h-5 text-[#7367f0]" /> */}
              <h2 className=" text-black">Create New Event</h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="form-label">Event Title *</label>
                <input
                  className="form-input "
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. ICPC Asia West Regional 2025"
                  required
                />
              </div>

              <div>
                <label className="form-label">Event Logo</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {/* <input
                      className="form-input text-xs flex-1"
                      value={formLogo}
                      onChange={(e) => setFormLogo(e.target.value)}
                      placeholder="Paste image URL (e.g. https://.../logo.png)"
                    /> */}
                    <label className="underline py-2 px-3 flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                      <span className='text-indigo-700'>Upload</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>

                  {formLogo && (
                    <div className="p-2 bg-[#f8f7fa] border border-[#dbdade] flex items-center justify-between">
                      <img src={formLogo} alt="Preview" className="h-8 max-w-[120px] object-contain" />
                      <button
                        type="button"
                        onClick={() => setFormLogo('')}
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
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Brief description of the event, contest, or workshop..."
                  rows={2}
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
