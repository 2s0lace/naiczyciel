import "server-only";

import { applySetCatalogSnapshot, getSetCatalogSnapshot, type SetCatalogSnapshot } from "@/lib/quiz/set-catalog";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const SET_ACCESS_STATE_ROW_ID = "e8";

type SetCatalogStateRow = {
  id?: string | null;
  sets?: unknown;
  config?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function shouldUseServiceRoleForAdminWrites() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function createSetCatalogClient(accessToken?: string | null) {
  if (shouldUseServiceRoleForAdminWrites()) {
    return getSupabaseServerClient();
  }

  return getSupabaseServerClient(accessToken);
}

export async function loadSetCatalogFromDatabase(accessToken?: string | null): Promise<{ loaded: boolean; details?: string }> {
  let supabase: ReturnType<typeof getSupabaseServerClient>;

  try {
    supabase = createSetCatalogClient(accessToken);
  } catch {
    return { loaded: false };
  }

  const result = await supabase
    .from("quiz_set_access_state")
    .select("id, sets, config")
    .eq("id", SET_ACCESS_STATE_ROW_ID)
    .maybeSingle();

  if (result.error) {
    return {
      loaded: false,
      details: result.error.message,
    };
  }

  const row = asRecord(result.data) as SetCatalogStateRow | null;

  if (!row) {
    if (!shouldUseServiceRoleForAdminWrites() && (!accessToken || accessToken.trim().length === 0)) {
      return { loaded: false };
    }

    const bootstrap = await saveSetCatalogToDatabase(undefined, accessToken);
    return {
      loaded: bootstrap.saved,
      details: bootstrap.details,
    };
  }

  applySetCatalogSnapshot({
    sets: row.sets,
    config: row.config,
  });

  return { loaded: true };
}

export async function saveSetCatalogToDatabase(
  snapshot = getSetCatalogSnapshot(),
  accessToken?: string | null,
): Promise<{ saved: boolean; details?: string }> {
  let supabase: ReturnType<typeof getSupabaseServerClient>;

  try {
    supabase = createSetCatalogClient(accessToken);
  } catch {
    return { saved: false };
  }

  const payload: {
    id: string;
    sets: SetCatalogSnapshot["sets"];
    config: SetCatalogSnapshot["config"];
  } = {
    id: SET_ACCESS_STATE_ROW_ID,
    sets: snapshot.sets,
    config: snapshot.config,
  };

  const result = await supabase
    .from("quiz_set_access_state")
    .upsert(payload, { onConflict: "id" });

  if (result.error) {
    return {
      saved: false,
      details: result.error.message,
    };
  }

  return { saved: true };
}
