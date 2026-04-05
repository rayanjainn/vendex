import useSWR from 'swr';
import { useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useSupplierStore } from '@/stores/supplierStore';

export function useSuppliers(jobId: string | null, filters: any = {}) {
  const key = jobId ? ['suppliers', jobId, JSON.stringify(filters)] : null;
  const store = useSupplierStore();

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => apiClient.getSuppliers(jobId!, filters)
  );

  useEffect(() => {
    if (data?.suppliers) {
      // Merge fetched suppliers into the store (replace any for this jobId)
      const others = store.suppliers.filter(s => s.jobId !== jobId);
      useSupplierStore.setState({ suppliers: [...others, ...data.suppliers] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return {
    suppliers: data?.suppliers || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate
  };
}
