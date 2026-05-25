export type CartItem = {
  id: string; // unique ID for the item in cart
  serviceId: string; // which service (VM, S3, etc)
  serviceName: string; // display name
  description: string; // details of the configuration
  quantity: number; // how many instances
  monthlyPrice: number; // calculated monthly price
};
