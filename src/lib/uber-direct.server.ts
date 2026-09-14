import type { ShippingOption } from "./shipping.types";

const UBER_AUTH_URL = "https://auth.uber.com/oauth/v2/token";
const UBER_API_URL = "https://api.uber.com";
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

type UberAddress = {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
};

type CachedToken = { value: string; expiresAt: number };
let cachedToken: CachedToken | undefined;
let tokenRequest: Promise<CachedToken> | undefined;

function structuredAddress(address: UberAddress) {
  return JSON.stringify({
    street_address: [
      `${address.street}, ${address.number}`,
      [address.complement, address.neighborhood].filter(Boolean).join(" — "),
    ].filter(Boolean),
    city: address.city,
    state: address.state.toUpperCase(),
    zip_code: address.zip.replace(/\D/g, ""),
    country: "BR",
  });
}

function pickupAddress(originZip: string) {
  return JSON.stringify({
    street_address: ["R. Merendiba, 325", "Pontezinha"],
    city: "Cabo de Santo Agostinho",
    state: "PE",
    zip_code: originZip,
    country: "BR",
  });
}

async function requestToken(signal: AbortSignal): Promise<CachedToken> {
  const clientId = process.env["UBER_DIRECT_CLIENT_ID"];
  const clientSecret = process.env["UBER_DIRECT_CLIENT_SECRET"];
  if (!clientId || !clientSecret) throw new Error("Credenciais Uber Direct ausentes");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: "eats.deliveries",
  });
  const response = await fetch(UBER_AUTH_URL, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error(`OAuth Uber Direct respondeu ${response.status}`);
  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!payload.access_token) throw new Error("OAuth Uber Direct sem token");
  return {
    value: payload.access_token,
    expiresAt: Date.now() + Math.max(60, payload.expires_in ?? 3600) * 1000,
  };
}

async function getAccessToken(signal: AbortSignal) {
  if (cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) {
    return cachedToken.value;
  }
  if (!tokenRequest) {
    tokenRequest = requestToken(signal).finally(() => {
      tokenRequest = undefined;
    });
  }
  cachedToken = await tokenRequest;
  return cachedToken.value;
}

export function uberDirectCredentialsConfigured() {
  return Boolean(
    process.env["UBER_DIRECT_CUSTOMER_ID"] &&
      process.env["UBER_DIRECT_CLIENT_ID"] &&
      process.env["UBER_DIRECT_CLIENT_SECRET"],
  );
}

export async function quoteUberDirect(input: {
  originZip: string;
  destination: UberAddress;
}): Promise<ShippingOption | null> {
  const customerId = process.env["UBER_DIRECT_CUSTOMER_ID"];
  if (!customerId || !uberDirectCredentialsConfigured()) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const accessToken = await getAccessToken(controller.signal);
    const response = await fetch(
      `${UBER_API_URL}/v1/customers/${encodeURIComponent(customerId)}/delivery_quotes`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup_address: pickupAddress(input.originZip),
          dropoff_address: structuredAddress(input.destination),
        }),
      },
    );
    if (!response.ok) {
      console.error("[shipping] Uber Direct respondeu", response.status);
      return null;
    }
    const quote = (await response.json()) as {
      id?: string;
      fee?: number;
      currency?: string;
    };
    const fee = quote.fee;
    if (!quote.id || typeof fee !== "number" || !Number.isInteger(fee) || fee < 0 || quote.currency !== "BRL") {
      console.error("[shipping] Cotação Uber Direct inválida");
      return null;
    }
    return {
      id: "uber_direct:same-day",
      source: "uber_direct",
      serviceId: quote.id,
      serviceName: "Entrega no mesmo dia",
      carrier: "Uber Direct",
      priceCents: fee,
      deadlineDays: 0,
    };
  } catch (error) {
    console.error("[shipping] Uber Direct indisponível", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}