"use client";

import { useUIStore } from "@/stores/uiStore";
import { useSupplierStore } from "@/stores/supplierStore";
import { X, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CurrencyBadge } from "@/components/shared/CurrencyBadge";
import { getCountryFlag } from "@/lib/utils";
import { TrustBadge } from "@/components/shared/TrustBadge";
import { Badge } from "@/components/ui/badge";

export function CompareDrawer({ jobId }: { jobId: string }) {
  const { compareIds, clearCompare, toggleCompare } = useUIStore();
  const { filteredAndSortedSuppliers } = useSupplierStore();

  const suppliers = filteredAndSortedSuppliers(jobId).filter(s => compareIds.includes(s.id));

  if (compareIds.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300">
      {/* Floating Action Bar */}
      <div className={`mx-auto max-w-fit mb-6 bg-white dark:bg-neutral-950 shadow-2xl rounded-full border border-neutral-800 dark:border-neutral-900 p-2 flex items-center gap-4 transition-all ${compareIds.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        <div className="flex items-center -space-x-3 px-3">
          {suppliers.map((s, i) => (
            <img key={s.id} src={s.productImageUrl} alt="" className="h-8 w-8 rounded-full border-2 border-white dark:border-neutral-950 object-cover relative" style={{ zIndex: 10 - i }} />
          ))}
        </div>
        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-300">
          Comparing {compareIds.length} of 4 items
        </span>
        <div className="flex items-center gap-2 border-l border-neutral-800 dark:border-neutral-900 pl-4">
          <Button size="sm" className="bg-neutral-800 dark:bg-white dark:text-black hover:bg-neutral-700 dark:hover:bg-neutral-200 text-white rounded-full h-8 px-4 border-0" onClick={() => document.getElementById('compare-drawer')?.classList.toggle('translate-y-full')}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Compare
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-neutral-500 hover:bg-neutral-900 dark:hover:bg-neutral-900" onClick={clearCompare}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Full Drawer (hidden by default initially handled by toggling translate-y-full) */}
      <div id="compare-drawer" className="fixed inset-x-0 bottom-0 h-[85vh] bg-white dark:bg-[#050505] border-t border-neutral-800 dark:border-neutral-900 shadow-2xl transform translate-y-full transition-transform duration-500 z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 dark:border-neutral-900">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold dark:text-white">Supplier Comparison</h2>
            <Badge variant="secondary">{compareIds.length} items</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={() => document.getElementById('compare-drawer')?.classList.add('translate-y-full')}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="grid gap-6 min-w-max pb-10" style={{ gridTemplateColumns: `repeat(${suppliers.length}, minmax(300px, 1fr))` }}>
            {/* Header Row */}
            {suppliers.map(s => (
              <div key={s.id} className="relative bg-neutral-950 dark:bg-neutral-950/50 p-4 rounded-xl border border-neutral-800 dark:border-neutral-900">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white dark:bg-neutral-900 shadow-sm" onClick={() => toggleCompare(s.id)}>
                  <X className="h-3 w-3" />
                </Button>
                <img src={s.productImageUrl} alt="" className="w-full h-40 object-cover rounded-lg mb-3" />
                <h3 className="font-semibold text-sm line-clamp-2 dark:text-white">{s.productName}</h3>
                <p className="text-xs text-neutral-500 mt-1 truncate">{s.supplierName}</p>
                <Badge variant="outline" className="mt-2 text-[10px] bg-white dark:bg-neutral-900">{s.platform}</Badge>
              </div>
            ))}

            {/* Price Row */}
            <div style={{ gridColumn: `span ${suppliers.length}` }} className="mt-4 text-sm font-semibold text-neutral-500 uppercase tracking-wider">Pricing & MOQ</div>
            {suppliers.map((s) => {
              const isLowestPrice = suppliers.every(other => s.unitPriceINR <= other.unitPriceINR);
              return (
                <div key={`price-${s.id}`} className={`p-4 rounded-xl border border-neutral-800 dark:border-neutral-900 ${isLowestPrice ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50' : ''}`}>
                  <p className="text-xs text-neutral-500 mb-1">Unit Price</p>
                  <CurrencyBadge originalAmount={s.originalPrice} originalCurrency={s.originalCurrency} inrAmount={s.unitPriceINR} />
                  
                  <div className="mt-4 pt-4 border-t border-neutral-900 dark:border-neutral-800">
                    <p className="text-xs text-neutral-500 mb-1">Minimum Order Qty</p>
                    <p className="font-medium dark:text-neutral-300">{s.moq} {s.moqUnit}</p>
                  </div>
                </div>
              );
            })}

            {/* Shipping Row */}
            <div style={{ gridColumn: `span ${suppliers.length}` }} className="mt-4 text-sm font-semibold text-neutral-500 uppercase tracking-wider">Shipping to India</div>
            {suppliers.map((s) => {
              const isFastest = suppliers.every(other => (s.estimatedDeliveryDays || 999) <= (other.estimatedDeliveryDays || 999));
              return (
                <div key={`ship-${s.id}`} className={`p-4 rounded-xl border border-neutral-800 dark:border-neutral-900 ${isFastest ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50' : ''}`}>
                  <p className="text-xs text-neutral-500 mb-1">Estimated Cost</p>
                  <p className="font-medium dark:text-neutral-300">₹{s.estimatedShippingCostINR?.toLocaleString('en-IN') || 'Unknown'}</p>
                  
                  <div className="mt-4 pt-4 border-t border-neutral-900 dark:border-neutral-800">
                    <p className="text-xs text-neutral-500 mb-1">Delivery Time</p>
                    <p className="font-medium dark:text-neutral-300">~{s.estimatedDeliveryDays} days</p>
                  </div>
                </div>
              );
            })}

            {/* Trust Row */}
            <div style={{ gridColumn: `span ${suppliers.length}` }} className="mt-4 text-sm font-semibold text-neutral-500 uppercase tracking-wider">Trust & Quality</div>
            {suppliers.map(s => (
              <div key={`trust-${s.id}`} className="p-4 rounded-xl border border-neutral-800 dark:border-neutral-900 space-y-3">
                <div className="flex flex-col gap-2">
                  <span className="flex items-center text-sm gap-2 dark:text-neutral-300">
                    {getCountryFlag(s.countryCode)} {s.country}
                  </span>
                  <span className="text-sm dark:text-neutral-300 capitalize">{s.supplierType.replace('_', ' ')}</span>
                  <span className="text-sm dark:text-neutral-300">{s.yearsOnPlatform} Years active</span>
                </div>
                <div className="pt-3 border-t border-neutral-900 dark:border-neutral-800 flex flex-wrap gap-2">
                  {s.verified && <TrustBadge type="verified_supplier" />}
                  {s.tradeAssurance && <TrustBadge type="trade_assurance" />}
                  {s.goldSupplier && <TrustBadge type="gold_supplier" />}
                </div>
              </div>
            ))}
            
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
