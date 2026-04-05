"use client";

import { useJobStore } from "@/stores/jobStore";
import { formatDistanceToNow } from "date-fns";
import {
  Camera, PlaySquare, Video, CheckCircle2, Clock, Loader2,
  Search, AlertCircle, ExternalLink, ChevronRight,
  Download, Cpu, Package, DatabaseZap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ReelJob } from "@/lib/types";
import { ReactNode, useEffect } from "react";
import { useJobStream } from "@/hooks/useJobStream";

const platformIcons: Record<string, ReactNode> = {
  instagram: <Camera className="h-4 w-4 text-pink-500" />,
  tiktok: <Video className="h-4 w-4 text-slate-700" />,
  youtube: <PlaySquare className="h-4 w-4 text-red-500" />,
  facebook: <Video className="h-4 w-4 text-blue-500" />,
  other: <Video className="h-4 w-4 text-slate-400" />,
};

const PIPELINE_STEPS = [
  { key: "downloading", label: "Download", icon: Download },
  { key: "extracting", label: "Extract Frames", icon: Cpu },
{ key: "searching", label: "Search Alibaba", icon: Search },
  { key: "normalizing", label: "Save Results", icon: DatabaseZap },
  { key: "complete", label: "Complete", icon: Package },
];


export default function JobsPage() {
  const { jobs, fetchJobs } = useJobStore();

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 8000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const activeJobs = jobs.filter(j => !["complete", "failed"].includes(j.status));
  const doneJobs = jobs.filter(j => ["complete", "failed"].includes(j.status));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Jobs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track the status of your sourcing pipeline runs.
        </p>
      </div>

      {jobs.length === 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-16 text-center">
            <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">No jobs yet</p>
            <p className="text-xs text-slate-400 mt-1">Submit a reel URL from the dashboard to get started.</p>
            <Link href="/dashboard">
              <Button size="sm" className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeJobs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Running ({activeJobs.length})
              </h2>
              {activeJobs.map(job => <JobCard key={job.id} initialJob={job} />)}
            </div>
          )}

          {doneJobs.length > 0 && (
            <div className="space-y-3">
              {activeJobs.length > 0 && (
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6">
                  Completed ({doneJobs.length})
                </h2>
              )}
              {doneJobs.map(job => <JobCard key={job.id} initialJob={job} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JobCard({ initialJob }: { initialJob: ReelJob }) {
  const { job: streamedJob } = useJobStream(
    !["complete", "failed"].includes(initialJob.status) ? initialJob.id : null
  );
  const job = streamedJob || initialJob;

  const isComplete = job.status === "complete";
  const isFailed = job.status === "failed";
  const isRunning = !isComplete && !isFailed;
  const timeAgo = (() => {
    try {
      const d = new Date(job.createdAt);
      return isNaN(d.getTime()) ? "Just now" : formatDistanceToNow(d, { addSuffix: true });
    } catch { return "Just now"; }
  })();

  return (
    <Card className={cn(
      "border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden",
      isFailed && "border-red-200",
      isRunning && "border-indigo-200 shadow-indigo-50"
    )}>
      {/* Top progress bar for running jobs */}
      {isRunning && (
        <div className="h-0.5 bg-slate-100">
          <div
            className="h-full bg-indigo-500 transition-all duration-700 ease-out"
            style={{ width: `${job.progressPercent || 5}%` }}
          />
        </div>
      )}

      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 border",
              isComplete ? "bg-emerald-50 border-emerald-200" :
              isFailed ? "bg-red-50 border-red-200" :
              "bg-indigo-50 border-indigo-200"
            )}>
              {platformIcons[job.platform]}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {job.label && (
                  <span className="text-sm font-semibold text-slate-800 truncate max-w-xs">{job.label}</span>
                )}
                <code className="text-[11px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                  {job.id}
                </code>
                <span className="text-[11px] text-slate-400">{timeAgo}</span>
              </div>
              <a
                href={job.reelUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 max-w-xs truncate"
              >
                <span className="truncate">{job.reelUrl}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0 text-slate-400" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={job.status} />
            <Link href={`/results/${job.id}`}>
              <Button
                size="sm"
                variant={isComplete ? "default" : "outline"}
                className={cn(
                  "h-7 text-xs gap-1",
                  isComplete && "bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                )}
              >
                {isComplete ? `${job.resultCount ?? 0} Results` : "View"}
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Detected product chip */}
        {job.detectedProductName && (
          <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            {job.extractedFrameUrl && (
              <img
                src={job.extractedFrameUrl}
                alt=""
                className="h-8 w-8 rounded object-cover flex-shrink-0 border border-slate-200"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{job.detectedProductName}</p>
              {job.detectedKeywords?.length ? (
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {job.detectedKeywords.slice(0, 5).join(" · ")}
                </p>
              ) : null}
            </div>
          </div>
        )}

        {/* Pipeline steps for running jobs */}
        {isRunning && (
          <div className="mt-2">
            <PipelineSteps currentStatus={job.status} />
          </div>
        )}

        {/* Error message */}
        {isFailed && job.errorMessage && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <p>{job.errorMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PipelineSteps({ currentStatus }: { currentStatus: string }) {
  const currentIdx = PIPELINE_STEPS.findIndex(s => s.key === currentStatus);

  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STEPS.slice(0, -1).map((step, idx) => {
        const isDone = currentIdx > idx || currentStatus === "complete";
        const isActive = currentIdx === idx;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center gap-1 flex-1 min-w-0">
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium flex-1 min-w-0 transition-colors",
              isDone ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
              isActive ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
              "bg-slate-50 text-slate-400 border border-slate-100"
            )}>
              {isActive ? (
                <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
              ) : isDone ? (
                <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
              ) : (
                <Icon className="h-3 w-3 flex-shrink-0" />
              )}
              <span className="truncate hidden sm:block">{step.label}</span>
            </div>
            {idx < PIPELINE_STEPS.length - 2 && (
              <ChevronRight className={cn("h-3 w-3 flex-shrink-0", isDone ? "text-emerald-400" : "text-slate-300")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-slate-100 text-slate-600 border-slate-200" },
    downloading: { label: "Downloading", className: "bg-blue-50 text-blue-700 border-blue-200" },
    extracting: { label: "Extracting", className: "bg-violet-50 text-violet-700 border-violet-200" },
searching: { label: "Searching", className: "bg-amber-50 text-amber-700 border-amber-200" },
    normalizing: { label: "Saving", className: "bg-teal-50 text-teal-700 border-teal-200" },
    complete: { label: "Complete", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    failed: { label: "Failed", className: "bg-red-50 text-red-700 border-red-200" },
  };

  const c = config[status] ?? config.pending;
  return (
    <Badge variant="outline" className={cn("text-[10px] font-semibold h-5 px-2 border", c.className)}>
      {c.label}
    </Badge>
  );
}
