import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MainWrapper } from "@/components/layout/MainWrapper";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReelSource",
  description: "Sourcing intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-700")}>
        <Sidebar />
        <TopBar />
        <MainWrapper>
          {children}
        </MainWrapper>
        <Toaster position="top-right" theme="light" />
      </body>
    </html>
  );
}
