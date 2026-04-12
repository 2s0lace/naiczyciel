"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  buildAdminBulkJsonTemplate,
  buildGapFillTextJsonTemplate,
  buildReadingMcJsonTemplate,
} from "@/lib/quiz/admin-json-template";
import { ADMIN_SET_CATALOG_CHANGED_EVENT } from "@/lib/quiz/admin-events";
import type { E8SetDefinition } from "@/lib/quiz/set-catalog";
import {
  CATEGORY_TO_TASK_TYPE,
  EXERCISE_CATEGORIES,
  EXERCISE_DIFFICULTIES,
  EXERCISE_STATUSES,
  EXERCISE_TASK_TYPES,
  createEmptyExercise,
  getExercisePromptPreview,
  type ExerciseCategory,
  type ExerciseDifficulty,
  type ExerciseStatus,
  type ExerciseTaskType,
  type UniversalExerciseRecord,
  validateExerciseRecord,
  withCategoryForTaskType,
  withTaskTypeForCategory,
} from "@/lib/quiz/admin-exercise";

type AdminSource = "supabase" | "local" | "mixed";

type AdminApiResponse = {
  source?: AdminSource;
  exercises?: UniversalExerciseRecord[];
  exercise?: UniversalExerciseRecord | null;
  error?: string;
  details?: string[];
  deletedCount?: number;
  updatedCount?: number;
};


type AdminQuizLaunchResponse = {
  sessionId?: string;
  mode?: string;
  acceptedCount?: number;
  skipped?: Array<{
    id: string;
    taskType: ExerciseTaskType;
    reason: string;
  }>;
  error?: string;
};

type AdminSetCreateResponse = {
  set?: {
    id: string;
    mode: string;
  };
  error?: string;
};

type AdminSetAccessResponse = {
  sets?: E8SetDefinition[];
  error?: string;
  details?: string;
};

type AdminFilters = {
  category: ExerciseCategory | "all";
  task_type: ExerciseTaskType | "all";
  status: ExerciseStatus | "all";
  difficulty: ExerciseDifficulty | "all";
};

type ExerciseSortMode = "recently_updated" | "recently_added" | "category_asc" | "category_desc";

const DEFAULT_FILTERS: AdminFilters = {
  category: "all",
  task_type: "all",
  status: "all",
  difficulty: "all",
};

const GRAMMAR_SELECT_OPTIONS = [
  "present_simple",
  "present_continuous",
  "present_perfect",
  "past_simple",
  "past_continuous",
  "future_simple",
  "going_to",
  "have_to",
  "would_like_to",
] as const;

const VOCABULARY_TOPIC_OPTIONS = [
  "czlowiek",
  "miejsce_zamieszkania",
  "edukacja",
  "praca",
  "zycie_prywatne",
  "zywienie",
  "zakupy_uslugi",
  "podrozowanie",
  "kultura",
  "sport",
  "zdrowie",
  "nauka_technika",
  "swiat_przyrody",
] as const;

function cloneExercise<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function splitCsv(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item, index, arr) => item.length > 0 && arr.indexOf(item) === index);
}

function formatDate(iso: string): string {
  if (!iso) {
    return "-";
  }

  try {
    return new Date(iso).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatCategoryLabel(category: ExerciseCategory): string {
  const labels: Record<ExerciseCategory, string> = {
    reactions: "reakcje",
    vocabulary: "slownictwo",
    grammar: "gramatyka",
    gap_fill_text: "gap fill text",
    reading_mc: "reading",
    gap_fill_word_bank: "word bank",
  };

  return labels[category] ?? category;
}

function truncateText(value: string, maxLength = 140): string {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function statusClass(status: ExerciseStatus): string {
  if (status === "active") {
    return "border-emerald-300/35 bg-emerald-500/12 text-emerald-100";
  }

  if (status === "archived") {
    return "border-rose-300/35 bg-rose-500/12 text-rose-100";
  }

  return "border-indigo-300/35 bg-indigo-500/12 text-indigo-100";
}

function isSupportedSetTaskType(taskType: ExerciseTaskType): boolean {
  return taskType === "single_choice_short" || taskType === "reading_mc" || taskType === "gap_fill_text";
}

function rebuildForCategory(current: UniversalExerciseRecord, nextCategory: ExerciseCategory): UniversalExerciseRecord {
  const empty = createEmptyExercise(nextCategory);

  return {
    ...empty,
    id: current.id,
    status: current.status,
    difficulty: current.difficulty,
    tags: current.tags,
    source: current.source,
    is_public: current.is_public,
    title: current.title,
    instruction: current.instruction,
    explanation: current.explanation,
    hint: current.hint,
    analytics: current.analytics,
    grammar: current.grammar,
    vocabulary: current.vocabulary,
    meta: {
      ...current.meta,
      updated_at: new Date().toISOString(),
    },
  };
}

export function AdminQuestionPanel() {
  const router = useRouter();
  const [filters, setFilters] = useState<AdminFilters>(DEFAULT_FILTERS);
  const [source, setSource] = useState<AdminSource | null>(null);
  const [exercises, setExercises] = useState<UniversalExerciseRecord[]>([]);
  const [draft, setDraft] = useState<UniversalExerciseRecord>(() => createEmptyExercise("reactions"));
  const [tagInput, setTagInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [isImportingJson, setIsImportingJson] = useState(false);
  const [isLaunchingQuiz, setIsLaunchingQuiz] = useState(false);
  const [isCreatingSetFromSelection, setIsCreatingSetFromSelection] = useState(false);
  const [isDeletingQuestions, setIsDeletingQuestions] = useState(false);
  const [isUpdatingVisibleStatus, setIsUpdatingVisibleStatus] = useState(false);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Record<string, boolean>>({});
  const [availableSets, setAvailableSets] = useState<E8SetDefinition[]>([]);
  const [excludedSetIds, setExcludedSetIds] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<ExerciseSortMode>("recently_updated");
  const [selectionTaskType, setSelectionTaskType] = useState<ExerciseTaskType | "all">("all");

  const getAuthHeaders = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      return {} as Record<string, string>;
    }

    return { Authorization: `Bearer ${token}` };
  }, []);

  const loadExercises = useCallback(async (overrideFilters?: AdminFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const effectiveFilters = overrideFilters ?? filters;
      const params = new URLSearchParams({ limit: "2000" });
      if (effectiveFilters.category !== "all") params.set("category", effectiveFilters.category);
      if (effectiveFilters.task_type !== "all") params.set("task_type", effectiveFilters.task_type);
      if (effectiveFilters.status !== "all") params.set("status", effectiveFilters.status);
      if (effectiveFilters.difficulty !== "all") params.set("difficulty", effectiveFilters.difficulty);
      for (const setId of excludedSetIds) {
        params.append("exclude_set_ids", setId);
      }

      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/e8/admin/questions?${params.toString()}`, {
        cache: "no-store",
        headers: authHeaders,
      });

      const data = (await response.json().catch(() => ({}))) as AdminApiResponse;

      if (!response.ok) {
        const details = Array.isArray(data.details) ? ` ${data.details.join(" | ")}` : "";
        throw new Error((data.error ?? "Nie udalo sie pobrac cwiczen.") + details);
      }

      setExercises(data.exercises ?? []);
      setSource(data.source ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Wystapil blad.");
    } finally {
      setIsLoading(false);
    }
  }, [excludedSetIds, filters, getAuthHeaders]);

  const loadSetOptions = useCallback(async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/e8/admin/set-access", {
        cache: "no-store",
        headers: authHeaders,
      });

      const data = (await response.json().catch(() => ({}))) as AdminSetAccessResponse;

      if (!response.ok) {
        throw new Error(`${data.error ?? "Nie udalo sie pobrac setow."}${data.details ? ` ${data.details}` : ""}`);
      }

      const nextSets = Array.isArray(data.sets)
        ? data.sets.filter((setItem) => {
            const hasQuestionIds = (setItem.questionIds?.length ?? 0) > 0;
            const isBuiltinMock = setItem.id === "set_mock_reading_mc" || setItem.id === "set_mock_gap_fill_text";
            return hasQuestionIds || isBuiltinMock;
          })
        : [];
      setAvailableSets(nextSets);
      setExcludedSetIds((prev) => prev.filter((setId) => nextSets.some((setItem) => setItem.id === setId)));
    } catch {
      setAvailableSets([]);
      setExcludedSetIds([]);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    void loadExercises();
  }, [loadExercises]);

  useEffect(() => {
    void loadSetOptions();
  }, [loadSetOptions]);

  useEffect(() => {
    const onSetCatalogChanged = () => {
      void loadSetOptions();
      void loadExercises();
    };

    window.addEventListener(ADMIN_SET_CATALOG_CHANGED_EVENT, onSetCatalogChanged);

    return () => {
      window.removeEventListener(ADMIN_SET_CATALOG_CHANGED_EVENT, onSetCatalogChanged);
    };
  }, [loadExercises, loadSetOptions]);

  useEffect(() => {
    setSelectedExerciseIds((prev) => {
      const next: Record<string, boolean> = {};

      for (const exercise of exercises) {
        if (prev[exercise.id]) {
          next[exercise.id] = true;
        }
      }

      return next;
    });
  }, [exercises]);

  const updateDraft = (updater: (next: UniversalExerciseRecord) => void) => {
    setDraft((prev) => {
      const next = cloneExercise(prev);
      updater(next);
      next.meta.updated_at = new Date().toISOString();
      return next;
    });
  };

  const resetForm = (category: ExerciseCategory = "reactions") => {
    setDraft(createEmptyExercise(category));
    setTagInput("");
    setEditingId(null);
    setValidationErrors([]);
  };

  const onChangeCategory = (category: ExerciseCategory) => {
    const pair = withTaskTypeForCategory(category, draft.task_type);
    updateDraft((next) => {
      if (next.task_type === pair.taskType) {
        next.category = pair.category;
      } else {
        Object.assign(next, rebuildForCategory(next, pair.category));
      }
    });
  };

  const onChangeTaskType = (taskType: ExerciseTaskType) => {
    const pair = withCategoryForTaskType(taskType, draft.category);
    updateDraft((next) => {
      if (next.task_type !== pair.taskType || next.category !== pair.category) {
        Object.assign(next, rebuildForCategory(next, pair.category));
      }
    });
  };

  const startEdit = (exercise: UniversalExerciseRecord) => {
    const copy = cloneExercise(exercise);
    setDraft(copy);
    setTagInput(copy.tags.join(", "));
    setEditingId(copy.id);
    setValidationErrors([]);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    setValidationErrors([]);

    const payload = cloneExercise(draft);
    payload.tags = splitCsv(tagInput);

    const validation = validateExerciseRecord(payload);

    if (!validation.isValid || !validation.exercise) {
      setValidationErrors(validation.errors);
      setIsSaving(false);
      return;
    }

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/e8/admin/questions", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(
          editingId
            ? { id: editingId, exercise: validation.exercise }
            : { exercise: validation.exercise },
        ),
      });

      const data = (await response.json().catch(() => ({}))) as AdminApiResponse;

      if (!response.ok) {
        const details = Array.isArray(data.details) ? ` ${data.details.join(" | ")}` : "";
        throw new Error((data.error ?? "Nie udalo sie zapisac.") + details);
      }

      setSource(data.source ?? source);
      setSuccess(editingId ? "Zaktualizowano cwiczenie." : "Utworzono cwiczenie.");
      resetForm(validation.exercise.category);
      await loadExercises();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Wystapil blad zapisu.");
    } finally {
      setIsSaving(false);
    }
  };


  const handleLoadJsonToForm = async () => {
    setError(null);
    setSuccess(null);
    setValidationErrors([]);

    if (!jsonInput.trim()) {
      setError("Wklej JSON rekordu cwiczenia.");
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput) as unknown;
      const container = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
      const rawList = Array.isArray(parsed)
        ? parsed
        : Array.isArray(container?.exercises)
          ? container.exercises
          : Array.isArray(container?.questions)
            ? container.questions
            : null;

      if (rawList && rawList.length > 1) {
        setSuccess("Wykryto wiele rekordow. Uruchamiam import listy JSON.");
        await handleImportJsonList();
        return;
      }

      const listCandidate = Array.isArray(container?.exercises)
        ? container.exercises[0]
        : Array.isArray(container?.questions)
          ? container.questions[0]
          : null;
      const listRecord =
        listCandidate && typeof listCandidate === "object" && !Array.isArray(listCandidate)
          ? (listCandidate as Record<string, unknown>)
          : null;
      const candidate = container?.exercise ?? listRecord?.exercise ?? listCandidate ?? parsed;
      const validation = validateExerciseRecord(candidate);

      if (!validation.isValid || !validation.exercise) {
        setValidationErrors(validation.errors);
        setError("JSON rekordu jest niepoprawny.");
        return;
      }

      const loaded = cloneExercise(validation.exercise);
      setDraft(loaded);
      setTagInput(loaded.tags.join(", "));
      setEditingId(null);
      setSuccess("JSON zaladowany do formularza.");
    } catch {
      setError("Niepoprawny JSON.");
    }
  };

  const handleImportJsonList = async () => {
    setError(null);
    setSuccess(null);
    setValidationErrors([]);

    if (!jsonInput.trim()) {
      setError("Wklej JSON z lista cwiczen.");
      return;
    }

    setIsImportingJson(true);

    try {
      const parsed = JSON.parse(jsonInput) as unknown;
      const asRecord = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
      const rawList = Array.isArray(parsed)
        ? parsed
        : Array.isArray(asRecord?.exercises)
          ? asRecord.exercises
          : Array.isArray(asRecord?.questions)
            ? asRecord.questions
            : null;

      if (!rawList || rawList.length === 0) {
        throw new Error("JSON musi zawierac tablice exercises/questions.");
      }

      const validRecords: UniversalExerciseRecord[] = [];
      const errors: string[] = [];

      rawList.forEach((entry, index) => {
        const entryRecord = entry && typeof entry === "object" && !Array.isArray(entry) ? (entry as Record<string, unknown>) : null;
        const candidate = entryRecord?.exercise ?? entry;
        const validation = validateExerciseRecord(candidate);
        if (validation.isValid && validation.exercise) {
          validRecords.push(validation.exercise);
        } else {
          const reason = validation.errors.join(" | ");
          errors.push(`Rekord ${index + 1}: ${reason || "invalid"}`);
        }
      });

      if (errors.length > 0) {
        setValidationErrors(errors.slice(0, 25));
      }

      if (validRecords.length === 0) {
        throw new Error("Brak poprawnych rekordow do importu.");
      }

      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/e8/admin/questions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ exercises: validRecords }),
      });

      const data = (await response.json().catch(() => ({}))) as AdminApiResponse;

      if (!response.ok) {
        const details = Array.isArray(data.details) ? ` ${data.details.join(" | ")}` : "";
        throw new Error((data.error ?? "Import JSON nie udal sie.") + details);
      }

      setSource(data.source ?? source);
      setSuccess(`Zaimportowano ${validRecords.length} rekordow.`);
      const importedMayBeHiddenByFilters =
        filters.category !== "all" ||
        filters.task_type !== "all" ||
        filters.status !== "all" ||
        filters.difficulty !== "all";

      if (importedMayBeHiddenByFilters) {
        setFilters(DEFAULT_FILTERS);
        await loadExercises(DEFAULT_FILTERS);
      } else {
        await loadExercises();
      }
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Wystapil blad importu.");
    } finally {
      setIsImportingJson(false);
    }
  };

  const handleInsertFullJsonTemplate = () => {
    setJsonInput(buildAdminBulkJsonTemplate());
    setSuccess("Wstawiono pelny template AI ze wszystkimi polami i dozwolonymi wartosciami.");
    setError(null);
    setValidationErrors([]);
  };

  const handleInsertReadingMcTemplate = () => {
    setJsonInput(buildReadingMcJsonTemplate());
    setSuccess("Wstawiono template AI dla reading_mc w nowym layoucie shared passage.");
    setError(null);
    setValidationErrors([]);
  };

  const handleInsertGapFillTextTemplate = () => {
    setJsonInput(buildGapFillTextJsonTemplate());
    setSuccess("Wstawiono template AI dla gap_fill_text w nowym layoucie shared text.");
    setError(null);
    setValidationErrors([]);
  };

  const handleFillJsonWithDraft = () => {
    const payload = cloneExercise(draft);
    payload.tags = splitCsv(tagInput);
    setJsonInput(JSON.stringify(payload, null, 2));
    setSuccess("Aktualny draft wstawiony do pola JSON.");
    setError(null);
  };
  const handleDeactivate = async (id: string) => {
    setError(null);
    setSuccess(null);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/e8/admin/questions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ id }),
      });

      const data = (await response.json().catch(() => ({}))) as AdminApiResponse;

      if (!response.ok) {
        const details = Array.isArray(data.details) ? ` ${data.details.join(" | ")}` : "";
        throw new Error((data.error ?? "Nie udalo sie zdezaktywowac.") + details);
      }

      setSource(data.source ?? source);
      setSuccess("Cwiczenie zdezaktywowane.");
      await loadExercises();
    } catch (deactivateError) {
      setError(deactivateError instanceof Error ? deactivateError.message : "Wystapil blad.");
    }
  };

  const handleDeletePermanently = async (id: string) => {
    setError(null);
    setSuccess(null);

    const confirmed = window.confirm("Usunac to pytanie na stale? Tej operacji nie da sie cofnac.");

    if (!confirmed) {
      return;
    }

    setIsDeletingQuestions(true);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/e8/admin/questions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ id, hard: true }),
      });

      const data = (await response.json().catch(() => ({}))) as AdminApiResponse;

      if (!response.ok) {
        const details = Array.isArray(data.details) ? ` ${data.details.join(" | ")}` : "";
        throw new Error((data.error ?? "Nie udalo sie usunac pytania.") + details);
      }

      setSource(data.source ?? source);
      setSuccess("Pytanie usuniete na stale.");

      if (editingId === id) {
        resetForm("reactions");
      }

      setSelectedExerciseIds((prev) => {
        if (!prev[id]) {
          return prev;
        }

        const next = { ...prev };
        delete next[id];
        return next;
      });

      await loadExercises();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Wystapil blad usuwania.");
    } finally {
      setIsDeletingQuestions(false);
    }
  };

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExerciseIds((prev) => ({
      ...prev,
      [exerciseId]: !prev[exerciseId],
    }));
  };

  const selectAllVisibleExercises = () => {
    setSelectedExerciseIds((prev) => {
      const next = { ...prev };

      for (const exercise of visibleExercises) {
        if (exercise.status === "draft") {
          next[exercise.id] = true;
        }
      }

      return next;
    });
  };

  const selectVisibleExercisesByTaskType = () => {
    setSelectedExerciseIds((prev) => {
      const next = { ...prev };

      for (const exercise of visibleExercises) {
        const matchesTaskType = selectionTaskType === "all" || exercise.task_type === selectionTaskType;

        if (exercise.status === "draft" && matchesTaskType) {
          next[exercise.id] = true;
        }
      }

      return next;
    });
  };

  const clearVisibleSelections = () => {
    setSelectedExerciseIds((prev) => {
      const next = { ...prev };

      for (const exercise of visibleExercises) {
        delete next[exercise.id];
      }

      return next;
    });
  };

  const visibleExercises = useMemo(() => {
    const baseExercises =
      excludedSetIds.length > 0
        ? exercises.filter((exercise) => exercise.status === "draft")
        : exercises;

    const sorted = [...baseExercises];

    sorted.sort((left, right) => {
      if (sortMode === "recently_added") {
        return right.meta.created_at.localeCompare(left.meta.created_at);
      }

      if (sortMode === "category_asc" || sortMode === "category_desc") {
        const categoryCompare = formatCategoryLabel(left.category).localeCompare(formatCategoryLabel(right.category), "pl");

        if (categoryCompare !== 0) {
          return sortMode === "category_asc" ? categoryCompare : -categoryCompare;
        }

        return right.meta.created_at.localeCompare(left.meta.created_at);
      }

      return right.meta.updated_at.localeCompare(left.meta.updated_at);
    });

    return sorted;
  }, [excludedSetIds.length, exercises, sortMode]);

  const selectedVisibleIds = useMemo(
    () => visibleExercises.filter((exercise) => selectedExerciseIds[exercise.id]).map((exercise) => exercise.id),
    [selectedExerciseIds, visibleExercises],
  );

  const selectedVisibleCount = selectedVisibleIds.length;

  const toggleExcludedSetId = (setId: string) => {
    setExcludedSetIds((prev) =>
      prev.includes(setId) ? prev.filter((entry) => entry !== setId) : [...prev, setId],
    );
  };

  const handleBulkUpdateVisibleStatus = async (nextStatus: ExerciseStatus) => {
    setError(null);
    setSuccess(null);

    if (visibleExercises.length === 0) {
      setError("Brak widocznych pytan do aktualizacji.");
      return;
    }

    setIsUpdatingVisibleStatus(true);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/e8/admin/questions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          mode: "bulk_status",
          status: nextStatus,
          ids: visibleExercises.map((exercise) => exercise.id),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as AdminApiResponse;

      if (!response.ok) {
        const details = Array.isArray(data.details) ? ` ${data.details.join(" | ")}` : "";
        throw new Error((data.error ?? "Nie udalo sie zmienic statusu widocznych pytan.") + details);
      }

      const updatedCount = typeof data.updatedCount === "number" ? data.updatedCount : visibleExercises.length;
      setSource(data.source ?? source);
      setSuccess(`Ustawiono status ${nextStatus} dla ${updatedCount} widocznych pytan.`);
      await loadExercises();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Wystapil blad aktualizacji statusu.");
    } finally {
      setIsUpdatingVisibleStatus(false);
    }
  };

  const handleDeleteSelectedPermanently = async () => {
    setError(null);
    setSuccess(null);

    if (selectedVisibleCount === 0) {
      setError("Zaznacz przynajmniej jedno pytanie do usuniecia.");
      return;
    }

    const confirmed = window.confirm(`Usunac na stale ${selectedVisibleCount} zaznaczonych pytan? Tej operacji nie da sie cofnac.`);

    if (!confirmed) {
      return;
    }

    setIsDeletingQuestions(true);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/e8/admin/questions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ ids: selectedVisibleIds, hard: true }),
      });

      const data = (await response.json().catch(() => ({}))) as AdminApiResponse;

      if (!response.ok) {
        const details = Array.isArray(data.details) ? ` ${data.details.join(" | ")}` : "";
        throw new Error((data.error ?? "Nie udalo sie usunac zaznaczonych pytan.") + details);
      }

      const deletedCount = typeof data.deletedCount === "number" ? data.deletedCount : selectedVisibleCount;
      setSource(data.source ?? source);
      setSuccess(`Usunieto na stale: ${deletedCount} pytan.`);

      setSelectedExerciseIds((prev) => {
        const next = { ...prev };

        for (const id of selectedVisibleIds) {
          delete next[id];
        }

        return next;
      });

      if (editingId && selectedVisibleIds.includes(editingId)) {
        resetForm("reactions");
      }

      await loadExercises();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Wystapil blad usuwania.");
    } finally {
      setIsDeletingQuestions(false);
    }
  };

  const handleLaunchSelectedQuiz = async () => {
    setError(null);
    setSuccess(null);

    if (selectedVisibleCount === 0) {
      setError("Zaznacz przynajmniej jedno pytanie.");
      return;
    }

    const selectedRecords = exercises.filter((exercise) => selectedExerciseIds[exercise.id]);
    const unsupported = selectedRecords.filter(
      (exercise) => !isSupportedSetTaskType(exercise.task_type),
    );

    if (unsupported.length > 0) {
      setError("Symulacja 1:1 obsluguje aktualnie tylko single_choice_short oraz reading_mc.");
      return;
    }

    setIsLaunchingQuiz(true);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/e8/admin/questions/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          exerciseIds: selectedVisibleIds,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as AdminQuizLaunchResponse;

      if (!response.ok || !data.sessionId) {
        throw new Error(data.error ?? "Nie udalo sie uruchomic symulacji quizu.");
      }

      const nextMode = typeof data.mode === "string" && data.mode.length > 0 ? data.mode : "reactions";
      router.push(`/e8/quiz/${encodeURIComponent(data.sessionId)}?mode=${encodeURIComponent(nextMode)}`);
    } catch (launchError) {
      setError(launchError instanceof Error ? launchError.message : "Wystapil blad uruchamiania quizu.");
      setIsLaunchingQuiz(false);
    }
  };

  const handleCreateSetFromSelected = async () => {
    setError(null);
    setSuccess(null);

    if (selectedVisibleCount === 0) {
      setError("Zaznacz pytania, z ktorych chcesz zbudowac set.");
      return;
    }

    const selectedRecords = exercises.filter((exercise) => selectedExerciseIds[exercise.id]);
    const unsupported = selectedRecords.filter((exercise) => !isSupportedSetTaskType(exercise.task_type));

    if (unsupported.length > 0) {
      setError("Set z wybranych pytan wspiera aktualnie tylko single_choice_short i reading_mc.");
      return;
    }

    const categories = Array.from(new Set(selectedRecords.map((exercise) => exercise.category)));
    let mode: string = categories.length === 1 ? categories[0] : "reactions";

    if (categories.length > 1) {
      const enteredMode = window.prompt(
        "Wybrano pytania z wielu kategorii. Podaj mode dla nowego setu:",
        mode,
      );

      if (enteredMode === null) {
        return;
      }

      const nextMode = enteredMode.trim().toLowerCase();
      if (!nextMode) {
        setError("Mode jest wymagane.");
        return;
      }

      mode = nextMode;
    }

    const nowSuffix = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 12);
    const enteredSetId = window.prompt(
      "Podaj id nowego setu (np. set_reactions_custom_01):",
      `set_custom_${nowSuffix}`,
    );

    if (enteredSetId === null) {
      return;
    }

    const setId = enteredSetId
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!setId) {
      setError("Niepoprawne id setu.");
      return;
    }

    const enteredTitle = window.prompt("Podaj tytul setu:", `Set ${selectedVisibleCount} pytan`);

    if (enteredTitle === null) {
      return;
    }

    const title = enteredTitle.trim() || `Set ${selectedVisibleCount} pytan`;

    const enteredSubtitle = window.prompt(
      "Podaj opis setu (opcjonalnie):",
      "Pytania wybrane recznie w panelu admina.",
    );

    if (enteredSubtitle === null) {
      return;
    }

    const subtitle = enteredSubtitle.trim();

    setIsCreatingSetFromSelection(true);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/e8/admin/set-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          set: {
            id: setId,
            mode,
            title,
            subtitle,
            questionCount: selectedVisibleCount,
            questionIds: selectedVisibleIds,
          },
          assignToTier: "registered",
        }),
      });

      const data = (await response.json().catch(() => ({}))) as AdminSetCreateResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Nie udalo sie utworzyc setu.");
      }

      const createdSetId = data.set?.id ?? setId;

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(ADMIN_SET_CATALOG_CHANGED_EVENT));
      }
      setSuccess(`Utworzono set: ${createdSetId}. Przypisano do: registered.`);
    } catch (createSetError) {
      setError(createSetError instanceof Error ? createSetError.message : "Wystapil blad tworzenia setu.");
    } finally {
      setIsCreatingSetFromSelection(false);
    }
  };
  const jsonPreview = useMemo(() => JSON.stringify({ ...draft, tags: splitCsv(tagInput) }, null, 2), [draft, tagInput]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_44px_-34px_rgba(0,0,0,0.95)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Panel admina cwiczen</h2>
          <p className="text-sm text-gray-300">Uniwersalne rekordy JSON dla 6 kategorii.</p>
        </div>
        <span className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-indigo-100/85">Zrodlo: {source ?? "-"}</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs text-gray-300">Category</span>
          <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value as AdminFilters["category"] }))} className="w-full rounded-xl border border-white/15 bg-[#070b18] px-3 py-2.5 text-sm text-white outline-none">
            <option value="all">all</option>
            {EXERCISE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-gray-300">Task type</span>
          <select value={filters.task_type} onChange={(e) => setFilters((p) => ({ ...p, task_type: e.target.value as AdminFilters["task_type"] }))} className="w-full rounded-xl border border-white/15 bg-[#070b18] px-3 py-2.5 text-sm text-white outline-none">
            <option value="all">all</option>
            {EXERCISE_TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-gray-300">Status</span>
          <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value as AdminFilters["status"] }))} className="w-full rounded-xl border border-white/15 bg-[#070b18] px-3 py-2.5 text-sm text-white outline-none">
            <option value="all">all</option>
            {EXERCISE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-gray-300">Difficulty</span>
          <select value={filters.difficulty} onChange={(e) => setFilters((p) => ({ ...p, difficulty: e.target.value as AdminFilters["difficulty"] }))} className="w-full rounded-xl border border-white/15 bg-[#070b18] px-3 py-2.5 text-sm text-white outline-none">
            <option value="all">all</option>
            {EXERCISE_DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => { void loadExercises(); }} className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white">Odswiez</button>
        <button type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setExcludedSetIds([]); }} className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white">Wyczysc filtry</button>
      </div>

      {availableSets.length > 0 ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-[#090d1f] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Ukryj pytania z setow</h3>
              <p className="text-xs text-gray-400">Jesli wybierzesz set, pytania juz w nim przypisane nie beda tu pokazane.</p>
            </div>
            {excludedSetIds.length > 0 ? (
              <button type="button" onClick={() => setExcludedSetIds([])} className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white">
                Pokaz wszystkie
              </button>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {availableSets.map((setItem) => {
              const isActive = excludedSetIds.includes(setItem.id);

              return (
                <button
                  key={setItem.id}
                  type="button"
                  onClick={() => toggleExcludedSetId(setItem.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? "border-amber-300/40 bg-amber-500/15 text-amber-100"
                      : "border-white/12 bg-white/[0.03] text-gray-200"
                  }`}
                >
                  {setItem.title} ({setItem.questionIds?.length ?? setItem.questionCount})
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-indigo-300/14 bg-[#0a0f26] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-indigo-100 uppercase">{editingId ? "Edycja" : "Nowe cwiczenie"}</h3>
          <button type="button" onClick={() => resetForm("reactions")} className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white">Nowy formularz</button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1"><span className="text-xs text-gray-300">category</span><select value={draft.category} onChange={(e) => onChangeCategory(e.target.value as ExerciseCategory)} className="w-full rounded-xl border border-white/15 bg-[#070b18] px-3 py-2.5 text-sm text-white">{EXERCISE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
          <label className="space-y-1"><span className="text-xs text-gray-300">task_type</span><select value={draft.task_type} onChange={(e) => onChangeTaskType(e.target.value as ExerciseTaskType)} className="w-full rounded-xl border border-white/15 bg-[#070b18] px-3 py-2.5 text-sm text-white">{EXERCISE_TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1"><span className="text-xs text-gray-300">status</span><select value={draft.status} onChange={(e) => updateDraft((n) => { n.status = e.target.value as ExerciseStatus; })} className="w-full rounded-xl border border-white/15 bg-[#070b18] px-3 py-2.5 text-sm text-white">{EXERCISE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
          <label className="space-y-1"><span className="text-xs text-gray-300">difficulty</span><select value={draft.difficulty} onChange={(e) => updateDraft((n) => { n.difficulty = e.target.value as ExerciseDifficulty; })} className="w-full rounded-xl border border-white/15 bg-[#070b18] px-3 py-2.5 text-sm text-white">{EXERCISE_DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
          <label className="space-y-1"><span className="text-xs text-gray-300">source</span><input value={draft.source} onChange={(e) => updateDraft((n) => { n.source = e.target.value; })} className="w-full rounded-xl border border-white/15 bg-[#070b18] px-3 py-2.5 text-sm text-white" /></label>
          <label className="flex items-end gap-2 rounded-xl border border-white/12 bg-[#070b18] px-3 py-2.5"><input type="checkbox" checked={draft.is_public} onChange={(e) => updateDraft((n) => { n.is_public = e.target.checked; })} className="h-4 w-4 accent-indigo-500" /><span className="text-sm text-gray-200">is_public</span></label>
        </div>

        <div className="mt-3 space-y-2">
          <label className="space-y-1"><span className="text-xs text-gray-300">title</span><input value={draft.title} onChange={(e) => updateDraft((n) => { n.title = e.target.value; })} className="w-full rounded-xl border border-white/15 bg-[#070b18] px-3 py-2.5 text-sm text-white" /></label>
          <label className="space-y-1"><span className="text-xs text-gray-300">instruction</span><input value={draft.instruction} onChange={(e) => updateDraft((n) => { n.instruction = e.target.value; })} className="w-full rounded-xl border border-white/15 bg-[#070b18] px-3 py-2.5 text-sm text-white" /></label>
          <label className="space-y-1"><span className="text-xs text-gray-300">tags (csv)</span><input value={tagInput} onChange={(e) => setTagInput(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#070b18] px-3 py-2.5 text-sm text-white" /></label>
        </div>

        <div className="mt-3 grid gap-2 rounded-xl border border-white/12 bg-[#070b18] p-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-gray-300">grammar.structures</span>
            <select
              multiple
              value={draft.grammar.structures}
              onChange={(e) =>
                updateDraft((n) => {
                  n.grammar.structures = Array.from(e.target.selectedOptions).map((option) => option.value);
                })
              }
              className="min-h-[140px] w-full rounded-xl border border-white/15 bg-[#060914] px-3 py-2 text-sm text-white"
            >
              {GRAMMAR_SELECT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-300">grammar.tenses</span>
            <select
              multiple
              value={draft.grammar.tenses}
              onChange={(e) =>
                updateDraft((n) => {
                  n.grammar.tenses = Array.from(e.target.selectedOptions).map((option) => option.value);
                })
              }
              className="min-h-[140px] w-full rounded-xl border border-white/15 bg-[#060914] px-3 py-2 text-sm text-white"
            >
              {GRAMMAR_SELECT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-300">vocabulary.topic</span>
            <select
              value={draft.vocabulary.topic}
              onChange={(e) =>
                updateDraft((n) => {
                  n.vocabulary.topic = e.target.value;
                })
              }
              className="w-full rounded-xl border border-white/15 bg-[#060914] px-3 py-2 text-sm text-white"
            >
              <option value="">-</option>
              {VOCABULARY_TOPIC_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-300">vocabulary.key_words (csv)</span>
            <input
              value={draft.vocabulary.key_words.join(", ")}
              onChange={(e) =>
                updateDraft((n) => {
                  n.vocabulary.key_words = splitCsv(e.target.value);
                })
              }
              className="w-full rounded-xl border border-white/15 bg-[#060914] px-3 py-2 text-sm text-white"
            />
          </label>
        </div>

        <div className="mt-4 space-y-2 rounded-xl border border-white/12 bg-[#070b18] p-3">
          <h4 className="text-xs font-semibold tracking-wide text-indigo-100 uppercase">Task-specific content</h4>
          {draft.task_type === "single_choice_short" && (
            <>
              <textarea value={draft.content.prompt} onChange={(e) => updateDraft((n) => { if (n.task_type === "single_choice_short") n.content.prompt = e.target.value; })} className="min-h-[80px] w-full rounded-xl border border-white/15 bg-[#060914] px-3 py-2.5 text-sm text-white" placeholder="prompt" />
              {(draft.content.options ?? []).map((option, index) => (
                <label key={option.id} className="flex items-center gap-2 rounded-lg border border-white/12 bg-[#050814] px-3 py-2">
                  <input type="radio" checked={draft.correct_answer.option_id === option.id} onChange={() => updateDraft((n) => { if (n.task_type === "single_choice_short") n.correct_answer.option_id = option.id; })} className="h-4 w-4 accent-indigo-500" />
                  <span className="w-5 text-xs text-indigo-200">{["A", "B", "C"][index]}</span>
                  <input value={option.text} onChange={(e) => updateDraft((n) => { if (n.task_type === "single_choice_short") n.content.options[index].text = e.target.value; })} className="w-full bg-transparent text-sm text-white outline-none" placeholder={`option ${index + 1}`} />
                </label>
              ))}
            </>
          )}
          {draft.task_type === "reading_mc" && (
            <>
              <input value={draft.content.title ?? ""} onChange={(e) => updateDraft((n) => { if (n.task_type === "reading_mc") n.content.title = e.target.value; })} className="w-full rounded-xl border border-white/15 bg-[#060914] px-3 py-2 text-sm text-white" placeholder="title" />
              <textarea value={draft.content.passage} onChange={(e) => updateDraft((n) => { if (n.task_type === "reading_mc") n.content.passage = e.target.value; })} className="min-h-[80px] w-full rounded-xl border border-white/15 bg-[#060914] px-3 py-2.5 text-sm text-white" placeholder="passage" />
              <textarea value={draft.content.question} onChange={(e) => updateDraft((n) => { if (n.task_type === "reading_mc") n.content.question = e.target.value; })} className="min-h-[72px] w-full rounded-xl border border-white/15 bg-[#060914] px-3 py-2.5 text-sm text-white" placeholder="question" />
              {(draft.content.options ?? []).map((option, index) => (
                <label key={option.id} className="flex items-center gap-2 rounded-lg border border-white/12 bg-[#050814] px-3 py-2">
                  <input type="radio" checked={draft.correct_answer.option_id === option.id} onChange={() => updateDraft((n) => { if (n.task_type === "reading_mc") n.correct_answer.option_id = option.id; })} className="h-4 w-4 accent-indigo-500" />
                  <span className="w-5 text-xs text-indigo-200">{["A", "B", "C"][index]}</span>
                  <input value={option.text} onChange={(e) => updateDraft((n) => { if (n.task_type === "reading_mc" && n.content.options?.[index]) n.content.options[index].text = e.target.value; })} className="w-full bg-transparent text-sm text-white outline-none" />
                </label>
              ))}
            </>
          )}
          {draft.task_type === "gap_fill_text" && (
            <>
              <input value={draft.content.title ?? ""} onChange={(e) => updateDraft((n) => { if (n.task_type === "gap_fill_text") n.content.title = e.target.value; })} className="w-full rounded-xl border border-white/15 bg-[#060914] px-3 py-2 text-sm text-white" placeholder="title" />
              <textarea value={draft.content.text} onChange={(e) => updateDraft((n) => { if (n.task_type === "gap_fill_text") n.content.text = e.target.value; })} className="min-h-[90px] w-full rounded-xl border border-white/15 bg-[#060914] px-3 py-2.5 text-sm text-white" placeholder="text" />
              {draft.content.blanks.map((blank, index) => (
                <div key={blank.id} className="grid gap-2 rounded-lg border border-white/12 bg-[#050814] p-2 sm:grid-cols-3">
                  <input value={blank.id} onChange={(e) => updateDraft((n) => { if (n.task_type === "gap_fill_text") { const oldId = n.content.blanks[index].id; n.content.blanks[index].id = e.target.value; const ans = n.correct_answer.blanks.find((b) => b.id === oldId); if (ans) ans.id = e.target.value; } })} className="rounded-lg border border-white/15 bg-[#060914] px-2 py-1.5 text-xs text-white" placeholder="blank id" />
                  <input value={blank.placeholder} onChange={(e) => updateDraft((n) => { if (n.task_type === "gap_fill_text") n.content.blanks[index].placeholder = e.target.value; })} className="rounded-lg border border-white/15 bg-[#060914] px-2 py-1.5 text-xs text-white" placeholder="placeholder" />
                  <input value={blank.accepted_answers.join(", ")} onChange={(e) => updateDraft((n) => { if (n.task_type === "gap_fill_text") { const answers = splitCsv(e.target.value); n.content.blanks[index].accepted_answers = answers; const ans = n.correct_answer.blanks.find((b) => b.id === n.content.blanks[index].id); if (ans) ans.accepted_answers = answers; else n.correct_answer.blanks.push({ id: n.content.blanks[index].id, accepted_answers: answers }); } })} className="rounded-lg border border-white/15 bg-[#060914] px-2 py-1.5 text-xs text-white" placeholder="accepted answers" />
                </div>
              ))}
              <button type="button" onClick={() => updateDraft((n) => { if (n.task_type === "gap_fill_text") { const id = `blank_${n.content.blanks.length + 1}`; n.content.blanks.push({ id, placeholder: "___", accepted_answers: [] }); n.correct_answer.blanks.push({ id, accepted_answers: [] }); } })} className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white">Dodaj blank</button>
            </>
          )}
          {draft.task_type === "gap_fill_word_bank" && (
            <>
              <input value={draft.content.title ?? ""} onChange={(e) => updateDraft((n) => { if (n.task_type === "gap_fill_word_bank") n.content.title = e.target.value; })} className="w-full rounded-xl border border-white/15 bg-[#060914] px-3 py-2 text-sm text-white" placeholder="title" />
              <textarea value={draft.content.text} onChange={(e) => updateDraft((n) => { if (n.task_type === "gap_fill_word_bank") n.content.text = e.target.value; })} className="min-h-[90px] w-full rounded-xl border border-white/15 bg-[#060914] px-3 py-2.5 text-sm text-white" placeholder="text" />
              <input value={draft.content.word_bank.join(", ")} onChange={(e) => updateDraft((n) => { if (n.task_type === "gap_fill_word_bank") n.content.word_bank = splitCsv(e.target.value); })} className="w-full rounded-xl border border-white/15 bg-[#060914] px-3 py-2 text-sm text-white" placeholder="word bank" />
              {draft.content.blanks.map((blank, index) => {
                const answer = draft.correct_answer.blanks.find((b) => b.id === blank.id);
                return (
                  <div key={blank.id} className="grid gap-2 rounded-lg border border-white/12 bg-[#050814] p-2 sm:grid-cols-3">
                    <input value={blank.id} onChange={(e) => updateDraft((n) => { if (n.task_type === "gap_fill_word_bank") { const oldId = n.content.blanks[index].id; n.content.blanks[index].id = e.target.value; const ans = n.correct_answer.blanks.find((b) => b.id === oldId); if (ans) ans.id = e.target.value; } })} className="rounded-lg border border-white/15 bg-[#060914] px-2 py-1.5 text-xs text-white" placeholder="blank id" />
                    <input value={blank.placeholder} onChange={(e) => updateDraft((n) => { if (n.task_type === "gap_fill_word_bank") n.content.blanks[index].placeholder = e.target.value; })} className="rounded-lg border border-white/15 bg-[#060914] px-2 py-1.5 text-xs text-white" placeholder="placeholder" />
                    <input value={answer?.word ?? ""} onChange={(e) => updateDraft((n) => { if (n.task_type === "gap_fill_word_bank") { const id = n.content.blanks[index].id; const ans = n.correct_answer.blanks.find((b) => b.id === id); if (ans) ans.word = e.target.value; else n.correct_answer.blanks.push({ id, word: e.target.value }); } })} className="rounded-lg border border-white/15 bg-[#060914] px-2 py-1.5 text-xs text-white" placeholder="correct word" />
                  </div>
                );
              })}
              <button type="button" onClick={() => updateDraft((n) => { if (n.task_type === "gap_fill_word_bank") { const id = `blank_${n.content.blanks.length + 1}`; n.content.blanks.push({ id, placeholder: "___" }); n.correct_answer.blanks.push({ id, word: "" }); } })} className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white">Dodaj blank</button>
            </>
          )}
        </div>

        <div className="mt-3 grid gap-2 rounded-xl border border-white/12 bg-[#070b18] p-3">
          <input value={draft.explanation.why} onChange={(e) => updateDraft((n) => { n.explanation.why = e.target.value; })} className="rounded-xl border border-white/15 bg-[#060914] px-3 py-2 text-sm text-white" placeholder="explanation.why" />
          <input value={draft.explanation.pattern} onChange={(e) => updateDraft((n) => { n.explanation.pattern = e.target.value; })} className="rounded-xl border border-white/15 bg-[#060914] px-3 py-2 text-sm text-white" placeholder="explanation.pattern" />
          <input value={draft.explanation.watch_out} onChange={(e) => updateDraft((n) => { n.explanation.watch_out = e.target.value; })} className="rounded-xl border border-white/15 bg-[#060914] px-3 py-2 text-sm text-white" placeholder="explanation.watch_out" />
          <input value={draft.hint.short} onChange={(e) => updateDraft((n) => { n.hint.short = e.target.value; })} className="rounded-xl border border-white/15 bg-[#060914] px-3 py-2 text-sm text-white" placeholder="hint.short (subtelnie: ton, kontekst, eliminacja)" />
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={draft.analytics.focus_label} onChange={(e) => updateDraft((n) => { n.analytics.focus_label = e.target.value; })} className="rounded-xl border border-white/15 bg-[#060914] px-3 py-2 text-sm text-white" placeholder="analytics.focus_label" />
            <input value={draft.analytics.skill} onChange={(e) => updateDraft((n) => { n.analytics.skill = e.target.value; })} className="rounded-xl border border-white/15 bg-[#060914] px-3 py-2 text-sm text-white" placeholder="analytics.skill" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => { void handleSave(); }} disabled={isSaving} className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? "Zapisywanie..." : editingId ? "Zapisz zmiany" : "Utworz"}</button>
          {editingId ? (<><button type="button" onClick={() => { void handleDeactivate(editingId); }} className="rounded-xl border border-rose-300/35 bg-rose-500/12 px-4 py-2.5 text-sm font-semibold text-rose-100">Dezaktywuj</button><button type="button" onClick={() => { void handleDeletePermanently(editingId); }} disabled={isDeletingQuestions} className="rounded-xl border border-rose-300/45 bg-rose-600/20 px-4 py-2.5 text-sm font-semibold text-rose-100 disabled:opacity-60">{isDeletingQuestions ? "Usuwanie..." : "Usun na stale"}</button></>) : null}
        </div>

        <div className="mt-3 space-y-2 rounded-xl border border-white/12 bg-[#070b18] p-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold tracking-wide text-indigo-100 uppercase">Wklej JSON</h4>
            <span className="text-[11px] text-gray-400">rekord, {'{ exercise }'} lub lista {'{ exercises }'}</span>
          </div>
          <p className="text-[11px] text-gray-500">Tip: generuj i zapisuj 1 exercise na raz (mniej bledow), potem kolejny.</p>
          <textarea
            value={jsonInput}
            onChange={(event) => setJsonInput(event.target.value)}
            className="min-h-[160px] w-full rounded-xl border border-white/15 bg-[#060914] px-3 py-2.5 text-xs text-gray-100"
            placeholder={`{
  "exercise": {
    "category": "reactions",
    "task_type": "single_choice_short",
    "...": "..."
  }
}`}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleLoadJsonToForm} className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white">
              Wczytaj do formularza
            </button>
            <button
              type="button"
              onClick={() => { void handleImportJsonList(); }}
              disabled={isImportingJson}
              className="rounded-lg border border-indigo-300/30 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-100 disabled:opacity-60"
            >
              {isImportingJson ? "Import..." : "Importuj liste JSON"}
            </button>
            <button type="button" onClick={handleFillJsonWithDraft} className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white">
              Wstaw aktualny draft
            </button>
            <button type="button" onClick={handleInsertFullJsonTemplate} className="rounded-lg border border-indigo-300/30 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-100">
              Wstaw pelny template AI
            </button>
            <button type="button" onClick={handleInsertReadingMcTemplate} className="rounded-lg border border-cyan-300/30 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-100">
              Template reading_mc
            </button>
            <button type="button" onClick={handleInsertGapFillTextTemplate} className="rounded-lg border border-cyan-300/30 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-100">
              Template gap_fill_text
            </button>
          </div>
        </div>

        {validationErrors.length > 0 ? <ul className="mt-3 space-y-1 rounded-xl border border-rose-300/25 bg-rose-500/10 p-3 text-xs text-rose-100">{validationErrors.map((item, index) => <li key={`${item}-${index}`}>- {item}</li>)}</ul> : null}

        <details className="mt-3 rounded-xl border border-white/10 bg-[#060914] p-3">
          <summary className="cursor-pointer text-xs font-semibold text-indigo-100">JSON preview</summary>
          <pre className="mt-2 overflow-x-auto text-[11px] text-gray-200">{jsonPreview}</pre>
        </details>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-200">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-200">{success}</p> : null}

      <div className="mt-6 rounded-2xl border border-white/10 bg-[#090d1f] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-indigo-100 uppercase">Pytania #lista ({visibleExercises.length})</h3>
            <p className="mt-1 text-xs text-gray-400">Pelna lista pytan do przegladania i sortowania, bez przyciecia do 200 rekordow.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 text-xs text-gray-300">
              <span>Sortowanie</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as ExerciseSortMode)}
                className="bg-transparent text-xs font-semibold text-white outline-none"
              >
                <option value="recently_updated" className="bg-[#090d1f] text-white">Ostatnio edytowane</option>
                <option value="recently_added" className="bg-[#090d1f] text-white">Recently added</option>
                <option value="category_asc" className="bg-[#090d1f] text-white">Kategoria A-Z</option>
                <option value="category_desc" className="bg-[#090d1f] text-white">Kategoria Z-A</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { void handleBulkUpdateVisibleStatus("active"); }} disabled={isUpdatingVisibleStatus || visibleExercises.length === 0} className="rounded-lg border border-emerald-300/35 bg-emerald-500/12 px-3 py-1.5 text-xs font-semibold text-emerald-100 disabled:opacity-55">
              {isUpdatingVisibleStatus ? "Aktualizacja..." : "Widoczne -> active"}
            </button>
            <button type="button" onClick={() => { void handleBulkUpdateVisibleStatus("draft"); }} disabled={isUpdatingVisibleStatus || visibleExercises.length === 0} className="rounded-lg border border-indigo-300/35 bg-indigo-500/12 px-3 py-1.5 text-xs font-semibold text-indigo-100 disabled:opacity-55">
              {isUpdatingVisibleStatus ? "Aktualizacja..." : "Widoczne -> draft"}
            </button>
            <button type="button" onClick={() => { void handleBulkUpdateVisibleStatus("archived"); }} disabled={isUpdatingVisibleStatus || visibleExercises.length === 0} className="rounded-lg border border-rose-300/35 bg-rose-500/12 px-3 py-1.5 text-xs font-semibold text-rose-100 disabled:opacity-55">
              {isUpdatingVisibleStatus ? "Aktualizacja..." : "Widoczne -> archived"}
            </button>
            <button type="button" onClick={selectAllVisibleExercises} className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white">Zaznacz wszystko (draft)</button>
            <label className="flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 text-xs text-gray-300">
              <span>Typ</span>
              <select
                value={selectionTaskType}
                onChange={(event) => setSelectionTaskType(event.target.value as ExerciseTaskType | "all")}
                className="bg-transparent text-xs font-semibold text-white outline-none"
              >
                <option value="all" className="bg-[#090d1f] text-white">Wszystkie</option>
                {EXERCISE_TASK_TYPES.map((taskType) => (
                  <option key={taskType} value={taskType} className="bg-[#090d1f] text-white">
                    {taskType}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={selectVisibleExercisesByTaskType} className="rounded-lg border border-indigo-300/30 bg-indigo-500/12 px-3 py-1.5 text-xs font-semibold text-indigo-100">
              {selectionTaskType === "all" ? "Zaznacz po typie" : `Zaznacz ${selectionTaskType}`}
            </button>
            <button type="button" onClick={clearVisibleSelections} className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white">Wyczysc zaznaczenie</button>
            <button type="button" onClick={() => { void handleDeleteSelectedPermanently(); }} disabled={isDeletingQuestions || selectedVisibleCount === 0} className="rounded-lg border border-rose-300/35 bg-rose-500/12 px-3 py-1.5 text-xs font-semibold text-rose-100 disabled:opacity-55">
              {isDeletingQuestions ? "Usuwanie..." : `Usun zaznaczone (${selectedVisibleCount})`}
            </button>
            <button type="button" onClick={() => { void handleLaunchSelectedQuiz(); }} disabled={isLaunchingQuiz || selectedVisibleCount === 0} className="rounded-lg border border-indigo-300/35 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-100 disabled:opacity-55">
              {isLaunchingQuiz ? "Uruchamianie..." : `Uruchom quiz (${selectedVisibleCount})`}
            </button>
            <button type="button" onClick={() => { void handleCreateSetFromSelected(); }} disabled={isCreatingSetFromSelection || selectedVisibleCount === 0} className="rounded-lg border border-emerald-300/35 bg-emerald-500/12 px-3 py-1.5 text-xs font-semibold text-emerald-100 disabled:opacity-55">
              {isCreatingSetFromSelection ? "Tworzenie setu..." : `Utworz set (${selectedVisibleCount})`}
            </button>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">Symulacja i sety z zaznaczonych wspieraja aktualnie single_choice_short i reading_mc. Set moze byc duzy, a quiz losuje z niego pytania przy starcie.</p>
        {isLoading ? (
          <div className="mt-3 flex items-center gap-2.5 text-sm text-gray-300">
            <Spinner size="sm" />
            <span>Ladowanie...</span>
          </div>
        ) : null}
        {!isLoading && visibleExercises.length === 0 ? <p className="mt-3 text-sm text-gray-300">Brak cwiczen.</p> : null}
        <div className="mt-3 space-y-2">
          {visibleExercises.map((exercise) => {
            const preview = exercise.title.trim().length > 0 ? exercise.title : getExercisePromptPreview(exercise);
            const promptPreview = truncateText(getExercisePromptPreview(exercise), 180);
            const isSelected = Boolean(selectedExerciseIds[exercise.id]);
            const isPersistedInDatabase = source !== "local" && !exercise.id.startsWith("local_ex_");

            return (
              <article key={exercise.id} className={`rounded-xl border p-3 transition-colors ${isSelected ? "border-indigo-300/35 bg-indigo-500/[0.08]" : "border-white/10 bg-[#090d1f]"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <label className="flex flex-1 cursor-pointer items-start gap-2">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleExerciseSelection(exercise.id)} className="mt-0.5 h-4 w-4 accent-indigo-500" />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-white">{preview || "(brak podgladu)"}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-indigo-100/68">{promptPreview || "(brak tresci pytania)"}</span>
                    </span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {isPersistedInDatabase ? (
                      <span className="rounded-lg border border-cyan-300/25 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-100">DB</span>
                    ) : null}
                    <span className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${statusClass(exercise.status)}`}>{exercise.status}</span>
                  </div>
                </div>
                <div className="mt-2 grid gap-1 text-[11px] text-gray-300 sm:grid-cols-2 lg:grid-cols-6">
                  <p>category: {exercise.category}</p>
                  <p>task_type: {exercise.task_type}</p>
                  <p>difficulty: {exercise.difficulty}</p>
                  <p>status: {exercise.status}</p>
                  <p>dodano: {formatDate(exercise.meta.created_at)}</p>
                  <p>updated: {formatDate(exercise.meta.updated_at)}</p>
                  <p>id: {exercise.id}</p>
                </div>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => startEdit(exercise)} className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white">Edytuj</button>
                  {exercise.status !== "archived" ? <button type="button" onClick={() => { void handleDeactivate(exercise.id); }} className="rounded-lg border border-rose-300/35 bg-rose-500/12 px-3 py-1.5 text-xs font-semibold text-rose-100">Dezaktywuj</button> : null}
                  <button type="button" onClick={() => { void handleDeletePermanently(exercise.id); }} disabled={isDeletingQuestions} className="rounded-lg border border-rose-300/45 bg-rose-600/20 px-3 py-1.5 text-xs font-semibold text-rose-100 disabled:opacity-55">Usun</button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-gray-300">
        {(Object.keys(CATEGORY_TO_TASK_TYPE) as ExerciseCategory[]).map((category) => (
          <p key={category}>{category} {"->"} {CATEGORY_TO_TASK_TYPE[category]}</p>
        ))}
      </div>
    </section>
  );
}





















