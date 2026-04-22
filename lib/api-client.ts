import { ReelJob, SupplierResult, CsvRow } from './types';
import { useAuthStore } from '@/stores/authStore';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const getHeaders = (extraHeaders: Record<string, string> = {}) => {
  const { password } = useAuthStore.getState();
  return {
    ...extraHeaders,
    ...(password ? { 'Authorization': `Bearer ${password}` } : {}),
  };
};

export const apiClient = {
  async createJob(reelUrl: string): Promise<{ job_id: string }> {
    const res = await fetch(`${BACKEND_URL}/api/v1/process`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ reel_url: reelUrl })
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  async createBatchJobs(items: { url: string; label: string; csv_row_id: string }[]): Promise<{ jobs: { job_id: string; csv_row_id: string }[] }> {
    const res = await fetch(`${BACKEND_URL}/api/v1/process/batch`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ items })
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  async getJobs(params?: { status?: string, limit?: number }): Promise<ReelJob[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    const res = await fetch(`/api/jobs?${searchParams.toString()}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  async getJob(jobId: string): Promise<ReelJob> {
    const res = await fetch(`/api/jobs/${jobId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  async deleteJob(jobId: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/v1/jobs/${jobId}`, { 
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
  },
  async getSuppliers(jobId: string, filters: any = {}): Promise<{suppliers: SupplierResult[], total: number}> {
    const searchParams = new URLSearchParams({ job_id: jobId });
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.set(k, v!.toString());
      }
    });
    const res = await fetch(`/api/suppliers?${searchParams.toString()}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  async getHealth(): Promise<any> {
    const res = await fetch(`/api/health`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  createJobStream(jobId: string): EventSource {
    const { password } = useAuthStore.getState();
    const url = new URL(`${BACKEND_URL}/api/v1/jobs/${jobId}/stream`);
    if (password) url.searchParams.set('token', password);
    return new EventSource(url.toString());
  },
  async uploadCsv(file: File): Promise<{ upload_id: string; upload_name: string; row_count: number }> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BACKEND_URL}/api/v1/csv/upload`, { 
      method: "POST", 
      headers: getHeaders(),
      body: form 
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  async getCsvRows(uploadId?: string): Promise<{ rows: CsvRow[] }> {
    const searchParams = new URLSearchParams();
    if (uploadId) searchParams.set('upload_id', uploadId);
    const res = await fetch(`/api/csv/rows?${searchParams.toString()}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  },
  async deleteCsvUpload(uploadId: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/v1/csv/upload/${uploadId}`, { 
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
  },
};
