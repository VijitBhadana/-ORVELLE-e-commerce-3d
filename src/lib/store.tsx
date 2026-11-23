"use client";

/**
 * Front-end store: catalogue, cart, wishlist, demo auth, orders and site content.
 * Everything persists to LocalStorage — there is no backend. The auth here is a
 * DEMONSTRATION ONLY: credentials live in the browser and are not secure.
 */

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { BRAND, DEFAULT_CONTENT, type SiteContent } from "./brand";
import { SEED_PRODUCTS, type Product, type Size } from "./products";
import { usePersistentState } from "./storage";

export type CartItem = { key: string; productId: string; size: Size; qty: number };
export type CartLine = CartItem & { product: Product; lineTotal: number };

export type Customer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pin: string;
};

export type OrderStatus = "Placed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
export type Order = {
  id: string;
  date: string;
  items: { productId: string; name: string; image: string; size: Size; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon?: string;
  customer: Customer;
  payment: string;
  status: OrderStatus;
  userEmail?: string;
};

export type User = { name: string; email: string; phone?: string; createdAt: string };
type StoredUser = User & { passwordHash: string };

export type Coupon = { code: string; label: string; kind: "percent" | "flat" | "shipping"; value: number; minSubtotal?: number };
export const COUPONS: Coupon[] = [
  { code: "WELCOME10", label: "10% off your order", kind: "percent", value: 10 },
  { code: "STYLE500", label: "₹500 off orders above ₹4,000", kind: "flat", value: 500, minSubtotal: 4000 },
  { code: "FREESHIP", label: "Free shipping", kind: "shipping", value: 0 },
];

type Toast = { id: number; message: string };

const SEED_ORDERS: Order[] = [
  {
    id: "ORV-10421",
    date: "2026-11-02T11:20:00.000Z",
    items: [{ productId: "p-01", name: "Classic White & Navy Set", image: "/img/products/classic-white-navy-sm.webp", size: "M", qty: 1, price: 4499 }],
    subtotal: 4499, discount: 0, shipping: 0, total: 4499,
    customer: { name: "Demo Customer A", email: "customer.a@example.com", phone: "9000000001", address: "Demo address", city: "Mumbai", state: "Maharashtra", pin: "400001" },
    payment: "Cash on Delivery (demo)", status: "Delivered",
  },
  {
    id: "ORV-10436",
    date: "2026-11-09T16:05:00.000Z",
    items: [
      { productId: "p-04", name: "Olive & Cream Set", image: "/img/products/olive-cream-sm.webp", size: "L", qty: 1, price: 4599 },
      { productId: "p-05", name: "Pink & Charcoal Set", image: "/img/products/pink-charcoal-sm.webp", size: "L", qty: 1, price: 4399 },
    ],
    subtotal: 8998, discount: 900, shipping: 0, total: 8098, coupon: "WELCOME10",
    customer: { name: "Demo Customer B", email: "customer.b@example.com", phone: "9000000002", address: "Demo address", city: "Bengaluru", state: "Karnataka", pin: "560001" },
    payment: "UPI (simulated)", status: "Shipped",
  },
];

const SEED_USERS: StoredUser[] = [
  { name: "Demo Customer A", email: "customer.a@example.com", createdAt: "2026-10-12", passwordHash: "" },
  { name: "Demo Customer B", email: "customer.b@example.com", createdAt: "2026-10-28", passwordHash: "" },
];

async function hash(text: string) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return btoa(unescape(encodeURIComponent(text)));
  }
}

type Store = ReturnType<typeof useStoreState>;
const Ctx = createContext<Store | null>(null);

function useStoreState() {
  const [products, setProducts, productsReady] = usePersistentState<Product[]>("products", SEED_PRODUCTS);
  const [cart, setCart, cartReady] = usePersistentState<CartItem[]>("cart", []);
  const [wishlist, setWishlist] = usePersistentState<string[]>("wishlist", []);
  const [couponCode, setCouponCode] = usePersistentState<string | null>("coupon", null);
  const [users, setUsers] = usePersistentState<StoredUser[]>("users", SEED_USERS);
  const [user, setUser] = usePersistentState<User | null>("session", null);
  const [orders, setOrders] = usePersistentState<Order[]>("orders", SEED_ORDERS);
  const content: SiteContent = DEFAULT_CONTENT;
  const [checkoutDraft, setCheckoutDraft] = usePersistentState<Partial<Customer>>("checkout", {});

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const toastId = useRef(0);

  const toast = useCallback((message: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const getProduct = useCallback((slugOrId: string) => products.find((p) => p.slug === slugOrId || p.id === slugOrId), [products]);

  /* ---------- cart ---------- */
  const addToCart = useCallback(
    (productId: string, size: Size, qty = 1) => {
      const p = products.find((x) => x.id === productId);
      if (!p) return false;
      const stock = p.stock[size] ?? 0;
      const key = `${productId}:${size}`;
      const have = cart.find((i) => i.key === key)?.qty ?? 0;
      if (stock <= 0) {
        toast(`Size ${size} is out of stock`);
        return false;
      }
      if (have >= stock) {
        toast(`Only ${stock} left in size ${size} — all in your bag`);
        return false;
      }
      const nextQty = Math.min(stock, have + qty);
      setCart((items) =>
        items.some((i) => i.key === key)
          ? items.map((i) => (i.key === key ? { ...i, qty: nextQty } : i))
          : [...items, { key, productId, size, qty: nextQty }]
      );
      toast(`${p.name} (${size}) added to bag`);
      return true;
    },
    [products, cart, setCart, toast]
  );

  const removeFromCart = useCallback((key: string) => setCart((items) => items.filter((i) => i.key !== key)), [setCart]);

  const updateQty = useCallback(
    (key: string, qty: number) =>
      setCart((items) =>
        items.flatMap((i) => {
          if (i.key !== key) return [i];
          const p = products.find((x) => x.id === i.productId);
          const max = p?.stock[i.size] ?? 10;
          const q = Math.min(Math.max(1, qty), Math.max(1, max));
          return [{ ...i, qty: q }];
        })
      ),
    [setCart, products]
  );

  const changeSize = useCallback(
    (key: string, size: Size) =>
      setCart((items) => {
        const item = items.find((i) => i.key === key);
        if (!item || item.size === size) return items;
        const newKey = `${item.productId}:${size}`;
        const merged = items.find((i) => i.key === newKey);
        const rest = items.filter((i) => i.key !== key && i.key !== newKey);
        const idx = items.findIndex((i) => i.key === key);
        const next = { ...item, key: newKey, size, qty: item.qty + (merged?.qty ?? 0) };
        rest.splice(Math.min(idx, rest.length), 0, next);
        return rest;
      }),
    [setCart]
  );

  const clearCart = useCallback(() => setCart([]), [setCart]);

  const lines: CartLine[] = useMemo(
    () =>
      cart.flatMap((i) => {
        const product = products.find((p) => p.id === i.productId);
        return product ? [{ ...i, product, lineTotal: product.price * i.qty }] : [];
      }),
    [cart, products]
  );

  const cartCount = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);
  const coupon = COUPONS.find((c) => c.code === couponCode) ?? null;
  const couponValid = !!coupon && (!coupon.minSubtotal || subtotal >= coupon.minSubtotal);
  const discount = !couponValid || !coupon ? 0 : coupon.kind === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.kind === "flat" ? Math.min(coupon.value, subtotal) : 0;
  const freeShip = (couponValid && coupon?.kind === "shipping") || subtotal - discount >= BRAND.shipping.freeAbove;
  const shipping = subtotal === 0 || freeShip ? 0 : BRAND.shipping.fee;
  const total = Math.max(0, subtotal - discount + shipping);

  const applyCoupon = useCallback(
    (raw: string): { ok: boolean; message: string } => {
      const code = raw.trim().toUpperCase();
      const c = COUPONS.find((x) => x.code === code);
      if (!c) return { ok: false, message: "That code isn't valid." };
      if (c.minSubtotal && subtotal < c.minSubtotal) return { ok: false, message: `Add items worth ₹${c.minSubtotal.toLocaleString("en-IN")} to use ${code}.` };
      setCouponCode(code);
      return { ok: true, message: `${code} applied — ${c.label}.` };
    },
    [setCouponCode, subtotal]
  );
  const removeCoupon = useCallback(() => setCouponCode(null), [setCouponCode]);

  /* ---------- wishlist ---------- */
  const isWishlisted = useCallback((id: string) => wishlist.includes(id), [wishlist]);
  const toggleWishlist = useCallback(
    (id: string) => {
      const p = products.find((x) => x.id === id);
      const has = wishlist.includes(id);
      setWishlist((w) => (has ? w.filter((x) => x !== id) : [...w, id]));
      if (p) toast(has ? `Removed from wishlist` : `${p.name} saved to wishlist`);
    },
    [wishlist, setWishlist, products, toast]
  );

  /* ---------- demo auth ---------- */
  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const e = email.trim().toLowerCase();
      if (users.some((u) => u.email === e)) return { ok: false, message: "An account with this email already exists." };
      const u: StoredUser = { name: name.trim(), email: e, createdAt: new Date().toISOString(), passwordHash: await hash(password) };
      setUsers((list) => [...list, u]);
      setUser({ name: u.name, email: u.email, createdAt: u.createdAt });
      return { ok: true, message: "Welcome to " + BRAND.name };
    },
    [users, setUsers, setUser]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const e = email.trim().toLowerCase();
      const u = users.find((x) => x.email === e);
      if (!u || !u.passwordHash || u.passwordHash !== (await hash(password))) return { ok: false, message: "Email or password is incorrect." };
      setUser({ name: u.name, email: u.email, phone: u.phone, createdAt: u.createdAt });
      return { ok: true, message: `Welcome back, ${u.name.split(" ")[0]}` };
    },
    [users, setUser]
  );

  const logout = useCallback(() => {
    setUser(null);
    toast("You've been signed out");
  }, [setUser, toast]);

  /* ---------- orders ---------- */
  const placeOrder = useCallback(
    (customer: Customer, payment: string) => {
      if (!lines.length) return null;
      const id = "ORV-" + String(Date.now()).slice(-6);
      const order: Order = {
        id,
        date: new Date().toISOString(),
        items: lines.map((l) => ({ productId: l.productId, name: l.product.name, image: l.product.imageSm, size: l.size, qty: l.qty, price: l.product.price })),
        subtotal, discount, shipping, total,
        coupon: couponValid ? couponCode ?? undefined : undefined,
        customer, payment, status: "Placed",
        userEmail: user?.email ?? customer.email.toLowerCase(),
      };
      setOrders((o) => [order, ...o]);
      // reduce demo inventory
      setProducts((list) =>
        list.map((p) => {
          const bought = lines.filter((l) => l.productId === p.id);
          if (!bought.length) return p;
          const stock = { ...p.stock };
          bought.forEach((l) => (stock[l.size] = Math.max(0, (stock[l.size] ?? 0) - l.qty)));
          return { ...p, stock };
        })
      );
      setCart([]);
      setCouponCode(null);
      return id;
    },
    [lines, subtotal, discount, shipping, total, couponValid, couponCode, user, setOrders, setProducts, setCart, setCouponCode]
  );


  return {
    hydrated: productsReady && cartReady,
    products, getProduct,
    cart, lines, cartCount, subtotal, discount, shipping, total, coupon: couponValid ? coupon : null, couponCode,
    addToCart, removeFromCart, updateQty, changeSize, clearCart, applyCoupon, removeCoupon,
    wishlist, isWishlisted, toggleWishlist,
    user, signup, login, logout,
    orders, placeOrder,
    content,
    checkoutDraft, setCheckoutDraft,
    toasts, toast,
    cartOpen, setCartOpen, quickView, setQuickView, searchOpen, setSearchOpen,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStoreState();
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside <StoreProvider>");
  return s;
}
