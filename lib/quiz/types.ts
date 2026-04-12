export type QuizMode = "reactions" | "grammar" | "vocabulary" | string;

export type QuizQuestionType = "single_question" | "reading_mc" | "gap_fill_text";

export type QuizOption = {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
};

export type QuizQuestionItem = {
  id: string;
  prompt: string;
  options: QuizOption[];
};

export type QuizQuestionBase = {
  id: string;
  mode: QuizMode;
  category: string;
  explanation: string;
  hintText?: string;
  patternTip?: string;
  warningTip?: string;
};

export type QuizSingleQuestion = QuizQuestionBase & {
  type: "single_question";
  prompt: string;
  options: QuizOption[];
};

export type QuizReadingMcQuestion = QuizQuestionBase & {
  type: "reading_mc";
  title?: string;
  passage: string;
  passageTranslation?: string;
  questions: QuizQuestionItem[];
};

export type QuizGapFillTextQuestion = QuizQuestionBase & {
  type: "gap_fill_text";
  title?: string;
  passage: string;
  passageTranslation?: string;
  questions: QuizQuestionItem[];
};

export type QuizQuestion = QuizSingleQuestion | QuizReadingMcQuestion | QuizGapFillTextQuestion;

export type QuizAnswerSnapshot = {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
};

export type QuizSessionPayload = {
  sessionId: string;
  mode: QuizMode;
  setId?: string;
  status?: "in_progress" | "completed" | string;
  questions: QuizQuestion[];
  answers: QuizAnswerSnapshot[];
};

export type CategoryBreakdownItem = {
  label: string;
  attempts: number;
  correct: number;
  percent: number | null;
  has_data: boolean;
};

export type QuizSummary = {
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  strongestArea?: string;
  weakestArea?: string;
  categoryBreakdown: CategoryBreakdownItem[];
};
