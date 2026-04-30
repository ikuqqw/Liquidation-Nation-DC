import Link from "next/link";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminProductsPageClient } from "@/components/admin/admin-products-page-client";

export default function AdminProductsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl text-orange-100">Inventory Control</h1>
            <p className="text-sm text-orange-300">
              Fast status updates for in-store inventory.
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-400"
          >
            Add Product
          </Link>
        </div>

        <AdminProductsPageClient />
      </AdminShell>
    </AdminGuard>
  );
}



