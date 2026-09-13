import { z } from "zod";
import type { ShippingOption, ShippingQuote } from "./shipping.types";

export const shippingItemsSchema = z
  .array(
    z.object({
      product_id: z.string().uuid(),
      quantity: z.number().int().positive().max(99),
    }),
  )
  .min(1)
  .max(50);

export type ShippingRequestItem = z.infer<typeof shippingItemsSchema>[number];

const SHIPPABLE_CATEGORIES = new Set([
  "pecas-componentes",
  "acessorios",
  "vestuario",
]);

function cleanZip(value: string) {
  return value.replace(/\D/g, "");
}

function moneyToCents(value: unknown) {
  const normalized = String(value ?? "0").replace(",", ".");
  return Math.max(0, Math.round(Number(normalized) * 100));
}

export async function calculateShippingInternal(
  destinationZip: string,
  requestedItems: ShippingRequestItem[],
): Promise<ShippingQuote> {
  const zip = cleanZip(destinationZip);
  if (zip.length !== 8) throw new Error("CEP inválido");

  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );
  const productIds = [...new Set(requestedItems.map((item) => item.product_id))];
  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select(
      "id, weight_kg, height_cm, width_cm, length_cm, category:categories!inner(slug)",
    )
    .in("id", productIds);
  if (productsError) throw new Error("Não foi possível consultar os produtos");
  if (!products || products.length !== productIds.length) {
    throw new Error("Um produto do carrinho não está mais disponível");
  }

  const quantityById = new Map(
    requestedItems.map((item) => [item.product_id, item.quantity]),
  );
  const normalized = products.map((product) => {
    const categoryValue = product.category as unknown as { slug: string } | null;
    return {
      ...product,
      categorySlug: categoryValue?.slug ?? "",
      quantity: quantityById.get(product.id) ?? 1,
    };
  });
  const shippable = normalized.filter((product) =>
    SHIPPABLE_CATEGORIES.has(product.categorySlug),
  );
  const pickup = normalized.filter(
    (product) => !SHIPPABLE_CATEGORIES.has(product.categorySlug),
  );

  if (shippable.length === 0) {
    return {
      options: [
        {
          id: "pickup",
          source: "pickup",
          serviceId: "pickup",
          serviceName: "Retirada na loja",
          carrier: "Paulo Bicicletas",
          priceCents: 0,
          deadlineDays: 0,
        },
      ],
      pickupProductIds: pickup.map((product) => product.id),
      shippableProductIds: [],
      hasPickupItems: true,
      hasShippableItems: false,
      fallbackUsed: false,
    };
  }

  const { data: config } = await supabaseAdmin
    .from("shipping_config")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  if (!config) throw new Error("Configuração de frete indisponível");

  const token = process.env["SUPERFRETE_TOKEN"];
  if (config.superfrete_enabled && token) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch("https://api.superfrete.com/api/v0/calculator", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "PauloBicicletas/1.0 (contato@paulobicicletas.com.br)",
        },
        body: JSON.stringify({
          from: { postal_code: config.origin_zip },
          to: { postal_code: zip },
          services: config.enabled_services,
          products: shippable.map((product) => ({
            quantity: product.quantity,
            weight: Number(product.weight_kg || config.default_weight_kg),
            height: product.height_cm || config.default_height_cm,
            width: product.width_cm || config.default_width_cm,
            length: product.length_cm || config.default_length_cm,
          })),
          options: {
            own_hand: false,
            receipt: false,
            insurance_value: 0,
            use_insurance_value: false,
          },
        }),
      });
      if (response.ok) {
        const payload = (await response.json()) as Array<{
          id?: number | string;
          name?: string;
          price?: string | number;
          delivery_time?: number;
          has_error?: boolean;
          company?: { name?: string };
        }>;
        const options = payload
          .filter((option) => !option.has_error && moneyToCents(option.price) >= 0)
          .map((option) => ({
            id: `superfrete:${String(option.id)}`,
            source: "superfrete" as const,
            serviceId: String(option.id),
            serviceName: option.name || "Entrega",
            carrier: option.company?.name || "SuperFrete",
            priceCents: moneyToCents(option.price),
            deadlineDays: Math.max(1, Number(option.delivery_time) || 1),
          }));
        if (options.length > 0) {
          return {
            options,
            pickupProductIds: pickup.map((product) => product.id),
            shippableProductIds: shippable.map((product) => product.id),
            hasPickupItems: pickup.length > 0,
            hasShippableItems: true,
            fallbackUsed: false,
          };
        }
      } else {
        console.error("[shipping] SuperFrete respondeu", response.status);
      }
    } catch (error) {
      console.error("[shipping] SuperFrete indisponível", error);
    } finally {
      clearTimeout(timeout);
    }
  }

  const totalWeight = shippable.reduce(
    (sum, product) =>
      sum + Number(product.weight_kg || config.default_weight_kg) * product.quantity,
    0,
  );
  const { data: rates, error: ratesError } = await supabaseAdmin
    .from("shipping_rates")
    .select("id, name, price_cents, deadline_days")
    .eq("active", true)
    .lte("zip_start", zip)
    .gte("zip_end", zip)
    .lt("weight_min_kg", totalWeight)
    .gte("weight_max_kg", totalWeight)
    .order("price_cents", { ascending: true });
  if (ratesError) throw new Error("Não foi possível calcular o frete de contingência");
  const options = (rates ?? []).map((rate) => ({
    id: `fallback:${rate.id}`,
    source: "fallback" as const,
    serviceId: String(rate.id),
    serviceName: rate.name,
    carrier: "Frete de contingência",
    priceCents: rate.price_cents,
    deadlineDays: rate.deadline_days,
  }));
  if (options.length === 0) {
    throw new Error("Não há tarifa de frete disponível para este CEP e peso");
  }
  return {
    options,
    pickupProductIds: pickup.map((product) => product.id),
    shippableProductIds: shippable.map((product) => product.id),
    hasPickupItems: pickup.length > 0,
    hasShippableItems: true,
    fallbackUsed: true,
  };
}
