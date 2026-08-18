'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Users, Award, Plus, Building2, ShieldCheck, Mail } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  email: string | null;
  status: string;
  events: { id: string; name: string; status: string; publicSlug: string; _count: { certificates: number } }[];
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
    <div className="space-y-6 animate-in">
      {/* Top bar back */}
      <div className="flex items-center justify-between">
        <button
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          onClick={() => router.push('/admin/organizations')}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Organizations</span>
        </button>
        <span className={`badge badge-${org.status.toLowerCase()}`}>{org.status}</span>
      </div>

      {/* Hero header */}
      <div className="materio-card p-6 bg-white border border-[#dbdade] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#7367f0]/10 text-[#7367f0] flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2f2b3d] tracking-tight">{org.name}</h1>
            <p className="text-xs text-[#6f6b7d] flex items-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5 text-[#a5a2ad]" />
              <span>{org.email || 'No email registered'}</span>
            </p>
          </div>
        </div>

        <Link href={`/admin/events?orgId=${org.id}`} className="no-underline">
          <button className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Create Event for Org</span>
          </button>
        </Link>
      </div>

      {/* Events section */}
      <div className="materio-card p-6 bg-white border border-[#dbdade]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#ebebed]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#00bad1]" />
            <h2 className="text-sm font-bold text-[#2f2b3d] uppercase tracking-wider">
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
                  <div>
                    <div className="font-bold text-xs text-[#2f2b3d] group-hover:text-[#7367f0] transition-colors">
                      {event.name}
                    </div>
                    <div className="text-[11px] text-[#6f6b7d] mt-0.5 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#00bad1]" />
                      <span>{event._count.certificates} certificates</span>
                    </div>
                  </div>
                  <span className={`badge badge-${event.status.toLowerCase()}`}>{event.status}</span>
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
          <h2 className="text-sm font-bold text-[#2f2b3d] uppercase tracking-wider">
            Assigned Members ({org.members.length})
          </h2>
        </div>

        <div className="divide-y divide-[#ebebed]">
          {org.members.map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-[#2f2b3d]">{m.user.name}</div>
                <div className="text-[11px] text-[#6f6b7d]">{m.user.email}</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#7367f0] font-medium bg-[#7367f0]/10 px-2 py-0.5 border border-[#7367f0]/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{m.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Org Admin'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
