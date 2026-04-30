function cleanEnvValue(value: string | undefined) {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const unquoted = trimmed.replace(/^['"]|['"]$/g, "").trim();
  return unquoted || undefined;
}

function normalizeSupabaseUrl(value: string | undefined) {
  const cleaned = cleanEnvValue(value);
  if (!cleaned) return undefined;

  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }
    return cleaned;
  } catch {
    return undefined;
  }
}

export const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const publishableKey = cleanEnvValue(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && publishableKey);
}
