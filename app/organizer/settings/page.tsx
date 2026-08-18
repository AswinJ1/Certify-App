'use client';

import { useEffect, useState } from 'react';
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
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

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
        showToast('Organization settings updated successfully!');
        loadSettings();
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch {
      showToast('Network error while saving settings', 'error');
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
        showToast('Organization logo updated!');
        loadSettings();
      }
    } catch {
      showToast('Error saving logo', 'error');
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
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 border shadow-lg text-xs font-semibold flex items-center gap-2.5 animate-in ${
            toastMessage.type === 'success'
              ? 'bg-white border-[#28c76f] text-[#28c76f]'
              : 'bg-white border-[#ea5455] text-[#ea5455]'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#28c76f]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#ea5455]" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

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
              <Building2 className="w-5 h-5 text-[#7367f0]" />
              <h2 className="text-sm font-bold text-[#2f2b3d] uppercase tracking-wider">Institution Details</h2>
            </div>
            <span className={`badge badge-${org.status.toLowerCase()}`}>{org.status}</span>
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
                <Mail className="w-4 h-4 text-[#a5a2ad] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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

        {/* Right: Members List (5 cols) */}
        <div className="lg:col-span-5 materio-card p-6 bg-white border border-[#dbdade] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#ebebed]">
              <Users className="w-5 h-5 text-[#00bad1]" />
              <h2 className="text-sm font-bold text-[#2f2b3d] uppercase tracking-wider">
                Assigned Team Members ({org.members.length})
              </h2>
            </div>

            <div className="space-y-3">
              {org.members.map((m) => (
                <div key={m.id} className="p-3 bg-[#f8f7fa] border border-[#dbdade] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[#2f2b3d]">{m.user.name}</div>
                    <div className="text-[11px] text-[#6f6b7d]">{m.user.email}</div>
                  </div>
                  <span className="badge badge-ready">{m.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-[#ebebed] text-[11px] text-[#6f6b7d]">
            To add more team members or change organizational roles, contact a platform Super Administrator.
          </div>
        </div>
      </div>
    </div>
  );
}
