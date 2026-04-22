import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthRole, unauthorizedResponse } from '@/lib/auth-server';

export async function GET(request: Request) {
  const role = await getAuthRole();
  if (!role) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('job_id');

  try {
    let rows;
    if (jobId) {
      rows = await sql`SELECT * FROM suppliers WHERE job_id = ${jobId} ORDER BY match_score DESC`;
    } else {
      rows = await sql`SELECT * FROM suppliers ORDER BY created_at DESC LIMIT 100`;
    }

    const suppliers = rows.map((row: any) => {
      const supplier: any = {};
      for (const [key, value] of Object.entries(row)) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
                            .replace('Inr', 'INR')
                            .replace('Usd', 'USD')
                            .replace('Cny', 'CNY');
        
        const jsonFields = ['shippingMethods', 'certifications', 'productProperties', 'rawApiResponse'];
        if (jsonFields.includes(camelKey) && typeof value === 'string') {
          try { supplier[camelKey] = JSON.parse(value); } catch { supplier[camelKey] = []; }
        } else if (['verified', 'goldSupplier', 'tradeAssurance', 'sampleAvailable'].includes(camelKey)) {
          supplier[camelKey] = value === 1 || value === true;
        } else {
          supplier[camelKey] = value;
        }
      }
      return supplier;
    });

    return NextResponse.json({
      suppliers,
      total: suppliers.length
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
