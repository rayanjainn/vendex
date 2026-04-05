"use client";

import { Bell, UserCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

export function TopBar() {
  const { sidebarOpen } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <header className={cn(
      "h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 transition-all duration-300 ease-in-out fixed top-0 right-0 z-30",
      mounted && sidebarOpen ? "left-56" : "left-16",
      !mounted && "left-56"
    )}>
      <div className="flex items-center flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search suppliers, jobs..."
            className="w-full pl-9 h-9 bg-slate-50 border-slate-200 rounded-lg text-sm text-slate-600 placeholder:text-slate-400 focus-visible:ring-indigo-500/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />
        </Button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-slate-700 leading-none">Rayan Jain</p>
            <p className="text-[10px] text-indigo-500 font-medium mt-0.5">Admin</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
            <UserCircle className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
