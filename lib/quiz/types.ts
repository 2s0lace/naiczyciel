export type QuizMode = "reactions" | "grammar" | "vocabulary" | string;

export type QuizOption = {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
};

export type QuizQuestion = {
  id: string;
  mode: QuizMode;
  category: string;
  prompt: string;
  explanation: string;
  patternTip?: string;
  warningTip?: string;
  options: QuizOption[];
};

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

export type QuizSummary = {
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  strongestArea?: string;
  weakestArea?: string;
};
