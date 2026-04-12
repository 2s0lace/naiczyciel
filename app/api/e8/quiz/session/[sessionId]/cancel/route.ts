import { NextRequest, NextResponse } from "next/server";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import { requireOwnedSession } from "@/lib/quiz/require-owned-session";
import { getSupabaseUserClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Brak sessionId." },
        { status: 400 },
      );
    }

    const access = await resolveAccessTierFromRequest(request);

    if (!access.userId || !access.accessToken) {
      return NextResponse.json(
        { error: "Brak autoryzacji." },
        { status: 401 },
      );
    }

    const supabase = getSupabaseUserClient(access.accessToken);

    const session = await requireOwnedSession(
      supabase,
      sessionId,
      access.userId,
    );

    if (session.status === "completed") {
      return NextResponse.json(
        { error: "Nie mozna anulowac zakonczonej sesji." },
        { status: 409 },
      );
    }

    const { data, error } = await supabase
      .from("quiz_sessions")
      .update({
        status: "cancelled",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", access.userId)
      .select("id, status")
      .maybeSingle();

    if (error) {
      console.error("[quiz-cancel] update failed", error);

      return NextResponse.json(
        { error: "Nie udalo sie anulowac sesji." },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Sesja nie zostala znaleziona." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      session: data,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SESSION_NOT_FOUND") {
      return NextResponse.json(
        { error: "Sesja nie istnieje albo nie nalezy do uzytkownika." },
        { status: 404 },
      );
    }

    console.error("[quiz-cancel] unexpected error", error);

    return NextResponse.json(
      { error: "Wystapil nieoczekiwany blad." },
      { status: 500 },
    );
  }
}
