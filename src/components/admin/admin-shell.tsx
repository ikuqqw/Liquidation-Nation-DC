"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  children: ReactNode;
}

const navItems = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/products/new", label: "Add Product" },
  { href: "/admin/categories", label: "Categories" },
];

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-500/35 bg-[#101010] p-4">
        <div className="flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition",
                pathname === item.href
                  ? "bg-orange-500 text-black"
                  : "text-orange-200 hover:bg-orange-500/10",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={signOut}
          disabled={isSigningOut}
          className="rounded-md border border-orange-500/35 px-3 py-2 text-sm text-orange-200 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </div>

      {children}
    </div>
  );
}



