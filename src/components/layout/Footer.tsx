import { Link } from "@tanstack/react-router";
import { Instagram, MapPin, Phone } from "lucide-react";
import logoVertical from "@/assets/logo-vertical.png.asset.json";
import {
  INSTAGRAM_URL,
  STORE_ADDRESS,
  TIKTOK_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_LINK,
} from "@/lib/format";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary text-secondary-foreground">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-4">
        <div className="flex flex-col items-start gap-4">
          <img src={logoVertical.url} alt="Paulo Bicicletas" className="h-24 w-auto brightness-0 invert" />
          <p className="text-sm text-secondary-foreground/80">
            Loja de bicicletas em Cabo de Santo Agostinho desde 1997.
          </p>
        </div>

        <div>
          <h3 className="mb-3 font-display text-lg uppercase">Navegar</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/produtos" className="hover:text-primary">Produtos</Link></li>
            <li><Link to="/sobre" className="hover:text-primary">Sobre a loja</Link></li>
            <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
            <li><Link to="/contato" className="hover:text-primary">Contato</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-display text-lg uppercase">Contato</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{STORE_ADDRESS}</span>
            </li>
            <li>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary">
                <Phone className="h-4 w-4" /> {WHATSAPP_DISPLAY}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-display text-lg uppercase">Redes</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary">
                <Instagram className="h-4 w-4" /> @paulobicicletas
              </a>
            </li>
            <li>
              <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                TikTok @paulobicicletas
              </a>
            </li>
          </ul>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            <Phone className="h-4 w-4" /> Falar no WhatsApp
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-secondary-foreground/70">
        © {new Date().getFullYear()} Paulo Bicicletas — Todos os direitos reservados.
      </div>
    </footer>
  );
}
