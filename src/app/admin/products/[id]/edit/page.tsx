import { notFound } from "next/navigation";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminProductFormPageClient } from "@/components/admin/admin-product-form-page-client";

interface AdminEditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditProductPage({
  params,
}: AdminEditProductPageProps) {
  const resolvedParams = await params;
  const productId = Number(resolvedParams.id);

  if (!productId || Number.isNaN(productId)) {
    notFound();
  }

  return (
    <AdminGuard>
      <AdminShell>
        <div className="space-y-2">
          <h1 className="text-4xl text-orange-100">Edit Product #{productId}</h1>
          <p className="text-sm text-orange-300">
            Update details, stock status, quantity and gallery.
          </p>
        </div>
        <AdminProductFormPageClient mode="edit" productId={productId} />
      </AdminShell>
    </AdminGuard>
  );
}


