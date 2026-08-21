'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Building2, Save, Users, ShieldCheck, Mail, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import UploadWithRetry from '@/app/components/UploadWithRetry';

interface OrgMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface Organization {
  id: string;
  name: string;
  email: string | null;
  logo: string | null;
  status: string;
  members: OrgMember[];
}

export default function OrganizerSettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = () => {
    fetch('/api/organizer/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.organization) {
          setOrg(data.organization);
          setName(data.organization.name || '');
          setEmail(data.organization.email || '');
          setLogoUrl(data.organization.logo || '');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/organizer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, logo: logoUrl || null }),
      });
      if (res.ok) {
        toast.success('Organization settings updated successfully');
        loadSettings();
      } else {
        toast.error('Failed to save organization settings');
      }
    } catch {
      toast.error('Network error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUploaded = async (res: { ufsUrl: string }[]) => {
    if (!res[0]?.ufsUrl) return;
    setLogoUrl(res[0].ufsUrl);
    try {
      const resp = await fetch('/api/organizer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: res[0].ufsUrl }),
      });
      if (resp.ok) {
        toast.success('Organization logo updated successfully');
        loadSettings();
      }
    } catch {
      toast.error('Failed to save organization logo');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="spinner" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="materio-card p-12 text-center bg-white border border-[#dbdade]">
        <AlertCircle className="w-12 h-12 text-[#ea5455] mx-auto mb-2" />
        <h3 className="text-base font-bold text-[#2f2b3d]">No Organization Found</h3>
        <p className="text-xs text-[#6f6b7d] mt-1">Your account is not currently assigned to an active organization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2f2b3d] tracking-tight">Organization Profile & Settings</h1>
        <p className="text-xs text-[#6f6b7d] mt-1">
          Manage your institution details, contact information, branding logos, and organizer staff
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Settings Form (7 cols) */}
        <div className="lg:col-span-7 materio-card p-6 bg-white border border-[#dbdade] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#ebebed]">
            <div className="flex items-center gap-2">
              {/* <Building2 className="w-5 h-5 text-[#7367f0]" /> */}
              <h2 className="uppercase tracking-wider">Institution Details</h2>
            </div>
            {/* <span className={`badge badge-${org.status.toLowerCase()}`}>{org.status}</span> */}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="form-label">Organization Name *</label>
              <input
                className="form-input text-xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amrita School of Computing"
                required
              />
            </div>

            <div>
              <label className="form-label">Official Inquiries Email</label>
              <div className="relative">
                {/* <Mail className="w-4 h-4 text-[#a5a2ad] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" /> */}
                <input
                  className="form-input text-xs pl-9"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="certificates@amrita.edu"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Organization Logo URL</label>
              <div className="relative">
                <input
                  className="form-input text-xs"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="e.g. https://.../amrita-logo.png"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#ebebed] flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>

          {/* Logo Section */}
          <div className="pt-4 border-t border-[#ebebed] space-y-3">
            <div className="text-xs font-bold text-[#2f2b3d] uppercase tracking-wider">Institution Brand Logo</div>
            {logoUrl && (
              <div className="p-3 bg-[#f8f7fa] border border-[#dbdade] flex items-center gap-3">
                <img src={logoUrl} alt="Org Logo" className="h-12 max-w-[160px] object-contain bg-white p-1 border border-[#dbdade]" />
                <div className="text-xs text-[#28c76f] font-semibold">Active Logo Live on Verification Portal</div>
              </div>
            )}
            <UploadWithRetry
              endpoint="logoUploader"
              title="Upload Organization Logo (PNG / SVG / JPG)"
              description="Recommended transparent background logo for use on certificates and public lookup portals."
              onUploadComplete={handleLogoUploaded}
            />
          </div>
        </div>

        {/* Right: Organizer Admin Profile (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {org.members.map((m, idx) => {
            const avatarList = ['/Avatar/1.png', '/Avatar/2.png', '/Avatar/3.png', '/Avatar/4.png', '/Avatar/5.png', '/Avatar/8.png'];
            const avatarSrc = avatarList[idx % avatarList.length];
            const username = m.user.email ? m.user.email.split('@')[0] : m.user.name.toLowerCase().replace(/\s+/g, '');
            return (
              <div key={m.id} className="materio-card p-6 bg-white border border-[#dbdade] flex flex-col items-center text-center gap-3">
                {/* Prominent Big Square Avatar */}
                <img
                  src={avatarSrc}
                  alt={m.user.name}
                  className="w-24 h-24 border border-[#dbdade] object-cover bg-[#f8f7fa] shadow-xs"
                />

                {/* Profile Information */}
                <div className="space-y-1 w-full">
                  <div className="font-bold text-base text-black">{m.user.name}</div>
                  <div className="text-xs text-[#7367f0] font-mono font-medium">@{username}</div>
                  <div className="text-xs text-[#6f6b7d] truncate">{m.user.email}</div>
                  <div className="pt-2">
                    <span className="text-[11px]  px-3 py-1 bg-[#f8f7fa] inline-block text-black">
                      {m.role === 'ORG_ADMIN' ? 'Organizer Administrator' : m.role}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
