/* ─── Question Bank ─────────────────────────────────────── */
const questions = [
  /* ── REACTIONS (reakcje językowe) ── */
  {
    id: 1, type: "reactions", topic: "Szkoła", level: "A2",
    question: "Kolega pyta Cię, jaki masz teraz przedmiot w planie lekcji. Co odpowiesz?",
    answers: ["A. I have my notebook and pen.", "B. According to my timetable, it's Biology.", "C. I am a very good student."],
    correct: 1,
    explanation: {
      why: "Informujesz o konkretnym przedmiocie — to bezpośrednia odpowiedź na pytanie o plan lekcji.",
      watch_out: "notebook = zeszyt, timetable = plan lekcji; same posiadanie zeszytu nie odpowiada na pytanie.",
      pattern: "According to my timetable, it's... → podawanie informacji z planu zajęć"
    }
  },
  {
    id: 2, type: "reactions", topic: "Szkoła", level: "A2",
    question: "Chcesz pożyczyć od koleżanki gumkę do mazania. Jak o to zapytasz?",
    answers: ["A. Can I borrow your eraser, please?", "B. Where is your pencil case?", "C. I lost my scissors yesterday."],
    correct: 0,
    explanation: {
      why: "Proszisz o tymczasowe użyczenie przedmiotu — to klasyczna prośba o pożyczenie.",
      watch_out: "borrow = pożyczyć (wziąć); eraser = gumka; pencil case = piórnik.",
      pattern: "Can I borrow ...? → prośba o pożyczenie przedmiotu"
    }
  },
  {
    id: 3, type: "reactions", topic: "Szkoła", level: "A2",
    question: "Chcesz zapytać nauczyciela, czy możesz oddać pracę jutro. Co powiesz?",
    answers: ["A. Can I hand in my work tomorrow?", "B. I have got a red folder.", "C. This homework is very easy."],
    correct: 0,
    explanation: {
      why: "Prosisz o pozwolenie na późniejsze oddanie pracy — bezpośrednie pytanie o zgodę.",
      watch_out: "hand in = oddać (pracę/zadanie); folder = teczka; easy nie wyraża żadnej prośby.",
      pattern: "Can I hand in ...? → prośba o zgodę na oddanie pracy"
    }
  },
  {
    id: 4, type: "reactions", topic: "Transport", level: "A2",
    question: "Chcesz poprosić wujka, żeby odebrał Cię z dworca. Co powiesz?",
    answers: ["A. Can you come to the station with me?", "B. Can you give me a lift to the station?", "C. Can you pick me up from the station?"],
    correct: 2,
    explanation: {
      why: "Prosisz o odebranie z konkretnego miejsca — 'pick up from' znaczy właśnie odebrać kogoś skądś.",
      watch_out: "pick up from = odebrać (skądś); give a lift to = podwieźć (dokądś) — kierunek jest inny.",
      pattern: "Can you pick me up from ...? → prośba o odebranie z miejsca"
    }
  },
  {
    id: 5, type: "reactions", topic: "Towarzyskie", level: "A2",
    question: "Kolega mówi, że nie przyjdzie na Twoje urodziny. Jak zareagujesz?",
    answers: ["A. What a pity you can't come!", "B. I hope you liked my party.", "C. You must buy me a present."],
    correct: 0,
    explanation: {
      why: "Wyrażasz rozczarowanie tym, że ktoś nie może przyjść — naturalna reakcja na taką informację.",
      watch_out: "What a pity! = Szkoda!, Jaka szkoda!; 'liked' sugeruje, że impreza już była.",
      pattern: "What a pity ...! → wyrażanie rozczarowania lub żalu"
    }
  },
  {
    id: 6, type: "reactions", topic: "Rada", level: "A2",
    question: "Chcesz odradzić koledze wycieczkę w góry. Co powiesz?",
    answers: ["A. I love climbing in the mountains.", "B. Let's go climbing tomorrow.", "C. You definitely shouldn't go climbing."],
    correct: 2,
    explanation: {
      why: "Odradzasz coś — używasz 'shouldn't', żeby wyrazić, że to nie jest dobry pomysł.",
      watch_out: "shouldn't = nie powinieneś; Let's = chodźmy razem — to propozycja, nie odradzanie.",
      pattern: "You shouldn't + czasownik → odradzanie, negatywna rada"
    }
  },
  {
    id: 7, type: "reactions", topic: "Pomoc", level: "A2",
    question: "Proponujesz komuś pomoc z zakupami. Co powiesz?",
    answers: ["A. Do you buy bags every day?", "B. Let me help you with those bags.", "C. I can't carry this bag."],
    correct: 1,
    explanation: {
      why: "Składasz ofertę pomocy — 'Let me help' to naturalna propozycja zrobienia czegoś dla kogoś.",
      watch_out: "carry = nieść/nosić; Let me = pozwól, że ja — wyraża chęć działania, nie pytanie.",
      pattern: "Let me + czasownik → propozycja pomocy / zrobienia czegoś za kogoś"
    }
  },
  {
    id: 8, type: "reactions", topic: "Transport", level: "A2",
    question: "Koleżanka pyta, jak wrócisz do domu po szkole. Co odpowiesz?",
    answers: ["A. I usually go home by bus.", "B. My school bag is heavy.", "C. I like my classroom."],
    correct: 0,
    explanation: {
      why: "Odpowiadasz konkretnie na pytanie o sposób podróży — podajesz środek transportu.",
      watch_out: "by bus = autobusem; heavy = ciężki — waga torby nie odpowiada na pytanie o dojazd.",
      pattern: "go ... by + środek transportu → informowanie o sposobie podróży"
    }
  },
  {
    id: 9, type: "reactions", topic: "Szkoła", level: "A2",
    question: "Chcesz zapytać kolegę, czy ma przy sobie długopis. Co powiesz?",
    answers: ["A. Do you have a pen with you?", "B. Your pen is very nice yesterday.", "C. I am writing with my pencil case."],
    correct: 0,
    explanation: {
      why: "Pytasz o to, czy ktoś aktualnie posiada przy sobie konkretny przedmiot.",
      watch_out: "pen = długopis; pencil case = piórnik (nie piszesz piórnikiem); 'very nice yesterday' — błąd czasu.",
      pattern: "Do you have ... with you? → pytanie o to, czy ktoś ma coś przy sobie"
    }
  },
  {
    id: 10, type: "reactions", topic: "Towarzyskie", level: "A2",
    question: "Chcesz zaproponować kolędze wspólne wyjście na basen w weekend. Co powiesz?",
    answers: ["A. Why don't we go to the swimming pool this weekend?", "B. I went swimming last Saturday.", "C. Swimming is my favourite sport."],
    correct: 0,
    explanation: {
      why: "Składasz propozycję wspólnego działania — 'Why don't we' to klasyczny sposób na zaproszenie do czegoś.",
      watch_out: "went = forma przeszła (byłem); favourite sport to tylko opinia, nie propozycja.",
      pattern: "Why don't we + czasownik? → propozycja wspólnego działania"
    }
  },

  /* ── READING multiple choice ── */
  {
    id: 11, type: "reading", topic: "Ogłoszenie szkolne", level: "A2",
    question: "Przeczytaj ogłoszenie:\n\n\"The school library will be CLOSED on Friday 14th March due to a staff training day. Books can be returned to the box in the main corridor. The library reopens on Monday.\"\n\nCo można zrobić z książkami w piątek?",
    answers: ["A. Zwrócić je do biblioteki przez pracownika.", "B. Wrzucić je do skrzynki na korytarzu.", "C. Zabrać je do domu i zwrócić w poniedziałek."],
    correct: 1,
    explanation: {
      why: "Ogłoszenie mówi, że skrzynka na głównym korytarzu służy do zwrotu książek, gdy biblioteka jest zamknięta.",
      watch_out: "returned to the box = zwróć do skrzynki; main corridor = główny korytarz; closed = zamknięta.",
      pattern: "can be returned → pasywna forma wyrażająca możliwość/instrukcję"
    }
  },
  {
    id: 12, type: "reading", topic: "Zaproszenie", level: "A2",
    question: "Przeczytaj wiadomość:\n\n\"Hi Tom! My parents are going out on Saturday evening, so I'm having a few friends over. We'll watch films and order pizza. Do you want to come? Let me know by Thursday!\"\n\nDo kiedy Tom powinien odpowiedzieć?",
    answers: ["A. Do soboty wieczór.", "B. Do czwartku.", "C. Przed wyjściem rodziców."],
    correct: 1,
    explanation: {
      why: "Wiadomość wyraźnie mówi 'Let me know by Thursday' — odpowiedź ma dotrzeć do czwartku.",
      watch_out: "Let me know by = daj mi znać do (daty); 'having friends over' = zapraszać przyjaciół do domu.",
      pattern: "Let me know by + dzień → deadline na odpowiedź / potwierdzenie"
    }
  },
  {
    id: 13, type: "reading", topic: "Ogłoszenie sklepowe", level: "A2",
    question: "Przeczytaj ogłoszenie w sklepie:\n\n\"Special offer! Buy two get one free — this weekend only. Offer applies to all snacks and soft drinks. Not valid with any other promotion.\"\n\nKiedy obowiązuje promocja?",
    answers: ["A. Przez cały miesiąc.", "B. Tylko w ten weekend.", "C. Zawsze, na wszystkie produkty."],
    correct: 1,
    explanation: {
      why: "Ogłoszenie mówi 'this weekend only' — promocja trwa wyłącznie przez ten weekend.",
      watch_out: "this weekend only = tylko w ten weekend; not valid with = nie łączy się z; applies to = dotyczy.",
      pattern: "... only → wyrażenie ograniczenia czasowego lub warunków obowiązywania"
    }
  },
  {
    id: 14, type: "reading", topic: "E-mail od koleżanki", level: "A2",
    question: "Przeczytaj fragment e-maila:\n\n\"I've started a new hobby — I'm learning to play the guitar! My uncle is teaching me. It's quite hard but I really enjoy it. I practise every day after school for about 30 minutes.\"\n\nKto uczy autorki e-maila gry na gitarze?",
    answers: ["A. Nauczyciel muzyki w szkole.", "B. Jej wujek.", "C. Koleżanka."],
    correct: 1,
    explanation: {
      why: "E-mail mówi wprost 'My uncle is teaching me' — to wujek jest nauczycielem.",
      watch_out: "uncle = wujek; is teaching = uczy (czas Present Continuous — dzieje się regularnie teraz).",
      pattern: "My uncle is teaching me → Present Continuous opisujący trwającą, regularną aktywność"
    }
  },

  /* ── VOCABULARY / słownictwo ── */
  {
    id: 15, type: "vocabulary", topic: "Emocje", level: "A2",
    question: "Wybierz właściwe słowo:\n\nAfter winning the competition, Anna felt very ___. She couldn't stop smiling.",
    answers: ["A. bored", "B. proud", "C. frightened"],
    correct: 1,
    explanation: {
      why: "Wygranie zawodów to powód do dumy — 'proud' (dumna) pasuje do opisu, że nie mogła przestać się uśmiechać.",
      watch_out: "bored = znudzony; proud = dumny; frightened = przestraszony — kontekst jest pozytywny.",
      pattern: "feel proud → wyrażenie dumy po osiągnięciu czegoś"
    }
  },
  {
    id: 16, type: "vocabulary", topic: "Dom i codzienne życie", level: "A2",
    question: "Wybierz właściwe słowo:\n\nCan you ___ the table before dinner? We're eating in five minutes.",
    answers: ["A. make", "B. lay", "C. do"],
    correct: 1,
    keywords: ["lay the table", "make a bed", "do the dishes"],
    explanation: {
      why: "'Lay the table' to stały kolokacja oznaczająca nakrywanie do stołu — nie używamy tu 'make' ani 'do'.",
      watch_out: "lay the table = nakryć do stołu; make a bed = posłać łóżko; do the dishes = zmywać.",
      pattern: "lay the table → stały związek wyrazowy (kolokacja): przygotowanie stołu do posiłku"
    }
  },
  {
    id: 17, type: "vocabulary", topic: "Zdrowie", level: "A2",
    question: "Wybierz właściwe słowo:\n\nI didn't feel well this morning, so I decided to ___ the doctor.",
    answers: ["A. visit to", "B. see", "C. look"],
    correct: 1,
    keywords: ["see the doctor", "feel well", "decide to"],
    explanation: {
      why: "'See the doctor' to naturalna kolokacja oznaczająca wizytę u lekarza — bez przyimka 'to'.",
      watch_out: "see the doctor = iść do lekarza; visit to = błąd ('visit' nie wymaga 'to'); look = patrzeć.",
      pattern: "see the doctor → kolokacja: wizyta lekarska (bez przyimka)"
    }
  },

  /* ── GRAMMAR / gramatyka zamknięta ── */
  {
    id: 18, type: "grammar", topic: "Present Perfect", level: "A2",
    question: "Wybierz poprawną formę:\n\nShe ___ already ___ her homework, so she can go out now.",
    answers: ["A. has / finished", "B. did / finish", "C. is / finishing"],
    correct: 0,
    keywords: ["has finished", "already", "present perfect"],
    explanation: {
      why: "'Already' z Present Perfect informuje, że czynność jest ukończona przed chwilą — mamy efekt (może wyjść).",
      watch_out: "already + Present Perfect = czynność już zakończona; 'did finish' — czas przeszły bez 'already'; 'is finishing' = właśnie kończy.",
      pattern: "has/have + already + past participle → Present Perfect: czynność ukończona przed momentem mówienia"
    }
  },
  {
    id: 19, type: "grammar", topic: "Stopniowanie przymiotników", level: "A2",
    question: "Wybierz poprawną formę:\n\nThis exercise is ___ than the last one.",
    answers: ["A. more difficult", "B. difficulter", "C. most difficult"],
    correct: 0,
    keywords: ["more difficult", "comparative", "than"],
    explanation: {
      why: "'Difficult' to przymiotnik wielosylabowy — stopień wyższy tworzy się przez 'more', nie przez '-er'.",
      watch_out: "difficulter = błąd (nie istnieje); most difficult = stopień najwyższy; 'than' wymaga stopnia wyższego.",
      pattern: "more + przymiotnik wielosylabowy → stopień wyższy (bez końcówki -er)"
    }
  },
  {
    id: 20, type: "grammar", topic: "Czasowniki modalne", level: "A2",
    question: "Wybierz poprawną odpowiedź:\n\nYou ___ eat in the library. It's not allowed.",
    answers: ["A. should", "B. mustn't", "C. needn't"],
    correct: 1,
    keywords: ["mustn't", "needn't", "should", "modal verbs"],
    explanation: {
      why: "'Mustn't' wyraża zakaz — nie wolno czegoś robić. Pasuje do sytuacji, gdy coś jest niedozwolone.",
      watch_out: "mustn't = nie wolno (zakaz); needn't = nie musisz (brak obowiązku); should = powinieneś — to rada.",
      pattern: "mustn't + czasownik → wyraźny zakaz (it's not allowed)"
    }
  }
];

/* ─── Type labels & icons ────────────────────────────────── */
const typeLabels = {
  reactions: "💬 Reakcje językowe",
  reading: "📖 Reading",
  vocabulary: "🔤 Słownictwo",
  grammar: "📝 Gramatyka"
};

/* ─── Utility ────────────────────────────────────────────── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─── State ──────────────────────────────────────────────── */
let sessionQuestions = [];
let currentIndex = 0;
let score = 0;
let answered = false;
let answers = []; // null | selectedIndex per question
let userResults = []; // { type, topic, correct, keywords? } per answered question

/* ─── Screens ────────────────────────────────────────────── */
const screenLanding = document.getElementById('screen-landing');
const screenQuiz = document.getElementById('screen-quiz');
const screenResult = document.getElementById('screen-result');

function showScreen(name) {
  screenLanding.classList.add('hidden');
  screenQuiz.classList.add('hidden');
  screenResult.classList.add('hidden');
  if (name === 'landing') { screenLanding.classList.remove('hidden'); window.scrollTo(0, 0); }
  if (name === 'quiz') { screenQuiz.classList.remove('hidden'); window.scrollTo(0, 0); }
  if (name === 'result') { screenResult.classList.remove('hidden'); window.scrollTo(0, 0); }
}

/* ─── Quiz elements ──────────────────────────────────────── */
const progressBar = document.getElementById('quiz-progress-bar');
const progressText = document.getElementById('quiz-progress-text');
const typeBadge = document.getElementById('quiz-type-badge');
const questionEl = document.getElementById('quiz-question');
const answersEl = document.getElementById('quiz-answers');
const explPanel = document.getElementById('explanation-panel');
const explWhy = document.getElementById('expl-why');
const explWatch = document.getElementById('expl-watch');
const explPattern = document.getElementById('expl-pattern');
const nextBtn = document.getElementById('next-btn'); // hidden via CSS
const prevNavBtn = document.getElementById('quiz-prev-btn');
const nextNavBtn = document.getElementById('quiz-next-btn');
const dotsBar = document.getElementById('quiz-dots-bar');

/* ─── Dot nav renderer ──────────────────────────────────── */
function renderDots() {
  dotsBar.innerHTML = '';
  sessionQuestions.forEach((q, i) => {
    const dot = document.createElement('button');
    dot.className = 'q-dot';
    dot.textContent = i + 1;
    dot.setAttribute('aria-label', `Pytanie ${i + 1}`);

    // State classes
    if (i === currentIndex) dot.classList.add('is-current');
    if (answers[i] !== null) {
      dot.classList.add(answers[i] === q.correct ? 'is-correct' : 'is-wrong');
    }

    dot.addEventListener('click', () => {
      if (i !== currentIndex) {
        currentIndex = i;
        renderQuestion();
        window.scrollTo(0, 0);
      }
    });
    dotsBar.appendChild(dot);
  });
}

function startQuiz() {
  sessionQuestions = shuffle(questions).slice(0, 10);
  currentIndex = 0;
  score = 0;
  answers = new Array(sessionQuestions.length).fill(null);
  userResults = [];
  showScreen('quiz');
  renderQuestion();
}

function renderQuestion() {
  const q = sessionQuestions[currentIndex];
  const total = sessionQuestions.length;
  const percent = (currentIndex / total) * 100;

  progressBar.style.width = percent + '%';
  progressText.textContent = `${currentIndex + 1} / ${total}`;
  typeBadge.textContent = typeLabels[q.type] || q.type;
  questionEl.textContent = q.question;

  // Nav button states
  prevNavBtn.disabled = currentIndex === 0;
  nextNavBtn.disabled = false; // always can go next (skip or last→result)

  // Restore answers if question was already visited
  const saved = answers[currentIndex];
  answered = saved !== null;

  answersEl.innerHTML = '';
  q.answers.forEach((ans, i) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = ans;
    btn.addEventListener('click', () => selectAnswer(i, btn, q));
    answersEl.appendChild(btn);
  });

  if (answered) {
    // Restore visual state for already-answered question
    const buttons = answersEl.querySelectorAll('.answer-btn');
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.correct) btn.classList.add('correct');
      else if (i === saved) btn.classList.add('wrong');
    });
    explWhy.textContent = q.explanation.why;
    explWatch.textContent = q.explanation.watch_out;
    explPattern.textContent = q.explanation.pattern;
    explPanel.classList.remove('hidden');
  } else {
    explPanel.classList.add('hidden');
  }

  renderDots();
}

function selectAnswer(idx, selectedBtn, q) {
  if (answered) return;
  answered = true;
  answers[currentIndex] = idx;

  // Track result for analytics
  const isCorrect = idx === q.correct;
  userResults.push({
    type: q.type,
    topic: q.topic,
    correct: isCorrect,
    keywords: isCorrect ? [] : (q.keywords || [])
  });

  const buttons = answersEl.querySelectorAll('.answer-btn');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct) btn.classList.add('correct');
  });

  if (idx !== q.correct) {
    selectedBtn.classList.add('wrong');
  }

  // Show explanation
  explWhy.textContent = q.explanation.why;
  explWatch.textContent = q.explanation.watch_out;
  explPattern.textContent = q.explanation.pattern;
  explPanel.classList.remove('hidden');

  renderDots(); // update dot color after answering
}

/* ─── Nav buttons ────────────────────────────────────────── */
nextNavBtn.addEventListener('click', () => {
  if (currentIndex < sessionQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
    window.scrollTo(0, 0);
  } else {
    showResult();
  }
});

prevNavBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
    window.scrollTo(0, 0);
  }
});

function showResult() {
  const total = sessionQuestions.length;

  // For any skipped questions, push them into userResults as wrong
  let skippedCount = 0;
  answers.forEach((sel, i) => {
    if (sel === null) {
      skippedCount++;
      const q = sessionQuestions[i];
      userResults.push({
        type: q.type,
        topic: q.topic,
        correct: false,
        keywords: q.keywords || []
      });
    }
  });

  // Calculate score from answers array
  score = answers.reduce((acc, sel, i) => {
    return acc + (sel === sessionQuestions[i].correct ? 1 : 0);
  }, 0);
  const percent = Math.round((score / total) * 100);

  let emoji = '😅', title = 'Nie poddawaj się!';
  if (percent >= 90) { emoji = '🏆'; title = 'Znakomity wynik!'; }
  else if (percent >= 70) { emoji = '🎉'; title = 'Dobra robota!'; }
  else if (percent >= 50) { emoji = '💪'; title = 'Nieźle, ćwicz dalej!'; }

  document.getElementById('result-emoji').textContent = emoji;
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-score').textContent = `${score} / ${total}`;
  document.getElementById('result-percent').textContent = `${percent}% poprawnych odpowiedzi`;

  progressBar.style.width = '100%';
  renderInsights();
  showScreen('result');
}

/* ─── Performance Insights ──────────────────────────── */
const typeNames = {
  reactions: 'Reakcje',
  reading: 'Reading',
  vocabulary: 'Słownictwo',
  grammar: 'Gramatyka'
};

function computeTopicStats(results) {
  const stats = {};
  results.forEach(r => {
    const key = r.type; // group by question type for MVP
    if (!stats[key]) stats[key] = { correct: 0, total: 0 };
    stats[key].total++;
    if (r.correct) stats[key].correct++;
  });
  for (const key in stats) {
    stats[key].accuracy = Math.round((stats[key].correct / stats[key].total) * 100);
  }
  return stats;
}

function renderInsights() {
  const results = userResults;

  // 1. Inline topic accuracy chips under percent
  const stats = computeTopicStats(results);
  const topicsBar = document.getElementById('insights-topics-bar');

  if (topicsBar) {
    topicsBar.innerHTML = Object.entries(stats)
      .map(([type, data]) => {
        const good = data.accuracy >= 70;
        return `<span class="topic-chip ${good ? 'topic-chip--good' : 'topic-chip--bad'}">${typeNames[type] || type} ${data.accuracy}%</span>`;
      }).join('');
  }

  // Words to review — vocabulary type only, collapsible
  const vocabWords = [...new Set(
    results
      .filter(r => !r.correct && r.type === 'vocabulary')
      .flatMap(r => r.keywords || [])
  )];

  // Show box whenever vocabulary questions were answered
  const hasVocab = results.some(r => r.type === 'vocabulary');
  const panel = document.getElementById('insights-panel');
  const wordsList = document.getElementById('insights-words-list');
  if (panel && hasVocab) {
    if (vocabWords.length) {
      wordsList.innerHTML = vocabWords.map(w => `<li>${w}</li>`).join('');
      wordsList.style.display = ''; // expanded by default
      const toggleBtn = document.getElementById('insights-toggle');
      if (toggleBtn) { toggleBtn.setAttribute('aria-expanded', 'true'); toggleBtn.textContent = 'Ukryj ▴'; }
    } else {
      wordsList.innerHTML = '<li style="color:var(--c-green);font-style:normal;">✔ Brak słów do powtórki — świetnie!</li>';
      wordsList.style.display = '';
      const toggleBtn = document.getElementById('insights-toggle');
      if (toggleBtn) { toggleBtn.setAttribute('aria-expanded', 'true'); toggleBtn.textContent = 'Ukryj ▴'; }
    }
    panel.style.display = '';
  } else if (panel) {
    panel.style.display = 'none';
  }
}

// Toggle words list
document.getElementById('insights-toggle').addEventListener('click', function () {
  const list = document.getElementById('insights-words-list');
  const open = this.getAttribute('aria-expanded') === 'true';
  this.setAttribute('aria-expanded', !open);
  this.textContent = open ? 'Pokaż ▾' : 'Ukryj ▴';
  list.style.display = open ? 'none' : '';
});

// PDF export
document.getElementById('insights-pdf').addEventListener('click', () => {
  const words = [...document.querySelectorAll('#insights-words-list li')].map(li => li.textContent);
  if (!words.length) return;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Słownictwo do powtórki</title>
    <style>body{font-family:sans-serif;padding:32px}h2{margin-bottom:16px}li{font-size:1.1rem;margin:6px 0}</style>
    </head><body><h2>📝 Słownictwo do powtórki</h2><ul>${words.map(w => `<li>${w}</li>`).join('')}</ul></body></html>`;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
});

/* ─── Retry & Home ───────────────────────────────────────── */
document.getElementById('btn-retry').addEventListener('click', startQuiz);
document.getElementById('btn-home').addEventListener('click', () => showScreen('landing'));
document.getElementById('nav-logo-home').addEventListener('click', (e) => { e.preventDefault(); showScreen('landing'); });

/* ─── Start buttons ──────────────────────────────────────── */
document.getElementById('hero-start-btn').addEventListener('click', startQuiz);
document.getElementById('nav-start-btn').addEventListener('click', startQuiz);

/* ─── Paywall Modal ──────────────────────────────────────── */
const modalOverlay = document.getElementById('modal-overlay');
const modal = document.getElementById('modal');
const modalBuyBtn = document.getElementById('modal-buy-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalComing = document.getElementById('modal-coming-soon');
let selectedPlan = 'student';

const stripeLinks = {
  '1day': 'https://buy.stripe.com/aFa3cvfHwaa1d1IcD8fAc00',
  '3days': 'https://buy.stripe.com/bJe00jcvk1DvaTA9qWfAc01',
  'student': 'https://buy.stripe.com/4gM4gzcvk1Dv1j046CfAc02',
  'studentplus': 'https://buy.stripe.com/3cIcN5anc6XP2n446CfAc03',
};

function openModal() {
  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  modalComing.style.display = 'none';
  document.querySelectorAll('.modal__plan').forEach(el => {
    el.classList.toggle('selected', el.dataset.plan === selectedPlan);
  });
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// Plan selection inside modal
document.querySelectorAll('.modal__plan').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.modal__plan').forEach(p => p.classList.remove('selected'));
    el.classList.add('selected');
    selectedPlan = el.dataset.plan;
    modalComing.style.display = 'none';
  });
});

// Buy button → redirect to Stripe
modalBuyBtn.addEventListener('click', () => {
  const url = stripeLinks[selectedPlan];
  if (url) {
    window.location.href = url;
  } else {
    // Uczeń+ not yet available
    modalComing.style.display = 'block';
    modalComing.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});

modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// All open-modal buttons
document.querySelectorAll('.open-modal-btn').forEach(btn => {
  btn.addEventListener('click', openModal);
});

/* ─── Scroll-reveal ──────────────────────────────────────── */
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.12 });
revealEls.forEach(el => revealObserver.observe(el));

/* ─── "Wkrótce" toast ────────────────────────────────────── */
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg || 'Wkrótce! 🚀';
  toast.classList.remove('hidden');
  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
    toast.textContent = 'Wkrótce! 🚀'; // reset
  }, 2800);
}
document.querySelectorAll('.soon-tile').forEach(el => {
  el.addEventListener('click', showToast);
});