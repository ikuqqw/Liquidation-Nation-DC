import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { CatalogClient } from "@/components/catalog/catalog-client";
import { FloatingCallButton } from "@/components/floating-call-button";
import { STORE_INFO } from "@/lib/constants";
import { getActiveCategories, getPublicProducts } from "@/lib/data/public-data";

export default async function Home() {
  const [categories, products] = await Promise.all([
    getActiveCategories(),
    getPublicProducts(),
  ]);
  const hasPlaceholderPhone = STORE_INFO.phone.toLowerCase().includes("x");
  const phoneHref = `tel:${STORE_INFO.phone.replace(/[^0-9+]/g, "")}`;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <FloatingCallButton />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-4 py-6 pb-24 sm:space-y-14 sm:px-6 sm:py-10 sm:pb-16">
        <section className="overflow-hidden rounded-3xl border border-orange-500/40 bg-black p-6 text-orange-100 shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:p-10 lg:p-14">
          <h1 className="text-center text-[clamp(2.4rem,10vw,4.6rem)] leading-[0.95]">
            Liquidation Nation DC
          </h1>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/catalog"
              className="w-full rounded-lg bg-orange-500 px-5 py-3 text-center text-sm font-black uppercase tracking-wider text-black hover:bg-orange-400 sm:w-auto"
            >
              View Catalog
            </Link>
            {hasPlaceholderPhone ? (
              <span className="w-full rounded-lg border border-orange-500/60 px-5 py-3 text-center text-sm font-semibold uppercase tracking-wider text-orange-200/70 sm:w-auto">
                Call Store
              </span>
            ) : (
              <a
                href={phoneHref}
                className="w-full rounded-lg border border-orange-500 px-5 py-3 text-center text-sm font-semibold uppercase tracking-wider text-orange-100 hover:bg-orange-500/15 sm:w-auto"
              >
                Call Store
              </a>
            )}
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-orange-500/30 bg-[#101010] p-4 sm:grid-cols-3 sm:p-6">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-orange-500 uppercase">
              Address
            </p>
            <p className="mt-1 text-lg font-semibold text-orange-100">
              {STORE_INFO.address}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-orange-500 uppercase">
              Hours
            </p>
            <p className="mt-1 text-lg font-semibold text-orange-100">{STORE_INFO.hours}</p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-orange-500 uppercase">
              Phone
            </p>
            <p className="mt-1 text-lg font-semibold text-orange-100">{STORE_INFO.phone}</p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-3xl text-orange-100 sm:text-4xl">Catalog</h2>
          </div>
          <CatalogClient categories={categories} products={products} />
        </section>
      </main>
    </div>
  );
}
