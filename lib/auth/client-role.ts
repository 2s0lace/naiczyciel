import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { resolveUserRole } from "@/lib/auth/role";

async function resolveRoleFromApi(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/role", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json().catch(() => ({}))) as { role?: string };

    return typeof data.role === "string" && data.role.trim().length > 0 ? data.role.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

export async function resolveRoleForSession(params: {
  supabase: SupabaseClient;
  session?: Session | null;
  user?: User | null;
}): Promise<string> {
  const { supabase, session, user } = params;
  const resolvedUser = session?.user ?? user ?? null;

  if (!resolvedUser) {
    return "user";
  }

  const accessToken = session?.access_token;

  if (accessToken) {
    const roleFromApi = await resolveRoleFromApi(accessToken);

    if (roleFromApi) {
      return roleFromApi;
    }
  }

  return resolveUserRole({
    supabase,
    user: resolvedUser,
  });
}
