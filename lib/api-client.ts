import { ReelJob, SupplierResult, CsvRow } from './types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const apiClient = {
  async createJob(reelUrl: string): Promise<{ job_id: string }> {
    const res = await fetch(`${BACKEND_URL}/api/v1/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reel_url: reelUrl })
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  async createBatchJobs(items: { url: string; label: string; csv_row_id: string }[]): Promise<{ jobs: { job_id: string; csv_row_id: string }[] }> {
    const res = await fetch(`${BACKEND_URL}/api/v1/process/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  async getJobs(params?: { status?: string, limit?: number }): Promise<ReelJob[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    const res = await fetch(`${BACKEND_URL}/api/v1/jobs?${searchParams.toString()}`);
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  async getJob(jobId: string): Promise<ReelJob> {
    const res = await fetch(`${BACKEND_URL}/api/v1/jobs/${jobId}`);
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  async deleteJob(jobId: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/v1/jobs/${jobId}`, { method: "DELETE" });
    if (!res.ok) throw new ApiError(res.status, await res.text());
  },
  async getSuppliers(jobId: string, filters: any = {}): Promise<{suppliers: SupplierResult[], total: number}> {
    const searchParams = new URLSearchParams({ job_id: jobId });
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.set(k, v!.toString());
      }
    });
    const res = await fetch(`${BACKEND_URL}/api/v1/suppliers?${searchParams.toString()}`);
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  async getHealth(): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/v1/health`);
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  createJobStream(jobId: string): EventSource {
    return new EventSource(`${BACKEND_URL}/api/v1/jobs/${jobId}/stream`);
  },
  async uploadCsv(file: File): Promise<{ upload_id: string; upload_name: string; row_count: number }> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BACKEND_URL}/api/v1/csv/upload`, { method: "POST", body: form });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  async getCsvRows(uploadId?: string): Promise<{ rows: CsvRow[] }> {
    const url = uploadId
      ? `${BACKEND_URL}/api/v1/csv/rows?upload_id=${uploadId}`
      : `${BACKEND_URL}/api/v1/csv/rows`;
    const res = await fetch(url);
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  async deleteCsvUpload(uploadId: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/v1/csv/upload/${uploadId}`, { method: "DELETE" });
    if (!res.ok) throw new ApiError(res.status, await res.text());
  },
};
