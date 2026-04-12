import { NextResponse } from "next/server";
import { resolveRoleFromRequest } from "@/lib/auth/server-role";
import { buildQuizQuestionsFromExercises, toSimulationMode } from "@/lib/quiz/admin-simulation";
import { getAdminExercisesByIds } from "@/lib/quiz/admin-store";
import { createLocalSessionFromQuestions } from "@/lib/quiz/local-store";
import { type UniversalExerciseRecord, validateExerciseRecord } from "@/lib/quiz/admin-exercise";
import { getSupabaseAdminClient, getSupabaseUserClient, getSupabaseServerClient } from "@/lib/supabase/server";

type AdminSource = "supabase" | "local" | "mixed";
type SupabaseExerciseRow = Record<string, unknown>;

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

function asStringArray(value: unknown): string[] {
  const parsed = parseJsonLike(value);

  if (Array.isArray(parsed)) {
    return parsed
      .map((entry) => asText(entry))
      .filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index);
  }

  if (typeof parsed === "string" && parsed.includes(",")) {
    return parsed
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index);
  }

  return [];
}

function shouldUseServiceRoleForAdmin() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function createAdminSupabaseClient(accessToken: string | null) {
  if (shouldUseServiceRoleForAdmin()) {
    return getSupabaseAdminClient();
  }

  if (!accessToken) {
    throw new Error("Brak tokenu dostepu dla admina.");
  }

  return getSupabaseUserClient(accessToken);
}

function toExerciseCandidate(row: SupabaseExerciseRow): Record<string, unknown> {
  const content = parseJsonLike(row.content);
  const correctAnswer = parseJsonLike(row.correct_answer);
  const explanation = parseJsonLike(row.explanation);
  const hint = parseJsonLike(row.hint);
  const analytics = parseJsonLike(row.analytics);
  const metaRecord = asRecord(row.meta);

  return {
    id: asText(row.id),
    status: row.status,
    category: row.category,
    task_type: row.task_type,
    difficulty: row.difficulty,
    tags: asStringArray(row.tags),
    source: row.source,
    is_public: row.is_public,
    title: row.title,
    instruction: row.instruction,
    content,
    correct_answer: correctAnswer,
    explanation,
    hint,
    analytics,
    meta: metaRecord ?? {
      created_at: asText(row.created_at),
      updated_at: asText(row.updated_at),
    },
  };
}

function normalizeSupabaseRow(row: SupabaseExerciseRow): UniversalExerciseRecord | null {
  const payload = asRecord(row.payload);

  if (payload) {
    const payloadValidation = validateExerciseRecord(payload);

    if (payloadValidation.isValid && payloadValidation.exercise) {
      return payloadValidation.exercise;
    }
  }

  const candidate = toExerciseCandidate(row);
  const fallbackValidation = validateExerciseRecord(candidate);

  if (fallbackValidation.isValid && fallbackValidation.exercise) {
    return fallbackValidation.exercise;
  }

  const hasMinimalShape =
    typeof candidate.id === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.task_type === "string" &&
    typeof candidate.status === "string";

  return hasMinimalShape ? (candidate as UniversalExerciseRecord) : null;
}

async function requireAdmin(request: Request) {
  const auth = await resolveRoleFromRequest(request);

  if (!auth.userId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 }),
    };
  }

  if (auth.role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Brak uprawnien." }, { status: 403 }),
    };
  }

  return { ok: true as const, accessToken: auth.accessToken, userId: auth.userId };
}

function parseSelectedIds(body: Record<string, unknown>): string[] {
  const rawIds = Array.isArray(body.exerciseIds)
    ? body.exerciseIds
    : Array.isArray(body.questionIds)
      ? body.questionIds
      : [];

  return Array.from(
    new Set(
      rawIds
        .map((entry) => asText(entry))
        .filter((entry) => entry.length > 0),
    ),
  ).slice(0, 40);
}

async function listSelectedFromSupabase(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  ids: string[],
): Promise<UniversalExerciseRecord[]> {
  const result = await supabase.from("quiz_exercises").select("*").in("id", ids);

  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Supabase list failed");
  }

  const parsed = (result.data as SupabaseExerciseRow[])
    .map((row) => normalizeSupabaseRow(row))
    .filter((item): item is UniversalExerciseRecord => Boolean(item));

  const byId = new Map(parsed.map((item) => [item.id, item]));

  return ids.map((id) => byId.get(id)).filter((item): item is UniversalExerciseRecord => Boolean(item));
}

export async function POST(request: Request) {
  const authGuard = await requireAdmin(request);

  if (!authGuard.ok) {
    return authGuard.response;
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const selectedIds = parseSelectedIds(body);

  if (selectedIds.length === 0) {
    return NextResponse.json({ error: "Wybierz co najmniej jedno pytanie." }, { status: 400 });
  }

  let supabaseSelected: UniversalExerciseRecord[] = [];
  let source: AdminSource = "local";

  try {
    const supabase = createAdminSupabaseClient(authGuard.accessToken);
    supabaseSelected = await listSelectedFromSupabase(supabase, selectedIds);
    source = "supabase";
  } catch {
    supabaseSelected = [];
    source = "local";
  }

  const supabaseById = new Map(supabaseSelected.map((item) => [item.id, item]));
  const localSelected = getAdminExercisesByIds(selectedIds);
  const localById = new Map(localSelected.map((item) => [item.id, item]));

  const selectedExercises = selectedIds
    .map((id) => supabaseById.get(id) ?? localById.get(id))
    .filter((item): item is UniversalExerciseRecord => Boolean(item));

  if (selectedExercises.length === 0) {
    return NextResponse.json({ error: "Nie znaleziono zaznaczonych pytan." }, { status: 404 });
  }

  if (source === "supabase" && selectedExercises.some((exercise) => !supabaseById.has(exercise.id))) {
    source = "mixed";
  }

  const simulation = buildQuizQuestionsFromExercises(selectedExercises);

  if (simulation.questions.length === 0) {
    return NextResponse.json(
      {
        error: "Zaznaczone rekordy nie sa kompatybilne z quizem 1:1.",
        skipped: simulation.skipped,
      },
      { status: 400 },
    );
  }

  const mode = toSimulationMode(selectedExercises);
  const session = createLocalSessionFromQuestions({
    mode,
    questions: simulation.questions,
    ownerUserId: authGuard.ok ? authGuard.userId : null,
  });

  return NextResponse.json({
    sessionId: session.id,
    mode,
    questionCount: session.questionCount,
    selectedCount: selectedExercises.length,
    acceptedCount: simulation.questions.length,
    skipped: simulation.skipped,
    source,
  });
}
