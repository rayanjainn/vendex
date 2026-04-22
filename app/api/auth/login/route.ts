import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'rayanadmin';
const VIEW_PASSWORD = process.env.VIEW_PASSWORD || 'viewonly';

export async function POST(request: Request) {
  const { password } = await request.json();

  if (password === ADMIN_PASSWORD) {
    (await cookies()).set('vendex-role', 'admin', { path: '/', httpOnly: false });
    (await cookies()).set('vendex-auth', password, { path: '/', httpOnly: false });
    return NextResponse.json({ role: 'admin' });
  } else if (password === VIEW_PASSWORD) {
    (await cookies()).set('vendex-role', 'viewer', { path: '/', httpOnly: false });
    (await cookies()).set('vendex-auth', password, { path: '/', httpOnly: false });
    return NextResponse.json({ role: 'viewer' });
  } else {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
}
