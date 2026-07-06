import { Link } from "@tanstack/react-router";
import type { CategoryWithSubs } from "@/lib/catalog.functions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  categories: CategoryWithSubs[];
  selectedCategory?: string;
  selectedSubcategory?: string;
}

export function CategoryFilter({ categories, selectedCategory, selectedSubcategory }: Props) {
  return (
    <aside className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 font-display text-lg uppercase text-foreground">Categorias</h2>
      <div className="mb-3">
        <Link
          to="/produtos"
          search={{}}
          className={`block rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted ${
            !selectedCategory ? "bg-muted font-semibold text-primary" : "text-foreground"
          }`}
        >
          Todos os produtos
        </Link>
      </div>
      <Accordion type="multiple" defaultValue={selectedCategory ? [selectedCategory] : []}>
        {categories.map((cat) => (
          <AccordionItem key={cat.id} value={cat.slug}>
            <AccordionTrigger className="text-left font-display uppercase">
              {cat.name}
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-1">
                <Link
                  to="/produtos"
                  search={{ categoria: cat.slug }}
                  className={`rounded px-2 py-1 text-sm transition-colors hover:bg-muted ${
                    selectedCategory === cat.slug && !selectedSubcategory
                      ? "font-semibold text-primary"
                      : "text-foreground/80"
                  }`}
                >
                  Todos em {cat.name}
                </Link>
                {cat.subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    to="/produtos"
                    search={{ categoria: cat.slug, subcategoria: sub.slug }}
                    className={`rounded px-2 py-1 text-sm transition-colors hover:bg-muted ${
                      selectedSubcategory === sub.slug
                        ? "font-semibold text-primary"
                        : "text-foreground/80"
                    }`}
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </aside>
  );
}
