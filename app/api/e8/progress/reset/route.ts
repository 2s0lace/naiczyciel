import { NextResponse } from "next/server";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const access = await resolveAccessTierFromRequest(request);

    if (!access.userId) {
      return NextResponse.json(
        {
          error: "Brak autoryzacji.",
          details: "Zaloguj się, aby zresetować progres.",
        },
        { status: 401 },
      );
    }

    let supabase: ReturnType<typeof getSupabaseServerClient>;

    try {
      supabase = getSupabaseServerClient();
    } catch {
      return NextResponse.json(
        {
          error: "Brak połączenia z bazą danych.",
        },
        { status: 500 },
      );
    }

    const sessionsResult = await supabase
      .from("quiz_sessions")
      .select("id")
      .eq("user_id", access.userId)
      .limit(5000);

    if (sessionsResult.error) {
      return NextResponse.json(
        {
          error: "Nie udało się pobrać sesji użytkownika.",
          details: sessionsResult.error.message,
        },
        { status: 500 },
      );
    }

    const sessionIds = (sessionsResult.data ?? [])
      .map((entry) => (entry && typeof entry.id === "string" ? entry.id.trim() : ""))
      .filter((id, index, list) => id.length > 0 && list.indexOf(id) === index);

    if (sessionIds.length > 0) {
      const statsDelete = await supabase
        .from("quiz_result_stats")
        .delete()
        .in("session_id", sessionIds);

      if (statsDelete.error) {
        return NextResponse.json(
          {
            error: "Nie udało się usunąć statystyk progresu.",
            details: statsDelete.error.message,
          },
          { status: 500 },
        );
      }

      const answersDelete = await supabase
        .from("quiz_session_answers")
        .delete()
        .in("session_id", sessionIds);

      if (answersDelete.error) {
        return NextResponse.json(
          {
            error: "Nie udało się usunąć odpowiedzi z sesji.",
            details: answersDelete.error.message,
          },
          { status: 500 },
        );
      }
    }

    const sessionsDelete = await supabase
      .from("quiz_sessions")
      .delete()
      .eq("user_id", access.userId);

    if (sessionsDelete.error) {
      return NextResponse.json(
        {
          error: "Nie udało się usunąć sesji użytkownika.",
          details: sessionsDelete.error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      deletedSessions: sessionIds.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Nie udało się zresetować progresu.",
        details: message,
      },
      { status: 500 },
    );
  }
}
