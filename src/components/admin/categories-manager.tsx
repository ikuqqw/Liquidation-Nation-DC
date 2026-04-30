"use client";

import { useMemo, useState } from "react";
import { Category } from "@/lib/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { slugify } from "@/lib/utils";

interface CategoriesManagerProps {
  initialCategories: Category[];
}

export function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("100");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const createCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const payload = {
      name: name.trim(),
      slug: slugify(name),
      sort_order: Number(sortOrder || 100),
      is_active: isActive,
    };

    if (!payload.name || !payload.slug) {
      setIsSaving(false);
      setError("Name is required.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("categories")
      .insert(payload)
      .select("id, name, slug, sort_order, is_active")
      .single();

    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    setCategories((prev) =>
      [...prev, data as Category].sort((a, b) => a.sort_order - b.sort_order),
    );
    setName("");
    setSortOrder("100");
    setIsActive(true);
    setIsSaving(false);
  };

  const updateCategory = async (categoryId: number, payload: Partial<Category>) => {
    setError("");
    const { error: updateError } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", categoryId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setCategories((prev) =>
      prev
        .map((category) =>
          category.id === categoryId ? { ...category, ...payload } : category,
        )
        .sort((a, b) => a.sort_order - b.sort_order),
    );
  };

  return (
    <section className="space-y-6 rounded-2xl border border-orange-500/35 bg-[#101010] p-6">
      <div>
        <h2 className="text-xl font-semibold text-orange-100">Categories</h2>
        <p className="text-sm text-orange-300">
          Manage what appears in filters and product forms.
        </p>
      </div>

      <form onSubmit={createCategory} className="grid gap-3 rounded-lg border border-orange-500/35 p-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase text-orange-300">
            Name
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-orange-300">
            Sort
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm text-orange-200">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Active
          </label>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-400 disabled:opacity-60"
          >
            Add
          </button>
        </div>
      </form>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-orange-500/35 text-orange-300">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Sort</th>
              <th className="px-3 py-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-orange-500/20">
                <td className="px-3 py-3">{category.name}</td>
                <td className="px-3 py-3 text-orange-400/90">{category.slug}</td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    defaultValue={category.sort_order}
                    onBlur={(event) =>
                      updateCategory(category.id, {
                        sort_order: Number(event.target.value || 100),
                      })
                    }
                    className="w-24 rounded-md border border-orange-500/35 px-2 py-1"
                  />
                </td>
                <td className="px-3 py-3">
                  <label className="flex items-center gap-2 text-sm text-orange-200">
                    <input
                      type="checkbox"
                      checked={category.is_active}
                      onChange={(event) =>
                        updateCategory(category.id, { is_active: event.target.checked })
                      }
                    />
                    {category.is_active ? "Yes" : "No"}
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}



