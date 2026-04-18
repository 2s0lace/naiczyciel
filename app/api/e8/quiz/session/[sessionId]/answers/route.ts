import { NextResponse } from "next/server";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import { getAccessibleLocalSession, isLocalSessionId, saveLocalAnswer } from "@/lib/quiz/local-store";
import { requireOwnedSession } from "@/lib/quiz/require-owned-session";
import { loadQuestionsForOwnedSession, resolveQuestionSelection } from "@/lib/quiz/session-questions";
import { getSupabaseUserClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

type SaveAnswerBody = {
  questionId?: string;
  optionId?: string;
  isCorrect?: boolean;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as SaveAnswerBody;

    const questionId = typeof body.questionId === "string" ? body.questionId : "";
    const optionId = typeof body.optionId === "string" ? body.optionId : "";

    if (!sessionId || !questionId || !optionId) {
      console.log("ANSWERS 400 DEBUG", { reason: "MISSING_SESSION_QUESTION_OR_OPTION", sessionId, body });
      return NextResponse.json({ error: "Nieprawidlowe dane odpowiedzi." }, { status: 400 });
    }

    const answeredAt = new Date().toISOString();
    const access = await resolveAccessTierFromRequest(request);

    if (isLocalSessionId(sessionId)) {
      const localSession = getAccessibleLocalSession(sessionId, access.userId);

      if (!localSession) {
        return NextResponse.json({ error: "Nie udalo sie rozpoczac quizu. Brak lokalnej sesji." }, { status: 404 });
      }

      try {
        saveLocalAnswer({
          sessionId,
          questionId,
          optionId,
          userId: access.userId,
        });
      } catch (error) {
        if (error instanceof Error && (error.message === "INVALID_QUESTION" || error.message === "INVALID_OPTION")) {
          console.log("ANSWERS 400 DEBUG", { reason: "LOCAL_SAVE_INVALID", sessionId, body });
          return NextResponse.json({ error: "Nieprawidlowe pytanie lub odpowiedz." }, { status: 400 });
        }

        if (error instanceof Error && error.message === "SESSION_NOT_FOUND") {
          return NextResponse.json({ error: "Sesja nie istnieje." }, { status: 404 });
        }

        throw error;
      }

      return NextResponse.json({
        ok: true,
        questionId,
        savedAt: answeredAt,
        storage: "local",
      });
    }

    if (!access.userId || !access.accessToken) {
      return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
    }

    const supabase = getSupabaseUserClient(access.accessToken);

    let session;

    try {
      session = await requireOwnedSession(supabase, sessionId, access.userId);
    } catch {
      return NextResponse.json({ error: "Sesja nie istnieje." }, { status: 404 });
    }

    const questions = await loadQuestionsForOwnedSession({
      supabase,
      session,
      tier: access.tier,
      role: access.role,
    });
    const selectedAnswer = resolveQuestionSelection({
      questions,
      questionId,
      optionId,
    });

    const resolvedIsCorrect =
      selectedAnswer?.isCorrect ?? (typeof body.isCorrect === "boolean" ? body.isCorrect : null);

    if (resolvedIsCorrect === null) {
      console.log("ANSWERS 400 DEBUG", { reason: "RESOLVED_IS_CORRECT_NULL", sessionId, body, selectedAnswer });
      return NextResponse.json({ error: "Nieprawidlowe pytanie lub odpowiedz." }, { status: 400 });
    }

    const primaryUpsert = await supabase.from("quiz_session_answers").upsert(
      {
        session_id: sessionId,
        question_id: questionId,
        option_id: optionId,
        is_correct: resolvedIsCorrect,
        answered_at: answeredAt,
      },
      {
        onConflict: "session_id,question_id",
      },
    );

    const fallbackUpsert =
      primaryUpsert.error
        ? await supabase.from("quiz_session_answers").upsert(
            {
              session_id: sessionId,
              question_id: questionId,
              selected_option_id: optionId,
              is_correct: resolvedIsCorrect,
              answered_at: answeredAt,
            },
            {
              onConflict: "session_id,question_id",
            },
          )
        : null;

    if (primaryUpsert.error && fallbackUpsert?.error) {
      console.error("[quiz-answer] upsert failed", primaryUpsert.error, fallbackUpsert.error);
      return NextResponse.json(
        {
          error: "Nie udalo sie zapisac odpowiedzi.",
        },
        { status: 500 },
      );
    }

    const sessionPatch: Record<string, string> = {
      updated_at: answeredAt,
      user_id: access.userId,
    };

    const sessionUpdate = await supabase
      .from("quiz_sessions")
      .update(sessionPatch)
      .eq("id", sessionId)
      .eq("user_id", access.userId);

    if (sessionUpdate.error) {
      console.error("[quiz-answer] session update failed", sessionUpdate.error);
    }

    return NextResponse.json({
      ok: true,
      questionId,
      savedAt: answeredAt,
      storage: "supabase",
    });
  } catch (error) {
    console.error("[quiz-answer] unexpected error", error);

    return NextResponse.json(
      {
        error: "Wystapil blad podczas zapisu odpowiedzi.",
      },
      { status: 500 },
    );
  }
}
