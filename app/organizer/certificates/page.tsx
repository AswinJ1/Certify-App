'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CertificateThumbnail from '@/app/components/CertificateThumbnail';
import { Award, Plus, Calendar, Users, ArrowRight } from 'lucide-react';

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

  useEffect(() => {
    fetch('/api/organizer/certificates')
      .then((r) => r.json())
      .then((d) => setCerts(d.certificates || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in text-black">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-black">Organization Certificates</h1>
          <p className=" mt-0.5">
            Design templates, map datasets, and manage public certificate verification links
          </p>
        </div>
        <Link href="/organizer/events" className="no-underline">
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
          <Award className="w-8 h-8 text-[#a5a2ad] mx-auto mb-2" />
          <h3 className=" text-black mb-1">No certificates configured yet</h3>
          <p className="text-black mb-5">
            Create an event first, then add certificate templates to start generating credentials.
          </p>
          <Link href="/organizer/events" className="no-underline">
            <button className="btn-primary text-xs py-2 px-4">Go to Events</button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {certs.map((cert) => (
            <Link
              key={cert.id}
              href={`/organizer/certificates/${cert.id}`}
              className="no-underline text-inherit block group"
            >
              <div className="materio-card p-3 bg-white border border-[#dbdade] hover:border-[#7367f0] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-11 bg-[#f8f7fa] border border-[#dbdade] overflow-hidden flex-shrink-0">
                    <CertificateThumbnail
                      url={cert.template?.fileKey}
                      name={cert.name}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-black group-hover:text-[#7367f0] transition-colors truncate">
                      {cert.name}
                    </div>
                    <div className=" text-[#6f6b7d] mt-0.5 flex items-center gap-1.5 truncate">
                      {/* <Calendar className="w-3 h-3 text-[#a5a2ad]" /> */}
                      <span>{cert.event.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="text-black">{cert._count.recipients}</div>
                    <div className="text-[10px] tracking-wider">Recipients</div>
                  </div>

                  <div className="text-right">
                    <div className="text-black">{cert._count.fields}</div>
                    <div className="text-[10px]  tracking-wider">Fields</div>
                  </div>

                  <span className="text-xs text-black">{cert.status}</span>

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
