const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const backendStream = await fetch(
    `${BACKEND_URL}/api/v1/jobs/${params.jobId}/stream`,
    { signal: request.signal as AbortSignal }
  );
  
  return new Response(backendStream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
