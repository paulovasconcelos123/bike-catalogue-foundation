import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  INSTAGRAM_URL,
  MAPS_EMBED_URL,
  STORE_ADDRESS,
  TIKTOK_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_LINK,
} from "@/lib/format";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Paulo Bicicletas" },
      {
        name: "description",
        content:
          "Fale com a Paulo Bicicletas: WhatsApp, endereço e redes sociais. Cabo de Santo Agostinho, PE.",
      },
    ],
  }),
  component: ContatoPage,
});

function ContatoPage() {
  const [sending, setSending] = useState(false);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-3xl uppercase sm:text-4xl">Contato</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Chame no WhatsApp pra atendimento rápido, ou mande uma mensagem pelo formulário.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {/* Left: Info */}
        <div className="space-y-6">
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#25D366] text-white">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-lg uppercase">WhatsApp</p>
              <p className="text-sm text-muted-foreground">{WHATSAPP_DISPLAY}</p>
            </div>
          </a>

          <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-lg uppercase">Endereço</p>
              <p className="text-sm text-muted-foreground">{STORE_ADDRESS}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-lg uppercase">Redes</p>
              <div className="mt-1 flex flex-col gap-1 text-sm">
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary">
                  <Instagram className="h-4 w-4" /> @paulobicicletas
                </a>
                <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                  TikTok @paulobicicletas
                </a>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              title="Localização Paulo Bicicletas"
              src={MAPS_EMBED_URL}
              width="100%"
              height="300"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="border-0"
            />
          </div>
        </div>

        {/* Right: Form */}
        <form
          className="space-y-4 rounded-xl border border-border bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSending(true);
            setTimeout(() => {
              setSending(false);
              (e.target as HTMLFormElement).reset();
              toast.success("Mensagem enviada! Vamos responder em breve.");
            }, 700);
          }}
        >
          <h2 className="font-display text-xl uppercase">Mande uma mensagem</h2>
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea id="mensagem" name="mensagem" rows={5} required />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={sending}>
            <Mail className="mr-2 h-4 w-4" /> {sending ? "Enviando..." : "Enviar"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Para respostas mais rápidas, chame direto no WhatsApp.
          </p>
        </form>
      </div>
    </div>
  );
}
