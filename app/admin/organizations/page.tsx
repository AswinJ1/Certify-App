'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Users, Calendar, ArrowRight, X, Mail } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  email: string | null;
  status: string;
  createdAt: string;
  _count: { events: number; members: number };
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [creating, setCreating] = useState(false);

  const loadOrgs = () => {
    fetch('/api/organizations')
      .then((r) => r.json())
      .then((d) => setOrgs(d.organizations || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, email: formEmail }),
      });
      if (res.ok) {
        setFormName('');
        setFormEmail('');
        setShowCreate(false);
        loadOrgs();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2f2b3d] tracking-tight">Organizations</h1>
          <p className="text-xs text-[#6f6b7d] mt-1">Manage institutions, universities, and multi-tenant groups</p>
        </div>
        <button
          className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4" />
          <span>New Organization</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="spinner" style={{ width: '36px', height: '36px' }} />
        </div>
      ) : orgs.length === 0 ? (
        <div className="materio-card p-12 text-center bg-white border border-[#dbdade] max-w-lg mx-auto mt-8">
          <div className="w-12 h-12 bg-[#7367f0]/10 text-[#7367f0] flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#2f2b3d] mb-1">No organizations created yet</h3>
          <p className="text-xs text-[#6f6b7d] mb-5">
            Create your primary institution to begin hosting events and certificate templates.
          </p>
          <button className="btn-primary text-xs py-2 px-4" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            <span>Create First Organization</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgs.map((org) => (
            <Link key={org.id} href={`/admin/organizations/${org.id}`} className="no-underline text-inherit group">
              <div className="materio-card p-5 bg-white border border-[#dbdade] hover:border-[#7367f0] transition-all flex flex-col justify-between h-full">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-[#7367f0]/10 text-[#7367f0] flex items-center justify-center flex-shrink-0 group-hover:bg-[#7367f0] group-hover:text-white transition-colors">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-[#2f2b3d] group-hover:text-[#7367f0] transition-colors truncate">
                        {org.name}
                      </h3>
                      <div className="text-xs text-[#6f6b7d] truncate flex items-center gap-1.5 mt-0.5">
                        {org.email ? (
                          <>
                            <Mail className="w-3 h-3 text-[#a5a2ad]" />
                            <span>{org.email}</span>
                          </>
                        ) : (
                          'No email registered'
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`badge badge-${org.status.toLowerCase()} flex-shrink-0`}>{org.status}</span>
                </div>

                <div className="pt-3 border-t border-[#ebebed] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-[#6f6b7d]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#00bad1]" />
                      <strong className="text-[#2f2b3d]">{org._count.events}</strong> Events
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#7367f0]" />
                      <strong className="text-[#2f2b3d]">{org._count.members}</strong> Members
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#a5a2ad] group-hover:text-[#7367f0] group-hover:translate-x-0.5 transition-all" />
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
              <Building2 className="w-5 h-5 text-[#7367f0]" />
              <h2 className="text-base font-bold text-[#2f2b3d]">Create Organization</h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="form-label">Organization Name *</label>
                <input
                  className="form-input text-xs"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Amrita Vishwa Vidyapeetham"
                  required
                />
              </div>
              <div>
                <label className="form-label">Official Contact Email</label>
                <input
                  className="form-input text-xs"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="admin@amrita.edu"
                />
              </div>
              <div className="flex gap-2 justify-end pt-3 border-t border-[#ebebed]">
                <button type="button" className="btn-secondary text-xs" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
