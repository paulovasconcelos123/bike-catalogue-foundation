export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export const WHATSAPP_NUMBER = "5581986218601";
export const WHATSAPP_DISPLAY = "(81) 98621-8601";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;
export const STORE_ADDRESS =
  "R. Merendiba, 325 — Pontezinha, Cabo de Santo Agostinho - PE, 54589-050";
export const STORE_ADDRESS_SHORT =
  "R. Merendiba, 325 — Pontezinha, Cabo de Santo Agostinho, PE";
export const INSTAGRAM_URL = "https://instagram.com/paulobicicletas";
export const TIKTOK_URL = "https://tiktok.com/@paulobicicletas";
export const MAPS_EMBED_URL =
  "https://www.google.com/maps?q=" +
  encodeURIComponent("R. Merendiba, 325, Pontezinha, Cabo de Santo Agostinho - PE") +
  "&output=embed";

export function whatsappLinkWithText(text: string): string {
  return `${WHATSAPP_LINK}?text=${encodeURIComponent(text)}`;
}
