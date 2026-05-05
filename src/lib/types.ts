export type ProductStatus = "draft" | "in_stock" | "out_of_stock" | "hidden";

export type ProductCondition = "new" | "open_box" | "used";

export type PromoDiscountType = "percent" | "amount";

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

export interface PromoCode {
  id: number;
  code: string;
  description: string | null;
  discount_type: PromoDiscountType;
  discount_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number | null;
  product_title: string;
  product_image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface Sale {
  id: number;
  business_day: string;
  subtotal: number;
  discount_amount: number;
  total: number;
  promo_code_id: number | null;
  promo_code_snapshot: string | null;
  sold_by: string | null;
  created_at: string;
  sale_items?: SaleItem[];
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
