"use client";

import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import {
  PRODUCT_CONDITION_LABELS,
  PRODUCT_STATUS_LABELS,
  SORT_OPTIONS,
} from "@/lib/constants";
import { ProductCard } from "@/components/catalog/product-card";
import { CatalogFiltersState, Category, Product, ProductCondition } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CatalogClientProps {
  categories: Category[];
  products: Product[];
}

const defaultFilters: CatalogFiltersState = {
  query: "",
  category: "all",
  availability: "all",
  condition: [],
  priceMin: "",
  priceMax: "",
  sort: "featured",
};

const conditionValues: ProductCondition[] = ["new", "open_box", "used"];

export function CatalogClient({ categories, products }: CatalogClientProps) {
  const [filters, setFilters] = useState<CatalogFiltersState>(defaultFilters);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    let list = products;

    if (filters.query.trim()) {
      const fuse = new Fuse(products, {
        threshold: 0.35,
        includeScore: false,
        keys: [
          { name: "title", weight: 0.6 },
          { name: "category.name", weight: 0.25 },
          { name: "condition", weight: 0.15 },
        ],
      });
      list = fuse.search(filters.query.trim()).map((item) => item.item);
    }

    if (filters.category !== "all") {
      list = list.filter((product) => product.category?.slug === filters.category);
    }

    if (filters.availability !== "all") {
      list = list.filter((product) => product.status === filters.availability);
    }

    if (filters.condition.length > 0) {
      const set = new Set(filters.condition);
      list = list.filter((product) => set.has(product.condition));
    }

    const min = Number(filters.priceMin);
    if (!Number.isNaN(min) && filters.priceMin !== "") {
      list = list.filter((product) => (product.price ?? 0) >= min);
    }

    const max = Number(filters.priceMax);
    if (!Number.isNaN(max) && filters.priceMax !== "") {
      list = list.filter((product) => (product.price ?? 0) <= max);
    }

    const sorted = [...list];
    switch (filters.sort) {
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case "price_asc":
        sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price_desc":
        sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "title_asc":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "featured":
      default:
        sorted.sort((a, b) => {
          if (a.is_featured === b.is_featured) return 0;
          return a.is_featured ? -1 : 1;
        });
    }

    return sorted;
  }, [filters, products]);

  const toggleCondition = (value: ProductCondition) => {
    setFilters((prev) => {
      const exists = prev.condition.includes(value);
      return {
        ...prev,
        condition: exists
          ? prev.condition.filter((item) => item !== value)
          : [...prev.condition, value],
      };
    });
  };

  const filtersPanel = (
    <aside className="space-y-6 rounded-2xl border border-orange-500/35 bg-[#101010] p-4">
      <div>
        <label htmlFor="search" className="block text-sm font-semibold text-orange-100">
          Search
        </label>
        <input
          id="search"
          value={filters.query}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, query: event.target.value }))
          }
          placeholder="Title, category, condition..."
          className="mt-2 w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
        />
      </div>

      <div>
        <label
          htmlFor="category"
          className="block text-sm font-semibold text-orange-100"
        >
          Category
        </label>
        <select
          id="category"
          value={filters.category}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, category: event.target.value }))
          }
          className="mt-2 w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option value={category.slug} key={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="availability"
          className="block text-sm font-semibold text-orange-100"
        >
          Availability
        </label>
        <select
          id="availability"
          value={filters.availability}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              availability: event.target.value as CatalogFiltersState["availability"],
            }))
          }
          className="mt-2 w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
        >
          <option value="all">All</option>
          <option value="in_stock">{PRODUCT_STATUS_LABELS.in_stock}</option>
          <option value="out_of_stock">{PRODUCT_STATUS_LABELS.out_of_stock}</option>
        </select>
      </div>

      <div>
        <p className="text-sm font-semibold text-orange-100">Condition</p>
        <div className="mt-2 space-y-2">
          {conditionValues.map((condition) => (
            <label key={condition} className="flex items-center gap-2 text-sm text-orange-200">
              <input
                type="checkbox"
                checked={filters.condition.includes(condition)}
                onChange={() => toggleCondition(condition)}
                className="h-4 w-4 rounded border-orange-500/35 text-orange-500 focus:ring-orange-500"
              />
              {PRODUCT_CONDITION_LABELS[condition]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-orange-100">Price Range</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            value={filters.priceMin}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, priceMin: event.target.value }))
            }
            placeholder="Min"
            inputMode="numeric"
            className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
          <input
            value={filters.priceMax}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, priceMax: event.target.value }))
            }
            placeholder="Max"
            inputMode="numeric"
            className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="sort" className="block text-sm font-semibold text-orange-100">
          Sort
        </label>
        <select
          id="sort"
          value={filters.sort}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              sort: event.target.value as CatalogFiltersState["sort"],
            }))
          }
          className="mt-2 w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
        >
          {SORT_OPTIONS.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => setFilters(defaultFilters)}
        className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm font-semibold text-orange-200 hover:bg-orange-500/10"
      >
        Reset filters
      </button>
    </aside>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="hidden lg:block">{filtersPanel}</div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-orange-100">
            {filteredProducts.length} products found
          </h2>
          <button
            type="button"
            onClick={() => setIsFiltersOpen((prev) => !prev)}
            className="rounded-lg border border-orange-500/35 bg-[#101010] px-4 py-2 text-sm font-semibold text-orange-200 lg:hidden"
          >
            Filters
          </button>
        </div>

        <div className={cn("lg:hidden", isFiltersOpen ? "block" : "hidden")}>
          {filtersPanel}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-orange-500/35 bg-[#101010] p-8 text-center text-orange-300">
            Nothing matched these filters. Try widening search or price range.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


