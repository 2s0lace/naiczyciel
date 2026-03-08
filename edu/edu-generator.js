const BASE_TYPES = ['multiple-choice', 'true-false', 'open'];

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function normalizeCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 10;
  return Math.max(1, Math.min(30, parsed));
}

function resolveQuestionType(questionType, index) {
  if (questionType !== 'mix') return questionType;
  return BASE_TYPES[index % BASE_TYPES.length];
}

function createPrompt(config, type, index) {
  const { subject, topic, gradeOrAge, difficulty, instructionLanguage } = config;
  const lang = instructionLanguage === 'en' ? 'en' : 'pl';
  const difficultyLabel = difficulty || 'medium';
  const number = index + 1;

  if (lang === 'en') {
    if (type === 'multiple-choice') {
      return `(${number}) ${subject}: ${topic}. Choose the best answer for a ${gradeOrAge} learner (${difficultyLabel}).`;
    }
    if (type === 'true-false') {
      return `(${number}) Statement about ${topic} in ${subject} for ${gradeOrAge}: true or false?`;
    }
    return `(${number}) Open question: explain ${topic} in ${subject} for ${gradeOrAge} (${difficultyLabel}).`;
  }

  if (type === 'multiple-choice') {
    return `(${number}) ${subject}: ${topic}. Wybierz najlepszą odpowiedź dla poziomu ${gradeOrAge} (${difficultyLabel}).`;
  }
  if (type === 'true-false') {
    return `(${number}) Zdanie o temacie „${topic}” z ${subject} dla ${gradeOrAge}: prawda czy fałsz?`;
  }
  return `(${number}) Pytanie otwarte: wyjaśnij temat „${topic}” z ${subject} na poziomie ${gradeOrAge} (${difficultyLabel}).`;
}

function buildQuestion(config, type, index) {
  const prompt = createPrompt(config, type, index);
  const id = makeId('q');

  if (type === 'multiple-choice') {
    const options = [
      `A. ${config.topic} — wariant 1`,
      `B. ${config.topic} — wariant 2`,
      `C. ${config.topic} — wariant 3`,
      `D. ${config.topic} — wariant 4`
    ];
    const correctAnswer = options[index % options.length];
    return { id, type, prompt, options, correctAnswer, points: 1 };
  }

  if (type === 'true-false') {
    const options = ['true', 'false'];
    const correctAnswer = index % 2 === 0 ? 'true' : 'false';
    return { id, type, prompt, options, correctAnswer, points: 1 };
  }

  return {
    id,
    type: 'open',
    prompt,
    options: [],
    correctAnswer: null,
    points: 2
  };
}

function buildTitle(config) {
  const subject = config.subject || 'Przedmiot';
  const topic = config.topic || 'Temat';
  return `${subject} — ${topic}`;
}

function normalizeConfig(input) {
  return {
    subject: (input.subject || '').trim() || 'Język angielski',
    topic: (input.topic || '').trim() || 'Powtórka',
    gradeOrAge: (input.gradeOrAge || '').trim() || 'klasa 7-8',
    difficulty: (input.difficulty || 'medium').trim(),
    questionCount: normalizeCount(input.questionCount),
    questionType: (input.questionType || 'mix').trim(),
    instructionLanguage: (input.instructionLanguage || 'pl').trim(),
    extraInstructions: (input.extraInstructions || '').trim()
  };
}

function generateMockTest(inputConfig) {
  const config = normalizeConfig(inputConfig);
  const questions = Array.from({ length: config.questionCount }, (_, index) => {
    const type = resolveQuestionType(config.questionType, index);
    return buildQuestion(config, type, index);
  });

  return {
    id: makeId('edu'),
    title: buildTitle(config),
    subject: config.subject,
    topic: config.topic,
    gradeOrAge: config.gradeOrAge,
    difficulty: config.difficulty,
    questionType: config.questionType,
    instructionLanguage: config.instructionLanguage,
    extraInstructions: config.extraInstructions,
    createdAt: new Date().toISOString(),
    questions
  };
}

function regenerateQuestion(test, questionId) {
  const idx = (test.questions || []).findIndex((q) => q.id === questionId);
  if (idx < 0) return test;

  const source = test.questions[idx];
  const nextType = source.type || resolveQuestionType(test.questionType, idx);
  const nextQuestion = buildQuestion(test, nextType, idx);
  const questions = [...test.questions];
  questions[idx] = nextQuestion;

  return { ...test, questions };
}

function regenerateAllQuestions(test) {
  const count = normalizeCount(test.questions?.length || test.questionCount || 10);
  const questions = Array.from({ length: count }, (_, idx) => {
    const type = resolveQuestionType(test.questionType || 'mix', idx);
    return buildQuestion(test, type, idx);
  });
  return { ...test, questions };
}

export {
  generateMockTest,
  regenerateQuestion,
  regenerateAllQuestions,
  normalizeConfig
};
