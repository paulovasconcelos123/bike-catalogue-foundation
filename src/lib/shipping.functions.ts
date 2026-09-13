import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { calculateShippingInternal, shippingItemsSchema } from "./shipping.server";

const quoteInput = z.object({
  destination_zip: z.string().trim().min(8).max(9),
  items: shippingItemsSchema,
});

export const getShippingOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => quoteInput.parse(data))
  .handler(async ({ data }) =>
    calculateShippingInternal(data.destination_zip, data.items),
  );
