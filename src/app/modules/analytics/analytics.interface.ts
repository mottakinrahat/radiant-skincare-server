export type AnalyticsEventType =
  | "SEARCH"
  | "VIEW"
  | "ADD_TO_CART"
  | "INITIATE_CHECKOUT"
  | "ABANDONED_CART"
  | "PURCHASE";

export interface ITrackEventInput {
  productId?: string;
  eventType: AnalyticsEventType;
  visitorId?: string;
  sessionId?: string;
  searchQuery?: string;
  metadata?: Record<string, any>;
}

export interface IAnalyticsFilterRequest {
  startDate?: string;
  endDate?: string;
  timeRange?: "today" | "yesterday" | "last7days" | "last30days" | "thisMonth" | "custom";
  productId?: string;
  searchTerm?: string;
  status?: string;
}

export interface IAnalyticsOverview {
  totalViews: number;
  uniqueVisitors: number;
  totalSearches: number;
  totalAddToCart: number;
  totalCheckoutInitiated: number;
  totalAbandonedCarts: number;
  totalPurchases: number;
  conversionRate: number;
  totalRevenue: number;
  funnel: {
    searches: number;
    views: number;
    addToCart: number;
    checkoutInitiated: number;
    purchases: number;
    searchToViewRate: number;
    viewToCartRate: number;
    cartToCheckoutRate: number;
    checkoutToPurchaseRate: number;
  };
  dailyTimeline: Array<{
    date: string;
    views: number;
    uniqueVisitors: number;
    searches: number;
    addToCart: number;
    checkoutInitiated: number;
    purchases: number;
    revenue: number;
  }>;
}

export interface IProductAnalyticsItem {
  productId: string;
  productName: string;
  slug: string;
  sku?: string;
  imageUrl?: string;
  categoryName?: string;
  sellingPrice: number;
  searches: number;
  totalViews: number;
  uniqueVisitors: number;
  addToCart: number;
  checkoutInitiated: number;
  abandonedCarts: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
}

export interface IAbandonedCartAnalyticsItem {
  id: string;
  customerName?: string;
  customerPhone: string;
  customerEmail?: string;
  district?: string;
  items: Array<{
    productId?: string;
    name?: string;
    price?: number;
    quantity?: number;
    image?: string;
  }>;
  totalAmount: number;
  status: string;
  followUpNote?: string;
  createdAt: string;
  updatedAt: string;
}
