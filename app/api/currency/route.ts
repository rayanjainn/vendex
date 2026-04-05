import { NextRequest, NextResponse } from "next/server";

const ratesCache = new Map<string, { rate: number, timestamp: number }>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from")?.toUpperCase() || "USD";
  const to = searchParams.get("to")?.toUpperCase() || "INR";
  const amountStr = searchParams.get("amount") || "1";
  const amount = parseFloat(amountStr);

  if (from === to) {
    return NextResponse.json({ original: amount, originalCurrency: from, [to.toLowerCase()]: amount, rate: 1 });
  }

  const cacheKey = `${from}_${to}`;
  const cached = ratesCache.get(cacheKey);
  const now = Date.now();

  let rate = 83.50; // default fallback

  if (cached && (now - cached.timestamp < 3600000)) {
    rate = cached.rate;
  } else {
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
      if (res.ok) {
        const data = await res.json();
        rate = data.rates[to];
        ratesCache.set(cacheKey, { rate, timestamp: now });
      }
    } catch (e) {
      console.error("Currency API error:", e);
    }
  }

  return NextResponse.json({
    original: amount,
    originalCurrency: from,
    inr: amount * rate, // Provide inr field correctly
    rate
  });
}
