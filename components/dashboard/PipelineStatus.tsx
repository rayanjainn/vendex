"use client";

import { PipelineStage } from "@/lib/types";
import { CheckCircle2, Clock, Loader2, XCircle, Download, Cpu, Search, DatabaseZap, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PipelineStatusProps {
  stages: PipelineStage[];
  status: string;
}

const STAGE_META: Record<string, { label: string; icon: any; description: string }> = {
  downloading: { label: "Download Reel", icon: Download, description: "Fetching video via yt-dlp" },
  extracting:  { label: "Extract Frames", icon: Cpu, description: "Scoring frames with OpenCV" },
searching:   { label: "Search Alibaba", icon: Search, description: "Scraping supplier pages" },
  normalizing: { label: "Save Results", icon: DatabaseZap, description: "Persisting to database" },
  complete:    { label: "Complete", icon: Package, description: "Pipeline finished" },
};

export function PipelineStatus({ stages, status }: PipelineStatusProps) {
  const isFailed = status === "failed";

  // Merge backend stages with known stage meta for richer display
  const enrichedStages = stages.length > 0
    ? stages.map(s => ({
        ...s,
        meta: STAGE_META[s.stage] ?? { label: s.stage, icon: Clock, description: s.message },
      }))
    : Object.entries(STAGE_META).slice(0, 5).map(([key, meta]) => ({
        stage: key,
        status: "pending" as const,
        message: meta.description,
        durationMs: undefined as number | undefined,
        timestamp: "",
        meta,
      }));

  return (
    <div className="space-y-1">
      {enrichedStages.map((stage, idx) => {
        const isRunning = stage.status === "running";
        const isDone = stage.status === "done";
        const isFailedStage = stage.status === "failed";
        const Icon = stage.meta.icon;

        return (
          <div key={`${stage.stage}-${idx}`} className="relative flex items-start gap-3">
            {/* Connector line */}
            {idx < enrichedStages.length - 1 && (
              <div className={cn(
                "absolute left-[15px] top-8 w-0.5 h-[calc(100%-4px)]",
                isDone ? "bg-emerald-300" : "bg-slate-200"
              )} />
            )}

            {/* Step dot */}
            <div className={cn(
              "flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center z-10 bg-white transition-all",
              isDone ? "border-emerald-500 text-emerald-600" :
              isRunning ? "border-indigo-500 text-indigo-600 shadow-md shadow-indigo-100" :
              isFailedStage ? "border-red-400 text-red-500" :
              "border-slate-200 text-slate-300"
            )}>
              {isRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isDone ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : isFailedStage ? (
                <XCircle className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
            </div>

            {/* Step content */}
            <div className={cn(
              "flex-1 pb-4 pt-0.5",
              idx === enrichedStages.length - 1 && "pb-0"
            )}>
              <div className="flex items-center justify-between gap-2">
                <span className={cn(
                  "text-sm font-medium",
                  isDone ? "text-slate-700" :
                  isRunning ? "text-indigo-700 font-semibold" :
                  isFailedStage ? "text-red-600" :
                  "text-slate-400"
                )}>
                  {stage.meta.label}
                </span>
                <div className="flex items-center gap-1.5">
                  {stage.durationMs && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-slate-200 text-slate-400 font-normal tabular-nums">
                      {stage.durationMs < 1000
                        ? `${stage.durationMs}ms`
                        : `${(stage.durationMs / 1000).toFixed(1)}s`}
                    </Badge>
                  )}
                  {isRunning && (
                    <Badge className="text-[10px] h-4 px-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 font-medium">
                      Running
                    </Badge>
                  )}
                </div>
              </div>
              <p className={cn(
                "text-xs mt-0.5",
                isRunning ? "text-indigo-500" : "text-slate-400"
              )}>
                {stage.message || stage.meta.description}
              </p>
            </div>
          </div>
        );
      })}

      {isFailed && (
        <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
          <XCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <p>Pipeline failed. Check the reel URL and try again.</p>
        </div>
      )}
    </div>
  );
}
