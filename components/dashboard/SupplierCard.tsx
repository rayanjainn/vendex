"use client";

import { SupplierResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/stores/uiStore";
import { getCountryFlag, cn } from "@/lib/utils";
import {
  ExternalLink,
  MessageCircle,
  Star,
  Truck,
  Package,
  Clock,
  RotateCcw,
  CheckCircle2,
  Layers,
  Image as ImageIcon,
  BarChart2,
  Trophy,
} from "lucide-react";
import { useState } from "react";

interface SupplierCardProps {
  supplier: SupplierResult;
}

export function SupplierCard({ supplier }: SupplierCardProps) {
  const { toggleCompare, compareIds } = useUIStore();
  const isSelected = compareIds.includes(supplier.id);
  const [imgError, setImgError] = useState(false);

  const props = supplier.productProperties || {};
  const chatUrl: string = props.chat_url || "";
  const certifications: string[] =
    supplier.certifications || props.certifications || [];
  const priceTiers: { raw: string }[] = props.price_tiers || [];
  const reorderRate = supplier.reorderRate || props.reorder_rate || "";
  const onTimeRate =
    supplier.onTimeDeliveryRate || props.on_time_delivery_rate || "";
  const estimatedDelivery = props.estimated_delivery || "";
  const samplePrice = supplier.samplePriceUSD || props.sample_price_usd || 0;
  const rankingStr: string = props.ranking || "";
  const rankNumber: number | null =
    typeof props.rank_number === "number" ? props.rank_number : null;

  const displayImage =
    !imgError &&
    supplier.productImageUrl &&
    supplier.productImageUrl.startsWith("http")
      ? supplier.productImageUrl
      : null;

  const matchPct = Math.round(supplier.matchScore);
  const showMatch = matchPct > 0;

  const formatPrice = (inr: number | undefined | null) => {
    if (!inr || inr <= 0) return "—";
    if (inr >= 1000) return `₹${(inr / 1000).toFixed(1)}k`;
    return `₹${inr.toFixed(0)}`;
  };

  return (
    <Card
      className={cn(
        "group border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col bg-white overflow-hidden",
        isSelected && "ring-2 ring-indigo-500 border-indigo-300",
      )}
    >
      {/* Product image */}
      <div className="relative aspect-[4/3] bg-slate-50 border-b border-slate-100 overflow-hidden flex items-center justify-center">
        {displayImage ? (
          <img
            src={displayImage}
            alt={supplier.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-300">
            <ImageIcon className="h-10 w-10" />
            <span className="text-[10px]">No image</span>
          </div>
        )}

        {/* Match score — only shown when non-zero */}
        {showMatch && (
          <div className="absolute top-2 right-2">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 bg-white shadow-sm",
                matchPct >= 90
                  ? "border-emerald-400 text-emerald-700"
                  : matchPct >= 75
                    ? "border-indigo-400 text-indigo-700"
                    : "border-slate-300 text-slate-600",
              )}
            >
              {matchPct}
            </div>
          </div>
        )}

        {/* Compare checkbox */}
        <button
          onClick={() => toggleCompare(supplier.id)}
          className={cn(
            "absolute bottom-2 right-2 h-6 w-6 rounded border-2 bg-white flex items-center justify-center transition-all shadow-sm",
            isSelected
              ? "border-indigo-500 bg-indigo-500"
              : "border-slate-300 opacity-0 group-hover:opacity-100",
          )}
        >
          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
        </button>
      </div>

      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        {/* Product name & supplier */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug mb-1">
            {supplier.productName}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-base leading-none">
              {getCountryFlag(supplier.countryCode)}
            </span>
            <span className="truncate">{supplier.supplierName}</span>
            {supplier.yearsOnPlatform > 0 && (
              <span className="text-slate-400 flex-shrink-0">
                · {supplier.yearsOnPlatform}yr
              </span>
            )}
          </div>
          {rankingStr && (
            <div
              className={cn(
                "mt-1.5 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold w-fit",
                rankNumber !== null && rankNumber <= 5
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : rankNumber !== null && rankNumber <= 10
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "bg-slate-50 text-slate-600 border border-slate-200",
              )}
            >
              <Trophy className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate max-w-[160px]">{rankingStr}</span>
            </div>
          )}
        </div>

        {/* Rating row */}
        {(supplier.rating > 0 || supplier.reviewCount > 0) &&
          supplier.rating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i <= Math.round(supplier.rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200 fill-slate-200",
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-700">
                {supplier.rating > 0 ? supplier.rating.toFixed(1) : "—"}
              </span>
              {supplier.reviewCount > 0 && (
                <span className="text-xs text-slate-400">
                  ({supplier.reviewCount.toLocaleString()})
                </span>
              )}
            </div>
          )}

        <Separator className="bg-slate-100" />

        {/* Price & MOQ */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">
              Unit Price
            </p>
            <p className="text-lg font-bold text-slate-900 leading-none">
              {formatPrice(supplier.unitPriceINR)}
            </p>
            {supplier.unitPriceUSD != null && supplier.unitPriceUSD > 0 && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                ${supplier.unitPriceUSD.toFixed(2)} USD
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">
              Min. Order
            </p>
            <p className="text-lg font-bold text-slate-900 leading-none">
              {supplier.moq > 0 ? supplier.moq.toLocaleString() : "—"}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {supplier.moqUnit || "pieces"}
            </p>
          </div>
        </div>

        {/* Price tiers */}
        {priceTiers.length > 1 && (
          <div className="flex gap-1 flex-wrap">
            {priceTiers.slice(0, 3).map((tier, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-[10px] h-5 px-1.5 border-slate-200 text-slate-500 font-normal"
              >
                {tier.raw.substring(0, 20)}
              </Badge>
            ))}
          </div>
        )}

        <Separator className="bg-slate-100" />

        {/* Supplier metrics row */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
          {estimatedDelivery && (
            <MetricItem
              icon={<Truck className="h-3 w-3" />}
              label="Delivery"
              value={estimatedDelivery.substring(0, 18)}
            />
          )}
          {reorderRate && (
            <MetricItem
              icon={<RotateCcw className="h-3 w-3" />}
              label="Reorder"
              value={reorderRate}
            />
          )}
          {onTimeRate && (
            <MetricItem
              icon={<Clock className="h-3 w-3" />}
              label="On-Time"
              value={onTimeRate}
            />
          )}
          {supplier.responseTime && (
            <MetricItem
              icon={<BarChart2 className="h-3 w-3" />}
              label="Response"
              value={supplier.responseTime}
            />
          )}
          {samplePrice > 0 && (
            <MetricItem
              icon={<Package className="h-3 w-3" />}
              label="Sample"
              value={`$${samplePrice.toFixed(0)}`}
            />
          )}
        </div>

        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {certifications.slice(0, 5).map((cert) => (
              <Badge
                key={cert}
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-slate-200 text-slate-500 bg-slate-50"
              >
                {cert}
              </Badge>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-1 flex gap-2">
          <a
            href={supplier.productUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1"
          >
            <Button
              size="sm"
              className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white border-0 gap-1"
            >
              View on Alibaba
              <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
          {chatUrl && (
            <a href={chatUrl} target="_blank" rel="noreferrer">
              <Button
                size="sm"
                className="h-8 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 gap-1"
                title="Chat with supplier"
              >
                <MessageCircle className="h-3 w-3" />
                Chat
              </Button>
            </a>
          )}
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "h-8 w-8 p-0 border-slate-200 flex-shrink-0",
              isSelected && "border-indigo-300 bg-indigo-50 text-indigo-600",
            )}
            onClick={() => toggleCompare(supplier.id)}
            title="Compare"
          >
            <Layers className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-slate-500">
      <span className="text-slate-400 flex-shrink-0">{icon}</span>
      <span className="text-[10px] font-medium text-slate-400 flex-shrink-0">
        {label}:
      </span>
      <span className="text-[10px] text-slate-600 truncate">{value}</span>
    </div>
  );
}
