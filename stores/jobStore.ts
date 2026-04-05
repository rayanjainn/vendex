import { create } from 'zustand';
import { ReelJob } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

interface JobState {
  jobs: ReelJob[];
  activeJobId: string | null;
  addJob: (job: ReelJob) => void;
  updateJobStatus: (id: string, status: ReelJob['status']) => void;
  setActiveJob: (id: string | null) => void;
  fetchJobs: () => Promise<void>;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  activeJobId: null,
  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
  updateJobStatus: (id, status) => set((state) => ({
    jobs: state.jobs.map(j => j.id === id ? { ...j, status, updatedAt: new Date().toISOString() } : j)
  })),
  setActiveJob: (activeJobId) => set({ activeJobId }),
  fetchJobs: async () => {
    try {
      const jobs = await apiClient.getJobs();
      set({ jobs });
    } catch (e) {
      console.error('Failed to fetch jobs', e);
    }
  }
}));
