interface SupabaseConfigAlertProps {
  compact?: boolean;
}

export function SupabaseConfigAlert({ compact = false }: SupabaseConfigAlertProps) {
  return (
    <div className="rounded-xl border border-orange-500/40 bg-[#17110b] p-5 text-orange-200">
      <p className="text-sm font-bold uppercase tracking-wide text-orange-400">
        Supabase env missing
      </p>
      <p className={`mt-2 text-sm ${compact ? "" : "max-w-2xl"}`}>
        Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> (or legacy{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) in <code>.env.local</code>{" "}
        for local development and in Cloudflare Worker variables for production,
        then restart/redeploy.
      </p>
    </div>
  );
}



