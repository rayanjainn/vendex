"use client";

import { SupplierResult } from "@/lib/types";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { TrustBadge } from "@/components/shared/TrustBadge";
import { RatingStars } from "@/components/shared/RatingStars";
import { getCountryFlag, calculateMatchColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/stores/uiStore";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchX } from "lucide-react";

export function SupplierTable({ suppliers }: { suppliers: SupplierResult[] }) {
  const { toggleCompare, compareIds } = useUIStore();

  if (suppliers.length === 0) {
    return (
      <EmptyState 
        icon={<SearchX className="h-10 w-10 text-neutral-400" />}
        title="No suppliers found"
        description="Try adjusting your filters to see more results."
        className="bg-white dark:bg-[#050505] border border-neutral-800 dark:border-neutral-900 rounded-xl"
      />
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden w-full shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-12 text-center"></TableHead>
              <TableHead className="min-w-[250px]">Product</TableHead>
              <TableHead className="min-w-[200px]">Supplier</TableHead>
              <TableHead className="w-32">Match</TableHead>
              <TableHead className="w-32 text-right">Unit Price</TableHead>
              <TableHead className="w-24 text-right">MOQ</TableHead>
              <TableHead className="min-w-[150px]">Quality Signals</TableHead>
              <TableHead className="w-32">Platform</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map(supplier => {
              const isSelected = compareIds.includes(supplier.id);
              return (
                <TableRow key={supplier.id} className={`${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => toggleCompare(supplier.id)}
                      aria-label="Select to compare"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {supplier.productImageUrl ? (
                        <img
                          src={supplier.productImageUrl}
                          alt=""
                          className="h-10 w-10 rounded object-cover border border-slate-200 flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-slate-100 border border-slate-200 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm text-neutral-950 dark:text-white line-clamp-1" title={supplier.productName}>{supplier.productName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <RatingStars rating={supplier.rating} reviewCount={supplier.reviewCount} />
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-slate-800 line-clamp-1" title={supplier.supplierName}>{supplier.supplierName}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-neutral-500">
                      <span>{getCountryFlag(supplier.countryCode)} {supplier.countryCode}</span>
                      <span>•</span>
                      <span className="capitalize">{supplier.supplierType.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${calculateMatchColor(supplier.matchScore)}`}>
                      {supplier.matchScore}% 
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-slate-900">₹{supplier.unitPriceINR.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-neutral-500">{supplier.originalCurrency} {supplier.unitPriceUSD?.toFixed(2) || supplier.originalPrice}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm text-neutral-950 dark:text-neutral-300 font-medium">{supplier.moq}</span>
                    <span className="text-xs text-neutral-500 block">{supplier.moqUnit}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {supplier.verified && <TrustBadge type="verified_supplier" label="Verif" />}
                      {supplier.tradeAssurance && <TrustBadge type="trade_assurance" label="TA" />}
                      {supplier.goldSupplier && <TrustBadge type="gold_supplier" label="Gold" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase">{supplier.platform}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {supplier.productProperties?.chat_url && (
                        <a href={supplier.productProperties.chat_url} target="_blank" rel="noreferrer">
                          <Button size="sm" className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                            <MessageCircle className="h-3 w-3" />
                            Chat
                          </Button>
                        </a>
                      )}
                      <a href={supplier.productUrl} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-neutral-400 dark:text-neutral-200">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
