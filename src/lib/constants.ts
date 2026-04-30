import { CatalogSort, ProductCondition, ProductStatus } from "@/lib/types";

export const STORE_INFO = {
  name: "Liquidation Nation DC",
  address: "xxx",
  phone: "+1 xxx xxx xxxx",
  hours: "...",
};

export const DEFAULT_CATEGORIES = [
  "Tools",
  "Landscape tools",
  "Vanity's",
  "Appliances",
  "Lights",
  "Doors and windows",
  "Bathtub, shower set & base",
  "Sink",
  "For Kids",
] as const;

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Draft",
  in_stock: "In stock",
  out_of_stock: "Out of stock",
  hidden: "Hidden",
};

export const PRODUCT_CONDITION_LABELS: Record<ProductCondition, string> = {
  new: "New",
  open_box: "Open box",
  used: "Used",
};

export const SORT_OPTIONS: Array<{ value: CatalogSort; label: string }> = [
  { value: "featured", label: "Featured first" },
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "title_asc", label: "Name: A-Z" },
];

export const STORAGE_BUCKET = "product-images";
