import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  const { reelUrl } = await request.json();
  
  const response = await fetch(`${BACKEND_URL}/api/v1/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reel_url: reelUrl })
  });
  
  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json({ error: error.detail || 'Processing failed' }, { status: response.status });
  }
  
  const data = await response.json();
  return NextResponse.json(data);
}
