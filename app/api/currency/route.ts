import { NextRequest, NextResponse } from "next/server";

const ratesCache = new Map<string, { rate: number, timestamp: number }>();

// Whitelist of ISO 4217 currency codes we support — prevents SSRF via param injection
const ALLOWED_CURRENCIES = new Set([
  "USD", "EUR", "GBP", "CNY", "INR", "JPY", "CAD", "AUD", "CHF", "HKD",
  "SGD", "KRW", "MYR", "THB", "BDT", "PKR", "LKR", "NPR", "IDR", "PHP",
  "VND", "TWD", "MXN", "BRL", "ZAR", "AED", "SAR", "TRY", "PLN", "SEK",
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromRaw = searchParams.get("from")?.toUpperCase() || "USD";
  const toRaw = searchParams.get("to")?.toUpperCase() || "INR";

  // Reject unknown currency codes — prevents path injection into the API URL
  if (!ALLOWED_CURRENCIES.has(fromRaw) || !ALLOWED_CURRENCIES.has(toRaw)) {
    return NextResponse.json({ error: "Invalid currency code" }, { status: 400 });
  }

  const from = fromRaw;
  const to = toRaw;
  const amountStr = searchParams.get("amount") || "1";
  const amount = parseFloat(amountStr);
  if (!isFinite(amount)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

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
