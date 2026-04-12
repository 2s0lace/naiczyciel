import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchQuestionsForExerciseIds, fetchQuestionsForMode, clampQuestionCount } from "@/lib/quiz/repository";
import { getSetSlots, getSetsForTier } from "@/lib/quiz/set-catalog";
import type { AccessTier } from "@/lib/quiz/set-catalog";
import type { QuizQuestion } from "@/lib/quiz/types";
import type { OwnedSession } from "@/lib/quiz/require-owned-session";

function normalizeSetId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asFiniteNumber(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export async function loadQuestionsForOwnedSession(params: {
  supabase: SupabaseClient;
  session: OwnedSession;
  tier: AccessTier;
  role: string | null;
}): Promise<QuizQuestion[]> {
  const { supabase, session, tier, role } = params;
  const allowedSetMap = new Map(getSetsForTier(tier).map((setItem) => [setItem.id, setItem]));
  const allSetMap = role === "admin" ? new Map(getSetSlots().map((setItem) => [setItem.id, setItem])) : null;
  const effectiveSetId = normalizeSetId(session.set_id);
  const selectedSet = effectiveSetId
    ? allowedSetMap.get(effectiveSetId) ?? allSetMap?.get(effectiveSetId) ?? null
    : null;
  const resolvedMode = selectedSet?.mode ?? (typeof session.mode === "string" ? session.mode : "reactions");
  const requestedCount = clampQuestionCount(asFiniteNumber(session.requested_count) ?? 10);

  if (selectedSet?.questionIds && selectedSet.questionIds.length > 0) {
    return fetchQuestionsForExerciseIds({
      supabase,
      exerciseIds: selectedSet.questionIds,
      count: Math.min(requestedCount, selectedSet.questionIds.length),
      shuffleSeed: selectedSet.questionIds.length > requestedCount ? session.id : undefined,
    });
  }

  return fetchQuestionsForMode({
    supabase,
    mode: resolvedMode,
    count: requestedCount,
  });
}

export function resolveQuestionSelection(params: {
  questions: QuizQuestion[];
  questionId: string;
  optionId: string;
}) {
  const { questions, questionId, optionId } = params;

  for (const question of questions) {
    if (question.type === "single_question" && question.id === questionId) {
      const selectedOption = question.options.find((option) => option.id === optionId);

      if (!selectedOption) {
        return null;
      }

      return {
        question,
        isCorrect: selectedOption.isCorrect === true,
      };
    }

    if (question.type !== "single_question") {
      const questionItem = question.questions.find((item) => item.id === questionId);

      if (!questionItem) {
        continue;
      }

      const selectedOption = questionItem.options.find((option) => option.id === optionId);

      if (!selectedOption) {
        return null;
      }

      return {
        question,
        isCorrect: selectedOption.isCorrect === true,
      };
    }
  }

  return null;
}
