"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { SupabaseConfigAlert } from "@/components/admin/supabase-config-alert";

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const pathname = usePathname();
  const { user, isLoading, isConfigured } = useAdminAuth(
    `/admin/login?next=${encodeURIComponent(pathname || "/admin/products")}`,
  );

  if (!isConfigured) {
    return <SupabaseConfigAlert />;
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-orange-500/35 bg-[#101010] p-6 text-sm text-orange-300">
        Checking admin session...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}



