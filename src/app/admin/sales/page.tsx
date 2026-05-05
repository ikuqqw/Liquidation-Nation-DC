import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSalesPageClient } from "@/components/admin/admin-sales-page-client";

export default function AdminSalesPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <div className="space-y-2">
          <h1 className="text-4xl text-orange-100">Sales Analytics</h1>
          <p className="text-sm text-orange-300">
            Daily sales totals, sold-item drilldown and product ranking.
          </p>
        </div>

        <AdminSalesPageClient />
      </AdminShell>
    </AdminGuard>
  );
}

