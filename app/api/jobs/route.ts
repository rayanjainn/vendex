import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthRole, unauthorizedResponse } from '@/lib/auth-server';

export async function GET(request: Request) {
  const role = await getAuthRole();
  if (!role) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let rows;
    if (status) {
      rows = await sql`
        SELECT * FROM jobs 
        WHERE status = ${status} 
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      rows = await sql`
        SELECT * FROM jobs 
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const jobs = rows.map((row: any) => {
      const job: any = {};
      for (const [key, value] of Object.entries(row)) {
        // Convert snake_case to camelCase
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
                            .replace('Inr', 'INR')
                            .replace('Usd', 'USD')
                            .replace('Cny', 'CNY');
        
        // Parse JSON fields
        if (['detectedKeywords', 'pipelineStages', 'detailedLogs'].includes(camelKey) && typeof value === 'string') {
          try { job[camelKey] = JSON.parse(value); } catch { job[camelKey] = []; }
        } else {
          job[camelKey] = value;
        }
      }
      return job;
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
