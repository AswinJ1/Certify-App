'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Calendar,
  Award,
  Users,
  BarChart3,
  Settings,
  ShieldCheck,
  Building2,
  ChevronsUpDown,
  LogOut,
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

  const orgName = user.organization?.name || `${user.name}'s Organization`;
  const orgLogo = user.organization?.logo;

  const navItems = [
    { href: '/organizer', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/organizer/events', label: 'Events', icon: Calendar },
    { href: '/organizer/certificates', label: 'Certificates Studio', icon: Award },
    { href: '/organizer/recipients', label: 'Recipients Database', icon: Users },
    { href: '/organizer/analytics', label: 'Analytics & Logs', icon: BarChart3 },
    { href: '/organizer/settings', label: 'Organization Profile', icon: Settings },
  ];

  // Derive current page title for breadcrumb
  const currentNav = navItems.find(
    (item) => item.href === pathname || (item.href !== '/organizer' && pathname.startsWith(item.href))
  );
  const pageTitle = currentNav ? currentNav.label : 'Management Portal';

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-[#ebebed] bg-white">
        {/* ── Sidebar Header: Organization Switcher ── */}
        <SidebarHeader className="border-b border-[#ebebed] p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-[#f8f7fa] data-[state=open]:text-[#2f2b3d] hover:bg-[#f8f7fa] transition-colors"
                    >
                      <div className="flex aspect-square size-8 items-center justify-center bg-[#7367f0] text-white flex-shrink-0">
                        {orgLogo ? (
                          <img src={orgLogo} alt={orgName} className="size-6 object-contain" />
                        ) : (
                          <Building2 className="size-4" />
                        )}
                      </div>
                      <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
                        <span className="truncate font-semibold text-black">
                          {orgName}
                        </span>
                        <span className="truncate text-[10px] text-[#7367f0]">
                          Organizer Workspace
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-3.5 text-[#a5a2ad]" />
                    </SidebarMenuButton>
                  }
                />
                <DropdownMenuContent
                  className="w-56 bg-white border border-[#dbdade] p-1.5 shadow-lg"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-[10px] text-[#6f6b7d] uppercase tracking-wider px-2 py-1">
                    Current Organization
                  </DropdownMenuLabel>
                  <DropdownMenuItem className="gap-2.5 p-2 text-xs text-black cursor-pointer hover:bg-[#f8f7fa]">
                    <Building2 className="size-4 text-[#7367f0]" />
                    <span className="truncate font-medium">{orgName}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#ebebed]" />
                  <DropdownMenuItem
                    onClick={() => router.push('/organizer/settings')}
                    className="gap-2.5 p-2 text-xs text-black cursor-pointer hover:bg-[#f8f7fa]"
                  >
                    <Settings className="size-4 text-[#6f6b7d]" />
                    <span>Organization Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* ── Sidebar Content: Navigation Links ── */}
        <SidebarContent className="p-2 space-y-4">
          <SidebarGroup>
            {/* <SidebarGroupLabel className="text-[10px] text-[#a5a2ad] uppercase tracking-wider px-2">
              Management Portal
            </SidebarGroupLabel> */}
            <SidebarMenu className="space-y-0.5 mt-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || (item.href !== '/organizer' && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={
                        <Link href={item.href} className="flex items-center gap-2.5">
                          <Icon className={`size-4 flex-shrink-0 ${isActive ? '' : ''}`} />
                          <span>{item.label}</span>
                        </Link>
                      }
                      isActive={isActive}
                      tooltip={item.label}
                      className={` py-2 px-2.5 transition-all ${
                        isActive
                          ? ' shadow-xs'
                          : 'text-black'
                      }`}
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>

          {/* Super Admin Switcher (if super admin) */}
          {user.role === 'SUPER_ADMIN' && (
            <SidebarGroup className="pt-2 border-t border-[#ebebed]">
              <SidebarGroupLabel className="text-[10px] text-[#a5a2ad] uppercase tracking-wider px-2">
                Administration
              </SidebarGroupLabel>
              <SidebarMenu className="mt-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={
                      <Link href="/admin" className="flex items-center gap-2.5">
                        <ShieldCheck className="size-4 flex-shrink-0 text-[#00bad1]" />
                        <span>Super Admin Portal</span>
                      </Link>
                    }
                    tooltip="Super Admin Portal"
                    className="text-xs text-[#00bad1] hover:bg-[#00bad1]/10 hover:text-[#00bad1] py-2 px-2.5"
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}
        </SidebarContent>

        {/* ── Sidebar Footer: User Profile & Actions ── */}
        <SidebarFooter className="border-t border-[#ebebed] p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-[#f8f7fa] hover:bg-[#f8f7fa] transition-colors"
                    >
                      <img
                        src="/Avatar/1.png"
                        alt={user.name}
                        className="size-8 border border-[#dbdade] object-cover bg-[#f8f7fa] flex-shrink-0"
                      />
                      <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
                        <span className="truncate font-semibold text-black">
                          {user.name}
                        </span>
                        <span className="truncate text-[10px] text-[#6f6b7d]">
                          {user.email}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-3.5 text-[#a5a2ad]" />
                    </SidebarMenuButton>
                  }
                />
                <DropdownMenuContent
                  className="w-56 bg-white border border-[#dbdade] p-1.5 shadow-lg"
                  side="right"
                  align="end"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="p-2 text-xs font-normal">
                    <div className="flex items-center gap-2">
                      <img
                        src="/Avatar/1.png"
                        alt={user.name}
                        className="size-7 border border-[#dbdade] object-cover bg-[#f8f7fa] flex-shrink-0"
                      />
                      <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
                        <span className="truncate font-semibold text-black">{user.name}</span>
                        <span className="truncate text-[10px] text-[#6f6b7d]">{user.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#ebebed]" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => router.push('/organizer/settings')}
                      className="gap-2 p-2 text-xs text-black cursor-pointer hover:bg-[#f8f7fa]"
                    >
                      <Settings className="size-3.5 text-[#6f6b7d]" />
                      <span>Account & Settings</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-[#ebebed]" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="gap-2 p-2 text-xs text-[#ea5455] cursor-pointer hover:bg-[#ea5455]/10"
                    >
                      <LogOut className="size-3.5" />
                      <span>Log Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* ── Main Inset Container ── */}
      <SidebarInset className="bg-[#f8f7fa] min-h-screen flex flex-col">
        {/* Modern Minimal Breadcrumb Bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[#ebebed] bg-white px-4">
          <SidebarTrigger className="-ml-1 text-[#6f6b7d] hover:text-black cursor-pointer" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-[#ebebed]" />
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              <BreadcrumbItem>
                <BreadcrumbLink href="/organizer" className="text-[#6f6b7d] hover:text-black no-underline">
                  Organizer
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-[#a5a2ad]" />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-black">
                  {pageTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Content View Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
