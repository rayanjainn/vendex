"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, LayoutDashboard, ListTodo, Search, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: ListTodo },
  { href: '/results', label: 'Catalog', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out",
      "bg-white border-r border-slate-200 flex flex-col shadow-sm",
      sidebarOpen ? "w-56" : "w-16"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-slate-100",
        sidebarOpen ? "px-5 gap-3" : "justify-center"
      )}>
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Zap className="h-4 w-4 text-white" />
        </div>
        {sidebarOpen && (
          <div>
            <span className="text-sm font-bold text-slate-900 tracking-tight">ReelSource</span>
            <span className="block text-[10px] font-medium text-indigo-500 tracking-wider leading-none mt-0.5">LENS AI</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) || (pathname === '/' && item.href === '/dashboard');
          return (
            <Link key={item.href} href={item.href}
              title={!sidebarOpen ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                !sidebarOpen && "justify-center"
              )}
            >
              <item.icon className={cn(
                "h-4.5 w-4.5 flex-shrink-0",
                isActive ? "text-indigo-600" : "text-slate-400"
              )} style={{ height: '18px', width: '18px' }} />
              {sidebarOpen && <span>{item.label}</span>}
              {isActive && sidebarOpen && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-100 p-3">
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all text-xs font-medium",
            !sidebarOpen && "justify-center"
          )}
        >
          {sidebarOpen ? (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
