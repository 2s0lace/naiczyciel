const questions = [
  {
    question: "Kolega pyta Cię, jaki masz teraz przedmiot w planie lekcji. Co odpowiesz?",
    answers: [
      "A. I have my notebook and pen.",
      "B. According to my timetable, it’s Biology.",
      "C. I am a very good student."
    ],
    correct: 1
  },
  {
    question: "Chcesz pożyczyć od koleżanki gumkę do mazania. Jak o to zapytasz?",
    answers: [
      "A. Can I borrow your eraser, please?",
      "B. Where is your pencil case?",
      "C. I lost my scissors yesterday."
    ],
    correct: 0
  },
  {
    question: "Nauczyciel prosi Cię o oddanie wypracowania. Co usłyszysz?",
    answers: [
      "A. Please open your textbook on page 10.",
      "B. Have you finished your assignment yet?",
      "C. You should go to the playground."
    ],
    correct: 1
  },
  {
    question: "Chcesz poprosić wujka, żeby odebrał Cię z dworca. Co powiesz?",
    answers: [
      "A. Can you come to the station with me?",
      "B. Can you give me a lift to the station?",
      "C. Can you pick me up from the station?"
    ],
    correct: 2
  },
  {
    question: "Kolega mówi, że nie przyjdzie na Twoje urodziny. Jak zareagujesz?",
    answers: [
      "A. What a pity you can’t come!",
      "B. I hope you liked my party.",
      "C. You must buy me a present."
    ],
    correct: 0
  },
  {
    question: "Chcesz odradzić koledze wycieczkę w góry. Co powiesz?",
    answers: [
      "A. I love climbing in the mountains.",
      "B. Let’s go climbing tomorrow.",
      "C. You definitely shouldn’t go climbing."
    ],
    correct: 2
  },
  {
    question: "Proponujesz komuś pomoc z zakupami. Co powiesz?",
    answers: [
      "A. Do you buy bags every day?",
      "B. Let me help you with those bags.",
      "C. I can’t carry this bag."
    ],
    correct: 1
  },
  {
    question: "Chcesz zapytać nauczyciela, czy możesz oddać pracę jutro. Co powiesz?",
    answers: [
      "A. Can I hand in my work tomorrow?",
      "B. I have got a red folder.",
      "C. This homework is very easy."
    ],
    correct: 0
  },
  {
    question: "Koleżanka pyta, jak wrócisz do domu po szkole. Co odpowiesz?",
    answers: [
      "A. I usually go home by bus.",
      "B. My school bag is heavy.",
      "C. I like my classroom."
    ],
    correct: 0
  },
  {
    question: "Chcesz zapytać kolegę, czy ma przy sobie długopis. Co powiesz?",
    answers: [
      "A. Do you have a pen with you?",
      "B. Your pen is very nice yesterday.",
      "C. I am writing with my pencil case."
    ],
    correct: 0
  }
];

let currentQuestion = 0;
let score = 0;
let answered = false;

const questionTitle = document.getElementById("question-title");
const answersContainer = document.getElementById("answers");
const feedback = document.getElementById("feedback");
const nextBtn = document.getElementById("next-btn");
const progress = document.getElementById("progress");
const quiz = document.getElementById("quiz");
const resultScreen = document.getElementById("result-screen");
const scoreText = document.getElementById("score-text");
const restartBtn = document.getElementById("restart-btn");

function renderQuestion() {
  answered = false;
  feedback.textContent = "";
  nextBtn.classList.add("hidden");

  const q = questions[currentQuestion];
  questionTitle.textContent = q.question;
  progress.textContent = `Pytanie ${currentQuestion + 1} / ${questions.length}`;

  answersContainer.innerHTML = "";

  q.answers.forEach((answer, index) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = answer;
    btn.addEventListener("click", () => selectAnswer(index, btn));
    answersContainer.appendChild(btn);
  });
}

function selectAnswer(selectedIndex, selectedButton) {
  if (answered) return;
  answered = true;

  const q = questions[currentQuestion];
  const buttons = document.querySelectorAll(".answer-btn");

  buttons.forEach((btn, index) => {
    btn.disabled = true;

    if (index === q.correct) {
      btn.classList.add("correct");
    }
  });

  if (selectedIndex === q.correct) {
    score++;
    feedback.textContent = "Poprawna odpowiedź!";
  } else {
    selectedButton.classList.add("wrong");
    feedback.textContent = "Niepoprawna odpowiedź.";
  }

  nextBtn.classList.remove("hidden");
}

nextBtn.addEventListener("click", () => {
  currentQuestion++;

  if (currentQuestion < questions.length) {
    renderQuestion();
  } else {
    showResult();
  }
});

function showResult() {
  quiz.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  const percent = Math.round((score / questions.length) * 100);
  scoreText.textContent = `${score} / ${questions.length} (${percent}%)`;
  progress.textContent = "Test zakończony";
}

restartBtn.addEventListener("click", () => {
  currentQuestion = 0;
  score = 0;
  quiz.classList.remove("hidden");
  resultScreen.classList.add("hidden");
  renderQuestion();
});

renderQuestion();