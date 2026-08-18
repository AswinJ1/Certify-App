'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  Award,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
  Building2,
  ExternalLink,
  ShieldCheck,
  Search,
  Bell,
  Sparkles,
  Command,
  Sun,
  Globe,
  Layers,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN';
  organization?: { id: string; name: string; logo?: string | null } | null;
}

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push('/login');
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7fa]">
        <div className="spinner" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: '/organizer', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/organizer/events', label: 'Events', icon: Calendar },
    { href: '/organizer/certificates', label: 'Certificates Studio', icon: Award },
    { href: '/organizer/recipients', label: 'Recipients Database', icon: Users },
    { href: '/organizer/analytics', label: 'Analytics & Logs', icon: BarChart3 },
    { href: '/organizer/settings', label: 'Organization Profile', icon: Settings },
  ];

  const orgName = user.organization?.name || `${user.name}'s Organization`;

  return (
    <div className="flex min-h-screen bg-[#f8f7fa] text-[#2f2b3d]">
      {/* ── Materio Sidebar ── */}
      <aside
        style={{
          width: sidebarOpen ? '260px' : '78px',
          background: '#ffffff',
          borderRight: '1px solid #dbdade',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="flex flex-col flex-shrink-0 z-30 shadow-sm"
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-[#ebebed] flex items-center justify-between">
          <Link href="/organizer" className="flex items-center gap-3 no-underline text-inherit overflow-hidden">
            <div className="w-10 h-10 bg-[#7367f0] flex items-center justify-center text-white flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            {sidebarOpen && (
              <div className="truncate">
                <div className="font-semibold text-sm tracking-tight text-[#2f2b3d] truncate">{orgName}</div>
                <div className="text-[10px] text-[#7367f0] uppercase tracking-wider flex items-center gap-1">
                  <span>Organizer Workspace</span>
                </div>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-[#a5a2ad] hover:text-[#2f2b3d] hover:bg-[#f8f7fa] transition-colors border-0 bg-transparent cursor-pointer"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Section Header */}
        {sidebarOpen && (
          <div className="px-5 pt-5 pb-2 text-[10px] text-[#a5a2ad] uppercase tracking-wider">
            Management Portal
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/organizer' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 text-xs tracking-wide transition-all no-underline ${
                  isActive
                    ? 'bg-[#7367f0] text-white shadow-sm font-medium'
                    : 'text-[#5d596c] hover:text-[#2f2b3d] hover:bg-[#f4f5fa]'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#7367f0]'}`} />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </div>
              </Link>
            );
          })}

          {user.role === 'SUPER_ADMIN' && sidebarOpen && (
            <div className="pt-4 mt-4 border-t border-[#ebebed]">
              <Link
                href="/admin"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-[#00bad1] hover:bg-[#00bad1]/10 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Super Admin Portal</span>
              </Link>
            </div>
          )}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-[#ebebed] bg-[#fafafc]">
          {sidebarOpen ? (
            <div className="flex items-center justify-between gap-2 p-2 bg-white border border-[#dbdade]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 bg-[#7367f0]/10 border border-[#7367f0]/20 flex items-center justify-center text-[#7367f0] font-bold text-xs flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#2f2b3d] truncate">{user.name}</div>
                  <div className="text-[10px] text-[#6f6b7d] truncate">{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-[#6f6b7d] hover:text-[#ea5455] hover:bg-[#ea5455]/10 transition-colors border-0 bg-transparent cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 text-[#6f6b7d] hover:text-[#ea5455] hover:bg-[#ea5455]/10 transition-colors border-0 bg-transparent cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main Content Area with Materio Top Header ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Materio Top Header Bar */}
        <header className="h-16 bg-white border-b border-[#dbdade] px-6 md:px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-20 shadow-xs">
          {/* Search Box with ⌘K */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#a5a2ad]" />
            <input
              type="text"
              placeholder="Search (Ctrl+/)"
              className="w-full text-xs text-[#2f2b3d] bg-transparent border-none outline-none placeholder-[#a5a2ad]"
            />
            <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#f8f7fa] border border-[#dbdade] text-[10px] font-mono text-[#a5a2ad]">
              <Command className="w-2.5 h-2.5" /> K
            </span>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#f8f7fa] border border-[#dbdade] text-xs font-semibold text-[#2f2b3d]">
              <Building2 className="w-3.5 h-3.5 text-[#7367f0]" />
              <span className="truncate max-w-[200px]">{orgName}</span>
            </div>

            <button
              onClick={handleLogout}
              className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-[#6f6b7d]" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main View Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
