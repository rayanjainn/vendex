"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileSpreadsheet,
  Upload,
  Trash2,
  Play,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useJobStore } from "@/stores/jobStore";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api-client";
import { CsvRow, ReelJob } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Live elapsed-time counter for a running job.
// Returns a formatted "Xm Ys" string, updating every second.
function useElapsedTime(
  startedAt: string | undefined,
  durationSeconds: number | undefined,
  isRunning: boolean,
) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isRunning || !startedAt) return;
    const update = () =>
      setElapsed(
        Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isRunning, startedAt]);
  const secs = isRunning ? elapsed : (durationSeconds ?? 0);
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

type UploadMeta = { uploadId: string; uploadName: string; rowCount: number };

type AppDialog =
  | { type: "error"; title: string; message: string }
  | { type: "confirm-delete"; uploadId: string; uploadName: string }
  | null;

export default function DashboardPage() {
  const { fetchJobs } = useJobStore();
  const { role } = useAuthStore();
  const isAdmin = role === "admin";

  const [uploads, setUploads] = useState<UploadMeta[]>([]);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingRows, setLoadingRows] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dialog, setDialog] = useState<AppDialog>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load all rows on mount (no upload filter = all uploads)
  const loadRows = useCallback(async (uploadId?: string) => {
    setLoadingRows(true);
    try {
      const { rows: fetched } = await apiClient.getCsvRows(uploadId);
      setRows(fetched);
      // Rebuild upload list from rows
      const seen = new Map<string, UploadMeta>();
      fetched.forEach((r) => {
        if (!seen.has(r.uploadId)) {
          seen.set(r.uploadId, {
            uploadId: r.uploadId,
            uploadName: r.uploadName,
            rowCount: 0,
          });
        }
        seen.get(r.uploadId)!.rowCount++;
      });
      setUploads(Array.from(seen.values()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRows(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
    fetchJobs();
  }, [loadRows, fetchJobs]);

  const displayedRows = activeUploadId
    ? rows.filter((r) => r.uploadId === activeUploadId)
    : rows;

  const handleFile = async (file: File) => {
    if (!file || !isAdmin) return;
    setUploading(true);
    try {
      const result = await apiClient.uploadCsv(file);
      await loadRows();
      setActiveUploadId(result.upload_id);
    } catch (e: any) {
      let msg = e.message;
      try {
        const parsed = JSON.parse(msg);
        if (parsed.detail) msg = parsed.detail;
      } catch {}
      setDialog({ type: "error", title: "Upload failed", message: msg });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const processable = filteredRows.filter((r) => r.productLink);
    if (selectedIds.size === processable.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processable.map((r) => r.id)));
    }
  };

  const handleProcess = async () => {
    if (selectedIds.size === 0 || !isAdmin) return;
    const selected = rows.filter(
      (r) => selectedIds.has(r.id) && r.productLink,
    );
    if (selected.length === 0) {
      setDialog({
        type: "error",
        title: "Nothing to process",
        message: "The selected rows have no product links.",
      });
      return;
    }
    setProcessing(true);
    try {
      await apiClient.createBatchJobs(
        selected.map((r) => ({
          url: r.productLink,
          label: r.skuName || r.srNo,
          csv_row_id: r.id,
        })),
      );
      await fetchJobs();
      setSelectedIds(new Set());
      setRows((prev) =>
        prev.map((r) =>
          selectedIds.has(r.id) ? { ...r, status: "processing" } : r,
        ),
      );
    } catch (e: any) {
      setDialog({
        type: "error",
        title: "Failed to start jobs",
        message: e.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUpload = (uploadId: string, uploadName: string) => {
    if (!isAdmin) return;
    setDialog({ type: "confirm-delete", uploadId, uploadName });
  };

  const confirmDelete = async () => {
    if (dialog?.type !== "confirm-delete") return;
    const { uploadId } = dialog;
    setDialog(null);
    try {
      await apiClient.deleteCsvUpload(uploadId);
      if (activeUploadId === uploadId) setActiveUploadId(null);
      await loadRows();
    } catch (e: any) {
      setDialog({ type: "error", title: "Delete failed", message: e.message });
    }
  };

  // Map csv_row_id → all jobs that reference it
  const { jobs } = useJobStore();
  const jobsByRow = new Map<string, ReelJob[]>();
  jobs.forEach((j) => {
    if (j.csvRowId) {
      if (!jobsByRow.has(j.csvRowId)) jobsByRow.set(j.csvRowId, []);
      jobsByRow.get(j.csvRowId)!.push(j);
    }
  });

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) =>
    setExpandedRows((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  type StatusFilter = "all" | "pending" | "done" | "failed";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Sort by SR. NO. numerically (handles "1", "2", … "10", "11" correctly)
  const sortedRows = [...displayedRows].sort((a, b) => {
    const n = (s: string) => parseInt(s?.replace(/\D/g, "") || "0", 10);
    return n(a.srNo) - n(b.srNo);
  });

  const filteredRows =
    statusFilter === "all"
      ? sortedRows
      : sortedRows.filter((r) => {
          if (statusFilter === "done") return r.status === "done";
          if (statusFilter === "pending") return r.status === "pending" || r.status === "processing";
          if (statusFilter === "failed") return r.status === "failed";
          return true;
        });

  const statusCounts = {
    all: sortedRows.length,
    pending: sortedRows.filter((r) => r.status === "pending" || r.status === "processing").length,
    done: sortedRows.filter((r) => r.status === "done").length,
    failed: sortedRows.filter((r) => r.status === "failed").length,
  };

  const processableSelected = filteredRows.filter(
    (r) => selectedIds.has(r.id) && r.productLink,
  ).length;
  const allProcessable = filteredRows.filter((r) => r.productLink);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload a sourcing CSV, select rows, and run the supplier search
            pipeline.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-slate-200 text-slate-500"
          onClick={() => loadRows(activeUploadId ?? undefined)}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left: upload sidebar */}
        <div className="xl:col-span-1 space-y-4">
          {/* Upload zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
              dragOver
                ? "border-indigo-400 bg-indigo-50"
                : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50",
            )}
            onClick={() => isAdmin && fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            {uploading ? (
              <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-2" />
            ) : (
              <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            )}
            <p className="text-xs font-medium text-slate-600">
              {uploading ? "Uploading…" : isAdmin ? "Drop CSV / Excel" : "Read Only Mode"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isAdmin ? "or click to browse" : "Upload disabled for viewers"}
            </p>
          </div>

          {/* Upload list */}
          {uploads.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Uploaded Files
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-3 space-y-1">
                <button
                  onClick={() => setActiveUploadId(null)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors",
                    activeUploadId === null
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="flex-1 truncate">All uploads</span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 border-0 bg-slate-200 text-slate-600"
                  >
                    {rows.length}
                  </Badge>
                </button>
                {uploads.map((u) => (
                  <div
                    key={u.uploadId}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors group",
                      activeUploadId === u.uploadId
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <button
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      onClick={() => setActiveUploadId(u.uploadId)}
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{u.uploadName}</span>
                    </button>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 border-0 bg-slate-200 text-slate-600 flex-shrink-0"
                    >
                      {u.rowCount}
                    </Badge>
                    <button
                      onClick={() =>
                        handleDeleteUpload(u.uploadId, u.uploadName)
                      }
                      className={cn(
                        "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all flex-shrink-0",
                        !isAdmin && "hidden"
                      )}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Expected columns info */}
          <Card className="border-slate-200 shadow-sm bg-slate-50">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Expected columns
              </p>
              {[
                "SR. NO.",
                "SENT BY",
                "SKU NAME",
                "PRODUCT LINK",
                "PRODUCT IMAGE",
                "INQUIRY SENT",
              ].map((col) => (
                <div
                  key={col}
                  className="text-[11px] text-slate-500 py-0.5 flex items-center gap-1.5"
                >
                  <span className="h-1 w-1 rounded-full bg-slate-400 flex-shrink-0" />
                  {col}
                </div>
              ))}
              <p className="text-[10px] text-slate-400 mt-2">
                Extra columns are preserved as metadata.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: table */}
        <div className="xl:col-span-3 space-y-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-slate-700">
                {activeUploadId
                  ? (uploads.find((u) => u.uploadId === activeUploadId)
                      ?.uploadName ?? "Upload")
                  : "All Rows"}
              </span>
              {/* Status filter pills */}
              {(
                [
                  { key: "all", label: "All" },
                  { key: "pending", label: "Pending" },
                  { key: "done", label: "Done" },
                  { key: "failed", label: "Failed" },
                ] as { key: StatusFilter; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors",
                    statusFilter === key
                      ? key === "done"
                        ? "bg-emerald-100 text-emerald-700"
                        : key === "failed"
                          ? "bg-red-100 text-red-600"
                          : "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                  )}
                >
                  {label}
                  <span className={cn(
                    "text-[10px] font-semibold tabular-nums",
                    statusFilter === key ? "opacity-100" : "opacity-60",
                  )}>
                    {statusCounts[key]}
                  </span>
                </button>
              ))}
              {selectedIds.size > 0 && (
                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5">
                  {selectedIds.size} selected
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-slate-400 gap-1"
                  onClick={() => setSelectedIds(new Set())}
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
                <Button
                  size="sm"
                  disabled={processableSelected === 0 || processing || !isAdmin}
                  onClick={handleProcess}
                  className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 disabled:opacity-50"
                >
                {processing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Process{" "}
                {processableSelected > 0
                  ? `${processableSelected} selected`
                  : "Selected"}
              </Button>
            </div>
          </div>

          {/* Table */}
          {loadingRows ? (
            <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-lg">
              <Loader2 className="h-5 w-5 text-slate-300 animate-spin" />
            </div>
          ) : sortedRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-xl text-center">
              <FileSpreadsheet className="h-10 w-10 text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-500">No rows yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Upload a CSV or Excel file to get started.
              </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 gap-1.5 border-slate-200"
                  disabled={!isAdmin}
                  onClick={() => isAdmin && fileRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload File
                </Button>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-lg text-center">
              <p className="text-sm font-medium text-slate-500">No {statusFilter} rows</p>
              <button
                onClick={() => setStatusFilter("all")}
                className="text-xs text-indigo-600 hover:underline mt-1"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="w-10 px-3 py-3">
                        <Checkbox
                          checked={
                            allProcessable.length > 0 &&
                            selectedIds.size === allProcessable.length
                          }
                          disabled={!isAdmin}
                          onCheckedChange={toggleAll}
                          className="border-slate-300"
                        />
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px] w-12">
                        #
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                        SKU Name
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                        Sent By
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                        Product Link
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                        Inquiry
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                        Jobs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((row) => {
                      const isSelectable = !!row.productLink;
                      const isSelected = selectedIds.has(row.id);
                      const rowJobs = jobsByRow.get(row.id) ?? [];
                      const isExpanded = expandedRows.has(row.id);
                      return (
                        <>
                          <tr
                            key={row.id}
                            className={cn(
                              "transition-colors",
                              isSelected
                                ? "bg-indigo-50/50"
                                : "hover:bg-slate-50",
                            )}
                          >
                            <td className="px-3 py-3">
                              <Checkbox
                                checked={isSelected}
                                disabled={!isSelectable}
                                onCheckedChange={() =>
                                  isSelectable && toggleRow(row.id)
                                }
                                className="border-slate-300"
                                disabled={!isAdmin}
                              />
                            </td>
                            <td className="px-3 py-3 text-slate-400 font-mono">
                              {row.srNo}
                            </td>
                            <td className="px-3 py-3 max-w-[180px]">
                              <span
                                className={cn(
                                  "font-medium text-slate-800 line-clamp-2",
                                  !row.skuName && "text-slate-300",
                                )}
                              >
                                {row.skuName || "—"}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
                              {row.sentBy || "—"}
                            </td>
                            <td className="px-3 py-3 max-w-[200px]">
                              {row.productLink ? (
                                <a
                                  href={row.productLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 truncate"
                                >
                                  <span className="truncate">
                                    {row.productLink.replace(
                                      /^https?:\/\//,
                                      "",
                                    )}
                                  </span>
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </a>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {row.inquirySent ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px] px-1.5 h-4">
                                  Sent
                                </Badge>
                              ) : (
                                <span className="text-slate-300 text-[10px]">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {rowJobs.length > 0 ? (
                                <button
                                  onClick={() => toggleExpand(row.id)}
                                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                  {rowJobs.length} run
                                  {rowJobs.length !== 1 ? "s" : ""}
                                </button>
                              ) : (
                                <RowStatusBadge status={row.status} />
                              )}
                            </td>
                          </tr>
                          {isExpanded &&
                            rowJobs.map((job) => (
                              <JobHistoryRow key={job.id} job={job} />
                            ))}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Error dialog */}
      <Dialog
        open={dialog?.type === "error"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {dialog?.type === "error" ? dialog.title : ""}
            </DialogTitle>
            <DialogDescription>
              {dialog?.type === "error" ? dialog.message : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" onClick={() => setDialog(null)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog
        open={dialog?.type === "confirm-delete"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete upload?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-slate-700">
                {dialog?.type === "confirm-delete" ? dialog.uploadName : ""}
              </span>{" "}
              and all its rows. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white border-0"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JobHistoryRow({ job }: { job: ReelJob }) {
  const isRunning = job.status !== "complete" && job.status !== "failed";
  const timer = useElapsedTime(job.createdAt, job.durationSeconds, isRunning);

  const statusConfig: Record<
    string,
    { label: string; className: string; icon?: React.ReactNode }
  > = {
    pending: {
      label: "Pending",
      className: "bg-slate-100 text-slate-500 border-0",
    },
    downloading: {
      label: "Downloading",
      className: "bg-blue-50 text-blue-700 border-0",
      icon: <Loader2 className="h-2.5 w-2.5 animate-spin" />,
    },
    extracting: {
      label: "Extracting",
      className: "bg-blue-50 text-blue-700 border-0",
      icon: <Loader2 className="h-2.5 w-2.5 animate-spin" />,
    },
    searching: {
      label: "Searching",
      className: "bg-blue-50 text-blue-700 border-0",
      icon: <Loader2 className="h-2.5 w-2.5 animate-spin" />,
    },
    normalizing: {
      label: "Normalizing",
      className: "bg-blue-50 text-blue-700 border-0",
      icon: <Loader2 className="h-2.5 w-2.5 animate-spin" />,
    },
    complete: {
      label: "Complete",
      className: "bg-emerald-50 text-emerald-700 border-0",
      icon: <CheckCircle2 className="h-2.5 w-2.5" />,
    },
    failed: {
      label: "Failed",
      className: "bg-red-50 text-red-600 border-0",
      icon: <AlertCircle className="h-2.5 w-2.5" />,
    },
  };
  const sc = statusConfig[job.status] ?? statusConfig.pending;

  return (
    <tr className="bg-slate-50/70 border-t border-slate-100">
      <td colSpan={7} className="px-6 py-2">
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="font-mono text-slate-400">{job.id}</span>
          <Badge className={cn("text-[10px] h-5 px-1.5 gap-1", sc.className)}>
            {sc.icon}
            {sc.label}
          </Badge>
          {timer && (
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="h-3 w-3" />
              {timer.toString().split(".")[0]}
            </span>
          )}
          {job.resultCount != null && job.resultCount > 0 && (
            <span className="text-slate-500">
              {job.resultCount} result{job.resultCount !== 1 ? "s" : ""}
            </span>
          )}
          {job.status === "complete" && (
            <Link
              href={`/results/${job.id}`}
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View results <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}

function RowStatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { label: string; className: string; icon?: React.ReactNode }
  > = {
    pending: {
      label: "Pending",
      className: "bg-slate-100 text-slate-500 border-0",
    },
    processing: {
      label: "Processing",
      className: "bg-blue-50 text-blue-700 border-0",
      icon: <Loader2 className="h-2.5 w-2.5 animate-spin" />,
    },
    done: {
      label: "Done",
      className: "bg-emerald-50 text-emerald-700 border-0",
      icon: <CheckCircle2 className="h-2.5 w-2.5" />,
    },
    failed: {
      label: "Failed",
      className: "bg-red-50 text-red-600 border-0",
      icon: <AlertCircle className="h-2.5 w-2.5" />,
    },
  };
  const c = config[status] ?? config.pending;
  return (
    <Badge className={cn("text-[10px] h-5 px-1.5 gap-1", c.className)}>
      {c.icon}
      {c.label}
    </Badge>
  );
}
