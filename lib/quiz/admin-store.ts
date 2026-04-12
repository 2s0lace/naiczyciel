import { MOCK_REACTIONS_QUESTIONS } from "@/lib/quiz/mock-data";
import {
  applyExerciseFilters,
  createEmptyExercise,
  getExercisePromptPreview,
  type ExerciseListFilters,
  type UniversalExerciseRecord,
} from "@/lib/quiz/admin-exercise";

type GlobalWithExerciseStore = typeof globalThis & {
  __naiczycielAdminExerciseStore?: UniversalExerciseRecord[];
};

function nowIso() {
  return new Date().toISOString();
}

function cloneExercise(exercise: UniversalExerciseRecord): UniversalExerciseRecord {
  return JSON.parse(JSON.stringify(exercise)) as UniversalExerciseRecord;
}

function buildSeedExercises(): UniversalExerciseRecord[] {
  const timestamp = nowIso();

  return MOCK_REACTIONS_QUESTIONS.slice(0, 10).map<UniversalExerciseRecord>((question, index) => {
    const exercise = createEmptyExercise("reactions");

    if (question.type !== "single_question") {
      return exercise;
    }

    return {
      ...exercise,
      id: `seed_reactions_${index + 1}`,
      status: "active",
      difficulty: index < 4 ? "easy" : index < 8 ? "medium" : "hard",
      tags: ["seed", "reactions"],
      source: "internal",
      title: `${question.category} #${index + 1}`,
      instruction: "Choose the best answer.",
      content: {
        prompt: question.prompt,
        options: question.options.slice(0, 3).map((option, optIndex) => ({
          id: ["A", "B", "C"][optIndex] ?? option.label,
          text: option.text,
        })),
      },
      correct_answer: {
        option_id:
          question.options
            .slice(0, 3)
            .map((option, optIndex) => ({ option, id: ["A", "B", "C"][optIndex] ?? option.label }))
            .find((entry) => entry.option.isCorrect)?.id ?? "A",
      },
      explanation: {
        why: question.explanation,
        pattern: question.patternTip ?? "Use a natural functional response.",
        watch_out: question.warningTip ?? "Avoid literal translation from Polish.",
      },
      hint: {
        short: question.warningTip ?? "Think about tone and intent.",
      },
      analytics: {
        focus_label: question.category,
        skill: "functional_language",
      },
      meta: {
        created_at: timestamp,
        updated_at: timestamp,
      },
        } as UniversalExerciseRecord;
  });
}

function getStore() {
  const root = globalThis as GlobalWithExerciseStore;

  if (!root.__naiczycielAdminExerciseStore) {
    root.__naiczycielAdminExerciseStore = buildSeedExercises();
  }

  return root.__naiczycielAdminExerciseStore;
}

export function listAdminExercises(filters: ExerciseListFilters): UniversalExerciseRecord[] {
  const store = getStore();
  return applyExerciseFilters(store, filters).map(cloneExercise);
}

export function getAdminExerciseById(id: string): UniversalExerciseRecord | null {
  const store = getStore();
  const found = store.find((exercise) => exercise.id === id);
  return found ? cloneExercise(found) : null;
}

export function getAdminExercisesByIds(ids: string[]): UniversalExerciseRecord[] {
  const store = getStore();
  const uniqueIds = Array.from(new Set(ids.filter((id) => typeof id === "string" && id.trim().length > 0)));

  return uniqueIds
    .map((id) => store.find((exercise) => exercise.id === id))
    .filter((exercise): exercise is UniversalExerciseRecord => Boolean(exercise))
    .map(cloneExercise);
}

export function createAdminExercise(exercise: UniversalExerciseRecord): UniversalExerciseRecord {
  const store = getStore();
  const timestamp = nowIso();

  const next: UniversalExerciseRecord = {
    ...cloneExercise(exercise),
    id: exercise.id || `local_ex_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    meta: {
      created_at: exercise.meta?.created_at || timestamp,
      updated_at: timestamp,
    },
  };

  store.unshift(next);
  return cloneExercise(next);
}

export function updateAdminExercise(id: string, exercise: UniversalExerciseRecord): UniversalExerciseRecord | null {
  const store = getStore();
  const index = store.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const previous = store[index];
  const timestamp = nowIso();

  const next: UniversalExerciseRecord = {
    ...cloneExercise(exercise),
    id,
    meta: {
      created_at: previous.meta?.created_at || exercise.meta?.created_at || timestamp,
      updated_at: timestamp,
    },
  };

  store[index] = next;
  return cloneExercise(next);
}

export function deactivateAdminExercise(id: string): UniversalExerciseRecord | null {
  const store = getStore();
  const index = store.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const current = store[index];

  const next: UniversalExerciseRecord = {
    ...current,
    status: "archived",
    meta: {
      ...current.meta,
      updated_at: nowIso(),
    },
  };

  store[index] = next;
  return cloneExercise(next);
}

export function upsertManyAdminExercises(exercises: UniversalExerciseRecord[]): UniversalExerciseRecord[] {
  const store = getStore();

  for (const exercise of exercises) {
    const existingIndex = store.findIndex((item) => item.id === exercise.id);

    if (existingIndex >= 0) {
      store[existingIndex] = {
        ...exercise,
        meta: {
          ...exercise.meta,
          updated_at: nowIso(),
        },
      };
    } else {
      store.unshift({
        ...exercise,
        meta: {
          ...exercise.meta,
          created_at: exercise.meta?.created_at || nowIso(),
          updated_at: nowIso(),
        },
      });
    }
  }

  return exercises.map((exercise) => {
    const updated = store.find((item) => item.id === exercise.id);
    return cloneExercise(updated ?? exercise);
  });
}

export function getExerciseListPreview(exercise: UniversalExerciseRecord): string {
  if (exercise.title.trim().length > 0) {
    return exercise.title;
  }

  return getExercisePromptPreview(exercise);
}



