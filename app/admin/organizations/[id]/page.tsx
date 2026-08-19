'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Users, Award, Plus, Building2, ShieldCheck, Mail } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  email: string | null;
  logo: string | null;
  status: string;
  events: { id: string; name: string; status: string; logo?: string | null; publicSlug: string; _count: { certificates: number } }[];
  members: { id: string; role: string; user: { id: string; name: string; email: string } }[];
}

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/organizations/${id}`)
      .then((r) => r.json())
      .then((d) => setOrg(d.organization))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="spinner" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }

  if (!org) return <div className="text-center py-12 text-[#6f6b7d] text-xs">Organization not found</div>;

  return (
    <div className="space-y-6 animate-in text-black">
      {/* Top bar back */}
      <div className="flex items-center justify-between">
        <button
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
          onClick={() => router.push('/admin/organizations')}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Organizations</span>
        </button>
        <span className="text-xs text-black border border-[#dbdade] px-2.5 py-0.5 bg-[#f8f7fa]">{org.status}</span>
      </div>

      {/* Hero header */}
      <div className="materio-card p-6 bg-white border border-[#dbdade] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {org.logo ? (
            <div className="w-14 h-14 bg-white border border-[#dbdade] flex items-center justify-center p-1 flex-shrink-0">
              <img src={org.logo} alt={org.name} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-14 h-14 bg-[#7367f0]/10 text-[#7367f0] border border-[#7367f0]/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
          )}

          <div>
            <h1 className="text-xl font-bold text-black tracking-tight">{org.name}</h1>
            <p className="text-xs text-[#6f6b7d] flex items-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5 text-[#a5a2ad]" />
              <span>{org.email || 'No official email registered'}</span>
            </p>
          </div>
        </div>

        <Link href={`/admin/events?orgId=${org.id}`} className="no-underline">
          <button className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>Create Event for Org</span>
          </button>
        </Link>
      </div>

      {/* Events section */}
      <div className="materio-card p-6 bg-white border border-[#dbdade]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#ebebed]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#7367f0]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-black">
              Events ({org.events.length})
            </h2>
          </div>
        </div>

        {org.events.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#6f6b7d]">
            No events registered yet for this organization.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {org.events.map((event) => (
              <Link key={event.id} href={`/admin/events/${event.id}`} className="no-underline text-inherit group">
                <div className="p-3.5 bg-[#f8f7fa] border border-[#dbdade] hover:border-[#7367f0] transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {event.logo ? (
                      <img src={event.logo} alt={event.name} className="w-8 h-8 object-contain bg-white border border-[#dbdade] p-0.5 flex-shrink-0" />
                    ) : (
                      <Calendar className="w-4 h-4 text-[#a5a2ad] flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-black group-hover:text-[#7367f0] transition-colors truncate">
                        {event.name}
                      </div>
                      <div className="text-[11px] text-[#6f6b7d] mt-0.5 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#00bad1]" />
                        <span>{event._count.certificates} certificates</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-black border border-[#dbdade] px-2 py-0.5 bg-white flex-shrink-0">
                    {event.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Members section */}
      <div className="materio-card p-6 bg-white border border-[#dbdade]">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#ebebed]">
          <Users className="w-5 h-5 text-[#7367f0]" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-black">
            Assigned Members ({org.members.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {org.members.map((m, idx) => {
            const avatarList = ['/Avatar/1.png', '/Avatar/2.png', '/Avatar/3.png', '/Avatar/4.png', '/Avatar/5.png', '/Avatar/8.png'];
            const avatarSrc = avatarList[idx % avatarList.length];
            const username = m.user.email ? m.user.email.split('@')[0] : m.user.name.toLowerCase().replace(/\s+/g, '');
            return (
              <div key={m.id} className="p-3 bg-[#f8f7fa] border border-[#dbdade] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={avatarSrc}
                    alt={m.user.name}
                    className="w-10 h-10 border border-[#dbdade] object-cover bg-white flex-shrink-0 shadow-xs"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-black truncate">{m.user.name}</div>
                    <div className="text-[10px] text-[#7367f0] font-mono">@{username}</div>
                    <div className="text-[11px] text-[#6f6b7d] truncate">{m.user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-black border border-[#dbdade] bg-white px-2 py-0.5 flex-shrink-0">
                  <ShieldCheck className="w-3 h-3 text-[#7367f0]" />
                  <span>{m.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Org Admin'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
