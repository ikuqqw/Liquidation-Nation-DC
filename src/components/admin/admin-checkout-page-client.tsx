"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Category, Product, PromoCode, PromoDiscountType } from "@/lib/types";
import { NormalizableProductRow, normalizeProducts } from "@/lib/normalizers";
import {
  clamp,
  computeSalesBusinessDay,
  formatUsd,
  slugify,
  toMoneyNumber,
} from "@/lib/utils";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutData {
  products: Product[];
  categories: Category[];
  promoCodes: PromoCode[];
}

type CreatePromoForm = {
  code: string;
  description: string;
  percentValue: string;
  amountValue: string;
  lastEdited: PromoDiscountType;
};

const productSelection = `
  id,
  title,
  slug,
  description,
  category_id,
  price,
  retail_price,
  condition,
  quantity,
  status,
  is_featured,
  created_at,
  updated_at,
  category:categories (
    id,
    name,
    slug,
    sort_order,
    is_active
  ),
  product_images:product_images (
    id,
    product_id,
    image_url,
    sort_order
  )
`;

async function fetchCheckoutData(supabase: ReturnType<typeof createBrowserSupabaseClient>) {
  const [productsResult, categoriesResult, promoCodesResult] = await Promise.all([
    supabase
      .from("products")
      .select(productSelection)
      .eq("status", "in_stock")
      .gt("quantity", 0)
      .order("updated_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name, slug, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("promo_codes")
      .select("id, code, description, discount_type, discount_value, is_active, created_at, updated_at")
      .order("created_at", { ascending: false }),
  ]);

  if (productsResult.error || categoriesResult.error || promoCodesResult.error) {
    return {
      data: null,
      error:
        productsResult.error?.message ||
        categoriesResult.error?.message ||
        promoCodesResult.error?.message ||
        "Failed to load checkout data.",
    };
  }

  return {
    data: {
      products: normalizeProducts((productsResult.data ?? []) as NormalizableProductRow[]),
      categories: (categoriesResult.data ?? []) as Category[],
      promoCodes: (promoCodesResult.data ?? []) as PromoCode[],
    } as CheckoutData,
    error: null,
  };
}

export function AdminCheckoutPageClient() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [promoInput, setPromoInput] = useState("");
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);
  const [createPromoForm, setCreatePromoForm] = useState<CreatePromoForm>({
    code: "",
    description: "",
    percentValue: "",
    amountValue: "",
    lastEdited: "percent",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const refreshData = async ({ withLoader }: { withLoader: boolean }) => {
    if (withLoader) {
      setIsLoading(true);
    }

    const { data, error: dataError } = await fetchCheckoutData(supabase);
    if (dataError || !data) {
      setError(dataError ?? "Failed to refresh checkout data.");
      setIsLoading(false);
      return;
    }

    setProducts(data.products);
    setCategories(data.categories);
    setPromoCodes(data.promoCodes);
    setIsLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      setError("");
      setIsLoading(true);

      const { data, error: dataError } = await fetchCheckoutData(supabase);
      if (dataError || !data) {
        setError(dataError ?? "Failed to load checkout data.");
        setIsLoading(false);
        return;
      }

      setProducts(data.products);
      setCategories(data.categories);
      setPromoCodes(data.promoCodes);
      setIsLoading(false);
    };

    void load();
  }, [supabase]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryFilter !== "all" && product.category?.slug !== categoryFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }

      return (
        product.title.toLowerCase().includes(normalizedQuery) ||
        (product.category?.name ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [products, query, categoryFilter]);

  const subtotal = useMemo(
    () =>
      toMoneyNumber(
        cart.reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0),
      ),
    [cart],
  );

  const saleDiscountAmount = useMemo(() => {
    if (!selectedPromo) return 0;
    const raw =
      selectedPromo.discount_type === "percent"
        ? (subtotal * selectedPromo.discount_value) / 100
        : selectedPromo.discount_value;
    return toMoneyNumber(clamp(raw, 0, subtotal));
  }, [selectedPromo, subtotal]);

  const saleTotal = toMoneyNumber(subtotal - saleDiscountAmount);

  const promoPercentPreview = useMemo(() => {
    if (createPromoForm.lastEdited === "percent") {
      const percent = Number(createPromoForm.percentValue);
      return Number.isFinite(percent) ? clamp(percent, 0, 100) : 0;
    }

    const amount = Number(createPromoForm.amountValue);
    if (!Number.isFinite(amount) || subtotal <= 0) return 0;
    return toMoneyNumber((clamp(amount, 0, subtotal) / subtotal) * 100);
  }, [
    createPromoForm.amountValue,
    createPromoForm.lastEdited,
    createPromoForm.percentValue,
    subtotal,
  ]);

  const promoAmountPreview = useMemo(() => {
    if (createPromoForm.lastEdited === "amount") {
      const amount = Number(createPromoForm.amountValue);
      return Number.isFinite(amount) ? Math.max(amount, 0) : 0;
    }

    const percent = Number(createPromoForm.percentValue);
    if (!Number.isFinite(percent) || subtotal <= 0) return 0;
    return toMoneyNumber((clamp(percent, 0, 100) / 100) * subtotal);
  }, [
    createPromoForm.amountValue,
    createPromoForm.lastEdited,
    createPromoForm.percentValue,
    subtotal,
  ]);

  const addToCart = (product: Product) => {
    setSuccess("");
    setError("");

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (!existing) {
        return [...prev, { product, quantity: 1 }];
      }

      const nextQuantity = Math.min(existing.quantity + 1, product.quantity);
      return prev.map((item) =>
        item.product.id === product.id ? { ...item, quantity: nextQuantity } : item,
      );
    });
  };

  const updateCartQty = (productId: number, quantity: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: clamp(quantity, 1, item.product.quantity) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const onPromoPercentChange = (value: string) => {
    setCreatePromoForm((prev) => ({
      ...prev,
      lastEdited: "percent",
      percentValue: value,
    }));
  };

  const onPromoAmountChange = (value: string) => {
    setCreatePromoForm((prev) => ({
      ...prev,
      lastEdited: "amount",
      amountValue: value,
    }));
  };

  const applyPromoCode = () => {
    setError("");
    setSuccess("");
    const normalized = promoInput.trim().toLowerCase();

    if (!normalized) {
      setSelectedPromo(null);
      return;
    }

    const match = promoCodes.find(
      (promo) => promo.is_active && promo.code.trim().toLowerCase() === normalized,
    );

    if (!match) {
      setError("Promo code not found or inactive.");
      setSelectedPromo(null);
      return;
    }

    setSelectedPromo(match);
    setSuccess(`Promo code "${match.code}" applied.`);
  };

  const createPromoCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsCreatingPromo(true);

    const rawCode = createPromoForm.code.trim().toUpperCase();
    const normalizedCode = slugify(rawCode).replace(/-/g, "").toUpperCase();
    if (!normalizedCode) {
      setIsCreatingPromo(false);
      setError("Promo code is required.");
      return;
    }

    const discountType = createPromoForm.lastEdited;
    const discountValue =
      discountType === "percent"
        ? clamp(promoPercentPreview, 0.01, 100)
        : Math.max(promoAmountPreview, 0.01);

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setIsCreatingPromo(false);
      setError("Enter a valid discount in % or $.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("promo_codes")
      .insert({
        code: normalizedCode,
        description: createPromoForm.description.trim() || null,
        discount_type: discountType,
        discount_value: discountValue,
        is_active: true,
      })
      .select("id, code, description, discount_type, discount_value, is_active, created_at, updated_at")
      .single();

    if (insertError) {
      setIsCreatingPromo(false);
      setError(insertError.message);
      return;
    }

    setPromoCodes((prev) => [data as PromoCode, ...prev]);
    setCreatePromoForm({
      code: "",
      description: "",
      percentValue: "",
      amountValue: "",
      lastEdited: "percent",
    });
    setIsCreatingPromo(false);
    setSuccess(`Promo code "${(data as PromoCode).code}" created.`);
  };

  const completeSale = async () => {
    if (cart.length === 0 || isSubmittingSale) return;

    setIsSubmittingSale(true);
    setError("");
    setSuccess("");

    const productIds = cart.map((item) => item.product.id);
    const { data: stockRows, error: stockError } = await supabase
      .from("products")
      .select("id, quantity")
      .in("id", productIds);

    if (stockError) {
      setIsSubmittingSale(false);
      setError(stockError.message);
      return;
    }

    const stockMap = new Map<number, { id: number; quantity: number }>();
    for (const row of stockRows ?? []) {
      const casted = row as { id: number; quantity: number };
      stockMap.set(casted.id, casted);
    }

    for (const item of cart) {
      const latest = stockMap.get(item.product.id);
      if (!latest || latest.quantity < item.quantity) {
        setIsSubmittingSale(false);
        setError(`Not enough stock for "${item.product.title}". Refresh and try again.`);
        return;
      }
    }

    const { data: userData } = await supabase.auth.getUser();
    const { data: createdSale, error: saleError } = await supabase
      .from("sales")
      .insert({
        business_day: computeSalesBusinessDay(new Date()),
        subtotal,
        discount_amount: saleDiscountAmount,
        total: saleTotal,
        promo_code_id: selectedPromo?.id ?? null,
        promo_code_snapshot: selectedPromo?.code ?? null,
        sold_by: userData.user?.id ?? null,
      })
      .select("id")
      .single();

    if (saleError || !createdSale) {
      setIsSubmittingSale(false);
      setError(saleError?.message ?? "Failed to create sale.");
      return;
    }

    const saleId = (createdSale as { id: number }).id;
    const saleItemsPayload = cart.map((item) => ({
      sale_id: saleId,
      product_id: item.product.id,
      product_title: item.product.title,
      product_image_url: item.product.product_images?.[0]?.image_url ?? null,
      unit_price: item.product.price ?? 0,
      quantity: item.quantity,
      line_total: toMoneyNumber((item.product.price ?? 0) * item.quantity),
    }));

    const { error: saleItemsError } = await supabase.from("sale_items").insert(saleItemsPayload);
    if (saleItemsError) {
      setIsSubmittingSale(false);
      setError(saleItemsError.message);
      return;
    }

    const updateRequests = cart.map((item) => {
      const latest = stockMap.get(item.product.id)!;
      const nextQuantity = Math.max(latest.quantity - item.quantity, 0);
      return supabase
        .from("products")
        .update({
          quantity: nextQuantity,
          status: nextQuantity > 0 ? "in_stock" : "out_of_stock",
        })
        .eq("id", item.product.id);
    });

    const updateResponses = await Promise.all(updateRequests);
    const failedUpdate = updateResponses.find((response) => response.error);
    if (failedUpdate?.error) {
      setIsSubmittingSale(false);
      setError(`Sale saved, but stock update failed: ${failedUpdate.error.message}`);
      return;
    }

    setCart([]);
    setSelectedPromo(null);
    setPromoInput("");
    setIsSubmittingSale(false);
    setSuccess("Sale completed and added to daily stats.");
    await refreshData({ withLoader: false });
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-orange-500/35 bg-[#101010] p-6 text-sm text-orange-300">
        Loading checkout data...
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_370px]">
      <section className="space-y-4 rounded-2xl border border-orange-500/35 bg-[#101010] p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="text-xs font-semibold tracking-wide text-orange-300 uppercase">
              Search products
            </label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Title or category..."
              className="mt-1 w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
          </div>
          <div className="w-full min-w-[180px] sm:w-auto">
            <label className="text-xs font-semibold tracking-wide text-orange-300 uppercase">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="mt-1 w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500 sm:w-56"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-xl border border-orange-500/25 bg-black/30"
            >
              {product.product_images?.[0]?.image_url ? (
                <img
                  src={product.product_images[0].image_url}
                  alt={product.title}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="flex h-36 items-center justify-center text-xs text-orange-300">
                  No photo
                </div>
              )}

              <div className="space-y-2 p-3">
                <h3 className="text-sm font-semibold text-orange-100">{product.title}</h3>
                <p className="text-xs text-orange-300">
                  {product.category?.name ?? "Uncategorized"} - Stock: {product.quantity}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-orange-100">{formatUsd(product.price)}</p>
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    className="rounded-md bg-orange-500 px-3 py-1 text-xs font-semibold text-black hover:bg-orange-400"
                  >
                    Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-orange-500/35 p-4 text-sm text-orange-300">
            No in-stock products found.
          </p>
        ) : null}
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-orange-500/35 bg-[#101010] p-4">
          <h2 className="text-lg font-semibold text-orange-100">Seller Cart</h2>
          <p className="text-xs text-orange-300">
            Business day window: 4:00 AM - 10:00 PM (America/New_York).
          </p>

          <div className="mt-3 space-y-2">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="rounded-lg border border-orange-500/25 bg-black/30 p-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-orange-100">{item.product.title}</p>
                    <p className="text-xs text-orange-300">
                      {formatUsd(item.product.price)} each
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-xs text-rose-300 hover:text-rose-200"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <input
                    type="number"
                    min={1}
                    max={item.product.quantity}
                    value={item.quantity}
                    onChange={(event) =>
                      updateCartQty(item.product.id, Number(event.target.value || 1))
                    }
                    className="w-20 rounded-md border border-orange-500/35 bg-black/40 px-2 py-1 text-sm text-orange-100"
                  />
                  <p className="text-sm font-semibold text-orange-100">
                    {formatUsd((item.product.price ?? 0) * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {cart.length === 0 ? <p className="mt-3 text-sm text-orange-300">Cart is empty.</p> : null}

          <div className="mt-4 rounded-lg border border-orange-500/25 bg-black/30 p-3">
            <label className="text-xs font-semibold tracking-wide text-orange-300 uppercase">
              Apply promo code
            </label>
            <div className="mt-1 flex gap-2">
              <input
                value={promoInput}
                onChange={(event) => setPromoInput(event.target.value)}
                placeholder="CODE"
                className="w-full rounded-md border border-orange-500/35 px-2 py-1.5 text-sm outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={applyPromoCode}
                className="rounded-md border border-orange-500/45 px-3 py-1.5 text-xs font-semibold text-orange-200 hover:bg-orange-500/10"
              >
                Apply
              </button>
            </div>
            {selectedPromo ? (
              <p className="mt-2 text-xs text-emerald-300">
                Applied: {selectedPromo.code} (
                {selectedPromo.discount_type === "percent"
                  ? `${selectedPromo.discount_value}%`
                  : formatUsd(selectedPromo.discount_value)}
                )
              </p>
            ) : null}
          </div>

          <div className="mt-4 space-y-1 text-sm text-orange-200">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatUsd(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{formatUsd(saleDiscountAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-orange-100">
              <span>Total</span>
              <span>{formatUsd(saleTotal)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void completeSale()}
            disabled={cart.length === 0 || isSubmittingSale}
            className="mt-4 w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmittingSale ? "Completing sale..." : "Complete sale"}
          </button>
        </section>

        <section className="rounded-2xl border border-orange-500/35 bg-[#101010] p-4">
          <h2 className="text-lg font-semibold text-orange-100">Create Promo Code</h2>
          <p className="text-xs text-orange-300">
            Enter discount in $ or %; the second field mirrors automatically from cart subtotal.
          </p>

          <form onSubmit={createPromoCode} className="mt-3 space-y-2">
            <input
              value={createPromoForm.code}
              onChange={(event) =>
                setCreatePromoForm((prev) => ({ ...prev, code: event.target.value }))
              }
              placeholder="Promo code (e.g. VIP50)"
              className="w-full rounded-md border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
            <input
              value={createPromoForm.description}
              onChange={(event) =>
                setCreatePromoForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Description (optional)"
              className="w-full rounded-md border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={
                  createPromoForm.lastEdited === "percent"
                    ? createPromoForm.percentValue.trim()
                      ? String(promoAmountPreview)
                      : ""
                    : createPromoForm.amountValue
                }
                onChange={(event) => onPromoAmountChange(event.target.value)}
                placeholder="$ discount"
                inputMode="decimal"
                className="w-full rounded-md border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
              <input
                value={
                  createPromoForm.lastEdited === "amount"
                    ? createPromoForm.amountValue.trim()
                      ? String(promoPercentPreview)
                      : ""
                    : createPromoForm.percentValue
                }
                onChange={(event) => onPromoPercentChange(event.target.value)}
                placeholder="% discount"
                inputMode="decimal"
                className="w-full rounded-md border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
            </div>
            <button
              type="submit"
              disabled={isCreatingPromo}
              className="w-full rounded-lg border border-orange-500/45 px-4 py-2 text-sm font-semibold text-orange-100 hover:bg-orange-500/10 disabled:opacity-60"
            >
              {isCreatingPromo ? "Creating promo..." : "Create promo code"}
            </button>
          </form>

          <div className="mt-3 max-h-48 space-y-2 overflow-auto pr-1">
            {promoCodes.slice(0, 20).map((promo) => (
              <div
                key={promo.id}
                className="rounded-md border border-orange-500/25 bg-black/30 px-2 py-1.5 text-xs text-orange-200"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{promo.code}</span>
                  <span className={promo.is_active ? "text-emerald-300" : "text-rose-300"}>
                    {promo.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p>
                  {promo.discount_type === "percent"
                    ? `${promo.discount_value}%`
                    : formatUsd(promo.discount_value)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {error ? (
          <p className="rounded-lg border border-rose-500/35 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {success}
          </p>
        ) : null}
      </aside>
    </div>
  );
}

