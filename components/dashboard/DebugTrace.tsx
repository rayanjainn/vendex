"use client";

import { useState } from "react";
import {
  Terminal,
  ChevronDown,
  ChevronRight,
  Activity,
  Cpu,
  Search,
  Database,
  Download,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEvent {
  timestamp: string;
  stage: string;
  message: string;
  data?: any;
}

interface DebugTraceProps {
  logs: LogEvent[];
}

const stageIcons: Record<string, any> = {
  download: Download,
  extract: Cpu,
  identify: Search,
  search: Activity,
  normalize: Database,
  pipeline: Terminal,
};

const stageColors: Record<string, string> = {
  download: "bg-blue-50 text-blue-600 border-blue-200",
  extract: "bg-violet-50 text-violet-600 border-violet-200",
  search: "bg-amber-50 text-amber-700 border-amber-200",
  normalize: "bg-teal-50 text-teal-600 border-teal-200",
  pipeline: "bg-slate-100 text-slate-600 border-slate-200",
};

export function DebugTrace({ logs = [] }: DebugTraceProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (!logs || logs.length === 0) {
    return (
      <div className="p-10 text-center bg-slate-950 rounded-xl border border-slate-800">
        <Terminal className="h-7 w-7 text-slate-600 mx-auto mb-3" />
        <p className="text-sm text-slate-500">
          No trace events yet — logs appear here as the pipeline runs.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5" />
          Pipeline Trace
        </h3>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
          {logs.length} events
        </span>
      </div>

      {/* Log list */}
      <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
        {logs.map((log, idx) => {
          const Icon = stageIcons[log.stage] ?? Activity;
          const colorClass = stageColors[log.stage] ?? stageColors.pipeline;
          const isSuccess = log.message.startsWith("[") && log.message.includes("✓");
          const isFail = log.message.startsWith("[") && log.message.includes("✗");
          const hasData = log.data && Object.keys(log.data).length > 0;

          return (
            <div key={idx} className="group">
              <button
                onClick={() => hasData ? setExpandedIdx(expandedIdx === idx ? null : idx) : undefined}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors",
                  hasData ? "hover:bg-slate-900 cursor-pointer" : "cursor-default",
                )}
              >
                {/* Stage badge */}
                <span className={cn(
                  "flex-shrink-0 mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border",
                  colorClass,
                )}>
                  <Icon className="h-2.5 w-2.5" />
                  {log.stage}
                </span>

                {/* Message */}
                <span className={cn(
                  "flex-1 text-xs leading-5",
                  isSuccess ? "text-emerald-400" :
                  isFail ? "text-red-400" :
                  "text-slate-300",
                )}>
                  {isSuccess && <CheckCircle2 className="h-3 w-3 inline mr-1 text-emerald-500" />}
                  {isFail && <XCircle className="h-3 w-3 inline mr-1 text-red-500" />}
                  {log.message}
                </span>

                {/* Time + expand */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-slate-600 font-mono tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {hasData && (
                    expandedIdx === idx
                      ? <ChevronDown className="h-3 w-3 text-slate-500" />
                      : <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-400" />
                  )}
                </div>
              </button>

              {expandedIdx === idx && hasData && (
                <div className="px-4 pb-3">
                  <pre className="text-[11px] font-mono text-slate-400 bg-black rounded border border-slate-800 p-3 overflow-x-auto max-h-48">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
