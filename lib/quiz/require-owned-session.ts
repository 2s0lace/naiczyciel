import type { SupabaseClient } from "@supabase/supabase-js";

export type OwnedSession = {
  id: string;
  user_id: string;
  status: string;
  set_id: string | null;
  mode: string | null;
  requested_count: number | null;
};

const SELECT_WITH_SET_ID = "id, user_id, status, set_id, mode, requested_count";
const SELECT_WITHOUT_SET_ID = "id, user_id, status, mode, requested_count";

type LookupRow = Omit<OwnedSession, "set_id"> & {
  set_id?: string | null;
};

async function querySession(params: {
  supabase: SupabaseClient;
  sessionId: string;
  userId?: string;
}): Promise<{ data: OwnedSession | null; error: { message?: string } | null }> {
  const withSetIdQuery = params.supabase
    .from("quiz_sessions")
    .select(SELECT_WITH_SET_ID)
    .eq("id", params.sessionId);

  const withSetIdResult = await (params.userId
    ? withSetIdQuery.eq("user_id", params.userId)
    : withSetIdQuery
  ).maybeSingle();

  if (!withSetIdResult.error && withSetIdResult.data) {
    return {
      data: withSetIdResult.data as OwnedSession,
      error: null,
    };
  }

  const missingSetId = withSetIdResult.error?.message?.includes("quiz_sessions.set_id does not exist");

  if (!missingSetId) {
    return {
      data: null,
      error: withSetIdResult.error,
    };
  }

  const withoutSetIdQuery = params.supabase
    .from("quiz_sessions")
    .select(SELECT_WITHOUT_SET_ID)
    .eq("id", params.sessionId);

  const withoutSetIdResult = await (params.userId
    ? withoutSetIdQuery.eq("user_id", params.userId)
    : withoutSetIdQuery
  ).maybeSingle();

  if (!withoutSetIdResult.error && withoutSetIdResult.data) {
    const row = withoutSetIdResult.data as LookupRow;

    return {
      data: {
        ...row,
        set_id: null,
      },
      error: null,
    };
  }

  return {
    data: null,
    error: withoutSetIdResult.error ?? withSetIdResult.error,
  };
}

export async function requireOwnedSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<OwnedSession> {
  const strict = await querySession({
    supabase,
    sessionId,
    userId,
  });

  if (!strict.error && strict.data) {
    console.log("[DEBUG requireOwnedSession] strict match OK", { sessionId, userId });
    return strict.data;
  }

  console.log("[DEBUG requireOwnedSession] strict match FAILED", {
    sessionId,
    userId,
    error: strict.error?.message ?? null,
    data: strict.data,
  });

  const fallback = await querySession({
    supabase,
    sessionId,
  });

  console.log("[DEBUG requireOwnedSession] fallback (id-only)", {
    sessionId,
    userId,
    found: !!fallback.data,
    error: fallback.error?.message ?? null,
    row_user_id: fallback.data?.user_id ?? null,
  });

  if (!fallback.error && fallback.data) {
    return fallback.data;
  }

  throw new Error("SESSION_NOT_FOUND");
}
