import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { formatBRL } from "@/lib/format";
import { ImagesUpload, VideoUpload } from "@/components/admin/ProductMediaUpload";

import {
  adminDeleteCategory,
  adminDeleteProduct,
  adminDeleteSubcategory,
  adminGetOrder,
  adminListCategories,
  adminListContactMessages,
  adminListOrders,
  adminListProducts,
  adminUpdateOrderStatus,
  adminUpsertCategory,
  adminUpsertProduct,
  adminUpsertSubcategory,
} from "@/lib/admin.functions";
import {
  adminDeleteCoupon,
  adminListCoupons,
  adminToggleCoupon,
  adminUpsertCoupon,
} from "@/lib/coupons.functions";
import { adminDeleteReview, adminListReviews } from "@/lib/reviews.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin — Paulo Bicicletas" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) {
      navigate({ to: "/", replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 font-display text-3xl uppercase tracking-wide text-foreground">
        Painel administrativo
      </h1>
      <Tabs defaultValue="produtos">
        <TabsList className="mb-6 flex flex-wrap">
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="cupons">Cupons</TabsTrigger>
          <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
        </TabsList>
        <TabsContent value="produtos">
          <ProductsPanel />
        </TabsContent>
        <TabsContent value="pedidos">
          <OrdersPanel />
        </TabsContent>
        <TabsContent value="categorias">
          <CategoriesPanel />
        </TabsContent>
        <TabsContent value="cupons">
          <CouponsPanel />
        </TabsContent>
        <TabsContent value="mensagens">
          <MessagesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========== PRODUCTS ==========
type ProductRow = Awaited<ReturnType<typeof adminListProducts>>[number];
type CategoriesData = Awaited<ReturnType<typeof adminListCategories>>;

function ProductsPanel() {
  const list = useServerFn(adminListProducts);
  const listCats = useServerFn(adminListCategories);
  const upsert = useServerFn(adminUpsertProduct);
  const remove = useServerFn(adminDeleteProduct);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [cats, setCats] = useState<CategoriesData>({ categories: [], subcategories: [] });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [open, setOpen] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([list(), listCats()]);
      setProducts(p);
      setCats(c);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(p: ProductRow) {
    setEditing(p);
    setOpen(true);
  }
  async function handleDelete(id: string) {
    if (!confirm("Remover este produto?")) return;
    try {
      await remove({ data: { id } });
      toast.success("Produto removido");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h2 className="font-display text-xl uppercase">Produtos ({products.length})</h2>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo produto
        </Button>
      </div>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(p.category as any)?.name}
                    {(p.subcategory as any)?.name
                      ? ` › ${(p.subcategory as any).name}`
                      : ""}
                  </TableCell>
                  <TableCell className="text-right">{formatBRL(p.price_cents)}</TableCell>
                  <TableCell className="text-right">{p.stock}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum produto ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <ProductDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        cats={cats}
        onSaved={() => {
          setOpen(false);
          refresh();
        }}
        upsert={upsert}
      />
    </div>
  );
}

function ProductDialog({
  open,
  onOpenChange,
  editing,
  cats,
  onSaved,
  upsert,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: ProductRow | null;
  cats: CategoriesData;
  onSaved: () => void;
  upsert: (args: { data: any }) => Promise<any>;
}) {
  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
    subcategory_id: "",
    images: [] as string[],
    video_url: null as string | null,
    featured: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        slug: editing.slug,
        name: editing.name,
        description: editing.description ?? "",
        price: (editing.price_cents / 100).toFixed(2),
        stock: String(editing.stock),
        category_id: editing.category_id,
        subcategory_id: editing.subcategory_id ?? "",
        images: (editing.images as string[]) ?? [],
        video_url: (editing as any).video_url ?? null,
        featured: editing.featured,
      });
    } else {
      setForm({
        slug: "",
        name: "",
        description: "",
        price: "",
        stock: "0",
        category_id: cats.categories[0]?.id ?? "",
        subcategory_id: "",
        images: [],
        video_url: null,
        featured: false,
      });
    }
  }, [open, editing, cats]);

  const availableSubs = useMemo(
    () => cats.subcategories.filter((s) => s.category_id === form.category_id),
    [cats, form.category_id],
  );

  async function handleSave() {
    setSaving(true);
    try {
      await upsert({
        data: {
          id: editing?.id,
          slug: form.slug.trim().toLowerCase(),
          name: form.name.trim(),
          description: form.description,
          price_cents: Math.round(parseFloat(form.price || "0") * 100),
          stock: parseInt(form.stock || "0", 10),
          category_id: form.category_id,
          subcategory_id: form.subcategory_id || null,
          images: form.images,
          video_url: form.video_url,
          featured: form.featured,
        },
      });
      toast.success(editing ? "Produto atualizado" : "Produto criado");
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

        <DialogHeader>
          <DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Nome</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="ex-nome-do-produto"
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <Label>Estoque</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) =>
                  setForm({ ...form, category_id: v, subcategory_id: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {cats.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subcategoria</Label>
              <Select
                value={form.subcategory_id || "__none__"}
                onValueChange={(v) =>
                  setForm({ ...form, subcategory_id: v === "__none__" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— nenhuma —</SelectItem>
                  {availableSubs.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Fotos do produto</Label>
            <p className="mb-2 text-xs text-muted-foreground">
              A primeira imagem será a capa. Arraste para reordenar via setas.
            </p>
            <ImagesUpload
              value={form.images}
              onChange={(v) => setForm({ ...form, images: v })}
            />
          </div>
          <div>
            <Label>Vídeo do produto (opcional)</Label>
            <div className="mt-2">
              <VideoUpload
                value={form.video_url}
                onChange={(v) => setForm({ ...form, video_url: v })}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Destacar na home
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ========== ORDERS ==========
type OrderRow = Awaited<ReturnType<typeof adminListOrders>>[number];
type OrderDetail = Awaited<ReturnType<typeof adminGetOrder>>;

const STATUS: Record<string, string> = {
  pending: "Aguardando",
  paid: "Pago",
  cancelled: "Cancelado",
  failed: "Falhou",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> =
  {
    pending: "outline",
    paid: "default",
    cancelled: "secondary",
    failed: "destructive",
  };

function OrdersPanel() {
  const list = useServerFn(adminListOrders);
  const get = useServerFn(adminGetOrder);
  const updateStatus = useServerFn(adminUpdateOrderStatus);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<OrderDetail | null>(null);
  const [open, setOpen] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setOrders(await list());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  async function openDetail(id: string) {
    const detail = await get({ data: { id } });
    setSelected(detail);
    setOpen(true);
  }
  async function changeStatus(id: string, status: string) {
    try {
      await updateStatus({ data: { id, status: status as any } });
      toast.success("Status atualizado");
      refresh();
      if (selected?.id === id) {
        setSelected({ ...selected, status: status as any });
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl uppercase">Pedidos ({filtered.length})</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Aguardando</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(o.id)}
                >
                  <TableCell className="text-sm">
                    {new Date(o.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div>{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.customer_email}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatBRL(o.total_cents)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[o.status]}>
                      {STATUS[o.status] ?? o.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum pedido.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pedido</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div>
                <div className="font-semibold">{selected.customer_name}</div>
                <div className="text-muted-foreground">
                  {selected.customer_email} · {selected.customer_phone}
                </div>
              </div>
              <div>
                <div className="mb-1 font-semibold">Endereço</div>
                <div className="text-muted-foreground">
                  {selected.address_street}, {selected.address_number}
                  {selected.address_complement ? ` — ${selected.address_complement}` : ""}
                  <br />
                  {selected.address_neighborhood} — {selected.address_city}/
                  {selected.address_state} · CEP {selected.address_zip}
                </div>
              </div>
              <div>
                <div className="mb-1 font-semibold">Itens</div>
                <ul className="space-y-1">
                  {(selected as any).items.map((it: any, i: number) => (
                    <li key={i} className="flex justify-between">
                      <span>
                        {it.quantity}× {it.product_name}
                      </span>
                      <span>{formatBRL(it.unit_price_cents * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span>{formatBRL(selected.total_cents)}</span>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={selected.status}
                  onValueChange={(v) => changeStatus(selected.id, v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Aguardando</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== CATEGORIES ==========
function CategoriesPanel() {
  const list = useServerFn(adminListCategories);
  const upsertCat = useServerFn(adminUpsertCategory);
  const delCat = useServerFn(adminDeleteCategory);
  const upsertSub = useServerFn(adminUpsertSubcategory);
  const delSub = useServerFn(adminDeleteSubcategory);
  const [data, setData] = useState<CategoriesData>({ categories: [], subcategories: [] });
  const [loading, setLoading] = useState(true);
  const [catDialog, setCatDialog] = useState<{
    open: boolean;
    editing: any | null;
  }>({ open: false, editing: null });
  const [subDialog, setSubDialog] = useState<{
    open: boolean;
    editing: any | null;
    categoryId: string;
  }>({ open: false, editing: null, categoryId: "" });

  async function refresh() {
    setLoading(true);
    try {
      setData(await list());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  async function handleDelCat(id: string) {
    if (!confirm("Remover categoria? Isso pode falhar se houver produtos vinculados.")) return;
    try {
      await delCat({ data: { id } });
      toast.success("Removida");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  async function handleDelSub(id: string) {
    if (!confirm("Remover subcategoria?")) return;
    try {
      await delSub({ data: { id } });
      toast.success("Removida");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;
  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h2 className="font-display text-xl uppercase">Categorias</h2>
        <Button onClick={() => setCatDialog({ open: true, editing: null })}>
          <Plus className="mr-2 h-4 w-4" /> Nova categoria
        </Button>
      </div>
      <div className="space-y-4">
        {data.categories.map((c) => {
          const subs = data.subcategories.filter((s) => s.category_id === c.id);
          return (
            <div key={c.id} className="rounded-md border p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="font-display text-lg uppercase">{c.name}</div>
                  <div className="text-xs text-muted-foreground">/{c.slug}</div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSubDialog({ open: true, editing: null, categoryId: c.id })
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" /> Sub
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setCatDialog({ open: true, editing: c })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelCat(c.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {subs.length > 0 && (
                <ul className="ml-4 space-y-1 border-l pl-4">
                  {subs.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        {s.name}{" "}
                        <span className="text-xs text-muted-foreground">/{s.slug}</span>
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setSubDialog({
                              open: true,
                              editing: s,
                              categoryId: c.id,
                            })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelSub(s.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <CategoryDialog
        open={catDialog.open}
        onOpenChange={(o) => setCatDialog({ ...catDialog, open: o })}
        editing={catDialog.editing}
        onSaved={async (values) => {
          try {
            await upsertCat({ data: { id: catDialog.editing?.id, ...values } });
            toast.success("Salvo");
            setCatDialog({ open: false, editing: null });
            refresh();
          } catch (e: any) {
            toast.error(e.message);
          }
        }}
      />
      <SubcategoryDialog
        open={subDialog.open}
        onOpenChange={(o) => setSubDialog({ ...subDialog, open: o })}
        editing={subDialog.editing}
        categoryId={subDialog.categoryId}
        onSaved={async (values) => {
          try {
            await upsertSub({
              data: {
                id: subDialog.editing?.id,
                category_id: subDialog.categoryId,
                ...values,
              },
            });
            toast.success("Salvo");
            setSubDialog({ open: false, editing: null, categoryId: "" });
            refresh();
          } catch (e: any) {
            toast.error(e.message);
          }
        }}
      />
    </div>
  );
}

function CategoryDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: any | null;
  onSaved: (values: { slug: string; name: string; sort: number }) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sort, setSort] = useState("0");
  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setSlug(editing?.slug ?? "");
    setSort(String(editing?.sort ?? 0));
  }, [open, editing]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div>
            <Label>Ordem</Label>
            <Input
              type="number"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onSaved({
                name: name.trim(),
                slug: slug.trim().toLowerCase(),
                sort: parseInt(sort || "0", 10),
              })
            }
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubcategoryDialog({
  open,
  onOpenChange,
  editing,
  categoryId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: any | null;
  categoryId: string;
  onSaved: (values: { slug: string; name: string; sort: number }) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sort, setSort] = useState("0");
  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setSlug(editing?.slug ?? "");
    setSort(String(editing?.sort ?? 0));
  }, [open, editing]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar subcategoria" : "Nova subcategoria"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div>
            <Label>Ordem</Label>
            <Input
              type="number"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!categoryId}
            onClick={() =>
              onSaved({
                name: name.trim(),
                slug: slug.trim().toLowerCase(),
                sort: parseInt(sort || "0", 10),
              })
            }
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ========== MESSAGES ==========
type MsgRow = Awaited<ReturnType<typeof adminListContactMessages>>[number];
function MessagesPanel() {
  const list = useServerFn(adminListContactMessages);
  const [msgs, setMsgs] = useState<MsgRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    list()
      .then(setMsgs)
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;
  return (
    <div>
      <h2 className="mb-4 font-display text-xl uppercase">
        Mensagens ({msgs.length})
      </h2>
      <div className="space-y-3">
        {msgs.map((m) => (
          <div key={m.id} className="rounded-md border p-4">
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <div className="font-semibold">{m.nome}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(m.created_at).toLocaleString("pt-BR")}
              </div>
            </div>
            <div className="mb-2 text-sm text-muted-foreground">{m.email}</div>
            <p className="whitespace-pre-wrap text-sm">{m.mensagem}</p>
          </div>
        ))}
        {msgs.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
        )}
      </div>
    </div>
  );
}

// ========== COUPONS ==========
type CouponRow = Awaited<ReturnType<typeof adminListCoupons>>[number];

function CouponsPanel() {
  const list = useServerFn(adminListCoupons);
  const upsert = useServerFn(adminUpsertCoupon);
  const remove = useServerFn(adminDeleteCoupon);
  const toggle = useServerFn(adminToggleCoupon);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CouponRow | null>(null);
  const [open, setOpen] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setCoupons(await list());
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao carregar cupons");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Remover este cupom?")) return;
    try {
      await remove({ data: { id } });
      toast.success("Cupom removido");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleToggle(c: CouponRow) {
    try {
      await toggle({ data: { id: c.id, active: !c.active } });
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h2 className="font-display text-xl uppercase">
          Cupons ({coupons.length})
        </h2>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo cupom
        </Button>
      </div>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead className="text-right">Usos</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => {
                const isExpired =
                  c.expires_at && new Date(c.expires_at).getTime() < Date.now();
                const isExhausted = c.uses_count >= c.max_uses;
                const statusLabel = !c.active
                  ? "Inativo"
                  : isExpired
                    ? "Expirado"
                    : isExhausted
                      ? "Esgotado"
                      : "Ativo";
                const statusVariant: any =
                  !c.active || isExpired || isExhausted
                    ? "secondary"
                    : "default";
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-semibold">
                      {c.code}
                    </TableCell>
                    <TableCell>
                      {c.discount_type === "percentage"
                        ? `${Number(c.discount_value)}%`
                        : formatBRL(Math.floor(Number(c.discount_value)))}
                      {c.min_order_cents ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          mín. {formatBRL(c.min_order_cents)}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.uses_count}/{c.max_uses}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.expires_at
                        ? new Date(c.expires_at).toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant}>{statusLabel}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggle(c)}
                        >
                          {c.active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditing(c);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {coupons.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    Nenhum cupom criado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <CouponDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSaved={async (values) => {
          try {
            await upsert({ data: { id: editing?.id, ...values } });
            toast.success(editing ? "Cupom atualizado" : "Cupom criado");
            setOpen(false);
            refresh();
          } catch (e: any) {
            toast.error(e.message);
          }
        }}
      />
    </div>
  );
}

function CouponDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: CouponRow | null;
  onSaved: (values: {
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    min_order_cents: number | null;
    max_uses: number;
    active: boolean;
    expires_at: string | null;
  }) => void;
}) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  // For percentage: raw %. For fixed: value in BRL (converted to cents on save)
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxUses, setMaxUses] = useState("100");
  const [active, setActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setCode(editing.code);
      setType(editing.discount_type as "percentage" | "fixed");
      setValue(
        editing.discount_type === "percentage"
          ? String(Number(editing.discount_value))
          : (Number(editing.discount_value) / 100).toFixed(2),
      );
      setMinOrder(
        editing.min_order_cents
          ? (editing.min_order_cents / 100).toFixed(2)
          : "",
      );
      setMaxUses(String(editing.max_uses));
      setActive(editing.active);
      setExpiresAt(
        editing.expires_at ? editing.expires_at.slice(0, 10) : "",
      );
    } else {
      setCode("");
      setType("percentage");
      setValue("");
      setMinOrder("");
      setMaxUses("100");
      setActive(true);
      setExpiresAt("");
    }
  }, [open, editing]);

  async function handleSave() {
    const parsedValue = parseFloat(value.replace(",", "."));
    if (!code.trim() || !parsedValue || parsedValue <= 0) {
      toast.error("Preencha código e valor válidos");
      return;
    }
    if (type === "percentage" && parsedValue > 100) {
      toast.error("Percentual máximo é 100");
      return;
    }
    setSaving(true);
    try {
      await onSaved({
        code: code.trim().toUpperCase(),
        discount_type: type,
        discount_value:
          type === "percentage" ? parsedValue : Math.round(parsedValue * 100),
        min_order_cents: minOrder
          ? Math.round(parseFloat(minOrder.replace(",", ".")) * 100)
          : null,
        max_uses: parseInt(maxUses || "0", 10),
        active,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar cupom" : "Novo cupom"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Código</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="PROMO10"
              maxLength={60}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as "percentage" | "fixed")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                  <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{type === "percentage" ? "Percentual" : "Valor (R$)"}</Label>
              <Input
                type="number"
                step={type === "percentage" ? "1" : "0.01"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor mínimo do pedido (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={minOrder}
                placeholder="opcional"
                onChange={(e) => setMinOrder(e.target.value)}
              />
            </div>
            <div>
              <Label>Limite de usos</Label>
              <Input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Validade (opcional)</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Cupom ativo
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
