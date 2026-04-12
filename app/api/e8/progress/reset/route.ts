import { NextResponse } from "next/server";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import { getSupabaseUserClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const access = await resolveAccessTierFromRequest(request);

    if (!access.userId || !access.accessToken) {
      return NextResponse.json(
        {
          error: "Brak autoryzacji.",
          details: "Zaloguj się, aby zresetować progres.",
        },
        { status: 401 },
      );
    }

    const supabase = getSupabaseUserClient(access.accessToken);

    const sessionsResult = await supabase
      .from("quiz_sessions")
      .select("id")
      .eq("user_id", access.userId)
      .limit(5000);

    if (sessionsResult.error) {
      console.error("[progress-reset] sessions lookup failed", sessionsResult.error);
      return NextResponse.json(
        {
          error: "Nie udalo sie pobrac sesji uzytkownika.",
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
        console.error("[progress-reset] stats delete failed", statsDelete.error);
        return NextResponse.json(
          {
            error: "Nie udalo sie usunac statystyk progresu.",
          },
          { status: 500 },
        );
      }

      const answersDelete = await supabase
        .from("quiz_session_answers")
        .delete()
        .in("session_id", sessionIds);

      if (answersDelete.error) {
        console.error("[progress-reset] answers delete failed", answersDelete.error);
        return NextResponse.json(
          {
            error: "Nie udalo sie usunac odpowiedzi z sesji.",
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
      console.error("[progress-reset] sessions delete failed", sessionsDelete.error);
      return NextResponse.json(
        {
          error: "Nie udalo sie usunac sesji uzytkownika.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      deletedSessions: sessionIds.length,
    });
  } catch (error) {
    console.error("[progress-reset] unexpected error", error);

    return NextResponse.json(
      {
        error: "Nie udalo sie zresetowac progresu.",
      },
      { status: 500 },
    );
  }
}
