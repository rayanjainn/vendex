import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthRole, unauthorizedResponse } from '@/lib/auth-server';

export async function GET(request: Request) {
  const role = await getAuthRole();
  if (!role) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const uploadId = searchParams.get('upload_id');

  try {
    let rows;
    if (uploadId) {
      rows = await sql`SELECT * FROM csv_rows WHERE upload_id = ${uploadId} ORDER BY created_at ASC`;
    } else {
      rows = await sql`SELECT * FROM csv_rows ORDER BY created_at DESC`;
    }

    const formattedRows = rows.map((row: any) => {
      const formatted: any = {};
      for (const [key, value] of Object.entries(row)) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        if (camelKey === 'extraData' && typeof value === 'string') {
          try { formatted[camelKey] = JSON.parse(value); } catch { formatted[camelKey] = {}; }
        } else {
          formatted[camelKey] = value;
        }
      }
      return formatted;
    });

    return NextResponse.json({ rows: formattedRows });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
