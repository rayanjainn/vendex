"use client";

import { useJobStore } from "@/stores/jobStore";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Camera, Play, Video, MoreHorizontal, Eye, Box, Sparkles, Clock, Globe } from "lucide-react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ReactNode, useEffect } from "react";
import { ReelJob } from "@/lib/types";
import { useJobStream } from "@/hooks/useJobStream";
import { cn } from "@/lib/utils";

const platformIcons: Record<string, ReactNode> = {
  instagram: <Camera className="h-4 w-4 text-indigo-500" />,
  tiktok: <Video className="h-4 w-4 text-slate-900 dark:text-white" />,
  youtube: <Play className="h-4 w-4 text-red-500" />,
  facebook: <Video className="h-4 w-4 text-blue-500" />,
  other: <Globe className="h-4 w-4 text-slate-400" />
};

export function JobTable() {
  const { jobs, fetchJobs } = useJobStore();
  const recentJobs = jobs.slice(0, 8);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  return (
    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
        <div className="flex flex-col">
           <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Active Pipelines</h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time sourcing intelligence</p>
        </div>
        <Link href="/jobs">
          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5 font-black tracking-widest text-[10px] uppercase">
            View All Pipelines
          </Button>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-950/50">
            <TableRow className="border-slate-100 dark:border-slate-900">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-8">Sourcing Core</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intelligence</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Signals</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentJobs.map((job) => (
              <JobTableRow key={job.id} job={job} />
            ))}
            {recentJobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                     <Box className="h-10 w-10 text-slate-200 dark:text-slate-800" />
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No active agents deployed</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function JobTableRow({ job: initialJob }: { job: ReelJob }) {
  const { job: streamedJob } = useJobStream(
    initialJob.status !== 'complete' && initialJob.status !== 'failed' ? initialJob.id : null
  );
  const job = streamedJob || initialJob;

    const displayUrl = (() => {
      try {
        if (!job.reelUrl) return 'Direct Upload';
        const url = new URL(job.reelUrl);
        return url.pathname.length > 25 ? `${url.pathname.slice(0, 25)}...` : url.pathname;
      } catch (e) {
        return 'Invalid URL';
      }
    })();

    return (
      <TableRow 
        key={job.id} 
        className="hover:bg-slate-50 dark:hover:bg-slate-900/40 border-slate-100 dark:border-slate-900 transition-colors group cursor-pointer"
        onClick={() => {
          if (job.status === 'complete' || job.status === 'failed') {
            window.location.href = `/results/${job.id}`;
          }
        }}
      >
        <TableCell className="pl-8 py-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
              {platformIcons[job.platform] || platformIcons.other}
            </div>
            <div className="flex flex-col">
              <div onClick={(e) => e.stopPropagation()}>
                <a href={job.reelUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-primary transition-colors flex items-center gap-1.5">
                  {displayUrl}
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </div>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID:</span>
                 <span className="text-[10px] font-bold text-slate-500 font-mono tracking-tighter">{job.id}</span>
              </div>
            </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2 min-w-[140px]">
          <StatusPill status={job.status} />
          {job.status !== 'complete' && job.status !== 'failed' && (
            <div className="w-full bg-slate-100 dark:bg-slate-900 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-1000 shadow-[0_0_8px_rgba(79,70,229,0.5)]" 
                style={{ width: `${job.progressPercent || 0}%` }}
              />
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {job.extractedFrameUrl ? (
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
               <img src={job.extractedFrameUrl} alt="Vision" className="h-full w-full object-cover" />
               <div className="absolute inset-0 bg-black/5" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight mb-1">
                {job.detectedProductName || 'Vision Syncing...'}
              </p>
              <div className="flex flex-wrap gap-1">
                 {job.detectedKeywords?.slice(0, 2).map((k, i) => (
                    <span key={i} className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                       {k}
                    </span>
                 ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
             <div className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center animate-pulse">
                <Sparkles className="h-3 w-3 text-slate-400" />
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identifying...</span>
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
           <div className={cn(
             "h-9 w-9 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950",
             job.resultCount && job.resultCount > 0 ? "text-primary" : "text-slate-300"
           )}>
              <Globe className="h-4 w-4" />
           </div>
           <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{job.resultCount || 0}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Matches</span>
           </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
           <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Clock className="h-3 w-3" />
              <span className="text-xs font-bold">
                {(() => {
                  try {
                    const d = new Date(job.createdAt);
                    return isNaN(d.getTime()) ? 'Just now' : formatDistanceToNow(d, { addSuffix: true });
                  } catch (e) {
                    return 'Just now';
                  }
                })()}
              </span>
           </div>
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Agent Ingested</span>
        </div>
      </TableCell>
      <TableCell className="text-right pr-8">
        <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
          {(job.status === 'complete' || job.status === 'failed') && (
            <Link href={`/results/${job.id}`}>
              <Button size="sm" className="h-10 px-5 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 transition-all font-black uppercase tracking-widest text-[9px] gap-2 border-0">
                <Eye className="h-4 w-4" />
                Inspect
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-100 dark:border-slate-800">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
    );
}
