"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminProductsTable } from "@/components/admin/admin-products-table";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Product } from "@/lib/types";
import { NormalizableProductRow, normalizeProducts } from "@/lib/normalizers";

const adminProductSelection = `
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

export function AdminProductsPageClient() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("products")
        .select(adminProductSelection)
        .order("updated_at", { ascending: false });

      if (queryError) {
        setError(queryError.message);
        setIsLoading(false);
        return;
      }

      setProducts(normalizeProducts((data ?? []) as NormalizableProductRow[]));
      setIsLoading(false);
    };

    void load();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-orange-500/35 bg-[#101010] p-6 text-sm text-orange-300">
        Loading products...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-300 bg-rose-50 p-6 text-sm text-rose-700">
        Failed to load products: {error}
      </div>
    );
  }

  return <AdminProductsTable initialProducts={products} />;
}




