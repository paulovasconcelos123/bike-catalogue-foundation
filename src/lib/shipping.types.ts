export type ShippingOption = {
  id: string;
  source: "superfrete" | "fallback" | "pickup";
  serviceId: string;
  serviceName: string;
  carrier: string;
  priceCents: number;
  deadlineDays: number;
};

export type ShippingQuote = {
  options: ShippingOption[];
  pickupProductIds: string[];
  shippableProductIds: string[];
  hasPickupItems: boolean;
  hasShippableItems: boolean;
  fallbackUsed: boolean;
};
