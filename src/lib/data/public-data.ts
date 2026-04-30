import { Category, Product } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  NormalizableProductRow,
  normalizeProduct,
  normalizeProducts,
} from "@/lib/normalizers";
import { hasSupabaseConfig } from "@/lib/supabase/config";

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

export async function getActiveCategories() {
  if (!hasSupabaseConfig()) {
    return [] as Category[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[getActiveCategories]", error.message);
    return [] as Category[];
  }

  return data ?? [];
}

export async function getPublicProducts() {
  if (!hasSupabaseConfig()) {
    return [] as Product[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelection)
    .in("status", ["in_stock", "out_of_stock"])
    .order("created_at", { ascending: false })
    .order("sort_order", {
      foreignTable: "product_images",
      ascending: true,
    });

  if (error) {
    console.error("[getPublicProducts]", error.message);
    return [] as Product[];
  }

  return normalizeProducts((data ?? []) as NormalizableProductRow[]);
}

export async function getFeaturedProducts(limit = 6) {
  if (!hasSupabaseConfig()) {
    return [] as Product[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelection)
    .eq("status", "in_stock")
    .eq("is_featured", true)
    .limit(limit)
    .order("updated_at", { ascending: false })
    .order("sort_order", {
      foreignTable: "product_images",
      ascending: true,
    });

  if (error) {
    console.error("[getFeaturedProducts]", error.message);
    return [] as Product[];
  }

  return normalizeProducts((data ?? []) as NormalizableProductRow[]);
}

export async function getProductById(id: number) {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelection)
    .eq("id", id)
    .single();

  if (error) {
    console.error("[getProductById]", error.message);
    return null;
  }

  return normalizeProduct(data as NormalizableProductRow);
}

