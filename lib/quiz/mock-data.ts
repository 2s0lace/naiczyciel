import type { QuizOption, QuizQuestion } from "@/lib/quiz/types";

export const MOCK_REACTIONS_QUESTIONS: QuizQuestion[] = [
  {
    id: "mock-q-1",
    type: "single_question",
    mode: "reactions",
    category: "Codzienne reakcje",
    prompt: "X: I'm sorry I'm late. The bus didn't arrive.\nY: ________",
    explanation: "W tej sytuacji naturalna i wspierająca reakcja to uspokojenie rozmówcy.",
    hintText: "Szukaj spokojnej reakcji, ktora zdejmie napiecie.",
    patternTip: "Pattern: apology -> reassurance",
    warningTip: "Unikaj dosłownego tłumaczenia z polskiego.",
    options: [
      { id: "mock-q-1-a", label: "A", text: "Never mind.", isCorrect: true },
      { id: "mock-q-1-b", label: "B", text: "It doesn't care.", isCorrect: false },
      { id: "mock-q-1-c", label: "C", text: "No one asks.", isCorrect: false },
      { id: "mock-q-1-d", label: "D", text: "I late too.", isCorrect: false },
    ],
  },
  {
    id: "mock-q-2",
    type: "single_question",
    mode: "reactions",
    category: "Wsparcie",
    prompt: "X: I didn't pass the driving test.\nY: ________",
    explanation: "To neutralna, empatyczna reakcja na złą wiadomość.",
    hintText: "Dobra odpowiedz brzmi wspierajaco, nie ironicznie.",
    patternTip: "Pattern: bad news -> empathy",
    warningTip: "Nie używaj ironii przy negatywnych wiadomościach.",
    options: [
      { id: "mock-q-2-a", label: "A", text: "That's a pity.", isCorrect: true },
      { id: "mock-q-2-b", label: "B", text: "Great for you.", isCorrect: false },
      { id: "mock-q-2-c", label: "C", text: "How lucky!", isCorrect: false },
      { id: "mock-q-2-d", label: "D", text: "I don't pass you.", isCorrect: false },
    ],
  },
  {
    id: "mock-q-3",
    type: "single_question",
    mode: "reactions",
    category: "Prośby",
    prompt: "X: Could you help me with this report?\nY: ________",
    explanation: "To naturalna, uprzejma zgoda na prośbę.",
    hintText: "Skup sie na uprzejmej zgodzie na prosbe.",
    patternTip: "Pattern: request -> willing response",
    warningTip: "Uważaj na kalki typu 'yes, of course I can help you now maybe'.",
    options: [
      { id: "mock-q-3-a", label: "A", text: "Sure, no problem.", isCorrect: true },
      { id: "mock-q-3-b", label: "B", text: "No, you can me.", isCorrect: false },
      { id: "mock-q-3-c", label: "C", text: "This report helps me not.", isCorrect: false },
      { id: "mock-q-3-d", label: "D", text: "I don't can.", isCorrect: false },
    ],
  },
  {
    id: "mock-q-4",
    type: "single_question",
    mode: "reactions",
    category: "Dobre wiadomości",
    prompt: "X: I got the job!\nY: ________",
    explanation: "Najbardziej naturalna reakcja to gratulacje.",
    hintText: "Przy dobrej wiadomosci wybierz reakcje pozytywna.",
    patternTip: "Pattern: success -> congratulations",
    warningTip: "Nie skracaj do 'Congrats for you' w tym kontekście.",
    options: [
      { id: "mock-q-4-a", label: "A", text: "Congratulations!", isCorrect: true },
      { id: "mock-q-4-b", label: "B", text: "That's too bad.", isCorrect: false },
      { id: "mock-q-4-c", label: "C", text: "Never congratulations.", isCorrect: false },
      { id: "mock-q-4-d", label: "D", text: "You are lost.", isCorrect: false },
    ],
  },
  {
    id: "mock-q-5",
    type: "single_question",
    mode: "reactions",
    category: "Planowanie",
    prompt: "X: Let's meet at 6 PM.\nY: ________",
    explanation: "To zwięzłe potwierdzenie ustalenia.",
    hintText: "Szukaj krotkiego potwierdzenia propozycji.",
    patternTip: "Pattern: suggestion -> agreement",
    warningTip: "Unikaj wieloznacznych odpowiedzi typu 'maybe yes'.",
    options: [
      { id: "mock-q-5-a", label: "A", text: "Sounds good.", isCorrect: true },
      { id: "mock-q-5-b", label: "B", text: "I don't listen.", isCorrect: false },
      { id: "mock-q-5-c", label: "C", text: "This is no sound.", isCorrect: false },
      { id: "mock-q-5-d", label: "D", text: "You meet me six clock.", isCorrect: false },
    ],
  },
  {
    id: "mock-q-6",
    type: "single_question",
    mode: "reactions",
    category: "Pomoc",
    prompt: "X: Thank you for your help.\nY: ________",
    explanation: "To standardowa odpowiedź na podziękowanie.",
    hintText: "To ma byc naturalna odpowiedz na podziekowanie.",
    patternTip: "Pattern: thanks -> polite response",
    warningTip: "Nie używaj 'No thanks' jako odpowiedzi na podziękowanie.",
    options: [
      { id: "mock-q-6-a", label: "A", text: "You're welcome.", isCorrect: true },
      { id: "mock-q-6-b", label: "B", text: "Welcome you too.", isCorrect: false },
      { id: "mock-q-6-c", label: "C", text: "No, thank you me.", isCorrect: false },
      { id: "mock-q-6-d", label: "D", text: "I don't mind thanks.", isCorrect: false },
    ],
  },
  {
    id: "mock-q-7",
    type: "single_question",
    mode: "reactions",
    category: "Spotkania",
    prompt: "X: Sorry, I can't make it today.\nY: ________",
    explanation: "Ta odpowiedź sygnalizuje zrozumienie i elastyczność.",
    hintText: "Najlepsza odpowiedz brzmi spokojnie i wyrozumiale.",
    patternTip: "Pattern: cancellation -> understanding",
    warningTip: "Nie reaguj oskarżająco przy neutralnym odwołaniu.",
    options: [
      { id: "mock-q-7-a", label: "A", text: "No worries, we can reschedule.", isCorrect: true },
      { id: "mock-q-7-b", label: "B", text: "You always can't.", isCorrect: false },
      { id: "mock-q-7-c", label: "C", text: "I make today, you no.", isCorrect: false },
      { id: "mock-q-7-d", label: "D", text: "Never call me.", isCorrect: false },
    ],
  },
  {
    id: "mock-q-8",
    type: "single_question",
    mode: "reactions",
    category: "Opinia",
    prompt: "X: Do you mind if I open the window?\nY: ________",
    explanation: "W tym pytaniu odpowiedź oznacza, że nie masz nic przeciwko.",
    hintText: "Pomysl, ktora odpowiedz oznacza zgode na otwarcie okna.",
    patternTip: "Pattern: do you mind -> permission",
    warningTip: "Najczęstszy błąd: mylenie 'Yes' i 'No' przy 'Do you mind...'.",
    options: [
      { id: "mock-q-8-a", label: "A", text: "Not at all.", isCorrect: true },
      { id: "mock-q-8-b", label: "B", text: "Yes, open now always.", isCorrect: false },
      { id: "mock-q-8-c", label: "C", text: "I mind no open.", isCorrect: false },
      { id: "mock-q-8-d", label: "D", text: "Open is minding.", isCorrect: false },
    ],
  },
  {
    id: "mock-q-9",
    type: "single_question",
    mode: "reactions",
    category: "Spotkania",
    prompt: "X: Thanks for waiting for me.\nY: ________",
    explanation: "Naturalna reakcja potwierdza, że to nie był problem.",
    hintText: "Tu pasuje uspokajajaca odpowiedz po podziekowaniu.",
    patternTip: "Pattern: appreciation -> reassurance",
    warningTip: "Unikaj chłodnych odpowiedzi, gdy ktoś dziękuje.",
    options: [
      { id: "mock-q-9-a", label: "A", text: "No problem at all.", isCorrect: true },
      { id: "mock-q-9-b", label: "B", text: "You must wait.", isCorrect: false },
      { id: "mock-q-9-c", label: "C", text: "Waiting is your fault.", isCorrect: false },
      { id: "mock-q-9-d", label: "D", text: "I problem no.", isCorrect: false },
    ],
  },
  {
    id: "mock-q-10",
    type: "single_question",
    mode: "reactions",
    category: "Przeprosiny",
    prompt: "X: Sorry, I forgot to call you yesterday.\nY: ________",
    explanation: "W tej sytuacji najlepiej zareagować spokojnie i zaakceptować przeprosiny.",
    hintText: "Szukaj lagodnej odpowiedzi, ktora przyjmuje przeprosiny.",
    patternTip: "Pattern: apology -> acceptance",
    warningTip: "Nie eskaluj tonu, gdy kontekst wymaga łagodnej reakcji.",
    options: [
      { id: "mock-q-10-a", label: "A", text: "It's okay, don't worry.", isCorrect: true },
      { id: "mock-q-10-b", label: "B", text: "You never call no one.", isCorrect: false },
      { id: "mock-q-10-c", label: "C", text: "Call is forgetting me.", isCorrect: false },
      { id: "mock-q-10-d", label: "D", text: "I am angry forever.", isCorrect: false },
    ],
  },
];

export const MOCK_READING_MC_QUESTIONS: QuizQuestion[] = [
  {
    id: "mock-reading-1",
    type: "reading_mc",
    mode: "reading_mc",
    category: "Czytanie",
    title: "Mock reading_mc",
    passage:
      "Tom is writing to Mia. He can't go to the park today because he has to stay at home and help his dad. He wants to meet Mia tomorrow after school instead.",
    passageTranslation:
      "Tom pisze do Mii. Nie może dziś iść do parku, ponieważ musi zostać w domu i pomóc swojemu tacie. Zamiast tego chce spotkać się z Mią jutro po szkole.",
    explanation: "Przy czytaniu szukaj dosłownej informacji w tekście i nie dopowiadaj nic spoza passage.",
    hintText: "Wszystkie odpowiedzi są wprost w tekście. Szukaj krótkich informacji, nie ogólnego sensu.",
    patternTip: "Najpierw przeczytaj tekst, potem dopasuj odpowiedzi do konkretnych zdań.",
    warningTip: "Nie wybieraj odpowiedzi, która tylko brzmi logicznie, ale nie pada w tekście.",
    questions: [
      {
        id: "1",
        prompt: "Why can't Tom go to the park today?",
        options: [
          { id: "A", label: "A", text: "He has to help his dad.", isCorrect: true },
          { id: "B", label: "B", text: "He is meeting Mia now.", isCorrect: false },
          { id: "C", label: "C", text: "He has football practice.", isCorrect: false },
        ],
      },
      {
        id: "2",
        prompt: "When does Tom want to meet Mia?",
        options: [
          { id: "A", label: "A", text: "This evening.", isCorrect: false },
          { id: "B", label: "B", text: "Tomorrow after school.", isCorrect: true },
          { id: "C", label: "C", text: "Next weekend.", isCorrect: false },
        ],
      },
    ],
  },
];

export const MOCK_GAP_FILL_TEXT_QUESTIONS: QuizQuestion[] = [
  {
    id: "mock-gap-fill-1",
    type: "gap_fill_text",
    mode: "gap_fill_text",
    category: "Uzupelnianie tekstu",
    title: "Mock gap_fill_text",
    passage:
      "Every school day, Amy [1] up at 6:30. After that, she [2] breakfast with her brother before they leave for school.",
    passageTranslation:
      "W każdy dzień szkolny Amy [1] o 6:30. Potem [2] śniadanie ze swoim bratem, zanim wyjdą do szkoły.",
    explanation: "W lukach patrz na podmiot i czas zdania. Tu wszystko opiera się o prosty present simple.",
    hintText: "Sprawdź formę czasownika przy 'Amy' i przy codziennej rutynie.",
    patternTip: "Najpierw przeczytaj cały tekst, potem dobierz formy do każdej luki.",
    warningTip: "Nie wybieraj bezokolicznika, jeśli zdanie opisuje stały nawyk jednej osoby.",
    questions: [
      {
        id: "1",
        prompt: "Gap 1",
        options: [
          { id: "A", label: "A", text: "get", isCorrect: false },
          { id: "B", label: "B", text: "gets", isCorrect: true },
          { id: "C", label: "C", text: "getting", isCorrect: false },
        ],
      },
      {
        id: "2",
        prompt: "Gap 2",
        options: [
          { id: "A", label: "A", text: "has", isCorrect: true },
          { id: "B", label: "B", text: "have", isCorrect: false },
          { id: "C", label: "C", text: "having", isCorrect: false },
        ],
      },
    ],
  },
];

function toThreeOptions(options: QuizOption[]): QuizOption[] {
  if (options.length <= 3) {
    return options.map((option, index) => ({
      ...option,
      label: ["A", "B", "C"][index] ?? `${index + 1}`,
    }));
  }

  const firstThree = options.slice(0, 3);
  const correctOption = options.find((option) => option.isCorrect);
  let selected = firstThree;

  if (!selected.some((option) => option.isCorrect) && correctOption) {
    const head = selected.slice(0, 2).filter((option) => option.id !== correctOption.id);
    selected = [...head, correctOption];
  }

  if (!selected.some((option) => option.isCorrect) && selected[0]) {
    selected[0] = {
      ...selected[0],
      isCorrect: true,
    };
  }

  return selected.slice(0, 3).map((option, index) => ({
    ...option,
    label: ["A", "B", "C"][index] ?? `${index + 1}`,
  }));
}

export function getMockQuestions(mode: string, count: number): QuizQuestion[] {
  const safeCount = Math.min(10, Math.max(5, count));
  const base =
    mode === "reading_mc"
      ? MOCK_READING_MC_QUESTIONS
      : mode === "gap_fill_text"
        ? MOCK_GAP_FILL_TEXT_QUESTIONS
        : MOCK_REACTIONS_QUESTIONS;

  return base.slice(0, safeCount).map((question) => {
    if (question.type !== "single_question") {
      return question;
    }

    return {
      ...question,
      options: toThreeOptions(question.options),
    };
  });
}
