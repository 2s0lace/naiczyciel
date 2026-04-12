import type { SupabaseClient } from "@supabase/supabase-js";
import { validateExerciseRecord, type UniversalExerciseRecord } from "@/lib/quiz/admin-exercise";
import type { CategoryBreakdownItem, QuizAnswerSnapshot, QuizQuestion, QuizQuestionItem, QuizOption } from "@/lib/quiz/types";

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

type ExerciseCandidateRow = {
  id?: string | number | null;
  category?: string | null;
  status?: string | null;
  task_type?: string | null;
  analytics?: unknown;
  grammar?: unknown;
  vocabulary?: unknown;
};

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

function buildQuizOptions(params: {
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
}): QuizOption[] {
  return constrainToThreeOptions(
    params.options.map((option, index) => ({
      id: option.id,
      label: LETTERS[index] ?? option.id,
      text: option.text,
      isCorrect: option.id === params.correctOptionId,
    })),
  );
}

function buildQuestionItems(params: {
  exerciseId: string;
  items: Array<{
    id: string;
    prompt: string;
    options: Array<{ id: string; text: string }>;
    correctOptionId: string;
  }>;
}): QuizQuestionItem[] {
  return params.items
    .map((item, index) => {
      const options = buildQuizOptions({
        options: item.options,
        correctOptionId: item.correctOptionId,
      });

      if (!item.prompt || options.length !== 3) {
        return null;
      }

      return {
        id: `${params.exerciseId}::${item.id || index + 1}`,
        prompt: item.prompt,
        options,
      } satisfies QuizQuestionItem;
    })
    .filter((item): item is QuizQuestionItem => Boolean(item));
}

function countAnswerableItems(question: QuizQuestion): number {
  if (question.type === "single_question") {
    return 1;
  }

  return question.questions.length;
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
    type: "single_question",
    mode: asText(row.mode, "reactions"),
    category: asText(row.category, "Reakcje"),
    prompt,
    explanation: asText(row.explanation, "Sprawdz wzorzec wypowiedzi i dobierz naturalna reakcje."),
    hintText: "",
    patternTip: asText(row.pattern_tip),
    warningTip: asText(row.warning_tip),
    options: threeOptions,
  };
}

function normalizeQuestionFromExerciseRow(row: ExerciseRow): QuizQuestion | null {
  const exercise = normalizeExerciseRowForValidation(row);

  if (!exercise) {
    return null;
  }

  const baseQuestion = {
    id: exercise.id,
    mode: exercise.category,
    category: exercise.analytics.focus_label.trim() || exercise.category || "Reakcje",
    explanation: exercise.explanation.why.trim() || "Sprawdz wzorzec wypowiedzi i dobierz naturalna reakcje.",
    hintText: exercise.hint.short.trim(),
    patternTip: exercise.explanation.pattern.trim(),
    warningTip: exercise.explanation.watch_out.trim(),
  };

  if (exercise.task_type === "single_choice_short") {
    const options = buildQuizOptions({
      options: exercise.content.options,
      correctOptionId: exercise.correct_answer.option_id,
    });

    if (options.length !== 3 || !exercise.content.prompt.trim()) {
      return null;
    }

    return {
      ...baseQuestion,
      type: "single_question",
      prompt: exercise.content.prompt.trim(),
      options,
    };
  }

  if (exercise.task_type === "reading_mc") {
    const promptEn = exercise.content.prompt_en?.trim() || "";
    const promptPl = exercise.content.prompt_pl?.trim() || "";
    const resolvedPassage = promptEn || exercise.content.passage.trim();
    const modernQuestions =
      Array.isArray(exercise.content.questions) && exercise.content.questions.length > 0
        ? buildQuestionItems({
            exerciseId: exercise.id,
            items: exercise.content.questions.map((question) => ({
              id: question.id,
              prompt: question.question,
              options: question.options,
              correctOptionId:
                exercise.correct_answer.questions?.find((answer) => answer.id === question.id)?.option_id ?? "",
            })),
          })
        : buildQuestionItems({
            exerciseId: exercise.id,
            items: [
              {
                id: "1",
                prompt: exercise.content.question ?? "",
                options: exercise.content.options ?? [],
                correctOptionId: exercise.correct_answer.option_id ?? "",
              },
            ],
          });

    if (!resolvedPassage || modernQuestions.length === 0) {
      return null;
    }

    return {
      ...baseQuestion,
      type: "reading_mc",
      title: exercise.content.title?.trim() || undefined,
      passage: resolvedPassage,
      passageTranslation: promptPl || undefined,
      questions: modernQuestions,
    };
  }

  if (exercise.task_type === "gap_fill_text") {
    const promptEn = exercise.content.prompt_en?.trim() || "";
    const promptPl = exercise.content.prompt_pl?.trim() || "";
    const resolvedPassage = promptEn || exercise.content.text.trim();
    const groupedQuestions = buildQuestionItems({
      exerciseId: exercise.id,
      items: (exercise.content.questions ?? []).map((question) => ({
        id: question.id,
        prompt: question.question,
        options: question.options,
        correctOptionId:
          exercise.correct_answer.questions?.find((answer) => answer.id === question.id)?.option_id ?? "",
      })),
    });

    if (!resolvedPassage || groupedQuestions.length === 0) {
      return null;
    }

    return {
      ...baseQuestion,
      type: "gap_fill_text",
      title: exercise.content.title?.trim() || undefined,
      passage: resolvedPassage,
      passageTranslation: promptPl || undefined,
      questions: groupedQuestions,
    };
  }

  return null;
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

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seed: string) {
  let state = hashSeed(seed) || 1;

  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffleIds(ids: string[], seed?: string): string[] {
  const next = [...ids];
  const random = seed ? createSeededRandom(seed) : Math.random;

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex] ?? current;
    next[swapIndex] = current;
  }

  return next;
}

function normalizeModes(rawModes: string[]): string[] {
  return rawModes
    .map((value) => asText(value).toLowerCase())
    .filter((value, index, list) => value.length > 0 && list.indexOf(value) === index);
}

function normalizeFocusLabel(value: unknown): string {
  return asText(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isSupportedTaskType(value: unknown): boolean {
  return value === "single_choice_short" || value === "reading_mc" || value === "gap_fill_text";
}

export async function fetchAdaptiveQuestions(params: {
  supabase: SupabaseClient;
  userId?: string | null;
  modes: string[];
  count: number;
  includeDraft?: boolean;
  excludeSessionId?: string;
  shuffleSeed?: string;
  focusLabel?: string | null;
  focusSource?: string | null;
  focusRaw?: string | null;
}): Promise<QuizQuestion[]> {
  const { supabase } = params;
  const count = clampQuestionCount(params.count);
  const includeDraft = params.includeDraft === true;
  const normalizedModes = normalizeModes(params.modes);
  const normalizedFocusLabel = normalizeFocusLabel(params.focusLabel);
  const normalizedFocusRaw = normalizeFocusLabel(params.focusRaw);
  const normalizedFocusSource =
    params.focusSource === "grammar" || params.focusSource === "vocabulary" || params.focusSource === "skill"
      ? params.focusSource
      : null;

  let exerciseQuery = includeDraft
    ? supabase.from("quiz_exercises").select("id, category, status, task_type, analytics, grammar, vocabulary").in("status", ["active", "draft"])
    : supabase.from("quiz_exercises").select("id, category, status, task_type, analytics, grammar, vocabulary").eq("status", "active");

  if (normalizedModes.length > 0) {
    exerciseQuery = exerciseQuery.in("category", normalizedModes);
  }

  const exerciseResult = await exerciseQuery.limit(5000);

  if (exerciseResult.error || !Array.isArray(exerciseResult.data) || exerciseResult.data.length === 0) {
    return [];
  }

  const baseCandidateRows = (exerciseResult.data as ExerciseCandidateRow[]).filter(
    (row) => asId(row.id).length > 0 && isSupportedTaskType(row.task_type),
  );

  const focusMatchedRows = normalizedFocusLabel
    ? baseCandidateRows.filter((row) => {
        const analytics = parseJsonLike(row.analytics) as Record<string, unknown> | null;
        const focusLabel = normalizeFocusLabel(analytics?.focus_label);

        if (!focusLabel) {
          return false;
        }

        return (
          focusLabel === normalizedFocusLabel ||
          focusLabel.includes(normalizedFocusLabel) ||
          normalizedFocusLabel.includes(focusLabel)
        );
      })
    : baseCandidateRows;

  const sourceMatchedRows =
    normalizedFocusRaw && normalizedFocusSource
      ? baseCandidateRows.filter((row) => {
          if (normalizedFocusSource === "skill") {
            const analytics = parseJsonLike(row.analytics) as Record<string, unknown> | null;
            return normalizeFocusLabel(analytics?.skill) === normalizedFocusRaw;
          }

          if (normalizedFocusSource === "vocabulary") {
            const vocabulary = parseJsonLike(row.vocabulary) as Record<string, unknown> | null;
            return normalizeFocusLabel(vocabulary?.topic) === normalizedFocusRaw;
          }

          const grammar = parseJsonLike(row.grammar) as Record<string, unknown> | null;
          const structures = Array.isArray(grammar?.structures) ? grammar?.structures : [];
          return structures.some((item) => normalizeFocusLabel(item) === normalizedFocusRaw);
        })
      : [];

  const sourceMatchedIds = sourceMatchedRows.map((row) => asId(row.id));
  const focusMatchedIds = focusMatchedRows
    .map((row) => asId(row.id))
    .filter((id) => !sourceMatchedIds.includes(id));
  const baseFallbackIds = baseCandidateRows
    .map((row) => asId(row.id))
    .filter((id) => !sourceMatchedIds.includes(id) && !focusMatchedIds.includes(id));
  const allCandidateIds = [...sourceMatchedIds, ...focusMatchedIds, ...baseFallbackIds];

  if (allCandidateIds.length === 0) {
    return [];
  }

  let answeredQuestionIds = new Set<string>();
  let solvedQuestionIds = new Set<string>();

  if (params.userId) {
    const sessionResult = await supabase.from("quiz_sessions").select("id").eq("user_id", params.userId).limit(5000);

    if (!sessionResult.error && Array.isArray(sessionResult.data) && sessionResult.data.length > 0) {
      const historicalSessionIds = sessionResult.data
        .map((row) => asRecord(row))
        .map((row) => asId(row?.id))
        .filter((id) => id.length > 0 && id !== params.excludeSessionId);

      if (historicalSessionIds.length > 0) {
        const answersResult = await supabase
          .from("quiz_session_answers")
          .select("question_id, is_correct")
          .in("session_id", historicalSessionIds)
          .limit(10000);

        if (!answersResult.error && Array.isArray(answersResult.data)) {
          answeredQuestionIds = new Set(
            answersResult.data
              .map((row) => asRecord(row))
              .map((row) => {
                const questionId = asId(row?.question_id);
                return questionId.includes("::") ? questionId.split("::")[0] ?? questionId : questionId;
              })
              .filter((id) => id.length > 0),
          );

          solvedQuestionIds = new Set(
            answersResult.data
              .map((row) => asRecord(row))
              .filter((row) => row?.is_correct === true)
              .map((row) => {
                const questionId = asId(row?.question_id);
                return questionId.includes("::") ? questionId.split("::")[0] ?? questionId : questionId;
              })
              .filter((id) => id.length > 0),
          );
        }
      }
    }
  }

  const seedBase = params.shuffleSeed ?? params.excludeSessionId ?? "adaptive-session";
  const sourceUnseenIds = sourceMatchedIds.filter((id) => !answeredQuestionIds.has(id));
  const sourceUnresolvedIds = sourceMatchedIds.filter((id) => answeredQuestionIds.has(id) && !solvedQuestionIds.has(id));
  const sourceResolvedIds = sourceMatchedIds.filter((id) => solvedQuestionIds.has(id));
  const focusUnseenIds = focusMatchedIds.filter((id) => !answeredQuestionIds.has(id));
  const focusUnresolvedIds = focusMatchedIds.filter((id) => answeredQuestionIds.has(id) && !solvedQuestionIds.has(id));
  const focusResolvedIds = focusMatchedIds.filter((id) => solvedQuestionIds.has(id));
  const baseUnseenIds = baseFallbackIds.filter((id) => !answeredQuestionIds.has(id));
  const baseUnresolvedIds = baseFallbackIds.filter((id) => answeredQuestionIds.has(id) && !solvedQuestionIds.has(id));
  const baseResolvedIds = baseFallbackIds.filter((id) => solvedQuestionIds.has(id));
  const prioritizedIds = [
    ...shuffleIds(sourceUnseenIds, `${seedBase}:source-unseen`),
    ...shuffleIds(focusUnseenIds, `${seedBase}:focus-unseen`),
    ...shuffleIds(baseUnseenIds, `${seedBase}:base-unseen`),
    ...shuffleIds(sourceUnresolvedIds, `${seedBase}:source-unresolved`),
    ...shuffleIds(focusUnresolvedIds, `${seedBase}:focus-unresolved`),
    ...shuffleIds(baseUnresolvedIds, `${seedBase}:base-unresolved`),
    ...shuffleIds(sourceResolvedIds, `${seedBase}:source-resolved`),
    ...shuffleIds(focusResolvedIds, `${seedBase}:focus-resolved`),
    ...shuffleIds(baseResolvedIds, `${seedBase}:base-resolved`),
  ];

  return fetchQuestionsForExerciseIds({
    supabase,
    exerciseIds: prioritizedIds,
    count,
    includeDraft,
  });
}

export async function fetchQuestionsForExerciseIds(params: {
  supabase: SupabaseClient;
  exerciseIds: string[];
  count?: number;
  includeDraft?: boolean;
  shuffleSeed?: string;
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
  const candidateIds = params.shuffleSeed ? shuffleIds(normalizedIds, params.shuffleSeed) : normalizedIds;
  const selectedIds = candidateIds.slice(0, limit);

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
  categoryBreakdown: CategoryBreakdownItem[];
} {
  const { questions, answers } = params;
  const totalQuestions = questions.reduce((sum, question) => sum + countAnswerableItems(question), 0);
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));

  let correctAnswers = 0;
  const areaStats: Record<string, { total: number; correct: number }> = {};

  for (const question of questions) {
    const area = question.category || "Reakcje";
    const current = areaStats[area] ?? { total: 0, correct: 0 };
    const answerableIds =
      question.type === "single_question" ? [question.id] : question.questions.map((item) => item.id);
    current.total += answerableIds.length;

    for (const answerId of answerableIds) {
      const answer = answerMap.get(answerId);

      if (answer?.isCorrect) {
        correctAnswers += 1;
        current.correct += 1;
      }
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

  const categoryBreakdown: CategoryBreakdownItem[] = Object.entries(areaStats).map(([label, stats]) => ({
    label,
    attempts: stats.total,
    correct: stats.correct,
    percent: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null,
    has_data: stats.total > 0,
  }));

  return {
    totalQuestions,
    correctAnswers,
    scorePercent,
    strongestArea: ranked[0]?.area,
    weakestArea: ranked[ranked.length - 1]?.area,
    categoryBreakdown,
  };
}
