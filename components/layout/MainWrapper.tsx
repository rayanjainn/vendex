"use client";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useState } from "react";

export function MainWrapper({ children }: { children: ReactNode }) {
  const { sidebarOpen } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <main className={cn(
      "transition-all duration-300 ease-in-out pt-16 min-h-screen bg-slate-50",
      mounted && sidebarOpen ? "pl-56" : "pl-16",
      !mounted && "pl-56"
    )}>
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
        {children}
      </div>
    </main>
  );
}
