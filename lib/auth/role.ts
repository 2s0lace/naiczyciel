import type { SupabaseClient, User } from "@supabase/supabase-js";

const ROLE_TABLES = ["profiles", "users"] as const;
const STATIC_ADMIN_EMAILS = new Set(["mamese123@proton.me", "patryk1tk@gmail.com"]);

function getEnvAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAIL_ALLOWLIST;

  if (!raw) {
    return new Set();
  }

  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0),
  );
}

function isAllowlistedAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  if (STATIC_ADMIN_EMAILS.has(normalized)) {
    return true;
  }

  return getEnvAdminEmails().has(normalized);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return isAllowlistedAdminEmail(email);
}

type RoleLookupParams = {
  supabase: SupabaseClient;
  userId: string;
  email?: string | null;
};

function normalizeRoleValue(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function readRoleFromRecord(record: Record<string, unknown> | null | undefined): string | null {
  if (!record) {
    return null;
  }

  return normalizeRoleValue(record.role) ?? normalizeRoleValue(record.access_level) ?? null;
}

export async function getRoleFromSupabaseTables({ supabase, userId, email }: RoleLookupParams): Promise<string | null> {
  for (const tableName of ROLE_TABLES) {
    const byId = await supabase
      .from(tableName)
      .select("role, access_level")
      .eq("id", userId)
      .maybeSingle();

    if (!byId.error && byId.data) {
      const role = readRoleFromRecord(byId.data as Record<string, unknown>);

      if (role) {
        return role;
      }
    }

    if (!email) {
      continue;
    }

    const byEmail = await supabase
      .from(tableName)
      .select("role, access_level")
      .eq("email", email)
      .maybeSingle();

    if (!byEmail.error && byEmail.data) {
      const role = readRoleFromRecord(byEmail.data as Record<string, unknown>);

      if (role) {
        return role;
      }
    }
  }

  return null;
}

export function getUserRole(user: User | null | undefined): string {
  if (!user) {
    return "user";
  }

  if (isAllowlistedAdminEmail(user.email)) {
    return "admin";
  }

  const appRole = normalizeRoleValue(user.app_metadata?.role);
  const userRole = normalizeRoleValue(user.user_metadata?.role);

  return appRole ?? userRole ?? "user";
}

export async function resolveUserRole(params: {
  supabase: SupabaseClient;
  user: User | null | undefined;
}): Promise<string> {
  const { supabase, user } = params;

  if (!user) {
    return "user";
  }

  if (isAllowlistedAdminEmail(user.email)) {
    return "admin";
  }

  const roleFromTable = await getRoleFromSupabaseTables({
    supabase,
    userId: user.id,
    email: user.email,
  });

  return roleFromTable ?? getUserRole(user);
}

export function setRoleCookie(role: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `role=${encodeURIComponent(role)}; Path=/; Max-Age=604800; SameSite=Lax`;
}

export function clearRoleCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = "role=; Path=/; Max-Age=0; SameSite=Lax";
}

