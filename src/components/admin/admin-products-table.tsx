"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Product } from "@/lib/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { extractStoragePathFromPublicUrl, formatUsd } from "@/lib/utils";
import { PRODUCT_STATUS_LABELS, STORAGE_BUCKET } from "@/lib/constants";

interface AdminProductsTableProps {
  initialProducts: Product[];
}

export function AdminProductsTable({ initialProducts }: AdminProductsTableProps) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const filtered = products.filter((product) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      product.title.toLowerCase().includes(query) ||
      (product.category?.name ?? "").toLowerCase().includes(query)
    );
  });

  const updateProduct = async (id: number, payload: Partial<Product>) => {
    setUpdatingId(id);
    setError("");
    const { error: updateError } = await supabase.from("products").update(payload).eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setUpdatingId(null);
      return false;
    }

    setProducts((prev) =>
      prev.map((product) => (product.id === id ? { ...product, ...payload } : product)),
    );
    setUpdatingId(null);
    return true;
  };

  const quickSetStatus = (id: number, status: Product["status"]) => {
    const quantity = status === "in_stock" ? 1 : 0;
    void updateProduct(id, { status, quantity });
  };

  const updateQuantity = (id: number, quantity: number) => {
    const status = quantity > 0 ? "in_stock" : "out_of_stock";
    void updateProduct(id, { quantity, status });
  };

  const deleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `Delete "${product.title}"?\n\nThis action cannot be undone.`,
    );
    if (!confirmed) return;

    setUpdatingId(product.id);
    setError("");

    const storagePaths = (product.product_images ?? [])
      .map((image) => extractStoragePathFromPublicUrl(image.image_url))
      .filter((path): path is string => Boolean(path));

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(storagePaths);
      if (storageError) {
        console.warn("[deleteProduct] storage cleanup failed", storageError.message);
      }
    }

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (deleteError) {
      setError(deleteError.message);
      setUpdatingId(null);
      return;
    }

    setProducts((prev) => prev.filter((item) => item.id !== product.id));
    setUpdatingId(null);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-orange-500/35 bg-[#101010] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-orange-100">Products</h2>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title or category..."
          className="w-full max-w-xs rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
        />
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-orange-200">
          <thead className="border-b border-orange-500/35 text-orange-300">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Quantity</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-b border-orange-500/20">
                <td className="px-3 py-3">
                  <div className="font-semibold text-orange-100">{product.title}</div>
                  <div className="text-xs text-orange-400/90">
                    {product.is_featured ? "Featured" : "Regular"} - ID #{product.id}
                  </div>
                </td>
                <td className="px-3 py-3">{product.category?.name ?? "-"}</td>
                <td className="px-3 py-3">{formatUsd(product.price)}</td>
                <td className="px-3 py-3">
                  <span className="rounded bg-black/70 px-2 py-1 text-xs font-semibold text-orange-200">
                    {PRODUCT_STATUS_LABELS[product.status]}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    min="0"
                    defaultValue={product.quantity}
                    onBlur={(event) => {
                      const value = Number(event.target.value || 0);
                      updateQuantity(product.id, value);
                    }}
                    className="w-20 rounded-md border border-orange-500/35 bg-black/40 px-2 py-1"
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => quickSetStatus(product.id, "out_of_stock")}
                      disabled={updatingId === product.id}
                      className="rounded-md border border-orange-500/35 px-2 py-1 text-xs font-semibold text-orange-200 hover:bg-orange-500/10"
                    >
                      Mark as Sold
                    </button>
                    <button
                      type="button"
                      onClick={() => quickSetStatus(product.id, "in_stock")}
                      disabled={updatingId === product.id}
                      className="rounded-md border border-orange-500/35 px-2 py-1 text-xs font-semibold text-orange-200 hover:bg-orange-500/10"
                    >
                      Back in Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => quickSetStatus(product.id, "hidden")}
                      disabled={updatingId === product.id}
                      className="rounded-md border border-orange-500/35 px-2 py-1 text-xs font-semibold text-orange-200 hover:bg-orange-500/10"
                    >
                      Hide
                    </button>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="rounded-md bg-orange-500 px-2 py-1 text-xs font-semibold text-black hover:bg-orange-400"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => void deleteProduct(product)}
                      disabled={updatingId === product.id}
                      className="rounded-md border border-rose-500/60 px-2 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/15 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-orange-500/35 p-4 text-sm text-orange-300">
          No products found.
        </p>
      ) : null}
    </section>
  );
}


