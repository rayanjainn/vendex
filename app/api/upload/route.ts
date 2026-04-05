import { NextResponse } from 'next/server';
import Papa from 'papaparse';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    let urls: string[] = [];
    
    if (file.name.endsWith('.csv')) {
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      urls = parsed.data.map((row: any) => row.reel_url || row.url || row.link);
    } else {
      const text = await file.text();
      urls = text.split('\n');
    }
    
    const filtered = urls.filter(u => u && u.trim().startsWith('http'));
    if (filtered.length === 0) {
      return NextResponse.json({ error: "No valid URLs found in file" }, { status: 400 });
    }
    
    const response = await fetch(`${BACKEND_URL}/api/v1/process/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: filtered })
    });
    
    if (!response.ok) {
        throw new Error("Batch processing failed");
    }
    
    const data = await response.json();
    return NextResponse.json({ success: true, count: filtered.length, jobIds: data.job_ids });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
