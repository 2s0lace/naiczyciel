import {
  CATEGORY_TO_TASK_TYPE,
  EXERCISE_CATEGORIES,
  EXERCISE_DIFFICULTIES,
  EXERCISE_STATUSES,
  EXERCISE_TASK_TYPES,
  type ExerciseCategory,
} from "@/lib/quiz/admin-exercise";

const GRAMMAR_OPTIONS = [
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

const VOCABULARY_TOPICS = [
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

function buildCommonBase(now: string, id: string, category: ExerciseCategory) {
  return {
    id,
    status: "draft",
    category,
    task_type: CATEGORY_TO_TASK_TYPE[category],
    difficulty: "easy",
    tags: ["ai", category],
    source: "internal",
    is_public: true,
    title: "",
    instruction: "",
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
      created_at: now,
      updated_at: now,
    },
  };
}

export function buildAdminBulkJsonTemplate(): string {
  const now = new Date().toISOString();

  const singleChoice = {
    ...buildCommonBase(now, "ex_ai_single_choice_001", "reactions"),
    task_type: "single_choice_short",
    title: "Reactions: apology and response",
    instruction: "Choose the best response.",
    content: {
      prompt: "X: Sorry I'm late.\nY: ______",
      options: [
        { id: "A", text: "No problem." },
        { id: "B", text: "Tomorrow is Monday." },
        { id: "C", text: "Yesterday was cold." },
      ],
    },
    correct_answer: {
      option_id: "A",
    },
  };

  const readingMc = {
    ...buildCommonBase(now, "ex_ai_reading_mc_001", "reading_mc"),
    task_type: "reading_mc",
    title: "Reading: short school notice",
    instruction: "Read the text and choose the correct answer.",
    content: {
      title: "School Notice",
      passage: "The school will be closed on Friday due to teacher training.",
      question: "When will the school be closed?",
      options: [
        { id: "A", text: "On Friday." },
        { id: "B", text: "On Saturday." },
        { id: "C", text: "On Thursday." },
      ],
    },
    correct_answer: {
      option_id: "A",
    },
  };

  const gapFillText = {
    ...buildCommonBase(now, "ex_ai_gap_fill_text_001", "gap_fill_text"),
    task_type: "gap_fill_text",
    title: "Gap fill",
    instruction: "Fill in the gaps with correct words.",
    content: {
      title: "Yesterday",
      text: "I ___ to school yesterday because it ___.",
      blanks: [
        {
          id: "blank_1",
          placeholder: "___",
          accepted_answers: ["went"],
        },
        {
          id: "blank_2",
          placeholder: "___",
          accepted_answers: ["rained", "was raining"],
        },
      ],
    },
    correct_answer: {
      blanks: [
        { id: "blank_1", accepted_answers: ["went"] },
        { id: "blank_2", accepted_answers: ["rained", "was raining"] },
      ],
    },
  };

  const gapFillWordBank = {
    ...buildCommonBase(now, "ex_ai_gap_fill_word_bank_001", "gap_fill_word_bank"),
    task_type: "gap_fill_word_bank",
    title: "Fill in with a word bank",
    instruction: "Use words from the word bank to fill in the gaps.",
    content: {
      title: "After class",
      text: "I ___ my homework and then I ___ TV.",
      word_bank: ["did", "watched", "eat", "play"],
      blanks: [
        { id: "blank_1", placeholder: "___" },
        { id: "blank_2", placeholder: "___" },
      ],
    },
    correct_answer: {
      blanks: [
        { id: "blank_1", word: "did" },
        { id: "blank_2", word: "watched" },
      ],
    },
  };

  const template = {
    _ai_prompt_for_chatgpt: [
      "Generate 1 exercise record for the nAIczyciel admin panel.",
      "Return ONLY JSON (no markdown and no comments).",
      "Technical keys must stay in English.",
      "Student-facing exercise fields that must be in English: title, instruction, content.*, options[].text.",
      "explanation.why must be 1 sentence in Polish explaining why the answer is correct.",
      "explanation.pattern must show the language pattern, e.g. 'miss a train / miss a bus / miss a flight'.",
      "explanation.watch_out must describe the most common mistake made by Polish students.",
      "hint.short must be max 8 words in Polish.",
      "analytics.focus_label must be in Polish, e.g. 'Reagowanie na przeprosiny'.",
      "analytics.skill must be snake_case English, e.g. 'apology_response'.",
      "Create one exercise at a time (fewest validation errors).",
      "After saving one record, create the next one.",
      "Do not change the category/task_type mapping.",
      "single_choice_short and reading_mc must have exactly 3 options (A/B/C).",
      "In gap_fill_text and gap_fill_word_bank, keep blank IDs consistent between content.blanks and correct_answer.blanks.",
      "Based on the generated task, automatically fill grammar and vocabulary fields.",
      `grammar.structures and grammar.tenses must use only these options: ${GRAMMAR_OPTIONS.join(", ")}.`,
      `vocabulary.topic must be exactly one of: ${VOCABULARY_TOPICS.join(", ")}.`,
      "vocabulary.key_words must contain keywords from question and answer options.",
      "Do not invent values outside these lists.",
      "If no grammar structure matches, return an empty array.",
    ],
    _ai_schema: {
      how_to_use: [
        "Fill all empty strings in the record.",
        "Do not change key names.",
        "Keep the correct category/task_type pair according to mapping.",
        "single_choice_short and reading_mc must have exactly 3 options.",
        "For gap_fill_text and gap_fill_word_bank, keep blank IDs consistent.",
      ],
      recommended_workflow: [
        "1) Generate 1 exercise in ChatGPT.",
        "2) Let ChatGPT auto-tag grammar and vocabulary.",
        "3) Paste it into the JSON field as { \"exercise\": { ... } }.",
        "4) Click 'Importuj' (or 'Load to form' + 'Create').",
        "5) Repeat for the next record.",
      ],
      allowed_values: {
        status: EXERCISE_STATUSES,
        difficulty: EXERCISE_DIFFICULTIES,
        category: EXERCISE_CATEGORIES,
        task_type: EXERCISE_TASK_TYPES,
        grammar_options: GRAMMAR_OPTIONS,
        vocabulary_topics: VOCABULARY_TOPICS,
      },
      category_to_task_type: CATEGORY_TO_TASK_TYPE,
      required_common_fields: [
        "id",
        "status",
        "category",
        "task_type",
        "difficulty",
        "tags",
        "source",
        "is_public",
        "title",
        "instruction",
        "content",
        "correct_answer",
        "explanation.why",
        "explanation.pattern",
        "explanation.watch_out",
        "hint.short",
        "analytics.focus_label",
        "analytics.skill",
        "grammar.structures",
        "grammar.tenses",
        "vocabulary.topic",
        "vocabulary.key_words",
        "meta.created_at",
        "meta.updated_at",
      ],
    },
    single_exercise_template: {
      exercise: singleChoice,
    },
    exercises: [singleChoice, readingMc, gapFillText, gapFillWordBank],
  };

  return JSON.stringify(template, null, 2);
}
