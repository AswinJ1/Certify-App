'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Calendar } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

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

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d?.dailyDownloads?.length) {
          setStartDate(d.dailyDownloads[0].date);
          setEndDate(d.dailyDownloads[d.dailyDownloads.length - 1].date);
        }
      })
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
      <div className="materio-card p-12 text-center bg-[#f8f7fa] border border-[#dbdade]">
        <h2 className="text-base font-bold text-[#2f2b3d]">No Analytics Data Available</h2>
        <p className="text-xs text-[#6f6b7d] mt-1">Publish certificates and get downloads to see analytics.</p>
      </div>
    );
  }

  const { summary, dailyDownloads, topCertificates, recentActivity } = data;

  const filteredDownloads = dailyDownloads.filter((d) => {
    if (startDate && d.date < startDate) return false;
    if (endDate && d.date > endDate) return false;
    return true;
  });

  const statCards = [
    { label: 'Total Downloads', value: summary.totalDownloads, subtext: 'Platform-wide claims' },
    { label: 'Total Recipients', value: summary.totalRecipients, subtext: 'Enrolled participants' },
    { label: 'Certificates', value: summary.totalCertificates, subtext: 'Total created templates' },
    { label: 'Live Portals', value: summary.publishedCertificates, subtext: 'Active searchable slugs' },
    { label: 'Organizations', value: summary.totalOrganizations, subtext: 'Registered institutions' },
    { label: 'Events', value: summary.totalEvents, subtext: 'Hosted programs & fests' },
  ];

  // ── ECharts: Multi-Stop Gradient Line & Area Chart ──
  const downloadTrendOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#dbdade',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#2f2b3d', fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 4px;',
      formatter: (params: any) => {
        const p = params[0];
        return `<div style="font-size: 11px;">
          <span style="color: #6f6b7d;">${p.name}</span><br/>
          <strong style="color: #7367f0; font-size: 13px;">${p.value}</strong> download(s)
        </div>`;
      },
    },
    grid: {
      top: '12%',
      left: '2%',
      right: '3%',
      bottom: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: filteredDownloads.map((d) => d.date),
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#dbdade' } },
      axisLabel: { color: '#6f6b7d', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#e5e4e8', type: 'dashed' } },
      axisLabel: { color: '#6f6b7d', fontSize: 11 },
    },
    series: [
      {
        name: 'Downloads',
        type: 'line',
        smooth: 0.35,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: {
          width: 3.5,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#7367f0' },
              { offset: 0.5, color: '#9055fd' },
              { offset: 1, color: '#00bad1' },
            ],
          },
        },
        itemStyle: {
          color: '#7367f0',
          borderColor: '#ffffff',
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(115, 103, 240, 0.42)' },
              { offset: 0.6, color: 'rgba(144, 85, 253, 0.15)' },
              { offset: 1, color: 'rgba(0, 186, 209, 0.01)' },
            ],
          },
        },
        data: filteredDownloads.map((d) => d.count),
      },
    ],
  };

  // ── ECharts: Status Distribution Donut Chart ──
  const verifiedCount = summary.totalDownloads;
  const pendingCount = Math.max(0, summary.totalRecipients - summary.totalDownloads);
  const draftCount = Math.max(0, summary.totalCertificates - summary.publishedCertificates);

  const statusDistributionOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Status Distribution',
      left: 'left',
      top: 0,
      textStyle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2f2b3d',
      },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#ffffff',
      borderColor: '#dbdade',
      borderWidth: 1,
      padding: [8, 14],
      textStyle: { color: '#2f2b3d', fontSize: 12, fontWeight: 500 },
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.12); border-radius: 4px;',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 8,
      left: 'center',
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 10,
      textStyle: { color: '#6f6b7d', fontSize: 12 },
    },
    series: [
      {
        name: 'Status',
        type: 'pie',
        radius: ['52%', '78%'],
        center: ['50%', '48%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 0,
          borderColor: '#f8f7fa',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b} ({d}%)',
          fontSize: 11,
          color: '#6f6b7d',
        },
        labelLine: {
          show: true,
          length: 14,
          length2: 18,
          smooth: true,
        },
        color: ['#5cb85c', '#f0ad4e', '#d9534f'],
        data: [
          { value: verifiedCount, name: 'Verified' },
          { value: pendingCount, name: 'Pending' },
          { value: draftCount, name: 'Rejected' },
        ],
      },
    ],
  };

  // ── ECharts: Top Performing Certificates Bar Chart ──
  const topCertsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#dbdade',
      borderWidth: 1,
      textStyle: { color: '#2f2b3d', fontSize: 12 },
    },
    legend: {
      top: 0,
      right: 0,
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 10,
      textStyle: { color: '#6f6b7d', fontSize: 11 },
    },
    grid: {
      top: '16%',
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: topCertificates.slice(0, 6).map((c) => (c.name.length > 12 ? c.name.slice(0, 12) + '...' : c.name)),
      axisLine: { lineStyle: { color: '#dbdade' } },
      axisLabel: { color: '#6f6b7d', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#e5e4e8', type: 'dashed' } },
      axisLabel: { color: '#6f6b7d', fontSize: 11 },
    },
    series: [
      {
        name: 'Downloads',
        type: 'bar',
        barWidth: '24%',
        itemStyle: { color: '#7367f0', borderRadius: [3, 3, 0, 0] },
        data: topCertificates.slice(0, 6).map((c) => c.downloads),
      },
      {
        name: 'Recipients',
        type: 'bar',
        barWidth: '24%',
        itemStyle: { color: '#00bad1', borderRadius: [3, 3, 0, 0] },
        data: topCertificates.slice(0, 6).map((c) => c.recipients),
      },
    ],
  };

  return (
    <div className="space-y-6 animate-in text-black">
      {/* Header with Interactive DatePicker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-black tracking-tight">Platform Analytics</h1>
          <p className="text-xs text-[#6f6b7d] mt-0.5">
            Real-time metrics, download volume trends, and certificate engagement across all institutions
          </p>
        </div>

        {/* Interactive Date Range Picker */}
        <div className="flex items-center gap-2 bg-[#f8f7fa] border border-[#dbdade] px-3 py-1.5 shadow-2xs self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-[#6f6b7d] flex-shrink-0" />
          <div className="flex items-center gap-1.5 text-xs text-[#2f2b3d]">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-0 text-xs text-[#2f2b3d] font-medium focus:outline-none cursor-pointer"
            />
            <span className="text-[#a5a2ad]">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-0 text-xs text-[#2f2b3d] font-medium focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Metric Stat Cards - Zero Icons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {statCards.map((card) => (
          <div key={card.label} className="materio-card p-4 bg-[#f8f7fa] border border-[#dbdade]">
            <div className="text-[10px] font-semibold text-[#6f6b7d] uppercase tracking-wider">
              {card.label}
            </div>
            <div className="text-2xl font-bold text-black mt-1.5 tracking-tight">
              {card.value}
            </div>
            <div className="text-[10px] text-[#6f6b7d] mt-1 truncate">
              {card.subtext}
            </div>
          </div>
        ))}
      </div>

      {/* Download Activity Chart with Gradient */}
      <div className="materio-card p-6 bg-[#f8f7fa] border border-[#dbdade]">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#dbdade]">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-black">
              Platform Download Activity
            </h2>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ReactECharts option={downloadTrendOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* Two Column Charts: Donut Status Distribution & Top Certs Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status Distribution Donut Chart */}
        <div className="materio-card p-6 bg-[#f8f7fa] border border-[#dbdade]">
          <div className="h-80 w-full">
            <ReactECharts option={statusDistributionOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Top Performing Certificates Bar Chart */}
        <div className="materio-card p-6 bg-[#f8f7fa] border border-[#dbdade]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#dbdade]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-black">Top Performing Certificates</h2>
          </div>
          <div className="h-80 w-full pt-2">
            <ReactECharts option={topCertsOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Shadcn Tables: Top Certificates & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Certificates Table */}
        <div className="materio-card p-5 bg-[#f8f7fa] border border-[#dbdade]">
          <div className="mb-3 pb-2 border-b border-[#dbdade]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-black">Top Certificate Leaderboard</h2>
          </div>

          {topCertificates.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#6f6b7d]">No certificate activity recorded yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#dbdade]">
                  <TableHead className="text-xs text-[#6f6b7d] font-semibold uppercase">Certificate</TableHead>
                  <TableHead className="text-xs text-[#6f6b7d] font-semibold uppercase">Institution</TableHead>
                  <TableHead className="text-xs text-[#6f6b7d] font-semibold uppercase text-right">Recipients</TableHead>
                  <TableHead className="text-xs text-[#6f6b7d] font-semibold uppercase text-right">Downloads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCertificates.slice(0, 6).map((cert) => (
                  <TableRow key={cert.id} className="border-[#dbdade] hover:bg-white/60">
                    <TableCell className="font-medium text-xs text-black truncate max-w-[130px]">{cert.name}</TableCell>
                    <TableCell className="text-xs text-[#6f6b7d] truncate max-w-[110px]">{cert.orgName}</TableCell>
                    <TableCell className="text-xs text-black text-right font-mono">{cert.recipients}</TableCell>
                    <TableCell className="text-xs text-[#7367f0] font-semibold text-right font-mono">{cert.downloads}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Recent Activity Table */}
        <div className="materio-card p-5 bg-[#f8f7fa] border border-[#dbdade]">
          <div className="mb-3 pb-2 border-b border-[#dbdade]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-black">Recent Downloads</h2>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#6f6b7d]">No certificate downloads yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#dbdade]">
                  <TableHead className="text-xs text-[#6f6b7d] font-semibold uppercase">Recipient</TableHead>
                  <TableHead className="text-xs text-[#6f6b7d] font-semibold uppercase">Certificate</TableHead>
                  <TableHead className="text-xs text-[#6f6b7d] font-semibold uppercase text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.slice(0, 6).map((act) => (
                  <TableRow key={act.id} className="border-[#dbdade] hover:bg-white/60">
                    <TableCell className="font-medium text-xs text-black truncate max-w-[130px]">{act.recipientName}</TableCell>
                    <TableCell className="text-xs text-[#6f6b7d] truncate max-w-[120px]">{act.certName}</TableCell>
                    <TableCell className="text-[11px] text-[#6f6b7d] text-right font-mono whitespace-nowrap">
                      {new Date(act.downloadedAt).toLocaleDateString()} {new Date(act.downloadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
