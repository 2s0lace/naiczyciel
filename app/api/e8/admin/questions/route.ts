import { NextResponse } from "next/server";
import { resolveRoleFromRequest } from "@/lib/auth/server-role";
import { listAdminExercises } from "@/lib/quiz/admin-store";
import {
  EXERCISE_CATEGORIES,
  EXERCISE_DIFFICULTIES,
  EXERCISE_STATUSES,
  EXERCISE_TASK_TYPES,
  applyExerciseFilters,
  type ExerciseCategory,
  type ExerciseDifficulty,
  type ExerciseListFilters,
  type ExerciseStatus,
  type ExerciseTaskType,
  type UniversalExerciseRecord,
  validateExerciseRecord,
} from "@/lib/quiz/admin-exercise";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type AdminSource = "supabase" | "local" | "mixed";

type SupabaseExerciseRow = Record<string, unknown>;

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
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

function asCategory(value: string | null): ExerciseCategory | "all" {
  if (!value || value === "all") {
    return "all";
  }

  return (EXERCISE_CATEGORIES as readonly string[]).includes(value) ? (value as ExerciseCategory) : "all";
}

function asTaskType(value: string | null): ExerciseTaskType | "all" {
  if (!value || value === "all") {
    return "all";
  }

  return (EXERCISE_TASK_TYPES as readonly string[]).includes(value) ? (value as ExerciseTaskType) : "all";
}

function asStatus(value: string | null): ExerciseStatus | "all" {
  if (!value || value === "all") {
    return "all";
  }

  return (EXERCISE_STATUSES as readonly string[]).includes(value) ? (value as ExerciseStatus) : "all";
}

function asDifficulty(value: string | null): ExerciseDifficulty | "all" {
  if (!value || value === "all") {
    return "all";
  }

  return (EXERCISE_DIFFICULTIES as readonly string[]).includes(value) ? (value as ExerciseDifficulty) : "all";
}

function parseFilters(url: URL): ExerciseListFilters {
  const category = asCategory(url.searchParams.get("category"));
  const taskType = asTaskType(url.searchParams.get("task_type"));
  const status = asStatus(url.searchParams.get("status"));
  const difficulty = asDifficulty(url.searchParams.get("difficulty"));
  const rawLimit = Number(url.searchParams.get("limit") ?? "120");
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(500, rawLimit)) : 120;

  return {
    category,
    task_type: taskType,
    status,
    difficulty,
    limit,
  };
}

function isUnfiltered(filters: ExerciseListFilters): boolean {
  return (
    (!filters.category || filters.category === "all") &&
    (!filters.task_type || filters.task_type === "all") &&
    (!filters.status || filters.status === "all") &&
    (!filters.difficulty || filters.difficulty === "all")
  );
}

function shouldUseServiceRoleForAdmin() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function createAdminSupabaseClient(accessToken: string | null) {
  if (shouldUseServiceRoleForAdmin()) {
    return getSupabaseServerClient();
  }

  return getSupabaseServerClient(accessToken);
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

  return { ok: true as const, accessToken: auth.accessToken };
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

  const id = asText(candidate.id);
  const category = asText(candidate.category);
  const taskType = asText(candidate.task_type);
  const status = asText(candidate.status);

  if (!id || !category || !taskType || !status) {
    return null;
  }

  const fallback = validateExerciseRecord({
    ...candidate,
    id,
    category,
    task_type: taskType,
    status,
    difficulty: asText(candidate.difficulty, "easy"),
    tags: asStringArray(candidate.tags),
    source: asText(candidate.source, "internal"),
    is_public: typeof candidate.is_public === "boolean" ? candidate.is_public : true,
    title: asText(candidate.title),
    instruction: asText(candidate.instruction, "Choose the best answer."),
    content: asRecord(candidate.content) ?? {},
    correct_answer: asRecord(candidate.correct_answer) ?? {},
    explanation:
      asRecord(candidate.explanation) ??
      ({ why: "Brak wyjasnienia.", pattern: "Brak wzorca.", watch_out: "Brak uwagi." } as Record<string, unknown>),
    hint: asRecord(candidate.hint) ?? ({ short: "Brak podpowiedzi." } as Record<string, unknown>),
    analytics: asRecord(candidate.analytics) ?? ({ focus_label: category, skill: "general" } as Record<string, unknown>),
    meta:
      asRecord(candidate.meta) ??
      ({
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>),
  });

  if (fallback.isValid && fallback.exercise) {
    return fallback.exercise;
  }

  return null;
}

function toSupabaseRow(exercise: UniversalExerciseRecord) {
  return {
    id: exercise.id,
    status: exercise.status,
    category: exercise.category,
    task_type: exercise.task_type,
    difficulty: exercise.difficulty,
    tags: exercise.tags,
    source: exercise.source,
    is_public: exercise.is_public,
    title: exercise.title,
    instruction: exercise.instruction,
    content: exercise.content,
    correct_answer: exercise.correct_answer,
    explanation: exercise.explanation,
    hint: exercise.hint,
    analytics: exercise.analytics,
    meta: exercise.meta,
    created_at: exercise.meta.created_at,
    updated_at: exercise.meta.updated_at,
    payload: exercise,
  };
}

async function listFromSupabase(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  filters: ExerciseListFilters,
): Promise<UniversalExerciseRecord[]> {
  let query = supabase.from("quiz_exercises").select("*");

  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  if (filters.task_type && filters.task_type !== "all") {
    query = query.eq("task_type", filters.task_type);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.difficulty && filters.difficulty !== "all") {
    query = query.eq("difficulty", filters.difficulty);
  }

  const limit = Number.isFinite(filters.limit) ? Number(filters.limit) : 120;
  const result = await query.limit(limit);

  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Supabase list failed");
  }

  const parsed = (result.data as SupabaseExerciseRow[])
    .map((row) => normalizeSupabaseRow(row))
    .filter((item): item is UniversalExerciseRecord => Boolean(item));

  return applyExerciseFilters(parsed, filters);
}

async function createInSupabase(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  exercise: UniversalExerciseRecord,
): Promise<UniversalExerciseRecord> {
  const row = toSupabaseRow(exercise);

  const result = await supabase.from("quiz_exercises").insert(row).select("*").single();

  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Supabase insert failed");
  }

  const parsed = normalizeSupabaseRow(result.data as SupabaseExerciseRow);

  if (!parsed) {
    throw new Error("Could not normalize inserted exercise.");
  }

  return parsed;
}

async function upsertManyInSupabase(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  exercises: UniversalExerciseRecord[],
): Promise<UniversalExerciseRecord[]> {
  const rows = exercises.map((exercise) => toSupabaseRow(exercise));

  const result = await supabase
    .from("quiz_exercises")
    .upsert(rows, { onConflict: "id" })
    .select("*");

  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Supabase bulk upsert failed");
  }

  const normalized = (result.data as SupabaseExerciseRow[])
    .map((row) => normalizeSupabaseRow(row))
    .filter((item): item is UniversalExerciseRecord => Boolean(item));

  const byId = new Map(normalized.map((item) => [item.id, item]));
  return exercises.map((exercise) => byId.get(exercise.id) ?? exercise);
}

async function updateInSupabase(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  id: string,
  exercise: UniversalExerciseRecord,
): Promise<UniversalExerciseRecord> {
  const row = toSupabaseRow({ ...exercise, id });

  const result = await supabase.from("quiz_exercises").update(row).eq("id", id).select("*").single();

  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Supabase update failed");
  }

  const parsed = normalizeSupabaseRow(result.data as SupabaseExerciseRow);

  if (!parsed) {
    throw new Error("Could not normalize updated exercise.");
  }

  return parsed;
}

async function deactivateInSupabase(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  id: string,
): Promise<UniversalExerciseRecord> {
  const now = new Date().toISOString();
  const result = await supabase
    .from("quiz_exercises")
    .update({
      status: "archived",
      updated_at: now,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Supabase deactivate failed");
  }

  const parsed = normalizeSupabaseRow(result.data as SupabaseExerciseRow);

  if (!parsed) {
    throw new Error("Could not normalize archived exercise.");
  }

  return parsed;
}

async function hardDeleteInSupabase(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  ids: string[],
): Promise<number> {
  const uniqueIds = ids.filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index);

  if (uniqueIds.length === 0) {
    return 0;
  }

  const result = await supabase
    .from("quiz_exercises")
    .delete()
    .in("id", uniqueIds)
    .select("id");

  if (result.error) {
    throw new Error(result.error.message ?? "Supabase hard delete failed");
  }

  return Array.isArray(result.data) ? result.data.length : 0;
}

export async function GET(request: Request) {
  const authGuard = await requireAdmin(request);

  if (!authGuard.ok) {
    return authGuard.response;
  }

  const filters = parseFilters(new URL(request.url));

  let supabase: ReturnType<typeof getSupabaseServerClient>;

  try {
    supabase = createAdminSupabaseClient(authGuard.accessToken);
  } catch (error) {
    const fallbackExercises = listAdminExercises(filters);
    const message = error instanceof Error ? error.message : "Brak konfiguracji Supabase na serwerze.";

    return NextResponse.json(
      {
        error: "Nie mozna nawiazac polaczenia z Supabase.",
        details: [message],
        source: "local" satisfies AdminSource,
        exercises: fallbackExercises,
      },
      { status: 500 },
    );
  }

  try {
    let exercises = await listFromSupabase(supabase, filters);

    if (exercises.length === 0 && isUnfiltered(filters)) {
      try {
        const alternateClient = shouldUseServiceRoleForAdmin()
          ? getSupabaseServerClient(authGuard.accessToken)
          : getSupabaseServerClient();
        const alternateExercises = await listFromSupabase(alternateClient, filters);

        if (alternateExercises.length > 0) {
          exercises = alternateExercises;
        }
      } catch {
        // Keep primary result if fallback mode fails.
      }
    }

    return NextResponse.json({
      source: "supabase" satisfies AdminSource,
      exercises,
    });
  } catch (error) {
    const fallbackExercises = listAdminExercises(filters);
    const message = error instanceof Error ? error.message : "Nie udalo sie pobrac cwiczen z bazy.";

    return NextResponse.json(
      {
        error: "Nie udalo sie pobrac cwiczen z Supabase.",
        details: [message],
        source: "local" satisfies AdminSource,
        exercises: fallbackExercises,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authGuard = await requireAdmin(request);

  if (!authGuard.ok) {
    return authGuard.response;
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const rawExercise = body.exercise ?? body;
  const validated = validateExerciseRecord(rawExercise);

  if (!validated.isValid || !validated.exercise) {
    return NextResponse.json({ error: "Validation failed.", details: validated.errors }, { status: 400 });
  }

  let supabase: ReturnType<typeof getSupabaseServerClient>;

  try {
    supabase = createAdminSupabaseClient(authGuard.accessToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Brak konfiguracji Supabase na serwerze.";
    return NextResponse.json({ error: "Nie mozna nawiazac polaczenia z Supabase.", details: [message] }, { status: 500 });
  }

  try {
    const exercise = await createInSupabase(supabase, validated.exercise);

    return NextResponse.json({
      source: "supabase" satisfies AdminSource,
      exercise,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase create failed";

    return NextResponse.json(
      {
        error: "Nie udalo sie zapisac cwiczenia w Supabase.",
        details: [message],
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const authGuard = await requireAdmin(request);

  if (!authGuard.ok) {
    return authGuard.response;
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const rawMany = Array.isArray(body.exercises)
    ? body.exercises
    : Array.isArray(body.questions)
      ? body.questions
      : null;

  let supabase: ReturnType<typeof getSupabaseServerClient>;

  try {
    supabase = createAdminSupabaseClient(authGuard.accessToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Brak konfiguracji Supabase na serwerze.";
    return NextResponse.json({ error: "Nie mozna nawiazac polaczenia z Supabase.", details: [message] }, { status: 500 });
  }

  if (rawMany && rawMany.length > 0) {
    const normalized = rawMany
      .map((entry) => validateExerciseRecord(entry))
      .filter((entry) => entry.isValid && entry.exercise)
      .map((entry) => entry.exercise as UniversalExerciseRecord);

    if (normalized.length === 0) {
      return NextResponse.json({ error: "No valid exercises in import payload." }, { status: 400 });
    }

    try {
      const imported = await upsertManyInSupabase(supabase, normalized);

      return NextResponse.json({
        source: "supabase" satisfies AdminSource,
        createdCount: imported.length,
        exercises: imported,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Supabase import failed";

      return NextResponse.json(
        {
          error: "Nie udalo sie zaimportowac rekordow do Supabase.",
          details: [message],
        },
        { status: 500 },
      );
    }
  }

  const id = asText(body.id);
  const rawExercise = body.exercise;

  if (!id || !rawExercise) {
    return NextResponse.json({ error: "id and exercise are required for update." }, { status: 400 });
  }

  const validated = validateExerciseRecord(rawExercise);

  if (!validated.isValid || !validated.exercise) {
    return NextResponse.json({ error: "Validation failed.", details: validated.errors }, { status: 400 });
  }

  try {
    const exercise = await updateInSupabase(supabase, id, validated.exercise);

    return NextResponse.json({
      source: "supabase" satisfies AdminSource,
      exercise,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase update failed";

    return NextResponse.json(
      {
        error: "Nie udalo sie zaktualizowac cwiczenia w Supabase.",
        details: [message],
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const authGuard = await requireAdmin(request);

  if (!authGuard.ok) {
    return authGuard.response;
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = asText(body.id);
  const ids = asStringArray(body.ids);
  const allIds = [...ids, ...(id ? [id] : [])].filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index);

  const hardDelete =
    body.hard === true ||
    asText(body.hard).toLowerCase() === "true" ||
    asText(body.mode).toLowerCase() === "hard";

  if (!hardDelete && !id) {
    return NextResponse.json({ error: "id is required for archive mode." }, { status: 400 });
  }

  if (hardDelete && allIds.length === 0) {
    return NextResponse.json({ error: "id or ids are required for hard delete." }, { status: 400 });
  }

  let supabase: ReturnType<typeof getSupabaseServerClient>;

  try {
    supabase = createAdminSupabaseClient(authGuard.accessToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Brak konfiguracji Supabase na serwerze.";
    return NextResponse.json({ error: "Nie mozna nawiazac polaczenia z Supabase.", details: [message] }, { status: 500 });
  }

  try {
    if (hardDelete) {
      const deletedCount = await hardDeleteInSupabase(supabase, allIds);

      return NextResponse.json({
        source: "supabase" satisfies AdminSource,
        deletedCount,
        deletedIds: allIds,
      });
    }

    const exercise = await deactivateInSupabase(supabase, id);

    return NextResponse.json({
      source: "supabase" satisfies AdminSource,
      exercise,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : hardDelete ? "Supabase hard delete failed" : "Supabase deactivate failed";

    return NextResponse.json(
      {
        error: hardDelete ? "Nie udalo sie usunac cwiczen w Supabase." : "Nie udalo sie zdezaktywowac cwiczenia w Supabase.",
        details: [message],
      },
      { status: 500 },
    );
  }
}


