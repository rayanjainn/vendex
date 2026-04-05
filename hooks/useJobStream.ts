import { useState, useEffect } from 'react';
import { ReelJob } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

export function useJobStream(jobId: string | null) {
  const [job, setJob] = useState<ReelJob | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    if (!jobId) return;
    
    const es = apiClient.createJobStream(jobId);
    
    es.onopen = () => setIsConnected(true);
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ReelJob;
        setJob(data);
        if (data.status === 'complete' || data.status === 'failed') {
          es.close();
          setIsConnected(false);
        }
      } catch (e) {}
    };
    
    es.onerror = () => {
      es.close();
      setIsConnected(false);
    };
    
    return () => es.close();
  }, [jobId]);
  
  return { job, isConnected };
}
