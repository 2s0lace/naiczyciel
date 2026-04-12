import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let publicServerClient: SupabaseClient | null = null;
let adminServerClient: SupabaseClient | null = null;

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL for server client");
  }

  return url;
}

function getSupabasePublicKey() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error("Missing Supabase publishable/anon key for server client");
  }

  return key;
}

function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for admin client");
  }

  return key;
}

function createServerClient(key: string, accessToken?: string | null) {
  return createClient(getSupabaseUrl(), key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global:
      accessToken && accessToken.trim().length > 0
        ? {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        : undefined,
  });
}

export function getSupabaseUserClient(accessToken: string) {
  return createServerClient(getSupabasePublicKey(), accessToken);
}

export function getSupabaseServerClient(accessToken?: string | null) {
  if (accessToken && accessToken.trim().length > 0) {
    return getSupabaseUserClient(accessToken);
  }

  if (publicServerClient) {
    return publicServerClient;
  }

  publicServerClient = createServerClient(getSupabasePublicKey());

  return publicServerClient;
}

export function getSupabaseAdminClient() {
  if (adminServerClient) {
    return adminServerClient;
  }

  adminServerClient = createServerClient(getSupabaseServiceRoleKey());

  return adminServerClient;
}

