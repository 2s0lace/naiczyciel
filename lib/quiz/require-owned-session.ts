import type { SupabaseClient } from "@supabase/supabase-js";

export type OwnedSession = {
  id: string;
  user_id: string;
  status: string;
  set_id: string | null;
  mode: string | null;
  requested_count: number | null;
};

export async function requireOwnedSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<OwnedSession> {
  const { data, error } = await supabase
    .from("quiz_sessions")
    .select("id, user_id, status, set_id, mode, requested_count")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("SESSION_NOT_FOUND");
  }

  return data as OwnedSession;
}
