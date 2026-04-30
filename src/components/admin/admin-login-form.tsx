"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { SupabaseConfigAlert } from "@/components/admin/supabase-config-alert";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRoute = searchParams.get("next") || "/admin/products";
  const isConfigured = hasSupabaseConfig();
  const supabase = useMemo(
    () => (isConfigured ? createBrowserSupabaseClient() : null),
    [isConfigured],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setError("Supabase env is not configured.");
      return;
    }

    setIsLoading(true);
    setError("");

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setIsLoading(false);
      return;
    }

    router.replace(nextRoute);
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-orange-500/35 bg-[#101010] p-6 shadow-[0_12px_34px_rgba(0,0,0,0.08)]">
      <h1 className="text-4xl text-orange-100">Admin Login</h1>
      <p className="mt-1 text-sm text-orange-300">
        Manage products, photos, categories and stock status.
      </p>

      {!isConfigured ? <div className="mt-4"><SupabaseConfigAlert compact /></div> : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-orange-100">Email</label>
          <input
            type="email"
            autoComplete="email"
            required
            disabled={!isConfigured}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-orange-100">Password</label>
          <input
            type="password"
            autoComplete="current-password"
            required
            disabled={!isConfigured}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-orange-500/35 px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
        </div>

        {error ? <p className="text-sm text-rose-700">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading || !isConfigured}
          className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <Link
        href="/"
        className="mt-4 inline-block text-sm font-semibold text-orange-300 underline-offset-4 hover:underline"
      >
        Back to storefront
      </Link>
    </div>
  );
}



