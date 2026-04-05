export interface PipelineStage {
  stage: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  message: string;
  durationMs?: number;
  timestamp: string;
}

export interface ReelJob {
  id: string;
  reelUrl: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'other';
  status: 'pending' | 'downloading' | 'extracting' | 'searching' | 'normalizing' | 'complete' | 'failed';
  createdAt: string;
  updatedAt: string;
  extractedFrameUrl?: string;
  detectedProductName?: string;
  detectedKeywords?: string[];
  errorMessage?: string;
  resultCount?: number;
  pipelineStages?: PipelineStage[];
  progressPercent?: number;
  detailedLogs?: any[];
  durationSeconds?: number;
  label?: string;
  csvRowId?: string;
}

export interface SupplierResult {
  id: string;
  jobId: string;
  // Product Info
  productName: string;
  productDescription: string;
  productImageUrl: string;
  productCategory: string;
  // Supplier Info  
  supplierName: string;
  supplierType: 'manufacturer' | 'trading_company' | 'distributor' | 'supplier';
  companyName: string;
  country: string;
  countryCode: string;
  city?: string;
  verified: boolean;
  goldSupplier: boolean;
  tradeAssurance: boolean;
  yearsOnPlatform: number;
  // Pricing
  unitPriceUSD?: number;
  unitPriceCNY?: number;
  unitPriceINR: number;
  originalCurrency: string;
  originalPrice: number;
  priceRangeMin?: number;
  priceRangeMax?: number;
  moq: number;
  moqUnit: string;
  // Shipping
  shippingMethods: string[];
  estimatedShippingCostUSD?: number;
  estimatedShippingCostINR?: number;
  totalPriceINR: number;
  estimatedDeliveryDays?: number;
  // Quality Signals
  rating: number;
  reviewCount: number;
  responseRate?: string;
  responseTime?: string;
  warranty?: string;
  certifications?: string[];
  sampleAvailable: boolean;
  samplePriceUSD?: number;
  samplePriceINR?: number;
  reorderRate?: string;
  onTimeDeliveryRate?: string;
  location?: string;
  // Platform Info
  platform: 'alibaba' | 'aliexpress' | 'made-in-china' | 'indiamart' | 'other';
  productUrl: string;
  itemId?: string;
  storeId?: string;
  // Matching
  matchScore: number;
  matchSource: 'visual' | 'keyword' | 'combined';
  productProperties?: Record<string, any>;
  createdAt: string;
  // Raw
  rawApiResponse?: Record<string, unknown>;
}

export interface CsvRow {
  id: string;
  uploadId: string;
  uploadName: string;
  srNo: string;
  sentBy: string;
  skuName: string;
  productLink: string;
  productImage: string;
  inquirySent: string;
  extraData: Record<string, string>;
  jobId: string | null;
  status: 'pending' | 'processing' | 'done' | 'failed';
  createdAt: string;
}

export interface SystemSettings {
  rapidApiKey: string;
  googleLensApiKey?: string;
  serpApiKey?: string;
  preferredCurrency: 'INR' | 'USD' | 'CNY';
  countryPriority: string[];
  maxResultsPerReel: number;
  autoConvertCurrency: boolean;
  enabledPlatforms: string[];
  detailedLogging: boolean;
}
