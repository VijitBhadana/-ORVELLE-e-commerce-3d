"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Grid2x2, List, Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { COLLECTIONS, SIZES, discountPct, formatPrice, totalStock, type Product, type Size } from "@/lib/products";
import { useStore } from "@/lib/store";

type Sort = "featured" | "newest" | "price-asc" | "price-desc" | "discount" | "name";
const SORTS: { id: Sort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "discount", label: "Biggest discount" },
  { id: "name", label: "Name A–Z" },
];

type Filters = { q: string; min: number; max: number; shirts: string[]; pants: string[]; sizes: Size[]; inStock: boolean; collection: string };

export default function ShopClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { products } = useStore();
  const priceCeil = useMemo(() => Math.ceil(Math.max(0, ...products.map((p) => p.price)) / 500) * 500 || 10000, [products]);

  const [f, setF] = useState<Filters>({ q: "", min: 0, max: priceCeil, shirts: [], pants: [], sizes: [], inStock: false, collection: "" });
  const [sort, setSort] = useState<Sort>("featured");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [drawer, setDrawer] = useState(false);

  // URL → state (search overlay and collection links land here)
  useEffect(() => {
    setF((x) => ({ ...x, q: params.get("q") ?? "", collection: params.get("collection") ?? "" }));
    const s = params.get("sort") as Sort | null;
    if (s && SORTS.some((o) => o.id === s)) setSort(s);
  }, [params]);
  useEffect(() => setF((x) => ({ ...x, max: Math.max(x.max, priceCeil) })), [priceCeil]);

  const shirtFamilies = useMemo(() => uniqueSwatches(products, "shirt"), [products]);
  const pantFamilies = useMemo(() => uniqueSwatches(products, "pant"), [products]);

  const results = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const list = products.filter((p) => {
      if (q && ![p.name, p.tagline, p.shirt.name, p.pant.name, p.shirt.family, p.pant.family, p.description].join(" ").toLowerCase().includes(q)) return false;
      if (p.price < f.min || p.price > f.max) return false;
      if (f.shirts.length && !f.shirts.includes(p.shirt.family)) return false;
      if (f.pants.length && !f.pants.includes(p.pant.family)) return false;
      if (f.sizes.length && !f.sizes.some((s) => (p.stock[s] ?? 0) > 0)) return false;
      if (f.inStock && totalStock(p) === 0) return false;
      if (f.collection && !p.collections.includes(f.collection)) return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "newest") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "discount") sorted.sort((a, b) => discountPct(b) - discountPct(a));
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [products, f, sort]);

  const toggle = <K extends "shirts" | "pants" | "sizes">(key: K, v: Filters[K][number]) =>
    setF((x) => {
      const arr = x[key] as string[];
      return { ...x, [key]: arr.includes(v) ? arr.filter((a) => a !== v) : [...arr, v] };
    });

  const clear = () => {
    setF({ q: "", min: 0, max: priceCeil, shirts: [], pants: [], sizes: [], inStock: false, collection: "" });
    router.replace("/shop", { scroll: false });
  };

  const activeCount = f.shirts.length + f.pants.length + f.sizes.length + (f.inStock ? 1 : 0) + (f.min > 0 || f.max < priceCeil ? 1 : 0) + (f.collection ? 1 : 0) + (f.q ? 1 : 0);
  const collectionName = COLLECTIONS.find((c) => c.id === f.collection)?.name;

  const panel = (
    <div className="space-y-9">
      <FilterGroup title="Price">
        <div className="flex items-center justify-between text-sm">
          <span>{formatPrice(f.min)}</span>
          <span>{formatPrice(f.max)}</span>
        </div>
        <div className="mt-3 space-y-3">
          <input type="range" aria-label="Minimum price" min={0} max={priceCeil} step={100} value={f.min} onChange={(e) => setF((x) => ({ ...x, min: Math.min(Number(e.target.value), x.max) }))} className="w-full accent-gold" />
          <input type="range" aria-label="Maximum price" min={0} max={priceCeil} step={100} value={f.max} onChange={(e) => setF((x) => ({ ...x, max: Math.max(Number(e.target.value), x.min) }))} className="w-full accent-gold" />
        </div>
      </FilterGroup>
      <FilterGroup title="Shirt colour">
        <SwatchList items={shirtFamilies} active={f.shirts} onToggle={(v) => toggle("shirts", v)} />
      </FilterGroup>
      <FilterGroup title="Trouser colour">
        <SwatchList items={pantFamilies} active={f.pants} onToggle={(v) => toggle("pants", v)} />
      </FilterGroup>
      <FilterGroup title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button key={s} onClick={() => toggle("sizes", s)} aria-pressed={f.sizes.includes(s)} className={`h-10 min-w-12 border px-3 text-xs font-semibold transition-colors ${f.sizes.includes(s) ? "border-gold bg-gold text-ink" : "border-line hover:border-white/50"}`}>
              {s}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Availability">
        <label className="flex cursor-pointer items-center gap-3 text-sm text-white/80">
          <input type="checkbox" checked={f.inStock} onChange={(e) => setF((x) => ({ ...x, inStock: e.target.checked }))} className="h-4 w-4 accent-gold" />
          In stock only
        </label>
      </FilterGroup>
      {activeCount > 0 && (
        <button onClick={clear} className="label text-gold hover:text-white">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <PageHeader eyebrow="The shop" title="All looks" crumbs={[{ label: "Shop" }]} intro="Complete shirt-and-trouser sets, ready to wear together. Filter by colour, size or price." compact />

      <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:px-10">
        {/* toolbar */}
        <div className="sticky top-16 z-20 -mx-5 mb-8 flex flex-wrap items-center gap-3 border-b border-line bg-ink/90 px-5 py-3 backdrop-blur-md sm:-mx-8 sm:px-8 md:top-20 lg:mx-0 lg:px-0">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <input value={f.q} onChange={(e) => setF((x) => ({ ...x, q: e.target.value }))} placeholder="Search products" aria-label="Search products" className="field h-11 pl-9" />
          </div>
          <button onClick={() => setDrawer(true)} className="btn btn-ghost btn-sm lg:hidden">
            <SlidersHorizontal size={14} /> Filters {activeCount > 0 && `(${activeCount})`}
          </button>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:block">{results.length} of {products.length}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort products" className="field h-11 w-auto min-w-44 text-xs">
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <div className="hidden border border-line sm:flex">
              <button aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`grid h-11 w-11 place-items-center ${view === "grid" ? "bg-white text-ink" : "text-muted hover:text-white"}`}>
                <Grid2x2 size={16} />
              </button>
              <button aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")} className={`grid h-11 w-11 place-items-center ${view === "list" ? "bg-white text-ink" : "text-muted hover:text-white"}`}>
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {(collectionName || f.q) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {collectionName && <Chip label={`Collection: ${collectionName}`} onClear={() => { setF((x) => ({ ...x, collection: "" })); router.replace("/shop", { scroll: false }); }} />}
            {f.q && <Chip label={`Search: “${f.q}”`} onClear={() => setF((x) => ({ ...x, q: "" }))} />}
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[240px_1fr] xl:gap-14">
          <aside className="hidden lg:block">
            <div className="sticky top-44">{panel}</div>
          </aside>

          <div>
            {results.length === 0 ? (
              <div className="border border-line py-24 text-center">
                <p className="display text-[clamp(30px,3vw,50px)]">No looks match.</p>
                <p className="mt-3 text-sm text-muted">Try widening the price range or clearing a colour.</p>
                <button onClick={clear} className="btn btn-ghost btn-sm mt-8">Clear filters</button>
              </div>
            ) : (
              <motion.div layout className={view === "grid" ? "grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-5"}>
                <AnimatePresence mode="popLayout">
                  {results.map((p, i) => (
                    <motion.div key={p.id} layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.5, delay: i * 0.04 }}>
                      <ProductCard product={p} layout={view} priority={i < 3} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <Modal open={drawer} onClose={() => setDrawer(false)} side="right" label="Filters">
        <div className="p-6 pt-16">
          <p className="display mb-8 text-[clamp(30px,3vw,50px)]">Filters</p>
          {panel}
          <button onClick={() => setDrawer(false)} className="btn btn-gold mt-10 w-full">
            Show {results.length} result{results.length === 1 ? "" : "s"}
          </button>
        </div>
      </Modal>
    </>
  );
}

function uniqueSwatches(products: Product[], key: "shirt" | "pant") {
  const map = new Map<string, string>();
  products.forEach((p) => !map.has(p[key].family) && map.set(p[key].family, p[key].hex));
  return [...map.entries()].map(([family, hex]) => ({ family, hex }));
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label mb-4 text-white">{title}</p>
      {children}
    </div>
  );
}

function SwatchList({ items, active, onToggle }: { items: { family: string; hex: string }[]; active: string[]; onToggle: (v: string) => void }) {
  return (
    <ul className="space-y-2.5">
      {items.map((s) => (
        <li key={s.family}>
          <button onClick={() => onToggle(s.family)} aria-pressed={active.includes(s.family)} className="group flex w-full items-center gap-3 text-sm">
            <span className={`h-5 w-5 rounded-full ring-1 ring-offset-2 ring-offset-ink transition-all ${active.includes(s.family) ? "ring-gold" : "ring-white/20 group-hover:ring-white/50"}`} style={{ background: s.hex }} />
            <span className={active.includes(s.family) ? "text-white" : "text-white/65 group-hover:text-white"}>{s.family}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 border border-line px-3 py-1.5 text-xs">
      {label}
      <button onClick={onClear} aria-label={`Remove ${label}`} className="text-muted hover:text-white">
        <X size={12} />
      </button>
    </span>
  );
}
