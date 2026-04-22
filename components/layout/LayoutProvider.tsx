'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MainWrapper } from "@/components/layout/MainWrapper";
import { Toaster } from "@/components/ui/sonner";

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return (
      <>
        {children}
        <Toaster position="top-right" theme="light" />
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <TopBar />
      <MainWrapper>
        {children}
      </MainWrapper>
      <Toaster position="top-right" theme="light" />
    </>
  );
}
