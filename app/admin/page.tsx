'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Calendar, Award, Plus, ArrowUpRight, Sparkles } from 'lucide-react';

interface Stats {
  organizations: number;
  events: number;
  certificates: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ organizations: 0, events: 0, certificates: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/organizations').then((r) => r.json()),
      fetch('/api/events').then((r) => r.json()),
      fetch('/api/certificates').then((r) => r.json()),
    ])
      .then(([orgs, events, certs]) => {
        setStats({
          organizations: orgs.organizations?.length || 0,
          events: events.events?.length || 0,
          certificates: certs.certificates?.length || 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: 'Registered Organizations',
      value: stats.organizations,
      icon: Building2,
      href: '/admin/organizations',
      iconBg: 'bg-[#7367f0]/10 text-[#7367f0]',
    },
    {
      label: 'Active Platform Events',
      value: stats.events,
      icon: Calendar,
      href: '/admin/events',
      iconBg: 'bg-[#00bad1]/10 text-[#00bad1]',
    },
    {
      label: 'Certificates Configured',
      value: stats.certificates,
      icon: Award,
      href: '/admin/certificates',
      iconBg: 'bg-[#28c76f]/10 text-[#28c76f]',
    },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2f2b3d] tracking-tight">Super Admin Dashboard</h1>
          <p className="text-xs text-[#6f6b7d] mt-1">Platform-wide overview and multi-tenant management</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/organizations" className="no-underline">
            <button className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />
              <span>Create Organization</span>
            </button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="spinner" style={{ width: '36px', height: '36px' }} />
        </div>
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.label} href={card.href} className="no-underline text-inherit group">
                  <div className="materio-card p-5 bg-white border border-[#dbdade] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#6f6b7d] tracking-wider uppercase">
                        {card.label}
                      </div>
                      <div className="text-2xl font-extrabold text-[#2f2b3d] mt-1 tracking-tight">
                        {card.value}
                      </div>
                      <div className="text-[11px] text-[#7367f0] mt-2 flex items-center gap-1 font-medium group-hover:underline">
                        <span>Manage records</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </div>
                    </div>
                    <div className={`p-3.5 ${card.iconBg} flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions Card */}
          <div className="materio-card p-5 bg-white border border-[#dbdade]">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#ebebed]">
              <Sparkles className="w-4 h-4 text-[#7367f0]" />
              <h2 className="text-sm font-bold text-[#2f2b3d] uppercase tracking-wider">Super Admin Shortcuts</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/admin/organizations" className="no-underline text-inherit">
                <div className="p-3.5 bg-[#f8f7fa] hover:bg-[#f2f1f8] border border-[#dbdade] transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-[#7367f0]" />
                    <span className="text-xs font-bold text-[#2f2b3d]">Add Organization</span>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-[#6f6b7d] group-hover:text-[#2f2b3d]" />
                </div>
              </Link>

              <Link href="/admin/events" className="no-underline text-inherit">
                <div className="p-3.5 bg-[#f8f7fa] hover:bg-[#f2f1f8] border border-[#dbdade] transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[#00bad1]" />
                    <span className="text-xs font-bold text-[#2f2b3d]">Add Event</span>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-[#6f6b7d] group-hover:text-[#2f2b3d]" />
                </div>
              </Link>

              <Link href="/admin/certificates" className="no-underline text-inherit">
                <div className="p-3.5 bg-[#f8f7fa] hover:bg-[#f2f1f8] border border-[#dbdade] transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Award className="w-4 h-4 text-[#28c76f]" />
                    <span className="text-xs font-bold text-[#2f2b3d]">Design Certificate</span>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-[#6f6b7d] group-hover:text-[#2f2b3d]" />
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
