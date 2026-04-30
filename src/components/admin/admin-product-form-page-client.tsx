"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Category, Product } from "@/lib/types";
import { ProductForm } from "@/components/admin/product-form";
import { NormalizableProductRow, normalizeProduct } from "@/lib/normalizers";

interface AdminProductFormPageClientProps {
  mode: "create" | "edit";
  productId?: number;
}

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

export function AdminProductFormPageClient({
  mode,
  productId,
}: AdminProductFormPageClientProps) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");
      setIsLoading(true);

      const categoriesPromise = supabase
        .from("categories")
        .select("id, name, slug, sort_order, is_active")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (mode === "edit" && productId) {
        const [categoriesResult, productResult] = await Promise.all([
          categoriesPromise,
          supabase
            .from("products")
            .select(adminProductSelection)
            .eq("id", productId)
            .single(),
        ]);

        if (categoriesResult.error) {
          setError(categoriesResult.error.message);
          setIsLoading(false);
          return;
        }

        if (productResult.error) {
          setError(productResult.error.message);
          setIsLoading(false);
          return;
        }

        setCategories((categoriesResult.data ?? []) as Category[]);
        setProduct(normalizeProduct(productResult.data as NormalizableProductRow));
        setIsLoading(false);
        return;
      }

      const categoriesResult = await categoriesPromise;
      if (categoriesResult.error) {
        setError(categoriesResult.error.message);
        setIsLoading(false);
        return;
      }

      setCategories((categoriesResult.data ?? []) as Category[]);
      setIsLoading(false);
    };

    void load();
  }, [mode, productId, supabase]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-orange-500/35 bg-[#101010] p-6 text-sm text-orange-300">
        Loading form data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-300 bg-rose-50 p-6 text-sm text-rose-700">
        Failed to load form data: {error}
      </div>
    );
  }

  if (mode === "edit" && !product) {
    return (
      <div className="rounded-2xl border border-rose-300 bg-rose-50 p-6 text-sm text-rose-700">
        Product not found.
      </div>
    );
  }

  return (
    <ProductForm
      mode={mode}
      categories={categories}
      initialProduct={mode === "edit" ? product : undefined}
    />
  );
}




