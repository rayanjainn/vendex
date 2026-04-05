import { create } from 'zustand';
import { SupplierResult } from '@/lib/types';

export type SortKey =
  | 'smart'
  | 'matchScore'
  | 'unitPriceINR_asc'
  | 'unitPriceINR_desc'
  | 'totalPriceINR_asc'
  | 'totalPriceINR_desc'
  | 'moq_asc'
  | 'moq_desc'
  | 'rating'
  | 'deliveryDays'
  | 'yearsOnPlatform'
  | 'reviewCount';

export interface Filters {
  countries: string[];
  supplierTypes: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minMoq: number | null;
  maxMoq: number | null;
  minRating: number;
  minDeliveryDays: number | null;
  maxDeliveryDays: number | null;
  minYearsOnPlatform: number | null;
  verifiedOnly: boolean;
  goldSupplierOnly: boolean;
  tradeAssuranceOnly: boolean;
  sampleAvailableOnly: boolean;
  topRankedOnly: boolean;
  certifications: string[];
  responseTimeMax: string | null; // e.g. "4h", "12h", "24h"
  sortBy: SortKey;
}

interface SupplierState {
  suppliers: SupplierResult[];
  filters: Filters;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  filteredAndSortedSuppliers: (jobId: string) => SupplierResult[];
}

export const defaultFilters: Filters = {
  countries: [],
  supplierTypes: [],
  minPrice: null,
  maxPrice: null,
  minMoq: null,
  maxMoq: null,
  minRating: 0,
  minDeliveryDays: null,
  maxDeliveryDays: null,
  minYearsOnPlatform: null,
  verifiedOnly: false,
  goldSupplierOnly: false,
  tradeAssuranceOnly: false,
  sampleAvailableOnly: false,
  topRankedOnly: false,
  certifications: [],
  responseTimeMax: null,
  sortBy: 'smart',
};

function parseResponseHours(rt: string | null | undefined): number {
  if (!rt) return Infinity;
  const m = rt.match(/(\d+)/);
  return m ? parseInt(m[1]) : Infinity;
}

function getRankNumber(s: SupplierResult): number {
  const n = s.productProperties?.rank_number;
  return typeof n === 'number' && n > 0 && n <= 20 ? n : Infinity;
}

function sortSuppliers(suppliers: SupplierResult[], sortBy: SortKey): SupplierResult[] {
  const sorted = [...suppliers];
  switch (sortBy) {
    case 'smart':
      // Top-20 ranked products first (sorted by rank number),
      // then unranked products sorted by price asc, then review count desc.
      return sorted.sort((a, b) => {
        const ra = getRankNumber(a);
        const rb = getRankNumber(b);
        const aRanked = ra !== Infinity;
        const bRanked = rb !== Infinity;
        if (aRanked && bRanked) return ra - rb;          // both ranked: lower rank wins
        if (aRanked && !bRanked) return -1;               // a ranked, b not: a first
        if (!aRanked && bRanked) return 1;                // b ranked, a not: b first
        // neither ranked: price asc, then reviews desc
        const priceDiff = (a.unitPriceINR || 0) - (b.unitPriceINR || 0);
        if (priceDiff !== 0) return priceDiff;
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      });
    case 'matchScore':       return sorted.sort((a, b) => b.matchScore - a.matchScore);
    case 'unitPriceINR_asc': return sorted.sort((a, b) => (a.unitPriceINR || 0) - (b.unitPriceINR || 0));
    case 'unitPriceINR_desc':return sorted.sort((a, b) => (b.unitPriceINR || 0) - (a.unitPriceINR || 0));
    case 'totalPriceINR_asc':return sorted.sort((a, b) => (a.totalPriceINR || 0) - (b.totalPriceINR || 0));
    case 'totalPriceINR_desc':return sorted.sort((a, b) => (b.totalPriceINR || 0) - (a.totalPriceINR || 0));
    case 'moq_asc':          return sorted.sort((a, b) => (a.moq || 0) - (b.moq || 0));
    case 'moq_desc':         return sorted.sort((a, b) => (b.moq || 0) - (a.moq || 0));
    case 'rating':           return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'reviewCount':      return sorted.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    case 'deliveryDays':     return sorted.sort((a, b) => (a.estimatedDeliveryDays ?? 9999) - (b.estimatedDeliveryDays ?? 9999));
    case 'yearsOnPlatform':  return sorted.sort((a, b) => (b.yearsOnPlatform || 0) - (a.yearsOnPlatform || 0));
    default:                 return sorted;
  }
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  filters: defaultFilters,
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  resetFilters: () => set({ filters: defaultFilters }),
  filteredAndSortedSuppliers: (jobId) => {
    const { suppliers, filters } = get();
    const filtered = suppliers.filter(s => {
      if (s.jobId !== jobId) return false;
      if (filters.countries.length && !filters.countries.includes(s.countryCode)) return false;
      if (filters.supplierTypes.length && !filters.supplierTypes.includes(s.supplierType)) return false;
      if (filters.minPrice !== null && (s.unitPriceINR || 0) < filters.minPrice) return false;
      if (filters.maxPrice !== null && (s.unitPriceINR || 0) > filters.maxPrice) return false;
      if (filters.minMoq !== null && (s.moq || 0) < filters.minMoq) return false;
      if (filters.maxMoq !== null && (s.moq || 0) > filters.maxMoq) return false;
      if (filters.minRating > 0 && (s.rating || 0) < filters.minRating) return false;
      if (filters.minDeliveryDays !== null && (s.estimatedDeliveryDays ?? 0) < filters.minDeliveryDays) return false;
      if (filters.maxDeliveryDays !== null && (s.estimatedDeliveryDays ?? 9999) > filters.maxDeliveryDays) return false;
      if (filters.minYearsOnPlatform !== null && (s.yearsOnPlatform || 0) < filters.minYearsOnPlatform) return false;
      if (filters.verifiedOnly && !s.verified) return false;
      if (filters.goldSupplierOnly && !s.goldSupplier) return false;
      if (filters.tradeAssuranceOnly && !s.tradeAssurance) return false;
      if (filters.sampleAvailableOnly && !s.sampleAvailable) return false;
      if (filters.topRankedOnly && getRankNumber(s) === Infinity) return false;
      if (filters.certifications.length) {
        const sCerts = s.certifications || (s.productProperties?.certifications as string[]) || [];
        if (!filters.certifications.some(c => sCerts.includes(c))) return false;
      }
      if (filters.responseTimeMax) {
        const maxHrs = parseResponseHours(filters.responseTimeMax);
        const supplierHrs = parseResponseHours(s.responseTime);
        if (supplierHrs > maxHrs) return false;
      }
      return true;
    });
    return sortSuppliers(filtered, filters.sortBy);
  },
}));
