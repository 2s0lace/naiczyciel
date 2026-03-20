import type { SupabaseClient } from "@supabase/supabase-js";
import { validateExerciseRecord, type UniversalExerciseRecord } from "@/lib/quiz/admin-exercise";
import type { QuizAnswerSnapshot, QuizQuestion } from "@/lib/quiz/types";

type QuestionRow = {
  id: string | number;
  mode?: string | null;
  category?: string | null;
  prompt?: string | null;
  question?: string | null;
  explanation?: string | null;
  pattern_tip?: string | null;
  warning_tip?: string | null;
};

type OptionRow = {
  id: string | number;
  question_id: string | number;
  label?: string | null;
  text?: string | null;
  option_text?: string | null;
  content?: string | null;
  is_correct?: boolean | null;
};

type AnswerRow = {
  question_id?: string | number | null;
  option_id?: string | number | null;
  selected_option_id?: string | number | null;
  is_correct?: boolean | null;
};

type ExerciseRow = Record<string, unknown>;

const QUESTION_SELECT = "id, mode, category, prompt, question, explanation, pattern_tip, warning_tip";
const OPTION_SELECT = "id, question_id, label, text, option_text, content, is_correct";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asId(value: unknown): string {
  return String(value ?? "");
}

function parseJsonLike(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) {
    return value;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  const parsed = parseJsonLike(value);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  return parsed as Record<string, unknown>;
}

function normalizeExerciseRowForValidation(row: ExerciseRow): UniversalExerciseRecord | null {
  const payload = asRecord(row.payload);

  if (payload) {
    const validatedPayload = validateExerciseRecord(payload);

    if (validatedPayload.isValid && validatedPayload.exercise) {
      return validatedPayload.exercise;
    }
  }

  const candidate = {
    id: asText(row.id),
    status: row.status,
    category: row.category,
    task_type: row.task_type,
    difficulty: row.difficulty,
    tags: parseJsonLike(row.tags),
    source: row.source,
    is_public: row.is_public,
    title: row.title,
    instruction: row.instruction,
    content: parseJsonLike(row.content),
    correct_answer: parseJsonLike(row.correct_answer),
    explanation: parseJsonLike(row.explanation),
    hint: parseJsonLike(row.hint),
    analytics: parseJsonLike(row.analytics),
    grammar: parseJsonLike(row.grammar),
    vocabulary: parseJsonLike(row.vocabulary),
    meta: asRecord(row.meta) ?? {
      created_at: asText(row.created_at),
      updated_at: asText(row.updated_at),
    },
  };

  const validatedCandidate = validateExerciseRecord(candidate);
  return validatedCandidate.isValid ? validatedCandidate.exercise : null;
}

export type FetchExercisesBySkillParams = {
  grammar_structure?: string;
  vocabulary_topic?: string;
  skill?: string;
  limit?: number;
};

export async function fetchExercisesBySkill(
  params: FetchExercisesBySkillParams,
): Promise<UniversalExerciseRecord[]> {
  const grammarStructure = asText(params.grammar_structure);
  const vocabularyTopic = asText(params.vocabulary_topic);
  const skill = asText(params.skill);
  const limit = Number.isFinite(params.limit) ? Math.max(1, Math.min(200, Number(params.limit))) : 40;

  const { getSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = getSupabaseServerClient();

  let query = supabase.from("quiz_exercises").select("*");

  if (grammarStructure) {
    query = query.contains("grammar", { structures: [grammarStructure] });
  }

  if (vocabularyTopic) {
    query = query.contains("vocabulary", { topic: vocabularyTopic });
  }

  if (skill) {
    query = query.contains("analytics", { skill });
  }

  const result = await query.limit(limit);

  if (result.error || !result.data || result.data.length === 0) {
    return [];
  }

  return (result.data as ExerciseRow[])
    .map((row) => normalizeExerciseRowForValidation(row))
    .filter((exercise): exercise is UniversalExerciseRecord => Boolean(exercise));
}

function constrainToThreeOptions(
  options: Array<{
    id: string;
    label: string;
    text: string;
    isCorrect: boolean;
  }>,
) {
  if (options.length < 3) {
    return [] as typeof options;
  }

  const firstThree = options.slice(0, 3);
  const correctOption = options.find((option) => option.isCorrect);
  let selected = firstThree;

  if (!firstThree.some((option) => option.isCorrect) && correctOption) {
    const head = firstThree.slice(0, 2).filter((option) => option.id !== correctOption.id);
    selected = [...head, correctOption];
  }

  if (selected.length < 3) {
    for (const option of options) {
      if (selected.some((item) => item.id === option.id)) {
        continue;
      }

      selected.push(option);

      if (selected.length === 3) {
        break;
      }
    }
  }

  if (!selected.some((option) => option.isCorrect) && selected[0]) {
    selected[0].isCorrect = true;
  }

  return selected.slice(0, 3).map((option, index) => ({
    ...option,
    label: LETTERS[index] ?? `${index + 1}`,
  }));
}

function normalizeQuestion(row: QuestionRow, options: OptionRow[]): QuizQuestion | null {
  const prompt = asText(row.prompt, asText(row.question));

  if (!prompt) {
    return null;
  }

  const mappedOptions = options
    .map((option, index) => ({
      id: asId(option.id),
      label: asText(option.label, LETTERS[index] ?? `${index + 1}`),
      text: asText(option.text, asText(option.option_text, asText(option.content))),
      isCorrect: Boolean(option.is_correct),
    }))
    .filter((option) => option.text.length > 0);

  const threeOptions = constrainToThreeOptions(mappedOptions);

  if (threeOptions.length < 3) {
    return null;
  }

  return {
    id: asId(row.id),
    mode: asText(row.mode, "reactions"),
    category: asText(row.category, "Reakcje"),
    prompt,
    explanation: asText(row.explanation, "Sprawdz wzorzec wypowiedzi i dobierz naturalna reakcje."),
    patternTip: asText(row.pattern_tip),
    warningTip: asText(row.warning_tip),
    options: threeOptions,
  };
}

function normalizeQuestionFromExerciseRow(row: ExerciseRow): QuizQuestion | null {
  const payload = asRecord(row.payload);
  const hasPayloadFields = Boolean(payload && Object.keys(payload).length > 0);
  const base: Record<string, unknown> = hasPayloadFields && payload ? payload : row;

  const taskType = asText(base.task_type, asText(row.task_type));

  if (taskType !== "single_choice_short" && taskType !== "reading_mc") {
    return null;
  }

  const content = asRecord(base.content);
  const correctAnswer = asRecord(base.correct_answer);
  const explanation = asRecord(base.explanation);
  const analytics = asRecord(base.analytics);

  const correctOptionId = asText(correctAnswer?.option_id);

  const optionEntriesRaw = parseJsonLike(content?.options);
  const optionEntries = Array.isArray(optionEntriesRaw) ? optionEntriesRaw : [];
  const mappedOptions = optionEntries
    .map((entry, index) => {
      const option = asRecord(entry);

      if (!option) {
        return null;
      }

      const id = asText(option.id, ["A", "B", "C"][index] ?? `${index + 1}`);
      const text = asText(option.text);

      if (!id || !text) {
        return null;
      }

      return {
        id,
        label: ["A", "B", "C"][index] ?? id,
        text,
        isCorrect: id === correctOptionId,
      };
    })
    .filter((item): item is { id: string; label: string; text: string; isCorrect: boolean } => Boolean(item));

  const options = constrainToThreeOptions(mappedOptions);

  if (options.length !== 3) {
    return null;
  }

  const prompt =
    taskType === "single_choice_short"
      ? asText(content?.prompt, asText(base.prompt, asText(base.question)))
      : [
          asText(content?.title),
          asText(content?.passage),
          asText(content?.question) ? `Pytanie: ${asText(content?.question)}` : "",
        ]
          .filter((part) => part.length > 0)
          .join("\n\n");

  if (!prompt) {
    return null;
  }

  const categoryValue = asText(base.category, asText(row.category, "reactions"));

  return {
    id: asText(base.id, asText(row.id)),
    mode: categoryValue || "reactions",
    category: asText(analytics?.focus_label, categoryValue || "Reakcje"),
    prompt,
    explanation: asText(explanation?.why, "Sprawdz wzorzec wypowiedzi i dobierz naturalna reakcje."),
    patternTip: asText(explanation?.pattern),
    warningTip: asText(explanation?.watch_out),
    options,
  };
}

async function fetchQuestionsFromExercises(params: {
  supabase: SupabaseClient;
  mode: string;
  count: number;
  includeDraft?: boolean;
}): Promise<QuizQuestion[]> {
  const { supabase, mode } = params;
  const count = clampQuestionCount(params.count);
  const includeDraft = params.includeDraft === true;

  const result = await (includeDraft
    ? supabase
        .from("quiz_exercises")
        .select("*")
        .in("status", ["active", "draft"])
        .eq("category", mode)
        .limit(count)
    : supabase
        .from("quiz_exercises")
        .select("*")
        .eq("status", "active")
        .eq("category", mode)
        .limit(count));

  if (result.error || !result.data || result.data.length === 0) {
    return [];
  }

  return (result.data as ExerciseRow[])
    .map((row) => normalizeQuestionFromExerciseRow(row))
    .filter((question): question is QuizQuestion => Boolean(question))
    .slice(0, count);
}

function normalizeExerciseIds(rawIds: string[]): string[] {
  return rawIds
    .map((value) => value.trim())
    .filter((value, index, list) => value.length > 0 && list.indexOf(value) === index);
}

export async function fetchQuestionsForExerciseIds(params: {
  supabase: SupabaseClient;
  exerciseIds: string[];
  count?: number;
  includeDraft?: boolean;
}): Promise<QuizQuestion[]> {
  const { supabase } = params;
  const includeDraft = params.includeDraft === true;
  const normalizedIds = normalizeExerciseIds(params.exerciseIds ?? []);

  if (normalizedIds.length === 0) {
    return [];
  }

  const requestedCount = Number.isFinite(params.count)
    ? Math.max(1, Math.round(params.count ?? normalizedIds.length))
    : normalizedIds.length;
  const limit = Math.min(normalizedIds.length, requestedCount);
  const selectedIds = normalizedIds.slice(0, limit);

  const result = await (includeDraft
    ? supabase
        .from("quiz_exercises")
        .select("*")
        .in("id", selectedIds)
        .in("status", ["active", "draft"])
    : supabase
        .from("quiz_exercises")
        .select("*")
        .in("id", selectedIds)
        .eq("status", "active"));

  if (result.error || !result.data || result.data.length === 0) {
    return [];
  }

  const byId = new Map<string, ExerciseRow>();

  for (const row of result.data as ExerciseRow[]) {
    const rowId = asId(row.id);

    if (!rowId) {
      continue;
    }

    byId.set(rowId, row);
  }

  const normalized = selectedIds
    .map((exerciseId) => {
      const row = byId.get(exerciseId);
      return row ? normalizeQuestionFromExerciseRow(row) : null;
    })
    .filter((question): question is QuizQuestion => Boolean(question))
    .slice(0, limit);

  return normalized;
}

export function clampQuestionCount(value: number): number {
  return Math.min(10, Math.max(5, value));
}

export async function fetchQuestionsForMode(params: {
  supabase: SupabaseClient;
  mode: string;
  count: number;
  includeDraft?: boolean;
}): Promise<QuizQuestion[]> {
  const { supabase, mode } = params;
  const count = clampQuestionCount(params.count);
  const includeDraft = params.includeDraft === true;

  const exerciseQuestions = await fetchQuestionsFromExercises({
    supabase,
    mode,
    count,
    includeDraft,
  });

  if (exerciseQuestions.length >= 5) {
    return exerciseQuestions.slice(0, count);
  }

  const questionsResult = await supabase
    .from("quiz_questions")
    .select(QUESTION_SELECT)
    .eq("mode", mode)
    .limit(count);

  if (questionsResult.error || !questionsResult.data || questionsResult.data.length === 0) {
    return [];
  }

  const questionRows = (questionsResult.data as QuestionRow[]).slice(0, count);
  const questionIds = questionRows.map((row) => asId(row.id));
  const optionsResult = await supabase.from("quiz_options").select(OPTION_SELECT).in("question_id", questionIds);

  if (optionsResult.error || !optionsResult.data) {
    return [];
  }

  const optionRows = optionsResult.data as OptionRow[];

  const normalized = questionRows
    .map((questionRow) => {
      const options = optionRows.filter((option) => asId(option.question_id) === asId(questionRow.id));
      return normalizeQuestion(questionRow, options);
    })
    .filter((question): question is QuizQuestion => question !== null)
    .slice(0, count);

  return normalized.length >= 5 ? normalized : [];
}

export async function fetchSessionAnswers(params: {
  supabase: SupabaseClient;
  sessionId: string;
}): Promise<QuizAnswerSnapshot[]> {
  const { supabase, sessionId } = params;

  const result = await supabase
    .from("quiz_session_answers")
    .select("question_id, option_id, selected_option_id, is_correct")
    .eq("session_id", sessionId);

  if (result.error || !result.data) {
    return [];
  }

  return (result.data as AnswerRow[])
    .map((row) => {
      const questionId = row.question_id ? asId(row.question_id) : "";
      const selectedOptionId = row.option_id
        ? asId(row.option_id)
        : row.selected_option_id
          ? asId(row.selected_option_id)
          : "";

      if (!questionId || !selectedOptionId) {
        return null;
      }

      return {
        questionId,
        selectedOptionId,
        isCorrect: Boolean(row.is_correct),
      };
    })
    .filter((answer): answer is QuizAnswerSnapshot => answer !== null);
}

export function buildSummary(params: {
  questions: QuizQuestion[];
  answers: QuizAnswerSnapshot[];
}): {
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  strongestArea?: string;
  weakestArea?: string;
} {
  const { questions, answers } = params;
  const totalQuestions = questions.length;
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));

  let correctAnswers = 0;
  const areaStats: Record<string, { total: number; correct: number }> = {};

  for (const question of questions) {
    const area = question.category || "Reakcje";
    const current = areaStats[area] ?? { total: 0, correct: 0 };
    current.total += 1;

    const answer = answerMap.get(question.id);

    if (answer?.isCorrect) {
      correctAnswers += 1;
      current.correct += 1;
    }

    areaStats[area] = current;
  }

  const scorePercent = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const ranked = Object.entries(areaStats)
    .map(([area, stats]) => ({
      area,
      ratio: stats.total > 0 ? stats.correct / stats.total : 0,
      total: stats.total,
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.ratio - a.ratio);

  return {
    totalQuestions,
    correctAnswers,
    scorePercent,
    strongestArea: ranked[0]?.area,
    weakestArea: ranked[ranked.length - 1]?.area,
  };
}
