import { SiteHeader } from "@/components/site-header";
import { CatalogClient } from "@/components/catalog/catalog-client";
import { FloatingCallButton } from "@/components/floating-call-button";
import { getActiveCategories, getPublicProducts } from "@/lib/data/public-data";

export default async function CatalogPage() {
  const [categories, products] = await Promise.all([
    getActiveCategories(),
    getPublicProducts(),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <FloatingCallButton />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 pb-24 sm:px-6 sm:py-10 sm:pb-16">
        <section className="rounded-2xl border border-orange-500/30 bg-[#101010] p-4 sm:p-6">
          <h1 className="text-[clamp(2rem,8vw,3.3rem)] text-orange-100">Store Catalog</h1>
          <p className="mt-2 text-sm text-orange-200">
            Browse live inventory, then visit us in-store to buy. No online checkout.
          </p>
        </section>

        <CatalogClient categories={categories} products={products} />
      </main>
    </div>
  );
}
