import { isAdminEmail, resolveUserRole } from "@/lib/auth/role";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");

  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function resolveRoleFromRequest(request: Request): Promise<{
  role: string;
  userId: string | null;
  accessToken: string | null;
}> {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return { role: "user", userId: null, accessToken: null };
  }

  let supabase: ReturnType<typeof getSupabaseServerClient>;

  try {
    supabase = getSupabaseServerClient();
  } catch {
    return { role: "user", userId: null, accessToken };
  }

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return { role: "user", userId: null, accessToken };
  }

  if (isAdminEmail(data.user.email)) {
    return {
      role: "admin",
      userId: data.user.id,
      accessToken,
    };
  }

  const role = await resolveUserRole({
    supabase,
    user: data.user,
  });

  return {
    role,
    userId: data.user.id,
    accessToken,
  };
}
