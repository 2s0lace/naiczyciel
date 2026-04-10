import type { ExerciseTaskType, UniversalExerciseRecord } from "@/lib/quiz/admin-exercise";
import type { QuizQuestion } from "@/lib/quiz/types";

const QUIZ_COMPATIBLE_TASK_TYPES: ExerciseTaskType[] = ["single_choice_short", "reading_mc", "gap_fill_text"];

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

    const baseQuestion = {
      id: exercise.id,
      mode: exercise.category,
      category: exercise.analytics.focus_label.trim() || categoryToLabel(exercise.category),
      explanation: exercise.explanation.why.trim() || "Sprawdz poprawna reakcje i kontekst wypowiedzi.",
      hintText: exercise.hint.short.trim(),
      patternTip: exercise.explanation.pattern.trim(),
      warningTip: exercise.explanation.watch_out.trim(),
    };

    if (exercise.task_type === "single_choice_short") {
      const prompt = exercise.content.prompt.trim();
      const options = exercise.content.options.slice(0, 3).map((option, index) => ({
        id: option.id,
        label: ["A", "B", "C"][index] ?? option.id,
        text: option.text,
        isCorrect: option.id === exercise.correct_answer.option_id,
      }));

      if (!prompt) {
        skipped.push({ id: exercise.id, taskType: exercise.task_type, reason: "missing_prompt" });
        continue;
      }

      if (options.length !== 3) {
        skipped.push({ id: exercise.id, taskType: exercise.task_type, reason: "invalid_options" });
        continue;
      }

      if (!options.some((option) => option.isCorrect)) {
        skipped.push({ id: exercise.id, taskType: exercise.task_type, reason: "invalid_correct_answer" });
        continue;
      }

      questions.push({
        ...baseQuestion,
        type: "single_question",
        prompt,
        options,
      });
      continue;
    }

    if (exercise.task_type === "reading_mc") {
      const groupedQuestions = (exercise.content.questions ?? []).map((question) => ({
        id: `${exercise.id}::${question.id}`,
        prompt: question.question,
        options: question.options.slice(0, 3).map((option, index) => ({
          id: option.id,
          label: ["A", "B", "C"][index] ?? option.id,
          text: option.text,
          isCorrect: option.id === (exercise.correct_answer.questions?.find((answer) => answer.id === question.id)?.option_id ?? ""),
        })),
      }));

      if (!exercise.content.passage.trim() || groupedQuestions.length === 0) {
        skipped.push({ id: exercise.id, taskType: exercise.task_type, reason: "missing_prompt" });
        continue;
      }

      if (groupedQuestions.some((question) => question.options.length !== 3)) {
        skipped.push({ id: exercise.id, taskType: exercise.task_type, reason: "invalid_options" });
        continue;
      }

      if (groupedQuestions.some((question) => !question.options.some((option) => option.isCorrect))) {
        skipped.push({ id: exercise.id, taskType: exercise.task_type, reason: "invalid_correct_answer" });
        continue;
      }

      questions.push({
        ...baseQuestion,
        type: "reading_mc",
        title: exercise.content.title?.trim() || undefined,
        passage: exercise.content.passage.trim(),
        questions: groupedQuestions,
      });
      continue;
    }

    if (exercise.task_type === "gap_fill_text") {
      const groupedQuestions = (exercise.content.questions ?? []).map((question) => ({
        id: `${exercise.id}::${question.id}`,
        prompt: question.question,
        options: question.options.slice(0, 3).map((option, index) => ({
          id: option.id,
          label: ["A", "B", "C"][index] ?? option.id,
          text: option.text,
          isCorrect: option.id === (exercise.correct_answer.questions?.find((answer) => answer.id === question.id)?.option_id ?? ""),
        })),
      }));

      if (!exercise.content.text.trim() || groupedQuestions.length === 0) {
        skipped.push({ id: exercise.id, taskType: exercise.task_type, reason: "missing_prompt" });
        continue;
      }

      if (groupedQuestions.some((question) => question.options.length !== 3)) {
        skipped.push({ id: exercise.id, taskType: exercise.task_type, reason: "invalid_options" });
        continue;
      }

      if (groupedQuestions.some((question) => !question.options.some((option) => option.isCorrect))) {
        skipped.push({ id: exercise.id, taskType: exercise.task_type, reason: "invalid_correct_answer" });
        continue;
      }

      questions.push({
        ...baseQuestion,
        type: "gap_fill_text",
        title: exercise.content.title?.trim() || undefined,
        passage: exercise.content.text.trim(),
        questions: groupedQuestions,
      });
      continue;
    }

    skipped.push({
      id: exercise.id,
      taskType: exercise.task_type,
      reason: "unsupported_task_type",
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


