export type ShippingOption = {
  id: string;
  source: "superfrete" | "fallback" | "pickup" | "uber_direct";
  serviceId: string;
  serviceName: string;
  carrier: string;
  priceCents: number;
  deadlineDays: number;
};

export type ShippingAddress = {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
};

export type ShippingQuote = {
  options: ShippingOption[];
  pickupProductIds: string[];
  shippableProductIds: string[];
  hasPickupItems: boolean;
  hasShippableItems: boolean;
  fallbackUsed: boolean;
};
