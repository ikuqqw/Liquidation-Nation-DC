"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Sale, SaleItem } from "@/lib/types";
import { clamp, formatBusinessDayLabel, formatUsd, toMoneyNumber } from "@/lib/utils";

interface DailyStatItem {
  businessDay: string;
  items: SaleItem[];
  total: number;
}

interface RankedProduct {
  productId: number | null;
  title: string;
  soldQty: number;
  rating: number;
}

const salesSelection = `
  id,
  business_day,
  subtotal,
  discount_amount,
  total,
  promo_code_id,
  promo_code_snapshot,
  sold_by,
  created_at,
  sale_items:sale_items (
    id,
    sale_id,
    product_id,
    product_title,
    product_image_url,
    unit_price,
    quantity,
    line_total,
    created_at
  )
`;

export function AdminSalesPageClient() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");

      const { data, error: salesError } = await supabase
        .from("sales")
        .select(salesSelection)
        .order("business_day", { ascending: false })
        .order("created_at", { ascending: false });

      if (salesError) {
        setError(salesError.message);
        setIsLoading(false);
        return;
      }

      const mapped = ((data ?? []) as Sale[]).map((sale) => ({
        ...sale,
        sale_items: (sale.sale_items ?? []).sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
      }));

      setSales(mapped);
      setIsLoading(false);
    };

    void load();
  }, [supabase]);

  const dailyStats = useMemo<DailyStatItem[]>(() => {
    const map = new Map<string, DailyStatItem>();

    for (const sale of sales) {
      const key = sale.business_day;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          businessDay: key,
          items: [...(sale.sale_items ?? [])],
          total: toMoneyNumber(sale.total ?? 0),
        });
      } else {
        existing.items.push(...(sale.sale_items ?? []));
        existing.total = toMoneyNumber(existing.total + (sale.total ?? 0));
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      b.businessDay.localeCompare(a.businessDay),
    );
  }, [sales]);

  const rankedProducts = useMemo<RankedProduct[]>(() => {
    const qtyMap = new Map<string, { productId: number | null; title: string; soldQty: number }>();

    for (const sale of sales) {
      for (const item of sale.sale_items ?? []) {
        const key = `${item.product_id ?? "null"}:${item.product_title}`;
        const current = qtyMap.get(key);
        if (!current) {
          qtyMap.set(key, {
            productId: item.product_id,
            title: item.product_title,
            soldQty: item.quantity,
          });
        } else {
          current.soldQty += item.quantity;
        }
      }
    }

    const raw = Array.from(qtyMap.values()).sort((a, b) => b.soldQty - a.soldQty);
    const topQty = raw[0]?.soldQty ?? 0;
    if (topQty <= 0) return [];

    return raw.slice(0, 20).map((item) => ({
      ...item,
      rating: clamp(Math.ceil((item.soldQty / topQty) * 5), 1, 5),
    }));
  }, [sales]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-orange-500/35 bg-[#101010] p-6 text-sm text-orange-300">
        Loading sales stats...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-300 bg-rose-50 p-6 text-sm text-rose-700">
        Failed to load sales stats: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-orange-500/35 bg-[#101010] p-4">
        <h2 className="text-xl font-semibold text-orange-100">Daily Sales</h2>
        <p className="text-sm text-orange-300">
          Business day closes at 10:00 PM (America/New_York).
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-orange-200">
            <thead className="border-b border-orange-500/35 text-orange-300">
              <tr>
                <th className="px-3 py-2">Day (m/d/y)</th>
                <th className="px-3 py-2">Sold Items</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {dailyStats.map((row) => (
                <tr key={row.businessDay} className="border-b border-orange-500/20 align-top">
                  <td className="px-3 py-3 font-semibold text-orange-100">
                    {formatBusinessDayLabel(row.businessDay)}
                  </td>
                  <td className="px-3 py-3">
                    {row.items.length === 0 ? (
                      <span className="text-xs text-orange-400/90">No sold items</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {row.items.map((item, index) => (
                          <div key={item.id} className="group relative">
                            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-orange-500/45 bg-black/40 px-2 text-xs font-semibold text-orange-100">
                              {index + 1}
                            </span>
                            <div className="invisible absolute z-20 mt-2 w-56 rounded-lg border border-orange-500/40 bg-[#0e0e0e] p-2 text-xs text-orange-200 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                              {item.product_image_url ? (
                                <img
                                  src={item.product_image_url}
                                  alt={item.product_title}
                                  className="mb-2 h-24 w-full rounded object-cover"
                                />
                              ) : null}
                              <p className="font-semibold text-orange-100">{item.product_title}</p>
                              <p>Qty: {item.quantity}</p>
                              <p>Unit: {formatUsd(item.unit_price)}</p>
                              <p>Line: {formatUsd(item.line_total)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 font-bold text-orange-100">{formatUsd(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {dailyStats.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-orange-500/35 p-4 text-sm text-orange-300">
            No completed sales yet.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-orange-500/35 bg-[#101010] p-4">
        <h2 className="text-xl font-semibold text-orange-100">Product Sales Ranking</h2>
        <p className="text-sm text-orange-300">Rating scale: 1 to 5 (based on sold quantity).</p>

        <div className="mt-4 space-y-2">
          {rankedProducts.map((item) => (
            <div
              key={`${item.productId ?? "null"}-${item.title}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-orange-500/25 bg-black/30 p-3"
            >
              <div>
                <p className="font-semibold text-orange-100">{item.title}</p>
                <p className="text-xs text-orange-300">Sold: {item.soldQty}</p>
              </div>
              <p className="text-sm font-semibold text-orange-200">
                {"★".repeat(item.rating)}
                {"☆".repeat(5 - item.rating)}
              </p>
            </div>
          ))}
        </div>

        {rankedProducts.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-orange-500/35 p-4 text-sm text-orange-300">
            Ranking will appear after first sales.
          </p>
        ) : null}
      </section>
    </div>
  );
}

