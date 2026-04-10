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
      "hint.short must be in Polish and should be subtle, not obvious.",
      "hint.short should usually be 6-12 words.",
      "hint.short must nudge the student toward tone, function, register, contrast, or grammar logic.",
      "hint.short must NOT reveal the answer directly.",
      "hint.short must NOT repeat key words from the correct option.",
      "hint.short must NOT say things like 'wybierz gratulacje', 'wybierz zgode', 'wybierz poprawna odpowiedz'.",
      "Weak hint example: 'Wybierz gratulacje.' Stronger hint example: 'Zwróć uwagę, czy reakcja pasuje do dobrej wiadomości.'",
      "Weak hint example: 'To odpowiedź wspierająca.' Stronger hint example: 'Odrzuć odpowiedzi, które brzmią zbyt chłodno albo ironicznie.'",
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
        "Write hint.short as a subtle clue, not a giveaway.",
        "Prefer hints based on elimination, tone, intent, or context.",
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

export function buildReadingMcJsonTemplate(): string {
  const now = new Date().toISOString();

  const readingMc = {
    ...buildCommonBase(now, "ex_ai_reading_mc_001", "reading_mc"),
    task_type: "reading_mc",
    title: "Reading: mock shared passage",
    instruction: "Read the text and choose the best answer for each question.",
    explanation: {
      why: "Poprawne odpowiedzi wynikają bezpośrednio z krótkiego tekstu i wymagają dopasowania informacji do podpunktów.",
      pattern: "read the passage -> match detail -> choose A/B/C",
      watch_out: "Polscy uczniowie często wybierają odpowiedź, która brzmi logicznie, ale nie wynika wprost z tekstu.",
    },
    hint: {
      short: "Szukaj odpowiedzi w konkretnych zdaniach passage, nie w ogólnym wrażeniu.",
    },
    analytics: {
      focus_label: "Czytanie ze zrozumieniem",
      skill: "reading_for_detail",
    },
    grammar: {
      structures: [],
      tenses: ["present_simple"],
    },
    vocabulary: {
      topic: "edukacja",
      key_words: ["after school", "help", "tomorrow", "message", "meet"],
    },
    content: {
      title: "A message from Tom",
      prompt_en:
        "Hi Anna, I can't meet you after school today because I have to help my dad in the shop. I should finish at about six, so maybe we can talk online in the evening. If not, let's meet tomorrow near the library.",
      prompt_pl:
        "Cześć Aniu, nie mogę spotkać się z tobą dziś po szkole, ponieważ muszę pomóc tacie w sklepie. Skończę około szóstej, więc może porozmawiamy wieczorem online. Jeśli nie, spotkajmy się jutro przy bibliotece.",
      passage:
        "Hi Anna, I can't meet you after school today because I have to help my dad in the shop. I should finish at about six, so maybe we can talk online in the evening. If not, let's meet tomorrow near the library.",
      questions: [
        {
          id: "1",
          question: "Why can't Tom meet Anna after school today?",
          options: [
            { id: "A", text: "He has to help his dad.", isCorrect: true },
            { id: "B", text: "He is going to the library.", isCorrect: false },
            { id: "C", text: "He is meeting her in the evening.", isCorrect: false },
          ],
        },
        {
          id: "2",
          question: "Where does Tom want to meet Anna tomorrow?",
          options: [
            { id: "A", text: "At the shop.", isCorrect: false },
            { id: "B", text: "Near the library.", isCorrect: true },
            { id: "C", text: "Online.", isCorrect: false },
          ],
        },
      ],
    },
    correct_answer: {
      questions: [
        { id: "1", option_id: "A" },
        { id: "2", option_id: "B" },
      ],
    },
  };

  const template = {
    _ai_prompt_for_chatgpt: [
      "Generate 1 exercise record for the nAIczyciel admin panel.",
      "Return ONLY JSON (no markdown and no comments).",
      "This template is ONLY for category reading_mc.",
      "Keep category='reading_mc' and task_type='reading_mc'.",
      "The task must use the NEW shared-passage layout.",
      "content must contain: title, prompt_en, prompt_pl, questions[].",
      "prompt_en is the English shared passage shown by default.",
      "prompt_pl is the Polish translation shown after toggling translation.",
      "Keep legacy content.passage only for backwards compatibility if needed, but prefer prompt_en/prompt_pl.",
      "questions[] must be an array of at least 2 subquestions.",
      "Each subquestion must have: id, question, options[].",
      "Each subquestion must have exactly 3 options: A, B, C.",
      "correct_answer must use the NEW layout: correct_answer.questions = [{ id, option_id }].",
      "Every question id in content.questions must match the id in correct_answer.questions.",
      "Student-facing fields should be natural exam-style English.",
      "explanation.why and explanation.watch_out must be in Polish.",
      "hint.short must be in Polish and subtle.",
      "analytics.focus_label must be in Polish; analytics.skill must be snake_case English.",
      `grammar.structures and grammar.tenses must use only these options: ${GRAMMAR_OPTIONS.join(", ")}.`,
      `vocabulary.topic must be exactly one of: ${VOCABULARY_TOPICS.join(", ")}.`,
    ],
    exercise: readingMc,
  };

  return JSON.stringify(template, null, 2);
}

export function buildGapFillTextJsonTemplate(): string {
  const now = new Date().toISOString();

  const gapFillText = {
    ...buildCommonBase(now, "ex_ai_gap_fill_text_001", "gap_fill_text"),
    task_type: "gap_fill_text",
    title: "Gap fill: mock shared text",
    instruction: "Read the text and choose the best answer for each gap.",
    explanation: {
      why: "Poprawne odpowiedzi wynikają z form gramatycznych i kontekstu całego tekstu, a nie z pojedynczych słów w oderwaniu.",
      pattern: "read the whole text -> check gap -> choose A/B/C",
      watch_out: "Polscy uczniowie często patrzą tylko na pojedynczą lukę i ignorują podmiot albo czas zdania.",
    },
    hint: {
      short: "Najpierw przeczytaj cały tekst, potem dopasuj formy do luk.",
    },
    analytics: {
      focus_label: "Uzupelnianie tekstu",
      skill: "gap_fill_text",
    },
    grammar: {
      structures: [],
      tenses: ["present_simple"],
    },
    vocabulary: {
      topic: "edukacja",
      key_words: ["school", "gets up", "has breakfast", "bus", "morning"],
    },
    content: {
      title: "A school morning",
      prompt_en:
        "Every school day, Mia [1] up at 6:30. Then she [2] breakfast with her brother before they leave for school.",
      prompt_pl:
        "W każdy dzień szkolny Mia [1] o 6:30. Potem [2] śniadanie ze swoim bratem, zanim wyjdą do szkoły.",
      passage:
        "Every school day, Mia [1] up at 6:30. Then she [2] breakfast with her brother before they leave for school.",
      questions: [
        {
          id: "1",
          question: "Gap 1",
          options: [
            { id: "A", text: "get", isCorrect: false },
            { id: "B", text: "gets", isCorrect: true },
            { id: "C", text: "getting", isCorrect: false },
          ],
        },
        {
          id: "2",
          question: "Gap 2",
          options: [
            { id: "A", text: "have", isCorrect: false },
            { id: "B", text: "having", isCorrect: false },
            { id: "C", text: "has", isCorrect: true },
          ],
        },
      ],
    },
    correct_answer: {
      questions: [
        { id: "1", option_id: "B" },
        { id: "2", option_id: "C" },
      ],
    },
  };

  const template = {
    _ai_prompt_for_chatgpt: [
      "Generate 1 exercise record for the nAIczyciel admin panel.",
      "Return ONLY JSON (no markdown and no comments).",
      "This template is ONLY for category gap_fill_text.",
      "Keep category='gap_fill_text' and task_type='gap_fill_text'.",
      "The task must use the NEW shared-text layout with visible gaps like [1], [2] in passage.",
      "content must contain: title, prompt_en, prompt_pl, questions[].",
      "prompt_en is the English shared text shown by default.",
      "prompt_pl is the Polish translation shown after toggling translation.",
      "Keep legacy content.text only for backwards compatibility if needed, but prefer prompt_en/prompt_pl.",
      "questions[] must be an array of at least 2 gaps.",
      "Each gap question must have: id, question, options[].",
      "Each gap question must have exactly 3 options: A, B, C.",
      "correct_answer must use the NEW layout: correct_answer.questions = [{ id, option_id }].",
      "Every question id in content.questions must match the id in correct_answer.questions.",
      "Student-facing fields should be natural exam-style English.",
      "explanation.why and explanation.watch_out must be in Polish.",
      "hint.short must be in Polish and subtle.",
      "analytics.focus_label must be in Polish; analytics.skill must be snake_case English.",
      `grammar.structures and grammar.tenses must use only these options: ${GRAMMAR_OPTIONS.join(", ")}.`,
      `vocabulary.topic must be exactly one of: ${VOCABULARY_TOPICS.join(", ")}.`,
    ],
    exercise: gapFillText,
  };

  return JSON.stringify(template, null, 2);
}
