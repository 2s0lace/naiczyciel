import type { ExerciseTaskType, UniversalExerciseRecord } from "@/lib/quiz/admin-exercise";
import type { QuizQuestion } from "@/lib/quiz/types";

const QUIZ_COMPATIBLE_TASK_TYPES: ExerciseTaskType[] = ["single_choice_short", "reading_mc"];

type SimulationSkipReason =
  | "unsupported_task_type"
  | "missing_prompt"
  | "invalid_options"
  | "invalid_correct_answer";

export type SimulationSkippedExercise = {
  id: string;
  taskType: ExerciseTaskType;
  reason: SimulationSkipReason;
};

export type SimulationBuildResult = {
  questions: QuizQuestion[];
  skipped: SimulationSkippedExercise[];
};

function categoryToLabel(category: string): string {
  switch (category) {
    case "reactions":
      return "Reakcje";
    case "vocabulary":
      return "Slownictwo";
    case "grammar":
      return "Gramatyka";
    case "gap_fill_text":
      return "Uzupelnianie tekstu";
    case "reading_mc":
      return "Czytanie";
    case "gap_fill_word_bank":
      return "Bank slow";
    default:
      return category;
  }
}

function pickPrompt(exercise: UniversalExerciseRecord): string {
  if (exercise.task_type === "single_choice_short") {
    return exercise.content.prompt.trim();
  }

  if (exercise.task_type === "reading_mc") {
    const passage = exercise.content.passage.trim();
    const question = exercise.content.question.trim();
    const title = (exercise.content.title ?? "").trim();

    return [title, passage, question ? `Pytanie: ${question}` : ""].filter((part) => part.length > 0).join("\n\n");
  }

  return "";
}

function buildOptions(exercise: UniversalExerciseRecord) {
  if (exercise.task_type !== "single_choice_short" && exercise.task_type !== "reading_mc") {
    return [];
  }

  const source = exercise.content.options.slice(0, 3);

  return source.map((option, index) => ({
    id: option.id,
    label: ["A", "B", "C"][index] ?? option.id,
    text: option.text,
    isCorrect: option.id === exercise.correct_answer.option_id,
  }));
}

export function buildQuizQuestionsFromExercises(exercises: UniversalExerciseRecord[]): SimulationBuildResult {
  const questions: QuizQuestion[] = [];
  const skipped: SimulationSkippedExercise[] = [];

  for (const exercise of exercises) {
    if (!QUIZ_COMPATIBLE_TASK_TYPES.includes(exercise.task_type)) {
      skipped.push({
        id: exercise.id,
        taskType: exercise.task_type,
        reason: "unsupported_task_type",
      });
      continue;
    }

    const prompt = pickPrompt(exercise);

    if (!prompt) {
      skipped.push({
        id: exercise.id,
        taskType: exercise.task_type,
        reason: "missing_prompt",
      });
      continue;
    }

    const options = buildOptions(exercise).filter((option) => option.text.trim().length > 0);

    if (options.length !== 3) {
      skipped.push({
        id: exercise.id,
        taskType: exercise.task_type,
        reason: "invalid_options",
      });
      continue;
    }

    if (!options.some((option) => option.isCorrect)) {
      skipped.push({
        id: exercise.id,
        taskType: exercise.task_type,
        reason: "invalid_correct_answer",
      });
      continue;
    }

    questions.push({
      id: exercise.id,
      mode: exercise.category,
      category: exercise.analytics.focus_label.trim() || categoryToLabel(exercise.category),
      prompt,
      explanation: exercise.explanation.why.trim() || "Sprawdz poprawna reakcje i kontekst wypowiedzi.",
      patternTip: exercise.explanation.pattern.trim(),
      warningTip: exercise.explanation.watch_out.trim(),
      options,
    });
  }

  return {
    questions,
    skipped,
  };
}

export function toSimulationMode(exercises: UniversalExerciseRecord[]): string {
  const categories = Array.from(new Set(exercises.map((exercise) => exercise.category)));

  if (categories.length === 1) {
    return categories[0] ?? "reactions";
  }

  return "mixed";
}


