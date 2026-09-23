export type CartItem = {
  id: string; // unique ID for the item in cart
  serviceId: string; // which service (vmCustom, vmPackage, s3, k8s, database, lb, vpc, custom)
  serviceName: string; // display name
  description: string; // details of the configuration
  quantity: number; // how many instances
  monthlyPrice: number; // calculated monthly price
  configData?: Record<string, any>; // structured config parameters for interactive re-calculation
};

export type SalesProfile = {
  name: string;
  phone: string;
  email: string;
  title: string;
};

export type QuoteInfo = {
  title: string;
  customerName: string;
  quoteCode: string;
  date: string;
  notes?: string;
  salesProfile?: SalesProfile;
  billingCycleMonths?: number; // 1, 3, 6, 12 months
};

export type SavedQuote = {
  id: string;
  savedAt: string;
  quoteInfo: QuoteInfo;
  cart: CartItem[];
  discountPercent: number | string;
};
