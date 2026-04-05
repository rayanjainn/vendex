import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== process.env.NEXTJS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { job_id, status } = await request.json();
  revalidatePath(`/results/${job_id}`);
  
  return NextResponse.json({ received: true });
}
