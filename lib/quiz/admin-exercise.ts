export const EXERCISE_CATEGORIES = [
  "reactions",
  "vocabulary",
  "grammar",
  "gap_fill_text",
  "reading_mc",
  "gap_fill_word_bank",
] as const;

export const EXERCISE_TASK_TYPES = [
  "single_choice_short",
  "gap_fill_text",
  "reading_mc",
  "gap_fill_word_bank",
] as const;

export const EXERCISE_STATUSES = ["draft", "active", "archived"] as const;
export const EXERCISE_DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];
export type ExerciseTaskType = (typeof EXERCISE_TASK_TYPES)[number];
export type ExerciseStatus = (typeof EXERCISE_STATUSES)[number];
export type ExerciseDifficulty = (typeof EXERCISE_DIFFICULTIES)[number];

export type ExerciseOption = {
  id: string;
  text: string;
};

export type ExerciseExplanation = {
  why: string;
  pattern: string;
  watch_out: string;
};

export type ExerciseHint = {
  short: string;
};

export type ExerciseAnalytics = {
  focus_label: string;
  skill: string;
};

export type ExerciseGrammar = {
  structures: string[];
  tenses: string[];
};

export type ExerciseVocabulary = {
  topic: string;
  key_words: string[];
};

export type ExerciseMeta = {
  created_at: string;
  updated_at: string;
};

export type SingleChoiceShortContent = {
  prompt: string;
  options: ExerciseOption[];
};

export type SingleChoiceShortAnswer = {
  option_id: string;
};

export type ExerciseChoiceQuestion = {
  id: string;
  question: string;
  options: ExerciseOption[];
};

export type ExerciseChoiceAnswer = {
  id: string;
  option_id: string;
};

export type GapFillTextBlank = {
  id: string;
  placeholder: string;
  accepted_answers: string[];
};

export type GapFillTextContent = {
  title?: string;
  text: string;
  prompt_en?: string;
  prompt_pl?: string;
  questions?: ExerciseChoiceQuestion[];
  blanks: GapFillTextBlank[];
};

export type GapFillTextAnswer = {
  questions?: ExerciseChoiceAnswer[];
  blanks: Array<{
    id: string;
    accepted_answers: string[];
  }>;
};

export type ReadingMcContent = {
  title?: string;
  passage: string;
  prompt_en?: string;
  prompt_pl?: string;
  question?: string;
  options?: ExerciseOption[];
  questions?: ExerciseChoiceQuestion[];
};

export type ReadingMcAnswer = {
  option_id?: string;
  questions?: ExerciseChoiceAnswer[];
};

export type GapFillWordBankBlank = {
  id: string;
  placeholder: string;
};

export type GapFillWordBankContent = {
  title?: string;
  text: string;
  word_bank: string[];
  blanks: GapFillWordBankBlank[];
};

export type GapFillWordBankAnswer = {
  blanks: Array<{
    id: string;
    word: string;
  }>;
};

export type UniversalExerciseBase = {
  id: string;
  status: ExerciseStatus;
  category: ExerciseCategory;
  task_type: ExerciseTaskType;
  difficulty: ExerciseDifficulty;
  tags: string[];
  source: string;
  is_public: boolean;
  title: string;
  instruction: string;
  explanation: ExerciseExplanation;
  hint: ExerciseHint;
  analytics: ExerciseAnalytics;
  grammar: ExerciseGrammar;
  vocabulary: ExerciseVocabulary;
  meta: ExerciseMeta;
};

export type SingleChoiceShortExercise = UniversalExerciseBase & {
  task_type: "single_choice_short";
  content: SingleChoiceShortContent;
  correct_answer: SingleChoiceShortAnswer;
};

export type GapFillTextExercise = UniversalExerciseBase & {
  task_type: "gap_fill_text";
  content: GapFillTextContent;
  correct_answer: GapFillTextAnswer;
};

export type ReadingMcExercise = UniversalExerciseBase & {
  task_type: "reading_mc";
  content: ReadingMcContent;
  correct_answer: ReadingMcAnswer;
};

export type GapFillWordBankExercise = UniversalExerciseBase & {
  task_type: "gap_fill_word_bank";
  content: GapFillWordBankContent;
  correct_answer: GapFillWordBankAnswer;
};

export type UniversalExerciseRecord =
  | SingleChoiceShortExercise
  | GapFillTextExercise
  | ReadingMcExercise
  | GapFillWordBankExercise;

export const CATEGORY_TO_TASK_TYPE: Record<ExerciseCategory, ExerciseTaskType> = {
  reactions: "single_choice_short",
  vocabulary: "single_choice_short",
  grammar: "single_choice_short",
  gap_fill_text: "gap_fill_text",
  reading_mc: "reading_mc",
  gap_fill_word_bank: "gap_fill_word_bank",
};

export const TASK_TYPE_TO_DEFAULT_CATEGORY: Record<ExerciseTaskType, ExerciseCategory> = {
  single_choice_short: "reactions",
  gap_fill_text: "gap_fill_text",
  reading_mc: "reading_mc",
  gap_fill_word_bank: "gap_fill_word_bank",
};

export function isExerciseCategory(value: string): value is ExerciseCategory {
  return (EXERCISE_CATEGORIES as readonly string[]).includes(value);
}

export function isExerciseTaskType(value: string): value is ExerciseTaskType {
  return (EXERCISE_TASK_TYPES as readonly string[]).includes(value);
}

export function isExerciseStatus(value: string): value is ExerciseStatus {
  return (EXERCISE_STATUSES as readonly string[]).includes(value);
}

export function isExerciseDifficulty(value: string): value is ExerciseDifficulty {
  return (EXERCISE_DIFFICULTIES as readonly string[]).includes(value);
}

export function isValidCategoryTaskTypePair(category: ExerciseCategory, taskType: ExerciseTaskType) {
  return CATEGORY_TO_TASK_TYPE[category] === taskType;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEnumKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^\w]/g, "");
}

function normalizeExerciseCategory(value: string): ExerciseCategory | null {
  if (!value) {
    return null;
  }

  const normalized = normalizeEnumKey(value);

  const alias: Record<string, ExerciseCategory> = {
    reactions: "reactions",
    reaction: "reactions",
    reakcje: "reactions",
    vocabulary: "vocabulary",
    vocab: "vocabulary",
    slownictwo: "vocabulary",
    grammar: "grammar",
    gramatyka: "grammar",
    gap_fill_text: "gap_fill_text",
    gapfilltext: "gap_fill_text",
    open_cloze: "gap_fill_text",
    reading_mc: "reading_mc",
    reading: "reading_mc",
    czytanie: "reading_mc",
    gap_fill_word_bank: "gap_fill_word_bank",
    word_bank: "gap_fill_word_bank",
    gapfillwordbank: "gap_fill_word_bank",
  };

  const mapped = alias[normalized];
  return mapped ?? (isExerciseCategory(normalized) ? normalized : null);
}

function normalizeExerciseTaskType(value: string): ExerciseTaskType | null {
  if (!value) {
    return null;
  }

  const normalized = normalizeEnumKey(value);

  const alias: Record<string, ExerciseTaskType> = {
    single_choice_short: "single_choice_short",
    single_choice: "single_choice_short",
    singlechoice: "single_choice_short",
    multiple_choice: "single_choice_short",
    mcq: "single_choice_short",
    gap_fill_text: "gap_fill_text",
    gapfilltext: "gap_fill_text",
    cloze: "gap_fill_text",
    reading_mc: "reading_mc",
    reading: "reading_mc",
    reading_multiple_choice: "reading_mc",
    gap_fill_word_bank: "gap_fill_word_bank",
    word_bank: "gap_fill_word_bank",
    gapfillwordbank: "gap_fill_word_bank",
  };

  const mapped = alias[normalized];
  return mapped ?? (isExerciseTaskType(normalized) ? normalized : null);
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asText(item))
    .filter((item, index, arr) => item.length > 0 && arr.indexOf(item) === index);
}

function normalizeOptions(rawOptions: unknown, exactCount?: number): ExerciseOption[] {
  const source = Array.isArray(rawOptions) ? rawOptions : [];

  const normalized = source
    .map((entry, index) => {
      const record = asRecord(entry);

      if (!record) {
        return null;
      }

      const id = asText(record.id) || String.fromCharCode(65 + index);
      const text = asText(record.text);

      if (!text) {
        return null;
      }

      return { id, text };
    })
    .filter((item): item is ExerciseOption => Boolean(item));

  if (typeof exactCount === "number") {
    return normalized.slice(0, exactCount);
  }

  return normalized;
}

function normalizeChoiceQuestions(rawQuestions: unknown): ExerciseChoiceQuestion[] {
  const source = Array.isArray(rawQuestions) ? rawQuestions : [];

  return source
    .map((entry, index) => {
      const record = asRecord(entry);

      if (!record) {
        return null;
      }

      const id = asText(record.id) || `${index + 1}`;
      const question = asText(record.question);
      const options = normalizeOptions(record.options, 3);

      if (!question || options.length !== 3) {
        return null;
      }

      return {
        id,
        question,
        options,
      } satisfies ExerciseChoiceQuestion;
    })
    .filter((item): item is ExerciseChoiceQuestion => Boolean(item));
}

function normalizeChoiceAnswers(rawAnswers: unknown): ExerciseChoiceAnswer[] {
  const source = Array.isArray(rawAnswers) ? rawAnswers : [];

  return source
    .map((entry, index) => {
      const record = asRecord(entry);

      if (!record) {
        return null;
      }

      const id = asText(record.id) || `${index + 1}`;
      const optionId = asText(record.option_id);

      if (!optionId) {
        return null;
      }

      return {
        id,
        option_id: optionId,
      } satisfies ExerciseChoiceAnswer;
    })
    .filter((item): item is ExerciseChoiceAnswer => Boolean(item));
}

function nowIso() {
  return new Date().toISOString();
}

export function createEmptyExercise(category: ExerciseCategory = "reactions"): UniversalExerciseRecord {
  const taskType = CATEGORY_TO_TASK_TYPE[category];
  const timestamp = nowIso();

  const common = {
    id: `local_ex_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: "draft" as const,
    category,
    task_type: taskType,
    difficulty: "easy" as const,
    tags: [],
    source: "internal",
    is_public: true,
    title: "",
    instruction: taskType === "single_choice_short" ? "Choose the best answer." : "Complete the task.",
    explanation: {
      why: "",
      pattern: "",
      watch_out: "",
    },
    hint: {
      short: "",
    },
    analytics: {
      focus_label: "",
      skill: "",
    },
    grammar: {
      structures: [],
      tenses: [],
    },
    vocabulary: {
      topic: "",
      key_words: [],
    },
    meta: {
      created_at: timestamp,
      updated_at: timestamp,
    },
  };

  if (taskType === "single_choice_short") {
    return {
      ...common,
      task_type: "single_choice_short",
      content: {
        prompt: "",
        options: [
          { id: "A", text: "" },
          { id: "B", text: "" },
          { id: "C", text: "" },
        ],
      },
      correct_answer: {
        option_id: "A",
      },
    };
  }

  if (taskType === "gap_fill_text") {
    return {
      ...common,
      task_type: "gap_fill_text",
      content: {
        title: "",
        text: "",
        questions: [
          {
            id: "1",
            question: "Gap 1",
            options: [
              { id: "A", text: "" },
              { id: "B", text: "" },
              { id: "C", text: "" },
            ],
          },
        ],
        blanks: [],
      },
      correct_answer: {
        questions: [{ id: "1", option_id: "A" }],
        blanks: [],
      },
    };
  }

  if (taskType === "reading_mc") {
    return {
      ...common,
      task_type: "reading_mc",
      content: {
        title: "",
        passage: "",
        questions: [
          {
            id: "1",
            question: "",
            options: [
              { id: "A", text: "" },
              { id: "B", text: "" },
              { id: "C", text: "" },
            ],
          },
        ],
      },
      correct_answer: {
        questions: [{ id: "1", option_id: "A" }],
      },
    };
  }

  return {
    ...common,
    task_type: "gap_fill_word_bank",
    content: {
      title: "",
      text: "",
      word_bank: [],
      blanks: [{ id: "blank_1", placeholder: "___" }],
    },
    correct_answer: {
      blanks: [{ id: "blank_1", word: "" }],
    },
  };
}

export type ExerciseValidationResult = {
  isValid: boolean;
  errors: string[];
  exercise: UniversalExerciseRecord | null;
};

export function validateExerciseRecord(raw: unknown): ExerciseValidationResult {
  const errors: string[] = [];
  const record = asRecord(raw);

  if (!record) {
    return { isValid: false, errors: ["Invalid exercise payload."], exercise: null };
  }

  const rawCategory = asText(record.category);
  const rawTaskType = asText(record.task_type);
  let category = normalizeExerciseCategory(rawCategory);
  let taskType = normalizeExerciseTaskType(rawTaskType);

  if (!category && taskType) {
    category = TASK_TYPE_TO_DEFAULT_CATEGORY[taskType];
  }

  if (!taskType && category) {
    taskType = CATEGORY_TO_TASK_TYPE[category];
  }

  if (!category) {
    errors.push("category must be one of supported values.");
  }

  if (!taskType) {
    errors.push("task_type must be one of supported values.");
  }

  if (errors.length > 0) {
    return { isValid: false, errors, exercise: null };
  }

  if (category && taskType && !isValidCategoryTaskTypePair(category, taskType)) {
    taskType = CATEGORY_TO_TASK_TYPE[category];
  }

  const statusRaw = asText(record.status) || "draft";
  const difficultyRaw = asText(record.difficulty) || "easy";

  if (!isExerciseStatus(statusRaw)) {
    errors.push("status is invalid.");
  }

  if (!isExerciseDifficulty(difficultyRaw)) {
    errors.push("difficulty is invalid.");
  }

  const explanationRecord = asRecord(record.explanation);
  const hintRecord = asRecord(record.hint);
  const analyticsRecord = asRecord(record.analytics);
  const grammarRecord = asRecord(record.grammar);
  const vocabularyRecord = asRecord(record.vocabulary);
  const metaRecord = asRecord(record.meta);

  const why = asText(explanationRecord?.why);
  const pattern = asText(explanationRecord?.pattern);
  const watchOut = asText(explanationRecord?.watch_out);

  if (!why) {
    errors.push("explanation.why is required.");
  }

  if (!pattern) {
    errors.push("explanation.pattern is required.");
  }

  if (!watchOut) {
    errors.push("explanation.watch_out is required.");
  }

  const hintShort = asText(hintRecord?.short);

  if (!hintShort) {
    errors.push("hint.short is required.");
  }

  const contentRecord = asRecord(record.content) ?? {};
  const correctRecord = asRecord(record.correct_answer) ?? {};

  let normalizedContent: unknown;
  let normalizedAnswer: unknown;

  if (taskType === "single_choice_short") {
    const prompt = asText(contentRecord.prompt);
    const options = normalizeOptions(contentRecord.options, 3);
    const optionId = asText(correctRecord.option_id);

    if (!prompt) {
      errors.push("content.prompt is required.");
    }

    if (options.length !== 3) {
      errors.push("single_choice_short must have exactly 3 options.");
    }

    const optionIds = new Set(options.map((opt) => opt.id));

    if (!optionId) {
      errors.push("correct_answer.option_id is required.");
    } else if (!optionIds.has(optionId)) {
      errors.push("correct_answer.option_id must match one option.");
    }

    normalizedContent = {
      prompt,
      options,
    } satisfies SingleChoiceShortContent;

    normalizedAnswer = {
      option_id: optionId || options[0]?.id || "A",
    } satisfies SingleChoiceShortAnswer;
  } else if (taskType === "reading_mc") {
    const title = asText(contentRecord.title);
    const passage = asText(contentRecord.passage);
    const legacyQuestion = asText(contentRecord.question);
    const legacyOptions = normalizeOptions(contentRecord.options, 3);
    const legacyOptionId = asText(correctRecord.option_id);
    const questions = normalizeChoiceQuestions(contentRecord.questions);
    const questionAnswers = normalizeChoiceAnswers(correctRecord.questions);
    const usesQuestionGroups = questions.length > 0 || questionAnswers.length > 0;

    if (!passage) {
      errors.push("content.passage is required.");
    }

    if (usesQuestionGroups) {
      if (questions.length < 1) {
        errors.push("reading_mc must have at least 1 question.");
      }

      if (questionAnswers.length < 1) {
        errors.push("correct_answer.questions is required for reading_mc.");
      }

      const questionMap = new Map(questions.map((item) => [item.id, item]));

      for (const item of questions) {
        if (item.options.length !== 3) {
          errors.push(`reading_mc question ${item.id} must have exactly 3 options.`);
        }
      }

      for (const answer of questionAnswers) {
        const matchingQuestion = questionMap.get(answer.id);

        if (!matchingQuestion) {
          errors.push(`reading_mc answer ${answer.id} must match one question.`);
          continue;
        }

        const optionIds = new Set(matchingQuestion.options.map((option) => option.id));

        if (!optionIds.has(answer.option_id)) {
          errors.push(`reading_mc answer ${answer.id} must match one option.`);
        }
      }
    } else {
      if (!legacyQuestion) {
        errors.push("content.question is required.");
      }

      if (legacyOptions.length !== 3) {
        errors.push("reading_mc must have exactly 3 options.");
      }

      const optionIds = new Set(legacyOptions.map((opt) => opt.id));

      if (!legacyOptionId) {
        errors.push("correct_answer.option_id is required.");
      } else if (!optionIds.has(legacyOptionId)) {
        errors.push("correct_answer.option_id must match one option.");
      }
    }

    normalizedContent = {
      title,
      passage,
      question: legacyQuestion,
      options: legacyOptions,
      questions: usesQuestionGroups
        ? questions
        : legacyQuestion && legacyOptions.length === 3
          ? [
              {
                id: "1",
                question: legacyQuestion,
                options: legacyOptions,
              },
            ]
          : [],
    } satisfies ReadingMcContent;

    normalizedAnswer = {
      option_id: legacyOptionId || legacyOptions[0]?.id || "A",
      questions: usesQuestionGroups
        ? questionAnswers
        : legacyQuestion && legacyOptions.length === 3
          ? [{ id: "1", option_id: legacyOptionId || legacyOptions[0]?.id || "A" }]
          : [],
    } satisfies ReadingMcAnswer;
  } else if (taskType === "gap_fill_text") {
    const title = asText(contentRecord.title);
    const text = asText(contentRecord.text);
    const questions = normalizeChoiceQuestions(contentRecord.questions);
    const questionAnswers = normalizeChoiceAnswers(correctRecord.questions);
    const rawBlanks = Array.isArray(contentRecord.blanks) ? contentRecord.blanks : [];

    const blanks = rawBlanks
      .map((item, index) => {
        const blank = asRecord(item);

        if (!blank) {
          return null;
        }

        const id = asText(blank.id) || `blank_${index + 1}`;
        const placeholder = asText(blank.placeholder) || "___";
        const acceptedAnswers = asStringArray(blank.accepted_answers);

        return {
          id,
          placeholder,
          accepted_answers: acceptedAnswers,
        } satisfies GapFillTextBlank;
      })
      .filter((item): item is GapFillTextBlank => Boolean(item));

    if (!text) {
      errors.push("content.text is required.");
    }

    const rawAnswerBlanks = Array.isArray(correctRecord.blanks) ? correctRecord.blanks : [];
    const answerBlanks = rawAnswerBlanks
      .map((item, index) => {
        const blank = asRecord(item);

        if (!blank) {
          return null;
        }

        const id = asText(blank.id) || blanks[index]?.id || `blank_${index + 1}`;
        const acceptedAnswers = asStringArray(blank.accepted_answers);

        return {
          id,
          accepted_answers: acceptedAnswers,
        };
      })
      .filter((item): item is { id: string; accepted_answers: string[] } => Boolean(item));

    const usesQuestionGroups = questions.length > 0 || questionAnswers.length > 0;

    if (usesQuestionGroups) {
      if (questions.length < 1) {
        errors.push("gap_fill_text must have at least 1 question.");
      }

      if (questionAnswers.length < 1) {
        errors.push("correct_answer.questions is required for gap_fill_text.");
      }

      const questionMap = new Map(questions.map((item) => [item.id, item]));

      for (const item of questions) {
        if (item.options.length !== 3) {
          errors.push(`gap_fill_text question ${item.id} must have exactly 3 options.`);
        }
      }

      for (const answer of questionAnswers) {
        const matchingQuestion = questionMap.get(answer.id);

        if (!matchingQuestion) {
          errors.push(`gap_fill_text answer ${answer.id} must match one question.`);
          continue;
        }

        const optionIds = new Set(matchingQuestion.options.map((option) => option.id));

        if (!optionIds.has(answer.option_id)) {
          errors.push(`gap_fill_text answer ${answer.id} must match one option.`);
        }
      }
    } else {
      if (blanks.length < 1) {
        errors.push("gap_fill_text must have at least 1 blank.");
      }

      if (blanks.some((blank) => blank.accepted_answers.length === 0)) {
        errors.push("Each gap_fill_text blank must have accepted_answers.");
      }

      if (answerBlanks.length < 1) {
        errors.push("correct_answer.blanks is required for gap_fill_text.");
      }

      if (answerBlanks.some((blank) => blank.accepted_answers.length === 0)) {
        errors.push("Each correct_answer blank must include accepted_answers.");
      }
    }

    normalizedContent = {
      title,
      text,
      questions,
      blanks,
    } satisfies GapFillTextContent;

    normalizedAnswer = {
      questions: questionAnswers,
      blanks: answerBlanks,
    } satisfies GapFillTextAnswer;
  } else {
    const title = asText(contentRecord.title);
    const text = asText(contentRecord.text);
    const wordBank = asStringArray(contentRecord.word_bank);
    const rawBlanks = Array.isArray(contentRecord.blanks) ? contentRecord.blanks : [];

    const blanks = rawBlanks
      .map((item, index) => {
        const blank = asRecord(item);

        if (!blank) {
          return null;
        }

        const id = asText(blank.id) || `blank_${index + 1}`;
        const placeholder = asText(blank.placeholder) || "___";

        return {
          id,
          placeholder,
        } satisfies GapFillWordBankBlank;
      })
      .filter((item): item is GapFillWordBankBlank => Boolean(item));

    if (!text) {
      errors.push("content.text is required.");
    }

    if (blanks.length < 1) {
      errors.push("gap_fill_word_bank must have at least 1 blank.");
    }

    if (wordBank.length < 1) {
      errors.push("gap_fill_word_bank must have a word_bank.");
    }

    const rawAnswerBlanks = Array.isArray(correctRecord.blanks) ? correctRecord.blanks : [];
    const answerBlanks = rawAnswerBlanks
      .map((item, index) => {
        const blank = asRecord(item);

        if (!blank) {
          return null;
        }

        const id = asText(blank.id) || blanks[index]?.id || `blank_${index + 1}`;
        const word = asText(blank.word);

        return {
          id,
          word,
        };
      })
      .filter((item): item is { id: string; word: string } => Boolean(item));

    if (answerBlanks.length < 1) {
      errors.push("correct_answer.blanks is required for gap_fill_word_bank.");
    }

    if (answerBlanks.some((blank) => !blank.word)) {
      errors.push("Each gap_fill_word_bank answer blank must include word.");
    }

    if (answerBlanks.some((blank) => blank.word && !wordBank.includes(blank.word))) {
      errors.push("Each selected answer word must exist in word_bank.");
    }

    normalizedContent = {
      title,
      text,
      word_bank: wordBank,
      blanks,
    } satisfies GapFillWordBankContent;

    normalizedAnswer = {
      blanks: answerBlanks,
    } satisfies GapFillWordBankAnswer;
  }

  const timestamp = nowIso();
  const createdAt = asText(metaRecord?.created_at) || timestamp;
  const updatedAt = timestamp;

  const normalizedBase = {
    id: asText(record.id) || `ex_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: (isExerciseStatus(statusRaw) ? statusRaw : "draft") as ExerciseStatus,
    category,
    task_type: taskType,
    difficulty: (isExerciseDifficulty(difficultyRaw) ? difficultyRaw : "easy") as ExerciseDifficulty,
    tags: asStringArray(record.tags),
    source: asText(record.source) || "internal",
    is_public: asBoolean(record.is_public, true),
    title: asText(record.title),
    instruction: asText(record.instruction) || (taskType === "single_choice_short" ? "Choose the best answer." : "Complete the task."),
    explanation: {
      why,
      pattern,
      watch_out: watchOut,
    },
    hint: {
      short: hintShort,
    },
    analytics: {
      focus_label: asText(analyticsRecord?.focus_label),
      skill: asText(analyticsRecord?.skill),
    },
    grammar: {
      structures: asStringArray(grammarRecord?.structures),
      tenses: asStringArray(grammarRecord?.tenses),
    },
    vocabulary: {
      topic: asText(vocabularyRecord?.topic),
      key_words: asStringArray(vocabularyRecord?.key_words),
    },
    meta: {
      created_at: createdAt,
      updated_at: updatedAt,
    },
  };

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      exercise: null,
    };
  }

  const normalizedExercise = {
    ...normalizedBase,
    content: normalizedContent,
    correct_answer: normalizedAnswer,
  } as UniversalExerciseRecord;

  return {
    isValid: true,
    errors: [],
    exercise: normalizedExercise,
  };
}

export type ExerciseListFilters = {
  category?: ExerciseCategory | "all";
  task_type?: ExerciseTaskType | "all";
  status?: ExerciseStatus | "all";
  difficulty?: ExerciseDifficulty | "all";
  limit?: number;
};

export function getExercisePromptPreview(exercise: UniversalExerciseRecord): string {
  if (exercise.task_type === "single_choice_short") {
    return exercise.content.prompt;
  }

  if (exercise.task_type === "reading_mc") {
    return exercise.content.question || exercise.content.passage;
  }

  return exercise.content.text;
}

export function applyExerciseFilters(
  items: UniversalExerciseRecord[],
  filters: ExerciseListFilters,
): UniversalExerciseRecord[] {
  const limit = Number.isFinite(filters.limit) ? Math.max(1, Math.min(500, Number(filters.limit))) : 120;

  return items
    .filter((item) => (filters.category && filters.category !== "all" ? item.category === filters.category : true))
    .filter((item) => (filters.task_type && filters.task_type !== "all" ? item.task_type === filters.task_type : true))
    .filter((item) => (filters.status && filters.status !== "all" ? item.status === filters.status : true))
    .filter((item) => (filters.difficulty && filters.difficulty !== "all" ? item.difficulty === filters.difficulty : true))
    .sort((a, b) => b.meta.updated_at.localeCompare(a.meta.updated_at))
    .slice(0, limit);
}

export function withTaskTypeForCategory(
  category: ExerciseCategory,
  currentTaskType: ExerciseTaskType,
): { category: ExerciseCategory; taskType: ExerciseTaskType } {
  const mapped = CATEGORY_TO_TASK_TYPE[category];

  if (mapped === currentTaskType) {
    return {
      category,
      taskType: currentTaskType,
    };
  }

  return {
    category,
    taskType: mapped,
  };
}

export function withCategoryForTaskType(
  taskType: ExerciseTaskType,
  currentCategory: ExerciseCategory,
): { category: ExerciseCategory; taskType: ExerciseTaskType } {
  const mappedTaskType = CATEGORY_TO_TASK_TYPE[currentCategory];

  if (mappedTaskType === taskType) {
    return {
      category: currentCategory,
      taskType,
    };
  }

  const nextCategory =
    (Object.keys(CATEGORY_TO_TASK_TYPE) as ExerciseCategory[]).find(
      (category) => CATEGORY_TO_TASK_TYPE[category] === taskType,
    ) ?? TASK_TYPE_TO_DEFAULT_CATEGORY[taskType];

  return {
    category: nextCategory,
    taskType,
  };
}
