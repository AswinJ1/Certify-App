'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Users,
  Award,
  Building2,
  Calendar,
  Activity,
  ArrowUpRight,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface Summary {
  totalOrganizations: number;
  totalEvents: number;
  totalCertificates: number;
  publishedCertificates: number;
  totalRecipients: number;
  totalDownloads: number;
  totalGenerated: number;
}

interface DailyDownload {
  date: string;
  count: number;
}

interface TopCert {
  id: string;
  name: string;
  status: string;
  eventName: string;
  orgName: string;
  recipients: number;
  downloads: number;
}

interface RecentActivity {
  id: string;
  certName: string;
  recipientName: string;
  downloadedAt: string;
  ipAddress: string | null;
}

interface AnalyticsData {
  summary: Summary;
  dailyDownloads: DailyDownload[];
  topCertificates: TopCert[];
  recentActivity: RecentActivity[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="spinner" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }

  if (!data || data.summary === undefined) {
    return (
      <div className="materio-card p-12 text-center bg-white border border-[#dbdade]">
        <BarChart3 className="w-12 h-12 text-[#a5a2ad] mx-auto mb-3" />
        <h2 className="text-base font-bold text-[#2f2b3d]">No Analytics Data Available</h2>
        <p className="text-xs text-[#6f6b7d] mt-1">Publish certificates and get downloads to see analytics.</p>
      </div>
    );
  }

  const { summary, dailyDownloads, topCertificates, recentActivity } = data;
  const maxDailyCount = Math.max(...dailyDownloads.map((d) => d.count), 1);

  const statCards = [
    { label: 'Total Downloads', value: summary.totalDownloads, icon: Download, color: 'text-[#7367f0]', bg: 'bg-[#7367f0]/10' },
    { label: 'Total Recipients', value: summary.totalRecipients, icon: Users, color: 'text-[#00bad1]', bg: 'bg-[#00bad1]/10' },
    { label: 'Certificates', value: summary.totalCertificates, icon: Award, color: 'text-[#28c76f]', bg: 'bg-[#28c76f]/10' },
    { label: 'Live Portals', value: summary.publishedCertificates, icon: TrendingUp, color: 'text-[#ff9f43]', bg: 'bg-[#ff9f43]/10' },
    { label: 'Organizations', value: summary.totalOrganizations, icon: Building2, color: 'text-[#7367f0]', bg: 'bg-[#7367f0]/10' },
    { label: 'Events', value: summary.totalEvents, icon: Calendar, color: 'text-[#00bad1]', bg: 'bg-[#00bad1]/10' },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2f2b3d] tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#7367f0]" />
          <span>Platform Analytics</span>
        </h1>
        <p className="text-xs text-[#6f6b7d] mt-1">Global platform metrics, download volume, and verification statistics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="materio-card p-4 bg-white border border-[#dbdade]">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#2f2b3d] tracking-tight">{card.value}</div>
              <div className="text-[10px] font-bold text-[#6f6b7d] tracking-wider uppercase mt-1">
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Downloads Chart */}
      <div className="materio-card p-6 bg-white border border-[#dbdade]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#7367f0]" />
            <h2 className="text-sm font-bold text-[#2f2b3d] uppercase tracking-wider">
              Downloads — Last 30 Days
            </h2>
          </div>
          <span className="text-xs text-[#6f6b7d] font-semibold bg-[#f8f7fa] px-2.5 py-1 border border-[#dbdade]">
            30-Day Sum: {dailyDownloads.reduce((s, d) => s + d.count, 0)}
          </span>
        </div>

        {/* Bar chart visual */}
        <div className="flex items-end gap-1.5 h-36 pt-4 px-2 bg-[#f8f7fa] border border-[#ebebed]">
          {dailyDownloads.map((day) => {
            const heightPct = maxDailyCount > 0 ? (day.count / maxDailyCount) * 100 : 0;
            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
                title={`${day.date}: ${day.count} download(s)`}
              >
                <div
                  style={{
                    height: `${Math.max(heightPct, 4)}%`,
                  }}
                  className={`w-full transition-all ${
                    day.count > 0 ? 'bg-[#7367f0] hover:bg-[#655bd3]' : 'bg-[#dbdade]'
                  }`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-[#6f6b7d] font-mono">
          <span>{dailyDownloads[0]?.date}</span>
          <span>{dailyDownloads[Math.floor(dailyDownloads.length / 2)]?.date}</span>
          <span>{dailyDownloads[dailyDownloads.length - 1]?.date}</span>
        </div>
      </div>

      {/* Top Certificates & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Certificates */}
        <div className="materio-card p-5 bg-white border border-[#dbdade]">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#ebebed]">
            <Award className="w-4 h-4 text-[#00bad1]" />
            <h2 className="text-sm font-bold text-[#2f2b3d] uppercase tracking-wider">Top Certificates</h2>
          </div>

          {topCertificates.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#6f6b7d]">No certificate activity recorded yet.</div>
          ) : (
            <div className="space-y-2.5">
              {topCertificates.slice(0, 6).map((cert, idx) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-2.5 bg-[#f8f7fa] border border-[#ebebed]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-bold text-[#7367f0] w-4">{idx + 1}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#2f2b3d] truncate">{cert.name}</div>
                      <div className="text-[10px] text-[#6f6b7d] truncate">
                        {cert.eventName} · {cert.orgName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-[#7367f0]">{cert.downloads}</div>
                      <div className="text-[9px] text-[#6f6b7d] uppercase">Downloads</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-[#00bad1]">{cert.recipients}</div>
                      <div className="text-[9px] text-[#6f6b7d] uppercase">Recipients</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="materio-card p-5 bg-white border border-[#dbdade]">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#ebebed]">
            <Clock className="w-4 h-4 text-[#ff9f43]" />
            <h2 className="text-sm font-bold text-[#2f2b3d] uppercase tracking-wider">Recent Activity</h2>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#6f6b7d]">No certificate downloads yet.</div>
          ) : (
            <div className="space-y-2">
              {recentActivity.slice(0, 7).map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-2.5 bg-[#f8f7fa] border border-[#ebebed]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 bg-[#28c76f]/10 text-[#28c76f] flex items-center justify-center flex-shrink-0">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#2f2b3d] truncate">{act.recipientName}</div>
                      <div className="text-[10px] text-[#6f6b7d] truncate">{act.certName}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#6f6b7d] text-right flex-shrink-0 font-mono">
                    {new Date(act.downloadedAt).toLocaleDateString()}
                    <br />
                    {new Date(act.downloadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
