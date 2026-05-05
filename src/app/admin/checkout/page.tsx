import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCheckoutPageClient } from "@/components/admin/admin-checkout-page-client";

export default function AdminCheckoutPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <div className="space-y-2">
          <h1 className="text-4xl text-orange-100">In-Store Checkout</h1>
          <p className="text-sm text-orange-300">
            Build a customer cart, apply promo codes, complete sale and auto-update stock.
          </p>
        </div>

        <AdminCheckoutPageClient />
      </AdminShell>
    </AdminGuard>
  );
}

