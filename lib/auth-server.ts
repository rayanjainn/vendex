import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'rayanadmin';
const VIEW_PASSWORD = process.env.VIEW_PASSWORD || 'viewonly';

export type AuthRole = 'admin' | 'viewer';

export async function getAuthRole(): Promise<AuthRole | null> {
  const headersList = headers();
  const authHeader = headersList.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  if (!token) return null;

  if (token === ADMIN_PASSWORD) return 'admin';
  if (token === VIEW_PASSWORD) return 'viewer';

  return null;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
