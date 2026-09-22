export type CartItem = {
  id: string; // unique ID for the item in cart
  serviceId: string; // which service (vmCustom, vmPackage, s3, k8s, database, lb, vpc, custom)
  serviceName: string; // display name
  description: string; // details of the configuration
  quantity: number; // how many instances
  monthlyPrice: number; // calculated monthly price
  configData?: Record<string, any>; // structured config parameters for interactive re-calculation
};

export type QuoteInfo = {
  title: string;
  customerName: string;
  quoteCode: string;
  date: string;
  notes?: string;
};
