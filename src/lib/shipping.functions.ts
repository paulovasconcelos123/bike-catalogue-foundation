import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const quoteInput = z.object({
  destination_zip: z.string().trim().min(8).max(9),
  destination_address: z.object({
    street: z.string().trim().min(1).max(200),
    number: z.string().trim().min(1).max(20),
    complement: z.string().trim().max(120).optional(),
    neighborhood: z.string().trim().min(1).max(120),
    city: z.string().trim().min(1).max(120),
    state: z.string().trim().length(2),
    zip: z.string().trim().min(8).max(9),
  }).optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive().max(99),
  })).min(1).max(50),
});

export const getShippingOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => quoteInput.parse(data))
  .handler(async ({ data }) => {
    const { calculateShippingInternal } = await import("./shipping.server");
    return calculateShippingInternal(data.destination_zip, data.items, data.destination_address);
  });
