"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Category, Product, ProductCondition, ProductStatus } from "@/lib/types";
import { STORAGE_BUCKET } from "@/lib/constants";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { slugify } from "@/lib/utils";

interface ProductFormProps {
  mode: "create" | "edit";
  categories: Category[];
  initialProduct?: Product | null;
}

interface ProductFormState {
  title: string;
  slug: string;
  description: string;
  category_id: string;
  price: string;
  retail_price: string;
  condition: ProductCondition;
  quantity: string;
  status: ProductStatus;
  is_featured: boolean;
}

function buildInitialState(product?: Product | null): ProductFormState {
  if (!product) {
    return {
      title: "",
      slug: "",
      description: "",
      category_id: "",
      price: "",
      retail_price: "",
      condition: "new",
      quantity: "1",
      status: "in_stock",
      is_featured: false,
    };
  }

  return {
    title: product.title,
    slug: product.slug,
    description: product.description ?? "",
    category_id: product.category_id ? String(product.category_id) : "",
    price: product.price ? String(product.price) : "",
    retail_price: product.retail_price ? String(product.retail_price) : "",
    condition: product.condition,
    quantity: String(product.quantity ?? 0),
    status: product.status,
    is_featured: product.is_featured,
  };
}

export function ProductForm({ mode, categories, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [state, setState] = useState<ProductFormState>(buildInitialState(initialProduct));
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const productId = initialProduct?.id;
  const existingImages = initialProduct?.product_images ?? [];

  const onTitleChange = (title: string) => {
    setState((prev) => {
      const shouldAutofillSlug = prev.slug === "" || prev.slug === slugify(prev.title);
      return {
        ...prev,
        title,
        slug: shouldAutofillSlug ? slugify(title) : prev.slug,
      };
    });
  };

  const deleteImage = async (imageId: number) => {
    const confirmed = window.confirm("Delete this image from gallery?");
    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imageId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.refresh();
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    if (!state.title.trim()) {
      setIsSaving(false);
      setError("Title is required.");
      return;
    }

    const payload = {
      title: state.title.trim(),
      slug: state.slug.trim() || slugify(state.title),
      description: state.description.trim() || null,
      category_id: state.category_id ? Number(state.category_id) : null,
      price: state.price ? Number(state.price) : null,
      retail_price: state.retail_price ? Number(state.retail_price) : null,
      condition: state.condition,
      quantity: Number(state.quantity || 0),
      status: state.status,
      is_featured: state.is_featured,
    };

    let finalProductId = productId;

    if (mode === "create") {
      const { data, error: insertError } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();

      if (insertError) {
        setIsSaving(false);
        setError(insertError.message);
        return;
      }

      finalProductId = data.id;
    } else if (finalProductId) {
      const { error: updateError } = await supabase
        .from("products")
        .update(payload)
        .eq("id", finalProductId);

      if (updateError) {
        setIsSaving(false);
        setError(updateError.message);
        return;
      }
    }

    if (!finalProductId) {
      setIsSaving(false);
      setError("Could not determine product id.");
      return;
    }

    if (files.length > 0) {
      const baseSortOrder = existingImages.length;

      for (const [index, file] of files.entries()) {
        const filePath = `${finalProductId}/${Date.now()}-${slugify(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, { upsert: false });

        if (uploadError) {
          setIsSaving(false);
          setError(`Upload failed for ${file.name}: ${uploadError.message}`);
          return;
        }

        const publicUrl = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath).data.publicUrl;

        const { error: imageRowError } = await supabase.from("product_images").insert({
          product_id: finalProductId,
          image_url: publicUrl,
          sort_order: baseSortOrder + index,
        });

        if (imageRowError) {
          setIsSaving(false);
          setError(imageRowError.message);
          return;
        }
      }
    }

    setIsSaving(false);
    router.push(`/admin/products/${finalProductId}/edit`);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-orange-500/35 bg-[#101010] p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-orange-100">Title</label>
          <input
            value={state.title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-orange-100">Slug</label>
          <input
            value={state.slug}
            onChange={(event) => setState((prev) => ({ ...prev, slug: event.target.value }))}
            className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-orange-100">Category</label>
          <select
            value={state.category_id}
            onChange={(event) =>
              setState((prev) => ({ ...prev, category_id: event.target.value }))
            }
            className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-orange-100">Description</label>
          <textarea
            rows={4}
            value={state.description}
            onChange={(event) =>
              setState((prev) => ({ ...prev, description: event.target.value }))
            }
            className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-orange-100">Price</label>
          <input
            type="number"
            min="0"
            step="1"
            value={state.price}
            onChange={(event) => setState((prev) => ({ ...prev, price: event.target.value }))}
            className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-orange-100">
            Retail Price
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={state.retail_price}
            onChange={(event) =>
              setState((prev) => ({ ...prev, retail_price: event.target.value }))
            }
            className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-orange-100">Condition</label>
          <select
            value={state.condition}
            onChange={(event) =>
              setState((prev) => ({
                ...prev,
                condition: event.target.value as ProductCondition,
              }))
            }
            className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
          >
            <option value="new">New</option>
            <option value="open_box">Open box</option>
            <option value="used">Used</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-orange-100">Status</label>
          <select
            value={state.status}
            onChange={(event) =>
              setState((prev) => ({
                ...prev,
                status: event.target.value as ProductStatus,
              }))
            }
            className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
          >
            <option value="draft">Draft</option>
            <option value="in_stock">In stock</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-orange-100">Quantity</label>
          <input
            type="number"
            min="0"
            step="1"
            value={state.quantity}
            onChange={(event) => setState((prev) => ({ ...prev, quantity: event.target.value }))}
            className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <label className="flex items-center gap-2 pt-7 text-sm text-orange-200">
          <input
            type="checkbox"
            checked={state.is_featured}
            onChange={(event) =>
              setState((prev) => ({ ...prev, is_featured: event.target.checked }))
            }
            className="h-4 w-4 rounded border-orange-500/35 text-orange-500"
          />
          Show as featured on homepage
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-orange-100">
          Upload Photos
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(event) => setFiles(Array.from(event.target.files || []))}
          className="block w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm"
        />
        <p className="mt-2 text-xs text-orange-400/90">
          Bucket name expected: <code>{STORAGE_BUCKET}</code>
        </p>
      </div>

      {existingImages.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold text-orange-100">Current Gallery</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {existingImages.map((image) => (
              <div key={image.id} className="overflow-hidden rounded-lg border border-orange-500/35">
                <img
                  src={image.image_url}
                  alt="Product photo"
                  className="h-32 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => deleteImage(image.id)}
                  className="w-full border-t border-orange-500/35 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                >
                  Delete image
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? "Saving..."
            : mode === "create"
              ? "Create product"
              : "Save changes"}
        </button>

        <Link
          href="/admin/products"
          className="rounded-lg border border-orange-500/35 px-5 py-2.5 text-sm font-semibold text-orange-200 hover:bg-orange-500/10"
        >
          Back to products
        </Link>
      </div>
    </form>
  );
}



