import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md rounded-2xl border border-orange-500/35 bg-[#101010] p-6 text-sm text-orange-300">
          Loading login form...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}



