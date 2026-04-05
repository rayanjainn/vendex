import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const response = await fetch(`${BACKEND_URL}/api/v1/suppliers?${searchParams.toString()}`);
  
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed' }, { status: response.status });
  }
  
  const data = await response.json();
  return NextResponse.json(data);
}
