import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart-context";
import { formatBRL } from "@/lib/format";
import { createPaymentPreference } from "@/lib/checkout.functions";
import { validateCoupon, type CouponValidation } from "@/lib/coupons.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Paulo Bicicletas" },
      { name: "description", content: "Finalize seu pedido na Paulo Bicicletas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type FormState = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  zip: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

const initialState: FormState = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  zip: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

function CheckoutPage() {
  const { items, totalCents, totalItems } = useCart();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const createPref = useServerFn(createPaymentPreference);
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login", search: { redirect: "/checkout" }, replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      customer_name:
        prev.customer_name ||
        (user.user_metadata?.full_name as string | undefined) ||
        "",
      customer_email: prev.customer_email || user.email || "",
    }));
  }, [user]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function lookupCep(rawCep: string) {
    const cep = rawCep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!res.ok) throw new Error("CEP não encontrado");
      const data = (await res.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setForm((prev) => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
    } catch {
      toast.error("Não foi possível consultar o CEP");
    } finally {
      setCepLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Seu carrinho está vazio");
      return;
    }
    setLoading(true);
    try {
      const result = await createPref({
        data: {
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone,
          address: {
            street: form.street,
            number: form.number,
            complement: form.complement,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state,
            zip: form.zip,
          },
          items: items.map((i) => ({
            product_id: i.id,
            product_name: i.name,
            unit_price_cents: i.price_cents,
            quantity: i.quantity,
          })),
        },
      });
      window.location.href = result.checkout_url;
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível iniciar o pagamento. Tente novamente.");
      setLoading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="font-display text-3xl uppercase text-foreground">
          Nada para finalizar
        </h1>
        <p className="mt-2 text-muted-foreground">
          Adicione itens ao carrinho antes de ir para o checkout.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/produtos">Ver produtos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl uppercase text-foreground sm:text-4xl">
        Finalizar compra
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Preencha seus dados para pagar com Mercado Pago.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-lg border border-border bg-card p-6"
        >
          <section className="space-y-4">
            <h2 className="font-display text-xl uppercase text-foreground">
              Seus dados
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  required
                  maxLength={120}
                  value={form.customer_name}
                  onChange={(e) => set("customer_name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  maxLength={255}
                  value={form.customer_email}
                  onChange={(e) => set("customer_email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input
                  id="phone"
                  required
                  placeholder="(81) 90000-0000"
                  maxLength={30}
                  value={form.customer_phone}
                  onChange={(e) => set("customer_phone", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-xl uppercase text-foreground">
              Endereço de entrega
            </h2>
            <div className="grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Label htmlFor="zip">CEP</Label>
                <Input
                  id="zip"
                  required
                  placeholder="00000-000"
                  maxLength={9}
                  value={form.zip}
                  onChange={(e) => set("zip", e.target.value)}
                  onBlur={(e) => lookupCep(e.target.value)}
                />
                {cepLoading && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Buscando CEP...
                  </p>
                )}
              </div>
              <div className="sm:col-span-4">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  required
                  maxLength={200}
                  value={form.street}
                  onChange={(e) => set("street", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  required
                  maxLength={20}
                  value={form.number}
                  onChange={(e) => set("number", e.target.value)}
                />
              </div>
              <div className="sm:col-span-4">
                <Label htmlFor="complement">Complemento (opcional)</Label>
                <Input
                  id="complement"
                  maxLength={120}
                  value={form.complement}
                  onChange={(e) => set("complement", e.target.value)}
                />
              </div>
              <div className="sm:col-span-3">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  required
                  maxLength={120}
                  value={form.neighborhood}
                  onChange={(e) => set("neighborhood", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  required
                  maxLength={120}
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
              <div className="sm:col-span-1">
                <Label htmlFor="state">UF</Label>
                <Input
                  id="state"
                  required
                  maxLength={2}
                  value={form.state}
                  onChange={(e) => set("state", e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate({ to: "/carrinho" })}
            >
              Voltar ao carrinho
            </Button>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Redirecionando..." : "Ir para pagamento"}
            </Button>
          </div>
        </form>

        <aside className="h-fit rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-xl uppercase text-foreground">
            Resumo do pedido
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalItems} {totalItems === 1 ? "item" : "itens"}
          </p>
          <ul className="mt-4 space-y-3 border-t border-border pt-4">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 text-sm">
                <span className="text-foreground">
                  {i.quantity}× {i.name}
                </span>
                <span className="shrink-0 font-medium text-foreground">
                  {formatBRL(i.price_cents * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-display text-lg uppercase text-foreground">
              Total
            </span>
            <span className="text-2xl font-bold text-foreground">
              {formatBRL(totalCents)}
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Pagamento processado com segurança pelo Mercado Pago. Frete
            combinado após a confirmação.
          </p>
        </aside>
      </div>
    </div>
  );
}
