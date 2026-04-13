import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createHmac, timingSafeEqual } from 'crypto';

export async function POST(request: Request) {
  const secret = process.env.NEXTJS_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // Read raw body for HMAC verification before parsing JSON
  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Timing-safe HMAC-SHA256 comparison — prevents timing attacks
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signature.replace(/^sha256=/, ''), 'hex');

  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let job_id: string;
  try {
    const body = JSON.parse(rawBody);
    job_id = body.job_id;
    if (!job_id || typeof job_id !== 'string') throw new Error('missing job_id');
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  revalidatePath(`/results/${job_id}`);
  return NextResponse.json({ received: true });
}
