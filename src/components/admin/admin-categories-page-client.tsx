"use client";

import { useEffect, useMemo, useState } from "react";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Category } from "@/lib/types";

export function AdminCategoriesPageClient() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");
      setIsLoading(true);

      const { data, error: queryError } = await supabase
        .from("categories")
        .select("id, name, slug, sort_order, is_active")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (queryError) {
        setError(queryError.message);
        setIsLoading(false);
        return;
      }

      setCategories((data ?? []) as Category[]);
      setIsLoading(false);
    };

    void load();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-orange-500/35 bg-[#101010] p-6 text-sm text-orange-300">
        Loading categories...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-300 bg-rose-50 p-6 text-sm text-rose-700">
        Failed to load categories: {error}
      </div>
    );
  }

  return <CategoriesManager initialCategories={categories} />;
}



