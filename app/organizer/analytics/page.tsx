'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
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
  eventCertificateDistribution: {
    eventName: string;
    certificateCount: number;
  }[];
}

export default function OrganizerAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const input = ref.current;
    if (!input) return;

    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof pickerInput.showPicker === 'function') {
      pickerInput.showPicker();
      return;
    }

    input.focus();
  };

  useEffect(() => {
    fetch('/api/organizer/analytics')
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
        <p className="text-xs text-[#6f6b7d] mt-1">
          Publish certificate portals and share them with participants to see real-time statistics.
        </p>
      </div>
    );
  }

  const { summary, dailyDownloads, topCertificates, recentActivity, eventCertificateDistribution } = data;

  const filteredDownloads = dailyDownloads.filter((d) => {
    if (startDate && d.date < startDate) return false;
    if (endDate && d.date > endDate) return false;
    return true;
  });

  const statCards = [
    { label: 'Total Downloads', value: summary.totalDownloads, subtext: 'Lifetime verified claims' },
    { label: 'Total Recipients', value: summary.totalRecipients, subtext: 'Mapped in dataset rosters' },
    { label: 'Live Portals', value: summary.publishedCertificates, subtext: 'Active searchable slugs' },
    { label: 'Total Events', value: summary.totalEvents, subtext: 'Registered organization programs' },
  ];

  // ── ECharts: Large Interactive Area Chart ──
  const downloadTrendOption = {
    backgroundColor: 'transparent',
    toolbox: {
      right: 0,
      top: 0,
      itemSize: 14,
      iconStyle: {
        borderColor: '#9aa2b1',
      },
      feature: {
        dataZoom: { yAxisIndex: 'none' },
        restore: {},
        saveAsImage: {},
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: { color: '#c9c7d0', type: 'dashed' },
      },
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
          <strong style="color: #ff4d8d; font-size: 13px;">${p.value}</strong> download(s)
        </div>`;
      },
    },
    grid: {
      top: '14%',
      left: '2%',
      right: '3%',
      bottom: '22%',
      containLabel: true,
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
      {
        type: 'slider',
        height: 22,
        bottom: 8,
        start: 0,
        end: 100,
        borderColor: '#e5e4e8',
        fillerColor: 'rgba(255, 120, 165, 0.16)',
        backgroundColor: '#f8f7fa',
        handleStyle: {
          color: '#ffffff',
          borderColor: '#c7c4d2',
        },
      },
    ],
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
        smooth: 0.25,
        showSymbol: false,
        lineStyle: {
          width: 2.5,
          color: '#ff4d8d',
        },
        itemStyle: {
          color: '#ff4d8d',
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
              { offset: 0, color: 'rgba(255, 93, 143, 0.58)' },
              { offset: 0.65, color: 'rgba(255, 93, 143, 0.26)' },
              { offset: 1, color: 'rgba(255, 93, 143, 0.06)' },
            ],
          },
        },
        data: filteredDownloads.map((d) => d.count),
      },
    ],
  };

  const eventCertificateData =
    eventCertificateDistribution.length > 0
      ? eventCertificateDistribution.map((item) => ({ name: item.eventName, value: item.certificateCount }))
      : Object.entries(
          topCertificates.reduce<Record<string, number>>((acc, cert) => {
            const key = cert.eventName || 'General Event';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {})
        ).map(([name, value]) => ({ name, value }));

  // ── ECharts: Event-wise Certificate Distribution Donut Chart ──
  const eventDistributionOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Certificates by Event',
      subtext: `${summary.totalCertificates} total certificates`,
      left: 'left',
      top: 0,
      textStyle: {
        fontSize: 20,
        fontWeight: '',
        color: '#2f2b3d',
      },
      subtextStyle: {
        fontSize: 15,
        color: '#6f6b7d',
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
      formatter: (params: any) => {
        return `<div style="font-size: 11px;">
          <span style="color: #6f6b7d;">${params.name}</span><br/>
          <strong style="color: #2f2b3d; font-size: 13px;">${params.value}</strong> certificate(s) <span style="color:#8f8a9b;">(${params.percent}%)</span>
        </div>`;
      },
    },
    legend: {
      bottom: 0,
      left: 'center',
      type: 'scroll',
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 14,
      itemGap: 12,
      textStyle: { color: '#6f6b7d', fontSize: 15 },
    },
    series: [
      {
        name: 'Certificates',
        type: 'pie',
        radius: ['54%', '76%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 0,
          borderColor: '#f8f7fa',
          borderWidth: 2,
        },
        label: {
          show: false,
          formatter: '{b}: {c}',
          fontSize: 10,
          color: '#6f6b7d',
        },
        labelLine: {
          show: false,
          length: 10,
          length2: 14,
          smooth: true,
        },
        color: ['#4c8eda', '#53c7d2', '#f6c343', '#f27d61', '#9276d8', '#6bcf8c', '#f06a9b', '#3cc0a7'],
        data: eventCertificateData,
      },
    ],
  };

  const topCertSource = topCertificates.slice(0, 6);
  const radarLabels = topCertSource.length
    ? topCertSource.map((c) => (c.name.length > 12 ? c.name.slice(0, 12) + '...' : c.name))
    : ['No Data'];
  const radarMaxValue = topCertSource.length
    ? Math.max(5, ...topCertSource.map((c) => Math.max(c.downloads, c.recipients))) + 2
    : 1;
  const radarDownloads = topCertSource.length ? topCertSource.map((c) => c.downloads) : [0];
  const radarRecipients = topCertSource.length ? topCertSource.map((c) => c.recipients) : [0];

  // ── ECharts: Top Performing Certificates Radar Chart ──
  const topCertsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#dbdade',
      borderWidth: 1,
      textStyle: { color: '#2f2b3d', fontSize: 12 },
      formatter: (params: any) => {
        const metric = params.name;
        const values = (params.value as number[]) || [];
        const rows = radarLabels
          .map((label, index) => `${label}: <strong>${values[index] ?? 0}</strong>`)
          .join('<br/>');

        return `<div style="font-size:11px;"><strong>${metric}</strong><br/>${rows}</div>`;
      },
    },
    legend: {
      top: 0,
      right: 0,
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 10,
      textStyle: { color: '#6f6b7d', fontSize: 11 },
    },
    radar: {
      center: ['50%', '58%'],
      radius: '66%',
      splitNumber: 4,
      indicator: radarLabels.map((label) => ({ name: label, max: radarMaxValue })),
      axisName: {
        color: '#6f6b7d',
        fontSize: 10,
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(76, 142, 218, 0.04)', 'rgba(83, 199, 210, 0.06)'],
        },
      },
      splitLine: {
        lineStyle: {
          color: '#dbdade',
        },
      },
      axisLine: {
        lineStyle: {
          color: '#dbdade',
        },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: radarDownloads,
            name: 'Downloads',
            symbol: 'circle',
            symbolSize: 7,
            lineStyle: { color: '#7367f0', width: 2.5 },
            itemStyle: { color: '#7367f0' },
            areaStyle: {
              color: 'rgba(115, 103, 240, 0.2)',
            },
          },
          {
            value: radarRecipients,
            name: 'Recipients',
            symbol: 'diamond',
            symbolSize: 7,
            lineStyle: { color: '#00bad1', width: 2.5 },
            itemStyle: { color: '#00bad1' },
            areaStyle: {
              color: 'rgba(0, 186, 209, 0.18)',
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="space-y-6 animate-in text-black">
      {/* Header with Interactive DatePicker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl text-black tracking-tight">Organization Analytics</h1>
          <p className="text-xs text-[#6f6b7d] mt-0.5">
            Real-time metrics, download volume trends, and certificate engagement statistics
          </p>
        </div>

        {/* Interactive Date Range Picker */}
        <div className="flex items-center gap-2  px-3 py-1.5 shadow-2xs self-start sm:self-auto">
          {/* <Calendar className="w-4 h-4 text-[#6f6b7d] flex-shrink-0" /> */}
        <div className="flex items-center gap-2">
  {/* Start date */}
  <div
    className="flex h-9 items-center px-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer"
    onClick={() => openDatePicker(startDateRef)}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-2 text-[#45414f]"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>

    <input
      ref={startDateRef}
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      className="w-26.25 bg-transparent text-sm font-medium text-[#3f3b48] outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
    />
  </div>

  <span className=" text-[#96929f]">to</span>

  {/* End date */}
  <div
    className="flex h-9 items-center px-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer"
    onClick={() => openDatePicker(endDateRef)}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-2 text-[#45414f]"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>

    <input
      ref={endDateRef}
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      className="w-26.25 bg-transparent text-sm font-medium text-[#3f3b48] outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
    />
  </div>
</div>
        </div>
      </div>

      {/* Metric Stat Cards - Zero Icons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className=" p-4  border">
            <div className="text-[11px] font-semibold text-[#6f6b7d] uppercase tracking-wider">
              {card.label}
            </div>
            <div className="text-2xl  text-black mt-1.5 tracking-tight">
              {card.value}
            </div>
            <div className="text-[11px] text-[#6f6b7d] mt-1 truncate">
              {card.subtext}
            </div>
          </div>
        ))}
      </div>

      {/* Download Activity Chart with Gradient */}
      <div className=" p-6 border ">
        <div className="flex items-center justify-between mb-3 pb-3">
          <div>
            <h2 className="uppercase tracking-wider text-black">
              Download Activity
            </h2>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ReactECharts option={downloadTrendOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* Two Column Charts: Event Distribution & Top Certs Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Event-wise Certificate Distribution Donut Chart */}
        <div className=" p-6  border ">
          <div className="h-80 w-full">
            <ReactECharts option={eventDistributionOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Top Performing Certificates Bar Chart */}
        <div className=" p-6  border ">
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
        <div className="  p-5 ">
          <div className="mb-3 pb-2 ">
            <h2 className=" tracking-wider text-black">Top Certificate Leaderboard</h2>
          </div>

          {topCertificates.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#6f6b7d]">No certificate activity recorded yet.</div>
          ) : (
            <Table className='border'>
              <TableHeader>
                <TableRow className="border-[#dbdade] bg-white ">
                  <TableHead className="text-xs text-[#6f6b7d]  uppercase">Certificate</TableHead>
                  <TableHead className="text-xs text-[#6f6b7d]  uppercase">Event</TableHead>
                  <TableHead className="text-xs text-[#6f6b7d] uppercase text-right">Recipients</TableHead>
                  <TableHead className="text-xs text-[#6f6b7d]  uppercase text-right">Downloads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCertificates.slice(0, 6).map((cert) => (
                  <TableRow key={cert.id} className="border-[#dbdade] hover:bg-white/60">
                    <TableCell className=" text-black truncate max-w-32.5">{cert.name}</TableCell>
                    <TableCell className=" text-[#6f6b7d] truncate max-w-27.5">{cert.eventName}</TableCell>
                    <TableCell className=" text-black text-right font-mono">{cert.recipients}</TableCell>
                    <TableCell className="text-right font-mono">{cert.downloads}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Recent Activity Table */}
        <div className=" p-5 ">
          <div className="mb-3 pb-2">
            <h2 className=" tracking-wider text-black">Recent Downloads</h2>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#6f6b7d]">No certificate downloads yet.</div>
          ) : (
            <Table className='border'>
              <TableHeader>
                <TableRow className="border-[#dbdade] bg-white">
                  <TableHead className=" text-[#6f6b7d] font-semibold uppercase">Recipient</TableHead>
                  <TableHead className=" text-[#6f6b7d] font-semibold uppercase">Certificate</TableHead>
                  <TableHead className=" text-[#6f6b7d] font-semibold uppercase text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.slice(0, 6).map((act) => (
                  <TableRow key={act.id} className="border-[#dbdade] hover:bg-white/60">
                    <TableCell className=" text-black truncate max-w-32.5">{act.recipientName}</TableCell>
                    <TableCell className=" text-[#6f6b7d] truncate max-w-30">{act.certName}</TableCell>
                    <TableCell className="text-[15px] text-[#6f6b7d] text-right font-mono whitespace-nowrap">
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
