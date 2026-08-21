'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Building2, Plus, Users, Calendar, ArrowRight, X, Mail } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  email: string | null;
  logo: string | null;
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
  const [formLogo, setFormLogo] = useState('');
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
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, email: formEmail, logo: formLogo || null }),
      });
      if (res.ok) {
        toast.success('Organization created successfully');
        setFormName('');
        setFormEmail('');
        setFormLogo('');
        setShowCreate(false);
        loadOrgs();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to create organization');
      }
    } catch {
      toast.error('Network error while creating organization');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in text-black">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-black">Organizations</h1>
          <p className="text-black mt-0.5">
            Manage institutions, universities, and multi-tenant groups
          </p>
        </div>
        <button
          className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm cursor-pointer"
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
          <Building2 className="w-8 h-8 text-[#a5a2ad] mx-auto mb-2" />
          <h3 className="text-sm text-black mb-1">No organizations created yet</h3>
          <p className="text-xs text-black mb-5">
            Create your primary institution to begin hosting events and certificate templates.
          </p>
          <button className="btn-primary text-xs py-2 px-4 cursor-pointer" onClick={() => setShowCreate(true)}>
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
                  <div className="flex items-center gap-3.5 min-w-0">
                    {org.logo ? (
                      <div className="w-12 h-12 bg-white border border-[#dbdade] flex items-center justify-center p-1 flex-shrink-0">
                        <img src={org.logo} alt={org.name} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-[#7367f0]/10 text-[#7367f0] border border-[#7367f0]/20 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-black group-hover:text-[#7367f0] transition-colors truncate">
                        {org.name}
                      </h3>
                      <div className="text-xs text-[#6f6b7d] truncate flex items-center gap-1.5 mt-0.5">
                        {org.email ? (
                          <>
                            <Mail className="w-3 h-3 text-[#a5a2ad]" />
                            <span>{org.email}</span>
                          </>
                        ) : (
                          'No official email registered'
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-black border border-[#dbdade] px-2 py-0.5 bg-[#f8f7fa] flex-shrink-0">
                    {org.status}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#ebebed] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-[#6f6b7d]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#00bad1]" />
                      <strong className="text-black">{org._count.events}</strong> Events
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#7367f0]" />
                      <strong className="text-black">{org._count.members}</strong> Members
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
          <div className="modal-content relative bg-white max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
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
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="form-label">Organization Name *</label>
                <input
                  className="form-input text-xs"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Amrita Vishwa Vidyapeetham / IEEE Student Branch"
                  required
                />
              </div>

              <div>
                <label className="form-label">Official Inquiries Email</label>
                <input
                  className="form-input text-xs"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. events@university.edu"
                />
              </div>

              <div>
                <label className="form-label">Organization Logo</label>
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
