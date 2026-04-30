"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export function useAdminAuth(redirectTo?: string) {
  const router = useRouter();
  const isConfigured = hasSupabaseConfig();
  const supabase = useMemo(
    () => (isConfigured ? createBrowserSupabaseClient() : null),
    [isConfigured],
  );
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase || !isConfigured) {
      return;
    }

    let isMounted = true;

    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    });

    const bootstrap = async () => {
      const { data: userData, error } = await supabase.auth.getUser();

      if (error) {
        setIsLoading(false);
        return;
      }

      if (!isMounted) return;
      setUser(userData.user ?? null);
      setIsLoading(false);

      if (!userData.user && redirectTo) {
        router.replace(redirectTo);
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
      authListener.data.subscription.unsubscribe();
    };
  }, [redirectTo, router, supabase, isConfigured]);

  return { supabase, user, isLoading, isConfigured };
}
