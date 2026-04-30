import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminProductFormPageClient } from "@/components/admin/admin-product-form-page-client";

export default function AdminNewProductPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <div className="space-y-2">
          <h1 className="text-4xl text-orange-100">Add Product</h1>
          <p className="text-sm text-orange-300">
            Create a new inventory item and upload one or more photos.
          </p>
        </div>
        <AdminProductFormPageClient mode="create" />
      </AdminShell>
    </AdminGuard>
  );
}



