import { PRODUCT_CONDITION_LABELS, PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { Product } from "@/lib/types";
import { formatUsd } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-52 w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,#2b170a_0,#151515_52%,#0c0c0c_100%)] text-sm font-semibold tracking-wide text-orange-300">
        No photo yet
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-52 w-full object-cover"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const firstImage = product.product_images?.[0]?.image_url;
  const isInStock = product.status === "in_stock";

  return (
    <article className="overflow-hidden rounded-2xl border border-orange-500/30 bg-[#101010] shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
      <ProductImage src={firstImage} alt={product.title} />

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg leading-tight font-semibold text-orange-100">
            {product.title}
          </h3>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
              isInStock
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {PRODUCT_STATUS_LABELS[product.status]}
          </span>
        </div>

        <p className="text-sm text-orange-300">
          {product.category?.name ?? "Uncategorized"} -{" "}
          {PRODUCT_CONDITION_LABELS[product.condition]}
        </p>

        <div className="space-y-1">
          <p className="text-2xl font-bold text-orange-100">{formatUsd(product.price)}</p>
          {product.retail_price ? (
            <p className="text-sm text-orange-400/90">
              Retail: <span className="line-through">{formatUsd(product.retail_price)}</span>
            </p>
          ) : null}
        </div>

        <p className="rounded-lg bg-black/70 px-3 py-2 text-xs font-medium uppercase tracking-wide text-orange-200">
          Available in store only
        </p>
      </div>
    </article>
  );
}

