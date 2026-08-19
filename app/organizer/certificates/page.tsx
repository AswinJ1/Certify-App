'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CertificateThumbnail from '@/app/components/CertificateThumbnail';
import { Award, Plus, Calendar, Users, ArrowRight, LayoutGrid, List } from 'lucide-react';

interface Certificate {
  id: string;
  name: string;
  status: string;
  publicSlug: string;
  template?: { fileKey: string } | null;
  event: {
    name: string;
    organization: { id: string; name: string };
  };
  _count: { recipients: number; fields: number };
}

export default function OrganizerCertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetch('/api/organizer/certificates')
      .then((r) => r.json())
      .then((d) => setCerts(d.certificates || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in text-black">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl text-black">Organization Certificates</h1>
          <p className="mt-0.5">
            Design templates, map datasets, and manage public certificate verification links
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Grid / List Toggle */}
          <div className="flex items-center border border-[#dbdade] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#7367f0] text-white' : 'text-[#6f6b7d] hover:text-black'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-[#7367f0] text-white' : 'text-[#6f6b7d] hover:text-black'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Link href="/organizer/events" className="no-underline">
            <button className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap">
              <Plus className="w-4 h-4" />
              <span>New Certificate</span>
            </button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="spinner" style={{ width: '36px', height: '36px' }} />
        </div>
      ) : certs.length === 0 ? (
        <div className="materio-card p-12 text-center bg-white border border-[#dbdade] max-w-lg mx-auto mt-8">
          <Award className="w-8 h-8 text-[#a5a2ad] mx-auto mb-2" />
          <h3 className="text-black mb-1">No certificates configured yet</h3>
          <p className="text-black mb-5">
            Create an event first, then add certificate templates to start generating credentials.
          </p>
          <Link href="/organizer/events" className="no-underline">
            <button className="btn-primary text-xs py-2 px-4 cursor-pointer">Go to Events</button>
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View: Embedded Certificate Previews ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {certs.map((cert) => (
            <Link
              key={cert.id}
              href={`/organizer/certificates/${cert.id}`}
              className="no-underline text-inherit group block h-full"
            >
              <div className="materio-card bg-white border border-[#dbdade] hover:border-[#7367f0] transition-all flex flex-col justify-between h-full overflow-hidden">
                {/* Embedded Template Preview Canvas */}
                <div className="h-44 bg-[#f8f7fa] border-b border-[#ebebed] overflow-hidden relative group-hover:opacity-95 transition-opacity">
                  <CertificateThumbnail
                    url={cert.template?.fileKey}
                    name={cert.name}
                    className="w-full h-full"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-white/95 px-2 py-0.5 text-[10px] text-black border border-[#dbdade] shadow-xs z-10">
                    {cert.status}
                  </div>
                </div>

                {/* Body info */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-[#6f6b7d] uppercase tracking-wider mb-1 truncate">
                      {cert.event.name}
                    </div>
                    <h3 className="text-base font-semibold text-black group-hover:text-[#7367f0] transition-colors line-clamp-1">
                      {cert.name}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-[#ebebed] flex items-center justify-between text-xs text-black">
                    <span className="flex items-center gap-1 text-[#6f6b7d]">
                      <Users className="w-3.5 h-3.5 text-[#a5a2ad]" />
                      <span>{cert._count.recipients} recipients</span>
                    </span>
                    <span className="text-[#7367f0] flex items-center gap-1 font-medium">
                      <span>Studio</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* ── List View ── */
        <div className="space-y-3">
          {certs.map((cert) => (
            <Link
              key={cert.id}
              href={`/organizer/certificates/${cert.id}`}
              className="no-underline text-inherit block group"
            >
              <div className="materio-card p-3.5 bg-white border border-[#dbdade] hover:border-[#7367f0] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-16 h-12 bg-[#f8f7fa] border border-[#dbdade] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <CertificateThumbnail
                      url={cert.template?.fileKey}
                      name={cert.name}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-black group-hover:text-[#7367f0] transition-colors truncate font-semibold">
                      {cert.name}
                    </div>
                    <div className="text-xs text-[#6f6b7d] mt-0.5 flex items-center gap-1.5 truncate">
                      <span>{cert.event.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="text-black font-semibold">{cert._count.recipients}</div>
                    <div className="text-[10px] text-[#6f6b7d] tracking-wider uppercase">Recipients</div>
                  </div>

                  <div className="text-right">
                    <div className="text-black font-semibold">{cert._count.fields}</div>
                    <div className="text-[10px] text-[#6f6b7d] tracking-wider uppercase">Fields</div>
                  </div>

                  <span className="text-xs text-black border border-[#dbdade] px-2 py-0.5 bg-[#f8f7fa]">
                    {cert.status}
                  </span>

                  <ArrowRight className="w-4 h-4 text-[#a5a2ad] group-hover:translate-x-1 group-hover:text-[#7367f0] transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
