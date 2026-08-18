'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, Plus, Calendar, Building2, ArrowRight } from 'lucide-react';

interface Certificate {
  id: string;
  name: string;
  status: string;
  publicSlug: string;
  event: {
    name: string;
    organization: { id: string; name: string };
  };
  _count: { recipients: number; fields: number };
}

export default function CertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/certificates')
      .then((r) => r.json())
      .then((d) => setCerts(d.certificates || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2f2b3d] tracking-tight">All Platform Certificates</h1>
          <p className="text-xs text-[#6f6b7d] mt-1">Manage certificate templates and recipient mappings across all institutions</p>
        </div>
        <Link href="/admin/events" className="no-underline">
          <button className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>New Certificate</span>
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="spinner" style={{ width: '36px', height: '36px' }} />
        </div>
      ) : certs.length === 0 ? (
        <div className="materio-card p-12 text-center bg-white border border-[#dbdade] max-w-lg mx-auto mt-8">
          <div className="w-12 h-12 bg-[#7367f0]/10 text-[#7367f0] flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#2f2b3d] mb-1">No certificates configured yet</h3>
          <p className="text-xs text-[#6f6b7d] mb-5">Create an event first, then add certificate templates to it.</p>
          <Link href="/admin/events" className="no-underline">
            <button className="btn-primary text-xs py-2 px-4">Go to Events</button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {certs.map((cert) => (
            <Link
              key={cert.id}
              href={`/admin/certificates/${cert.id}`}
              className="no-underline text-inherit block group"
            >
              <div className="materio-card p-4 bg-white border border-[#dbdade] hover:border-[#7367f0] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-[#7367f0]/10 text-[#7367f0] flex items-center justify-center flex-shrink-0 group-hover:bg-[#7367f0] group-hover:text-white transition-colors">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-[#2f2b3d] group-hover:text-[#7367f0] transition-colors truncate">
                      {cert.name}
                    </div>
                    <div className="text-xs text-[#6f6b7d] mt-0.5 flex items-center gap-2 truncate">
                      <span className="flex items-center gap-1 font-medium text-[#2f2b3d]">
                        <Calendar className="w-3 h-3 text-[#00bad1]" />
                        {cert.event.name}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-[#7367f0]" />
                        {cert.event.organization.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-[#2f2b3d]">{cert._count.recipients}</div>
                    <div className="text-[10px] text-[#6f6b7d] uppercase tracking-wider">Recipients</div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-sm text-[#7367f0]">{cert._count.fields}</div>
                    <div className="text-[10px] text-[#6f6b7d] uppercase tracking-wider">Fields</div>
                  </div>

                  <span className={`badge badge-${cert.status.toLowerCase()}`}>{cert.status}</span>

                  <ArrowRight className="w-4 h-4 text-[#a5a2ad] group-hover:text-[#7367f0] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
