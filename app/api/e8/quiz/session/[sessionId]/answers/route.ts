import { NextResponse } from "next/server";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import { isLocalSessionId, saveLocalAnswer } from "@/lib/quiz/local-store";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
      return NextResponse.json({ error: "Nieprawidłowe dane odpowiedzi." }, { status: 400 });
    }

    const isCorrect = Boolean(body.isCorrect);
    const answeredAt = new Date().toISOString();
    const access = await resolveAccessTierFromRequest(request);

    if (isLocalSessionId(sessionId)) {
      saveLocalAnswer({
        sessionId,
        questionId,
        optionId,
        isCorrect,
      });

      return NextResponse.json({
        ok: true,
        questionId,
        savedAt: answeredAt,
        storage: "local",
      });
    }

    let supabase: ReturnType<typeof getSupabaseServerClient> | null = null;

    try {
      supabase = getSupabaseServerClient();
    } catch {
      saveLocalAnswer({
        sessionId,
        questionId,
        optionId,
        isCorrect,
      });

      return NextResponse.json({
        ok: true,
        questionId,
        savedAt: answeredAt,
        storage: "local",
      });
    }

    const primaryUpsert = await supabase.from("quiz_session_answers").upsert(
      {
        session_id: sessionId,
        question_id: questionId,
        option_id: optionId,
        is_correct: isCorrect,
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
              is_correct: isCorrect,
              answered_at: answeredAt,
            },
            {
              onConflict: "session_id,question_id",
            },
          )
        : null;

    if (primaryUpsert.error && fallbackUpsert?.error) {
      saveLocalAnswer({
        sessionId,
        questionId,
        optionId,
        isCorrect,
      });

      return NextResponse.json({
        ok: true,
        questionId,
        savedAt: answeredAt,
        storage: "local",
      });
    }

    const sessionPatch: Record<string, string> = { updated_at: answeredAt };

    if (access.userId) {
      sessionPatch.user_id = access.userId;
    }

    void supabase
      .from("quiz_sessions")
      .update(sessionPatch)
      .eq("id", sessionId);

    return NextResponse.json({
      ok: true,
      questionId,
      savedAt: answeredAt,
      storage: "supabase",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Wystąpił błąd podczas zapisu odpowiedzi.",
        details: message,
      },
      { status: 500 },
    );
  }
}
