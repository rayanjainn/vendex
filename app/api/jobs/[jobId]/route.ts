import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthRole, unauthorizedResponse } from '@/lib/auth-server';

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const role = await getAuthRole();
  if (!role) return unauthorizedResponse();

  const jobId = params.jobId.trim();

  try {
    const rows = await sql`SELECT * FROM jobs WHERE id = ${jobId}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const row = rows[0];
    const job: any = {};
    for (const [key, value] of Object.entries(row)) {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
                          .replace('Inr', 'INR')
                          .replace('Usd', 'USD')
                          .replace('Cny', 'CNY');
      
      if (['detectedKeywords', 'pipelineStages', 'detailedLogs'].includes(camelKey) && typeof value === 'string') {
        try { job[camelKey] = JSON.parse(value); } catch { job[camelKey] = []; }
      } else {
        job[camelKey] = value;
      }
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
