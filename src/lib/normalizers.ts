import { Category, Product, ProductImage } from "@/lib/types";

export type NormalizableProductRow = Record<string, unknown> & {
  category?: Category | Category[] | null;
  product_images?: ProductImage[] | null;
};

export function normalizeProduct(row: NormalizableProductRow): Product {
  const category = Array.isArray(row.category)
    ? (row.category[0] ?? null)
    : (row.category ?? null);

  const productImages = Array.isArray(row.product_images)
    ? [...row.product_images].sort((a, b) => a.sort_order - b.sort_order)
    : [];

  const productBase = row as unknown as Omit<Product, "category" | "product_images">;

  return {
    ...productBase,
    category,
    product_images: productImages,
  };
}

export function normalizeProducts(rows: NormalizableProductRow[]) {
  return rows.map(normalizeProduct);
}
