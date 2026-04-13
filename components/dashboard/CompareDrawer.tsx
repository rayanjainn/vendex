"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useSupplierStore } from "@/stores/supplierStore";
import { X, ArrowRightLeft, Sparkles, Loader2, ChevronDown, ChevronUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyBadge } from "@/components/shared/CurrencyBadge";
import { TrustBadge } from "@/components/shared/TrustBadge";
import { getCountryFlag } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// ── Markdown-lite renderer (bold + bullets only) ─────────────────────────────
// Renders **bold** markers as React <strong> elements — no dangerouslySetInnerHTML.
function InlineBold({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
      )}
    </>
  );
}

function InsightText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm text-slate-700 leading-relaxed">
      {lines.map((line, i) => {
        // Section headings: **text**
        const heading = line.match(/^\*\*(.+)\*\*$/);
        if (heading) return (
          <p key={i} className="font-semibold text-slate-900 mt-4 first:mt-0">{heading[1]}</p>
        );
        // Bullet points
        if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
          const content = line.trim().slice(2);
          return (
            <div key={i} className="flex gap-2">
              <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
              <span><InlineBold text={content} /></span>
            </div>
          );
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        return (
          <p key={i}><InlineBold text={line} /></p>
        );
      })}
    </div>
  );
}

// ── Single metric row used in the comparison grid ────────────────────────────
function MetricRow({ label, values, highlight }: {
  label: string;
  values: React.ReactNode[];
  highlight?: number; // index of the "best" column
}) {
  return (
    <div className="contents">
      <div className="py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center bg-slate-50 border-b border-slate-100">
        {label}
      </div>
      {values.map((v, i) => (
        <div
          key={i}
          className={`py-3 px-4 border-b border-slate-100 flex items-center text-sm
            ${highlight === i ? "bg-emerald-50 font-medium text-emerald-800" : "bg-white text-slate-700"}`}
        >
          {v ?? <span className="text-slate-300">—</span>}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function CompareDrawer({ jobId }: { jobId: string }) {
  const { compareIds, clearCompare, toggleCompare } = useUIStore();
  const { filteredAndSortedSuppliers } = useSupplierStore();

  const suppliers = filteredAndSortedSuppliers(jobId).filter(s => compareIds.includes(s.id));

  const [open, setOpen] = useState(false);
  const [insights, setInsights] = useState<string>("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const [insightsOpen, setInsightsOpen] = useState(true);

  // Auto-open drawer when first item added
  useEffect(() => {
    if (compareIds.length > 0) setOpen(true);
  }, [compareIds.length > 0]);

  // Reset insights when selection changes
  useEffect(() => {
    setInsights("");
    setInsightsError("");
  }, [compareIds.join(",")]);

  if (compareIds.length === 0) return null;

  const n = suppliers.length;

  // ── Helpers for highlighting best values ──
  const lowestPriceIdx = suppliers.reduce((best, s, i) =>
    s.unitPriceINR < suppliers[best].unitPriceINR ? i : best, 0);
  const fastestIdx = suppliers.reduce((best, s, i) =>
    (s.estimatedDeliveryDays ?? 999) < (suppliers[best].estimatedDeliveryDays ?? 999) ? i : best, 0);
  const highestRatingIdx = suppliers.reduce((best, s, i) =>
    (s.rating ?? 0) > (suppliers[best].rating ?? 0) ? i : best, 0);
  const highestMatchIdx = suppliers.reduce((best, s, i) =>
    (s.matchScore ?? 0) > (suppliers[best].matchScore ?? 0) ? i : best, 0);

  async function fetchInsights() {
    setLoadingInsights(true);
    setInsightsError("");
    setInsights("");
    setInsightsOpen(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/suppliers/compare/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suppliers }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setInsights(data.insights);
    } catch (e: any) {
      setInsightsError(e.message?.slice(0, 200) || "Failed to get insights");
    } finally {
      setLoadingInsights(false);
    }
  }

  // ── Floating action bar (always visible when items selected) ─────────────
  const actionBar = (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 bg-slate-900 text-white shadow-2xl rounded-full px-4 py-2.5 border border-slate-700">
        {/* Stacked thumbnails */}
        <div className="flex items-center -space-x-2.5">
          {suppliers.slice(0, 4).map((s, i) => (
            <img key={s.id} src={s.productImageUrl} alt=""
              className="h-7 w-7 rounded-full border-2 border-slate-900 object-cover"
              style={{ zIndex: 10 - i }}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{n} selected</span>
        <div className="w-px h-4 bg-slate-600" />
        <Button size="sm"
          className="rounded-full h-7 px-3 text-xs bg-indigo-500 hover:bg-indigo-400 text-white border-0"
          onClick={() => setOpen(o => !o)}
        >
          <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
          {open ? "Hide" : "Compare"}
        </Button>
        <button onClick={clearCompare} className="text-slate-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  if (!open) return actionBar;

  // ── Full compare panel ────────────────────────────────────────────────────
  return (
    <>
      {actionBar}
      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col bg-white border-t border-slate-200 shadow-2xl"
        style={{ height: "82vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="h-4 w-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Compare Suppliers</h2>
            <Badge variant="secondary" className="text-xs">{n} selected</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              onClick={fetchInsights}
              disabled={loadingInsights || n < 2}
            >
              {loadingInsights
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Sparkles className="h-3.5 w-3.5" />}
              AI Insights
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setOpen(false)}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* AI Insights panel */}
          {(insights || insightsError || loadingInsights) && (
            <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-purple-50/40">
              <button
                className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-indigo-800"
                onClick={() => setInsightsOpen(o => !o)}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Analysis
                </span>
                {insightsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {insightsOpen && (
                <div className="px-6 pb-5">
                  {loadingInsights && (
                    <div className="flex items-center gap-2 text-sm text-indigo-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analysing suppliers…
                    </div>
                  )}
                  {insightsError && (
                    <p className="text-sm text-red-600">{insightsError}</p>
                  )}
                  {insights && <InsightText text={insights} />}
                </div>
              )}
            </div>
          )}

          {/* Comparison grid — CSS grid with label col + N supplier cols */}
          <div
            className="grid"
            style={{ gridTemplateColumns: `200px repeat(${n}, 1fr)` }}
          >
            {/* ── Product header row ─────────────────────────────────── */}
            {/* Empty label cell */}
            <div className="bg-slate-50 border-b border-slate-100" />
            {suppliers.map(s => (
              <div key={s.id} className="p-4 border-b border-slate-100 bg-white relative">
                <button
                  onClick={() => toggleCompare(s.id)}
                  className="absolute top-2 right-2 h-5 w-5 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
                <img src={s.productImageUrl} alt="" className="w-full h-32 object-cover rounded-lg mb-3 bg-slate-50" />
                <p className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug">{s.productName}</p>
                <p className="text-xs text-slate-400 mt-1 truncate">{s.supplierName}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs">{getCountryFlag(s.countryCode)}</span>
                  <span className="text-xs text-slate-500">{s.country}</span>
                </div>
              </div>
            ))}

            {/* ── Pricing ─────────────────────────────────────────────── */}
            <MetricRow
              label="Unit Price"
              highlight={lowestPriceIdx}
              values={suppliers.map(s => (
                <CurrencyBadge
                  originalAmount={s.originalPrice}
                  originalCurrency={s.originalCurrency}
                  inrAmount={s.unitPriceINR}
                />
              ))}
            />
            <MetricRow
              label="Min. Order Qty"
              values={suppliers.map(s => `${s.moq} ${s.moqUnit}`)}
            />
            <MetricRow
              label="Price Range"
              values={suppliers.map(s =>
                s.priceRangeMin && s.priceRangeMax
                  ? `$${s.priceRangeMin.toFixed(2)} – $${s.priceRangeMax.toFixed(2)}`
                  : null
              )}
            />
            <MetricRow
              label="Sample Available"
              values={suppliers.map(s =>
                s.sampleAvailable
                  ? <span className="text-emerald-600 font-medium">Yes {s.samplePriceUSD ? `· $${s.samplePriceUSD}` : ""}</span>
                  : <span className="text-slate-400">No</span>
              )}
            />

            {/* ── Delivery ─────────────────────────────────────────────── */}
            <MetricRow
              label="Est. Delivery"
              highlight={fastestIdx}
              values={suppliers.map(s =>
                s.estimatedDeliveryDays ? `~${s.estimatedDeliveryDays} days` : null
              )}
            />
            <MetricRow
              label="Shipping Methods"
              values={suppliers.map(s =>
                s.shippingMethods?.length
                  ? <span className="line-clamp-2">{s.shippingMethods.join(", ")}</span>
                  : null
              )}
            />

            {/* ── Supplier quality ─────────────────────────────────────── */}
            <MetricRow
              label="Rating"
              highlight={highestRatingIdx}
              values={suppliers.map(s =>
                s.rating > 0
                  ? <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{s.rating.toFixed(1)} ({s.reviewCount})</span>
                  : null
              )}
            />
            <MetricRow
              label="Years on Platform"
              values={suppliers.map(s => s.yearsOnPlatform ? `${s.yearsOnPlatform} yrs` : null)}
            />
            <MetricRow
              label="Reorder Rate"
              values={suppliers.map(s => s.reorderRate || (s.productProperties as any)?.reorder_rate || null)}
            />
            <MetricRow
              label="On-time Delivery"
              values={suppliers.map(s => s.onTimeDeliveryRate || (s.productProperties as any)?.on_time_delivery_rate || null)}
            />
            <MetricRow
              label="Response Time"
              values={suppliers.map(s => s.responseTime || null)}
            />

            {/* ── Trust ────────────────────────────────────────────────── */}
            <MetricRow
              label="Trust Badges"
              values={suppliers.map(s => (
                <div className="flex flex-wrap gap-1">
                  {s.verified && <TrustBadge type="verified_supplier" />}
                  {s.tradeAssurance && <TrustBadge type="trade_assurance" />}
                  {s.goldSupplier && <TrustBadge type="gold_supplier" />}
                  {!s.verified && !s.tradeAssurance && !s.goldSupplier && <span className="text-slate-300 text-xs">None</span>}
                </div>
              ))}
            />
            <MetricRow
              label="Certifications"
              values={suppliers.map(s =>
                s.certifications?.length
                  ? <div className="flex flex-wrap gap-1">{s.certifications.map(c => <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0">{c}</Badge>)}</div>
                  : null
              )}
            />

            {/* ── Match ────────────────────────────────────────────────── */}
            <MetricRow
              label="Match Score"
              highlight={highestMatchIdx}
              values={suppliers.map(s =>
                s.matchScore
                  ? <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${s.matchScore}%` }} />
                      </div>
                      <span>{s.matchScore.toFixed(0)}%</span>
                    </div>
                  : null
              )}
            />
            <MetricRow
              label="Ranking"
              values={suppliers.map(s => (s.productProperties as any)?.ranking || null)}
            />

            {/* Bottom spacer */}
            <div className="col-span-full h-8" />
          </div>
        </div>
      </div>
    </>
  );
}
