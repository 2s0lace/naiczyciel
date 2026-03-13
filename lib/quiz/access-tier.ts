import { isAdminEmail } from "@/lib/auth/role";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AccessTier } from "@/lib/quiz/set-catalog";

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");

  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRole(value: unknown): string {
  return asText(value).toLowerCase();
}

function roleLooksPremiumPlus(role: string): boolean {
  return (
    role.includes("premium_plus") ||
    role.includes("premium+") ||
    role.includes("premiumplus") ||
    role.includes("uczen+") ||
    role.includes("uczen_plus") ||
    role.includes("student+")
  );
}

function roleLooksPremium(role: string): boolean {
  return role.includes("premium") || role.includes("uczen") || role.includes("student");
}

function hasFuturePremiumUntil(value: unknown): boolean {
  const text = asText(value);

  if (!text) {
    return false;
  }

  const time = Date.parse(text);
  return Number.isFinite(time) && time > Date.now();
}

function resolveTierFromSignals(params: {
  role: string;
  premiumUntil: unknown;
  isAdmin: boolean;
}): AccessTier {
  if (params.isAdmin || params.role === "admin") {
    return "premium_plus";
  }

  if (roleLooksPremiumPlus(params.role)) {
    return "premium_plus";
  }

  if (roleLooksPremium(params.role) || hasFuturePremiumUntil(params.premiumUntil)) {
    return "premium";
  }

  return "registered";
}

async function readProfileLikeRecord(params: {
  supabase: ReturnType<typeof getSupabaseServerClient>;
  userId: string;
  email: string;
}): Promise<Record<string, unknown> | null> {
  const tables = ["profiles", "users"] as const;

  for (const tableName of tables) {
    const byId = await params.supabase
      .from(tableName)
      .select("role, access_level, premium_until")
      .eq("id", params.userId)
      .maybeSingle();

    if (!byId.error && byId.data) {
      const record = asRecord(byId.data);

      if (record) {
        return record;
      }
    }

    if (!params.email) {
      continue;
    }

    const byEmail = await params.supabase
      .from(tableName)
      .select("role, access_level, premium_until")
      .eq("email", params.email)
      .maybeSingle();

    if (!byEmail.error && byEmail.data) {
      const record = asRecord(byEmail.data);

      if (record) {
        return record;
      }
    }
  }

  return null;
}

export async function resolveAccessTierFromRequest(request: Request): Promise<{
  tier: AccessTier;
  userId: string | null;
  role: string | null;
}> {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return {
      tier: "unregistered",
      userId: null,
      role: null,
    };
  }

  let supabase: ReturnType<typeof getSupabaseServerClient>;

  try {
    supabase = getSupabaseServerClient();
  } catch {
    return {
      tier: "registered",
      userId: null,
      role: null,
    };
  }

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return {
      tier: "unregistered",
      userId: null,
      role: null,
    };
  }

  const email = asText(data.user.email);
  const adminByEmail = isAdminEmail(email);

  const metadataRole = normalizeRole(data.user.app_metadata?.role) || normalizeRole(data.user.user_metadata?.role);

  if (adminByEmail || metadataRole === "admin") {
    return {
      tier: "premium_plus",
      userId: data.user.id,
      role: "admin",
    };
  }

  let profileRole = "";
  let profilePremiumUntil: unknown = null;

  try {
    const profileRecord = await readProfileLikeRecord({
      supabase,
      userId: data.user.id,
      email,
    });

    if (profileRecord) {
      profileRole = normalizeRole(profileRecord.access_level) || normalizeRole(profileRecord.role);
      profilePremiumUntil = profileRecord.premium_until;
    }
  } catch {
    profileRole = "";
    profilePremiumUntil = null;
  }

  const resolvedRole = profileRole || metadataRole || "registered";

  return {
    tier: resolveTierFromSignals({
      role: resolvedRole,
      premiumUntil: profilePremiumUntil,
      isAdmin: false,
    }),
    userId: data.user.id,
    role: resolvedRole,
  };
}

