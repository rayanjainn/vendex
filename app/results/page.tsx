"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ResultsPlaceholder() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard where the user can pick a job
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 text-neutral-300 animate-spin mb-4" />
      <p className="text-neutral-500 font-medium">Redirecting to Dashboard...</p>
    </div>
  );
}
