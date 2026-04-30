export type ProductStatus = "draft" | "in_stock" | "out_of_stock" | "hidden";

export type ProductCondition = "new" | "open_box" | "used";

export type CatalogSort =
  | "featured"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "title_asc";

export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  sort_order: number;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  category_id: number | null;
  price: number | null;
  retail_price: number | null;
  condition: ProductCondition;
  quantity: number;
  status: ProductStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  product_images?: ProductImage[];
}

export interface CatalogFiltersState {
  query: string;
  category: string;
  availability: "all" | "in_stock" | "out_of_stock";
  condition: ProductCondition[];
  priceMin: string;
  priceMax: string;
  sort: CatalogSort;
}
