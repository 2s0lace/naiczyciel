import "server-only";

import { applySetCatalogSnapshot, getSetCatalogSnapshot, type SetCatalogSnapshot } from "@/lib/quiz/set-catalog";
import { getSupabaseAdminClient, getSupabaseServerClient, getSupabaseUserClient } from "@/lib/supabase/server";

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

function createSetCatalogReadClient(accessToken?: string | null) {
  if (accessToken && accessToken.trim().length > 0) {
    return getSupabaseUserClient(accessToken);
  }

  return getSupabaseServerClient();
}

function createSetCatalogWriteClient(accessToken?: string | null) {
  if (shouldUseServiceRoleForAdminWrites()) {
    return getSupabaseAdminClient();
  }

  if (accessToken && accessToken.trim().length > 0) {
    return getSupabaseUserClient(accessToken);
  }

  return getSupabaseServerClient();
}

export async function loadSetCatalogFromDatabase(params?: {
  accessToken?: string | null;
  allowBootstrap?: boolean;
}): Promise<{ loaded: boolean; details?: string }> {
  return loadSetCatalogState({
    accessToken: params?.accessToken ?? null,
    allowBootstrap: params?.allowBootstrap === true,
  });
}

export async function loadSetCatalogState(params?: {
  accessToken?: string | null;
  allowBootstrap?: boolean;
}): Promise<{ loaded: boolean; details?: string }> {
  const accessToken = params?.accessToken ?? null;
  const allowBootstrap = params?.allowBootstrap === true;
  let supabase: ReturnType<typeof createSetCatalogReadClient>;

  try {
    supabase = createSetCatalogReadClient(accessToken);
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
      details: "Nie udalo sie odczytac konfiguracji setow z bazy.",
    };
  }

  const row = asRecord(result.data) as SetCatalogStateRow | null;

  if (!row) {
    if (!allowBootstrap || !accessToken || !accessToken.trim()) {
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
  let supabase: ReturnType<typeof createSetCatalogWriteClient>;

  try {
    supabase = createSetCatalogWriteClient(accessToken);
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
      details: "Nie udalo sie zapisac konfiguracji setow w bazie.",
    };
  }

  return { saved: true };
}
