import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCategoriesPageClient } from "@/components/admin/admin-categories-page-client";

export default function AdminCategoriesPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <div className="space-y-2">
          <h1 className="text-4xl text-orange-100">Categories</h1>
          <p className="text-sm text-orange-300">
            Add, reorder and enable/disable storefront categories.
          </p>
        </div>

        <AdminCategoriesPageClient />
      </AdminShell>
    </AdminGuard>
  );
}



