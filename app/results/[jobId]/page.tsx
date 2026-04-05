"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FilterPanel } from "@/components/dashboard/FilterPanel";
import { SupplierGrid } from "@/components/dashboard/SupplierGrid";
import { SupplierTable } from "@/components/dashboard/SupplierTable";
import { CompareDrawer } from "@/components/dashboard/CompareDrawer";
import { ExportMenu } from "@/components/dashboard/ExportMenu";
import { DebugTrace } from "@/components/dashboard/DebugTrace";
import { PipelineStatus } from "@/components/dashboard/PipelineStatus";
import { useJobStream } from "@/hooks/useJobStream";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useJobStore } from "@/stores/jobStore";
import { useSupplierStore } from "@/stores/supplierStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LayoutGrid,
  List,
  ChevronLeft,
  Loader2,
  Search,
  ExternalLink,
  AlertCircle,
  Terminal,
  Package,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ViewMode = "card" | "table" | "debug";

export default function ResultsPage() {
  const params = useParams();
  const jobId = typeof params?.jobId === "string" ? params.jobId : "";

  const { jobs, fetchJobs } = useJobStore();
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [mounted, setMounted] = useState(false);

  const initialJob = jobs.find((j) => j.id === jobId);

  const { job: streamedJob } = useJobStream(
    initialJob &&
      initialJob.status !== "complete" &&
      initialJob.status !== "failed"
      ? jobId
      : null,
  );
  const job = streamedJob || initialJob;

  const {
    suppliers: allSuppliers,
    isLoading: loadingSuppliers,
    mutate: mutateSuppliers,
  } = useSuppliers(jobId);
  const { filteredAndSortedSuppliers } = useSupplierStore();
  const suppliers = filteredAndSortedSuppliers(jobId);
  const totalCount = allSuppliers.filter((s) => s.jobId === jobId).length;

  useEffect(() => {
    setMounted(true);
    if (!initialJob) fetchJobs();
  }, [fetchJobs, jobId, initialJob]);

  useEffect(() => {
    if (job?.status === "complete") mutateSuppliers();
  }, [job?.status, mutateSuppliers]);

  if (!mounted) return null;

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Search className="h-10 w-10 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-800 mb-1">
          Job not found
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          Could not locate job{" "}
          <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
            {jobId}
          </code>
        </p>
        <Link href="/jobs">
          <Button variant="outline" size="sm">
            Back to Jobs
          </Button>
        </Link>
      </div>
    );
  }

  const isComplete = job.status === "complete";
  const isFailed = job.status === "failed";
  const isRunning = !isComplete && !isFailed;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <Link href="/jobs">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-200 flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {job.label || job.detectedProductName || `Job ${jobId.slice(0, 8)}`}
              </h1>
              <StatusChip status={job.status} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <a
                href={job.reelUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-slate-600 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Source Reel
              </a>
              <span>·</span>
              <code className="font-mono">{jobId}</code>
            </div>
          </div>
        </div>

        {/* View mode + export */}
        {isComplete && (
          <div className="flex items-center gap-2">
            <ExportMenu suppliers={suppliers} />
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
              {(
                [
                  { key: "card", icon: LayoutGrid, label: "Grid" },
                  { key: "table", icon: List, label: "Table" },
                  { key: "debug", icon: Terminal, label: "Trace" },
                ] as const
              ).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-r border-slate-200 last:border-0 transition-colors",
                    viewMode === key
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!isComplete && (
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => setViewMode("card")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-r border-slate-200 transition-colors",
                viewMode !== "debug"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
              )}
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode("debug")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                viewMode === "debug"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
              )}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Trace</span>
            </button>
          </div>
        )}
      </div>

      {/* Debug trace view */}
      {viewMode === "debug" ? (
        <div className="max-w-3xl">
          <DebugTrace logs={job.detailedLogs || []} />
        </div>
      ) : isRunning ? (
        /* Pipeline running state */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          {/* Progress card */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="relative h-20 w-20 mb-6">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="hsl(238 84% 67%)"
                    strokeWidth="2.5"
                    strokeDasharray={`${job.progressPercent || 5} ${100 - (job.progressPercent || 5)}`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-bold text-slate-800 tabular-nums">
                    {job.progressPercent || 0}%
                  </span>
                </div>
              </div>
              <h2 className="text-base font-semibold text-slate-800 capitalize mb-1">
                {job.status.replace("_", " ")}
              </h2>
              <p className="text-xs text-slate-500 max-w-xs">
                AI agents are analyzing the reel and finding verified suppliers
                on Alibaba.
              </p>
              {job.detectedProductName && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 max-w-full">
                  {job.extractedFrameUrl && (
                    <img
                      src={job.extractedFrameUrl}
                      alt=""
                      className="h-8 w-8 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <span className="truncate font-medium">
                    {job.detectedProductName}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline stages */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-800">
                Pipeline Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <PipelineStatus
                stages={job.pipelineStages || []}
                status={job.status}
              />
            </CardContent>
          </Card>
        </div>
      ) : isFailed ? (
        /* Failed state */
        <Card className="border-red-200 shadow-sm max-w-xl">
          <CardContent className="p-8 text-center">
            <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-base font-semibold text-slate-800 mb-1">
              Processing Failed
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              {job.errorMessage ||
                "Something went wrong during product identification."}
            </p>
            <Link href="/jobs">
              <Button size="sm" variant="outline" className="border-slate-200">
                Back to Jobs
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Results view */
        <div className="flex gap-5 items-start">
          <FilterPanel />

          <div className="flex-1 min-w-0 space-y-4">
            {/* Results header bar */}
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Badge
                  variant="secondary"
                  className="bg-indigo-50 text-indigo-700 border-0 text-xs px-2.5"
                >
                  {suppliers.length}
                  {totalCount !== suppliers.length && ` / ${totalCount}`}{" "}
                  suppliers
                </Badge>
                {job.detectedProductName && (
                  <span className="text-xs text-slate-500">
                    for{" "}
                    <span className="font-medium text-slate-700">
                      {job.detectedProductName}
                    </span>
                  </span>
                )}
                {job.detectedKeywords?.length ? (
                  <div className="flex gap-1">
                    {job.detectedKeywords.slice(0, 3).map((kw) => (
                      <Badge
                        key={kw}
                        variant="outline"
                        className="text-[10px] h-5 border-slate-200 text-slate-500 font-normal px-1.5"
                      >
                        {kw}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-1.5">
                <ExportMenu suppliers={suppliers} />
              </div>
            </div>

            {loadingSuppliers ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
              </div>
            ) : suppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border border-slate-200 rounded-lg bg-white">
                <Package className="h-8 w-8 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">
                  No suppliers match your filters
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting the filters in the panel.
                </p>
              </div>
            ) : (
              <div>
                {viewMode === "card" && <SupplierGrid suppliers={suppliers} />}
                {viewMode === "table" && <SupplierTable suppliers={suppliers} />}
              </div>
            )}
          </div>
        </div>
      )}

      {isComplete && <CompareDrawer jobId={jobId} />}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    },
    downloading: {
      label: "Downloading",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    extracting: {
      label: "Extracting",
      className: "bg-violet-50 text-violet-700 border-violet-200",
    },
    searching: {
      label: "Searching",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    normalizing: {
      label: "Saving",
      className: "bg-teal-50 text-teal-700 border-teal-200",
    },
    complete: {
      label: "Complete",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    failed: {
      label: "Failed",
      className: "bg-red-50 text-red-600 border-red-200",
    },
  };
  const c = config[status] ?? config.pending;
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-semibold px-2 h-5 border", c.className)}
    >
      {c.label}
    </Badge>
  );
}
