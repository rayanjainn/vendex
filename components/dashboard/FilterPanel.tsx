"use client";

import { useSupplierStore, SortKey } from "@/stores/supplierStore";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCountryFlag, cn } from "@/lib/utils";
import {
  Star,
  RotateCcw,
  Globe,
  Building2,
  Banknote,
  Box,
  ShieldCheck,
  ArrowUpDown,
  Filter,
  Clock,
  Award,
  Truck,
} from "lucide-react";

const COUNTRIES = [
  { id: "CN", label: "China" },
  { id: "IN", label: "India" },
];

const SUPPLIER_TYPES = [
  { id: "manufacturer", label: "Manufacturer" },
  { id: "trading_company", label: "Trading Co." },
  { id: "distributor", label: "Distributor" },
  { id: "supplier", label: "Supplier" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "smart", label: "Smart (Ranked → Price → Reviews)" },
  { value: "matchScore", label: "Best Match" },
  { value: "unitPriceINR_asc", label: "Price: Low → High" },
  { value: "unitPriceINR_desc", label: "Price: High → Low" },
  { value: "totalPriceINR_asc", label: "Total Cost: Low → High" },
  { value: "moq_asc", label: "MOQ: Lowest" },
  { value: "moq_desc", label: "MOQ: Highest" },
  { value: "rating", label: "Highest Rated" },
  { value: "reviewCount", label: "Most Reviews" },
  { value: "deliveryDays", label: "Fastest Delivery" },
  { value: "yearsOnPlatform", label: "Most Experienced" },
];

const CERTIFICATIONS = [
  "CE",
  "RoHS",
  "FCC",
  "FDA",
  "ISO",
  "REACH",
  "UL",
  "CCC",
  "BIS",
];

const RESPONSE_TIMES = [
  { value: "4h", label: "< 4 hours" },
  { value: "12h", label: "< 12 hours" },
  { value: "24h", label: "< 24 hours" },
  { value: "48h", label: "< 48 hours" },
];

export function FilterPanel() {
  const { filters, setFilters, resetFilters } = useSupplierStore();

  const hasActiveFilters =
    filters.countries.length > 0 ||
    filters.supplierTypes.length > 0 ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.minMoq !== null ||
    filters.maxMoq !== null ||
    filters.minRating > 0 ||
    filters.minDeliveryDays !== null ||
    filters.maxDeliveryDays !== null ||
    filters.minYearsOnPlatform !== null ||
    filters.verifiedOnly ||
    filters.goldSupplierOnly ||
    filters.tradeAssuranceOnly ||
    filters.sampleAvailableOnly ||
    filters.topRankedOnly ||
    filters.certifications.length > 0 ||
    filters.responseTimeMax !== null ||
    filters.sortBy !== "matchScore";

  const activeCount = [
    filters.countries.length > 0,
    filters.supplierTypes.length > 0,
    filters.minPrice !== null || filters.maxPrice !== null,
    filters.minMoq !== null || filters.maxMoq !== null,
    filters.minRating > 0,
    filters.minDeliveryDays !== null || filters.maxDeliveryDays !== null,
    filters.minYearsOnPlatform !== null,
    filters.verifiedOnly,
    filters.goldSupplierOnly,
    filters.tradeAssuranceOnly,
    filters.sampleAvailableOnly,
    filters.topRankedOnly,
    filters.certifications.length > 0,
    filters.responseTimeMax !== null,
  ].filter(Boolean).length;

  const toggleCountry = (id: string) => {
    const updated = filters.countries.includes(id)
      ? filters.countries.filter((c) => c !== id)
      : [...filters.countries, id];
    setFilters({ countries: updated });
  };

  const toggleType = (id: string) => {
    const updated = filters.supplierTypes.includes(id)
      ? filters.supplierTypes.filter((t) => t !== id)
      : [...filters.supplierTypes, id];
    setFilters({ supplierTypes: updated });
  };

  const toggleCert = (cert: string) => {
    const updated = filters.certifications.includes(cert)
      ? filters.certifications.filter((c) => c !== cert)
      : [...filters.certifications, cert];
    setFilters({ certifications: updated });
  };

  return (
    <div className="w-60 flex-shrink-0 bg-white border border-slate-200 rounded-xl flex flex-col h-[calc(100vh-120px)] sticky top-24 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filters</span>
          {activeCount > 0 && (
            <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-indigo-600 text-white rounded-full border-0">
              {activeCount}
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-6 text-[10px] text-slate-400 hover:text-slate-600 px-2 rounded-md gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 space-y-5">
          {/* Top Ranked — pinned at top for quick access */}
          <section>
            <button
              onClick={() =>
                setFilters({ topRankedOnly: !filters.topRankedOnly })
              }
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all",
                filters.topRankedOnly
                  ? "bg-amber-50 border-amber-400 text-amber-800"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300",
              )}
            >
              <div className="flex items-center gap-2">
                <Award
                  className={cn(
                    "h-4 w-4",
                    filters.topRankedOnly ? "text-amber-500" : "text-slate-400",
                  )}
                />
                <span className="text-xs font-semibold">Top Ranked Only</span>
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  filters.topRankedOnly
                    ? "bg-amber-400 text-white"
                    : "bg-slate-200 text-slate-500",
                )}
              >
                #1-20
              </span>
            </button>
          </section>

          <Separator className="bg-slate-100" />

          {/* Sort */}
          <section>
            <SectionLabel
              icon={<ArrowUpDown className="h-3.5 w-3.5" />}
              label="Sort by"
            />
            <Select
              value={filters.sortBy}
              onValueChange={(v) => setFilters({ sortBy: v as SortKey })}
            >
              <SelectTrigger className="h-8 text-xs border-slate-200 rounded-lg bg-white mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-xs"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <Separator className="bg-slate-100" />

          {/* Country */}
          <section>
            <SectionLabel
              icon={<Globe className="h-3.5 w-3.5" />}
              label="Country of Origin"
            />
            <div className="mt-2 grid grid-cols-2 gap-1">
              {COUNTRIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleCountry(c.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs border transition-all text-left",
                    filters.countries.includes(c.id)
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-medium"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <span className="text-sm leading-none">
                    {getCountryFlag(c.id)}
                  </span>
                  <span className="truncate text-[11px]">{c.label}</span>
                </button>
              ))}
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* Supplier Type */}
          <section>
            <SectionLabel
              icon={<Building2 className="h-3.5 w-3.5" />}
              label="Supplier Type"
            />
            <div className="mt-2 space-y-1.5">
              {SUPPLIER_TYPES.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <Checkbox
                    checked={filters.supplierTypes.includes(t.id)}
                    onCheckedChange={() => toggleType(t.id)}
                    className="h-3.5 w-3.5 rounded border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <span
                    className={cn(
                      "text-xs",
                      filters.supplierTypes.includes(t.id)
                        ? "text-indigo-700 font-medium"
                        : "text-slate-600",
                    )}
                  >
                    {t.label}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* Price Range */}
          <section>
            <SectionLabel
              icon={<Banknote className="h-3.5 w-3.5" />}
              label="Unit Price (INR)"
            />
            <div className="mt-2 flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minPrice ?? ""}
                onChange={(e) =>
                  setFilters({
                    minPrice: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="h-8 text-xs border-slate-200 rounded-lg"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxPrice ?? ""}
                onChange={(e) =>
                  setFilters({
                    maxPrice: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="h-8 text-xs border-slate-200 rounded-lg"
              />
            </div>
          </section>

          {/* MOQ */}
          <section>
            <SectionLabel
              icon={<Box className="h-3.5 w-3.5" />}
              label="Min. Order Qty (pcs)"
            />
            <div className="mt-2 flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minMoq ?? ""}
                onChange={(e) =>
                  setFilters({
                    minMoq: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="h-8 text-xs border-slate-200 rounded-lg"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxMoq ?? ""}
                onChange={(e) =>
                  setFilters({
                    maxMoq: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="h-8 text-xs border-slate-200 rounded-lg"
              />
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* Delivery Days */}
          <section>
            <SectionLabel
              icon={<Truck className="h-3.5 w-3.5" />}
              label="Delivery Days"
            />
            <div className="mt-2 flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minDeliveryDays ?? ""}
                onChange={(e) =>
                  setFilters({
                    minDeliveryDays: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
                className="h-8 text-xs border-slate-200 rounded-lg"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxDeliveryDays ?? ""}
                onChange={(e) =>
                  setFilters({
                    maxDeliveryDays: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
                className="h-8 text-xs border-slate-200 rounded-lg"
              />
            </div>
          </section>

          {/* Years on Platform */}
          <section>
            <SectionLabel
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Min. Years on Alibaba"
            />
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {[0, 1, 3, 5, 10].map((y) => (
                <button
                  key={y}
                  onClick={() =>
                    setFilters({ minYearsOnPlatform: y === 0 ? null : y })
                  }
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] border transition-all font-medium",
                    (
                      y === 0
                        ? filters.minYearsOnPlatform === null
                        : filters.minYearsOnPlatform === y
                    )
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50",
                  )}
                >
                  {y === 0 ? "Any" : `${y}+`}
                </button>
              ))}
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* Rating */}
          <section>
            <SectionLabel
              icon={<Star className="h-3.5 w-3.5" />}
              label="Min. Rating"
            />
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {[0, 3, 3.5, 4, 4.5].map((r) => (
                <button
                  key={r}
                  onClick={() => setFilters({ minRating: r })}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-all font-medium",
                    filters.minRating === r
                      ? "bg-amber-500 text-white border-amber-500"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50",
                  )}
                >
                  {r > 0 && <Star className="h-2.5 w-2.5 fill-current" />}
                  {r === 0 ? "Any" : r}
                </button>
              ))}
            </div>
          </section>

          {/* Response Time */}
          <section>
            <SectionLabel
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Response Time"
            />
            <div className="mt-2 space-y-1.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={filters.responseTimeMax === null}
                  onCheckedChange={() => setFilters({ responseTimeMax: null })}
                  className="h-3.5 w-3.5 rounded border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                />
                <span className="text-xs text-slate-600">Any</span>
              </label>
              {RESPONSE_TIMES.map((rt) => (
                <label
                  key={rt.value}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.responseTimeMax === rt.value}
                    onCheckedChange={() =>
                      setFilters({
                        responseTimeMax:
                          filters.responseTimeMax === rt.value
                            ? null
                            : rt.value,
                      })
                    }
                    className="h-3.5 w-3.5 rounded border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <span className="text-xs text-slate-600">{rt.label}</span>
                </label>
              ))}
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* Certifications */}
          <section>
            <SectionLabel
              icon={<Award className="h-3.5 w-3.5" />}
              label="Certifications"
            />
            <div className="mt-2 flex gap-1 flex-wrap">
              {CERTIFICATIONS.map((cert) => (
                <button
                  key={cert}
                  onClick={() => toggleCert(cert)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] border transition-all font-medium",
                    filters.certifications.includes(cert)
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50",
                  )}
                >
                  {cert}
                </button>
              ))}
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* Trust Signals */}
          <section>
            <SectionLabel
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="Trust Signals"
            />
            <div className="mt-2 space-y-3">
              {[
                {
                  id: "verified",
                  label: "Verified Supplier",
                  checked: filters.verifiedOnly,
                  key: "verifiedOnly" as const,
                },
                {
                  id: "gold",
                  label: "Gold Supplier",
                  checked: filters.goldSupplierOnly,
                  key: "goldSupplierOnly" as const,
                },
                {
                  id: "trade",
                  label: "Trade Assurance",
                  checked: filters.tradeAssuranceOnly,
                  key: "tradeAssuranceOnly" as const,
                },
                {
                  id: "sample",
                  label: "Sample Available",
                  checked: filters.sampleAvailableOnly,
                  key: "sampleAvailableOnly" as const,
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between"
                >
                  <Label
                    htmlFor={item.id}
                    className="text-xs text-slate-600 cursor-pointer font-normal"
                  >
                    {item.label}
                  </Label>
                  <Switch
                    id={item.id}
                    checked={item.checked}
                    onCheckedChange={(c) => setFilters({ [item.key]: c })}
                    className="h-4 w-7 data-[state=checked]:bg-indigo-600 scale-90"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-400">{icon}</span>
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}
