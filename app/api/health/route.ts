import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET() {
  const response = await fetch(`${BACKEND_URL}/api/v1/health`, {
    next: { revalidate: 60 }
  });
  
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed' }, { status: response.status });
  }
  
  const data = await response.json();
  return NextResponse.json(data);
}
