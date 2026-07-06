import { createFileRoute } from "@tanstack/react-router";
import { Award, Users, Wrench } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Paulo Bicicletas" },
      {
        name: "description",
        content:
          "Loja de bicicletas fundada em 1997 em Cabo de Santo Agostinho. Atendimento próximo, qualidade e comunidade.",
      },
      { property: "og:title", content: "Sobre a Paulo Bicicletas" },
      {
        property: "og:description",
        content: "Loja de bairro que virou referência regional em bicicletas desde 1997.",
      },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <div>
      <section className="bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <p className="mb-2 font-display text-sm uppercase tracking-widest text-primary">
            Desde 1997
          </p>
          <h1 className="font-display text-4xl uppercase sm:text-5xl">Sobre a loja</h1>
          <p className="mt-4 max-w-2xl text-secondary-foreground/85">
            A Paulo Bicicletas nasceu em 1997 em Cabo de Santo Agostinho, Pernambuco. Começamos
            como uma oficina de bairro e crescemos junto com a cidade, atendendo três gerações de
            ciclistas.
          </p>
        </div>
      </section>

      <section className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="font-display text-3xl uppercase">Nossa missão</h2>
          <p className="mt-4 text-foreground/85">
            Colocar mais gente pedalando. Vendemos e cuidamos de bicicletas para todo tipo de
            ciclista — de quem usa pra ir trabalhar, à galera do MTB, do speed e das primeiras
            pedaladas da criançada.
          </p>
          <p className="mt-4 text-foreground/85">
            Tudo passa pela nossa oficina antes de sair da loja. E depois da venda, você tem a
            gente por perto pra dúvida, revisão e ajuste.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="aspect-square rounded-xl bg-muted" />
          <div className="aspect-square rounded-xl bg-muted" />
          <div className="col-span-2 aspect-video rounded-xl bg-muted" />
        </div>
      </section>

      <section className="bg-muted">
        <div className="container mx-auto grid gap-6 px-4 py-14 md:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Atendimento próximo",
              text: "A gente conhece você pelo nome. Loja de bairro no melhor sentido.",
            },
            {
              icon: Wrench,
              title: "Oficina de verdade",
              text: "Mecânicos experientes e peças originais. Revisão, ajuste e montagem.",
            },
            {
              icon: Award,
              title: "Referência regional",
              text: "Mais de duas décadas atendendo Cabo, Recife e cidades da região.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-6">
              <Icon className="h-8 w-8 text-primary" />
              <h3 className="mt-3 font-display text-xl uppercase">{title}</h3>
              <p className="mt-2 text-sm text-foreground/80">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
