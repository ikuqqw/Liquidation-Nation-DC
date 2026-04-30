import Link from "next/link";
import { STORE_INFO } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-orange-500/30 bg-black/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-black tracking-wide text-orange-300">
          {STORE_INFO.name}
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold text-orange-200">
          <Link href="/catalog" className="hover:text-orange-400">
            Catalog
          </Link>
        </nav>
      </div>
    </header>
  );
}

