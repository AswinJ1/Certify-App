'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Award,
  Users,
  Download,
  Plus,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';

interface Stats {
  events: number;
  certificates: number;
  recipients: number;
  downloads: number;
}

interface EventItem {
  id: string;
  name: string;
  description: string | null;
  status: string;
  publicSlug: string;
  createdAt: string;
  _count: { certificates: number };
}

interface CertificateItem {
  id: string;
  name: string;
  status: string;
  publicSlug: string;
  event: { name: string };
  _count: { recipients: number };
}

export default function OrganizerDashboard() {
  const [stats, setStats] = useState<Stats>({ events: 0, certificates: 0, recipients: 0, downloads: 0 });
  const [recentEvents, setRecentEvents] = useState<EventItem[]>([]);
  const [recentCertificates, setRecentCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/organizer/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) {
          setStats(data.stats);
          setRecentEvents(data.recentEvents || []);
          setRecentCertificates(data.recentCertificates || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in text-black">
      {/* ── Top Overview Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl text-black">Organizer Dashboard</h1>
          <p className="text-xs text-black mt-0.5">
            Certificate Studio, Event Operations & Recipient Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/organizer/events" className="no-underline">
            <button className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
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
          {/* ── Top 3-Card Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Card 1: Downloads Status */}
            <div className="lg:col-span-4 materio-card p-6 bg-white border border-[#dbdade] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-black">Total Downloads</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <div className="text-3xl text-black">{stats.downloads}</div>
                  <span className="text-xs text-black">generated</span>
                </div>
                <p className="text-xs text-black mt-1">
                  Certificates generated on-demand by recipients.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#ebebed] flex items-center justify-between text-xs">
                <Link
                  href="/organizer/analytics"
                  className="text-[#7367f0] hover:underline flex items-center gap-1"
                >
                  <span>View Analytics</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: Recipients Base */}
            <div className="lg:col-span-4 materio-card p-6 bg-white border border-[#dbdade] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-black">Recipients in Database</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <div className="text-3xl text-black">{stats.recipients}</div>
                  <span className="text-xs text-black">participants</span>
                </div>
                <p className="text-xs text-black mt-1">
                  Imported across all CSV/XLSX recipient datasets.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#ebebed] flex items-center justify-between text-xs">
                <Link
                  href="/organizer/recipients"
                  className="text-[#7367f0] hover:underline flex items-center gap-1"
                >
                  <span>Browse Directory</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: Quick Summary without colored container boxes over icons */}
            <div className="lg:col-span-4 materio-card p-6 bg-white border border-[#dbdade] space-y-4">
              <div className="flex items-center justify-between border-b border-[#ebebed] pb-2">
                <div className="text-xs text-black">Overview</div>
                <span className="text-[11px] text-black">Platform Stats</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#f8f7fa] border border-[#dbdade] flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#a5a2ad] flex-shrink-0" />
                  <div>
                    <div className="text-base text-black">{stats.events}</div>
                    <div className="text-[11px] text-black">Events</div>
                  </div>
                </div>

                <div className="p-3 bg-[#f8f7fa] border border-[#dbdade] flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#a5a2ad] flex-shrink-0" />
                  <div>
                    <div className="text-base text-black">{stats.certificates}</div>
                    <div className="text-[11px] text-black">Certificates</div>
                  </div>
                </div>

                <div className="p-3 bg-[#f8f7fa] border border-[#dbdade] flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#a5a2ad] flex-shrink-0" />
                  <div>
                    <div className="text-base text-black">{stats.recipients}</div>
                    <div className="text-[11px] text-black">Recipients</div>
                  </div>
                </div>

                <div className="p-3 bg-[#f8f7fa] border border-[#dbdade] flex items-center gap-3">
                  <Download className="w-5 h-5 text-[#a5a2ad] flex-shrink-0" />
                  <div>
                    <div className="text-base text-black">{stats.downloads}</div>
                    <div className="text-[11px] text-black">Downloads</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Events & Certificates Table Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Recent Events */}
            <div className="materio-card bg-white border border-[#dbdade] overflow-hidden">
              <div className="p-4 border-b border-[#ebebed] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#a5a2ad]" />
                  <h2 className="text-sm text-black">Recent Events</h2>
                </div>
                <Link href="/organizer/events" className="text-xs text-[#7367f0] hover:underline flex items-center gap-1">
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-[#ebebed]">
                {recentEvents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-black">No events created yet.</div>
                ) : (
                  recentEvents.map((evt) => (
                    <Link
                      key={evt.id}
                      href={`/organizer/events/${evt.id}`}
                      className="p-4 flex items-center justify-between hover:bg-[#f8f7fa] transition-colors no-underline text-inherit block"
                    >
                      <div>
                        <div className="text-xs text-black">{evt.name}</div>
                        <div className="text-[11px] text-[#6f6b7d] mt-0.5">
                          {evt._count.certificates} certificates configured
                        </div>
                      </div>
                      <span className="text-xs text-black">{evt.status}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Recent Certificates */}
            <div className="materio-card bg-white border border-[#dbdade] overflow-hidden">
              <div className="p-4 border-b border-[#ebebed] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#a5a2ad]" />
                  <h2 className="text-sm text-black">Configured Certificates</h2>
                </div>
                <Link href="/organizer/certificates" className="text-xs text-[#7367f0] hover:underline flex items-center gap-1">
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-[#ebebed]">
                {recentCertificates.length === 0 ? (
                  <div className="p-8 text-center text-xs text-black">No certificates configured yet.</div>
                ) : (
                  recentCertificates.map((cert) => (
                    <Link
                      key={cert.id}
                      href={`/organizer/certificates/${cert.id}`}
                      className="p-4 flex items-center justify-between hover:bg-[#f8f7fa] transition-colors no-underline text-inherit block"
                    >
                      <div>
                        <div className="text-xs text-black">{cert.name}</div>
                        <div className="text-[11px] text-[#6f6b7d] mt-0.5">
                          Event: {cert.event.name} · {cert._count.recipients} recipients
                        </div>
                      </div>
                      <span className="text-xs text-black">{cert.status}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
