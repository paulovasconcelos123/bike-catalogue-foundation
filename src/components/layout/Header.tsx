import { useState } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { LogOut, Menu, Package, Search, Settings, ShoppingBag, User } from "lucide-react";
import logoHorizontal from "@/assets/logo-horizontal.png.asset.json";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { to: "/produtos", label: "Produtos" },
  { to: "/sobre", label: "Sobre" },
  { to: "/blog", label: "Blog" },
  { to: "/contato", label: "Contato" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() || user?.email || "";

  async function handleSignOut() {
    await signOut();
    await router.invalidate();
    navigate({ to: "/", replace: true });
  }


  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:gap-6 sm:py-4">
        <Link to="/" className="flex shrink-0 items-center" aria-label="Paulo Bicicletas — Início">
          <img
            src={logoHorizontal.url}
            alt="Paulo Bicicletas"
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        <nav className="hidden min-w-0 items-center justify-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="font-display text-sm uppercase tracking-wide text-foreground/80 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden lg:block">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar bicicleta, peça..."
                className="w-56 pl-8"
              />
            </div>
          </div>
          <Button asChild variant="ghost" size="icon" aria-label={`Carrinho (${totalItems} itens)`} className="relative">
            <Link to="/carrinho">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Minha conta">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/minha-conta">
                    <Package className="mr-2 h-4 w-4" /> Meus pedidos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden font-display uppercase tracking-wide md:inline-flex">
              <Link to="/login">Entrar</Link>
            </Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="mt-8 flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="search" placeholder="Buscar..." className="pl-8" />
                </div>
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="font-display text-lg uppercase tracking-wide text-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-4 border-t border-border pt-4">
                  {user ? (
                    <>
                      <p className="mb-2 truncate text-sm text-muted-foreground">{displayName}</p>
                      <Button
                        asChild
                        variant="outline"
                        className="mb-2 w-full"
                        onClick={() => setOpen(false)}
                      >
                        <Link to="/minha-conta">
                          <Package className="mr-2 h-4 w-4" /> Meus pedidos
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setOpen(false);
                          handleSignOut();
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" /> Sair
                      </Button>
                    </>
                  ) : (
                    <Button asChild className="w-full" onClick={() => setOpen(false)}>
                      <Link to="/login">Entrar</Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
