import { MessageCircle } from "lucide-react";
import { WHATSAPP_LINK } from "@/lib/format";

export function WhatsAppFab() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <MessageCircle className="h-7 w-7" strokeWidth={2.5} />
    </a>
  );
}
