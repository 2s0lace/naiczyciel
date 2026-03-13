import type { QuizOption, QuizQuestion } from "@/lib/quiz/types";

export const MOCK_REACTIONS_QUESTIONS: QuizQuestion[] = [
  {
    id: "mock-q-1",
    mode: "reactions",
    category: "Codzienne reakcje",
    prompt: "X: I'm sorry I'm late. The bus didn't arrive.\nY: ________",
    explanation: "W tej sytuacji naturalna i wspierająca reakcja to uspokojenie rozmówcy.",
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
    mode: "reactions",
    category: "Wsparcie",
    prompt: "X: I didn't pass the driving test.\nY: ________",
    explanation: "To neutralna, empatyczna reakcja na złą wiadomość.",
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
    mode: "reactions",
    category: "Prośby",
    prompt: "X: Could you help me with this report?\nY: ________",
    explanation: "To naturalna, uprzejma zgoda na prośbę.",
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
    mode: "reactions",
    category: "Dobre wiadomości",
    prompt: "X: I got the job!\nY: ________",
    explanation: "Najbardziej naturalna reakcja to gratulacje.",
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
    mode: "reactions",
    category: "Planowanie",
    prompt: "X: Let's meet at 6 PM.\nY: ________",
    explanation: "To zwięzłe potwierdzenie ustalenia.",
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
    mode: "reactions",
    category: "Pomoc",
    prompt: "X: Thank you for your help.\nY: ________",
    explanation: "To standardowa odpowiedź na podziękowanie.",
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
    mode: "reactions",
    category: "Spotkania",
    prompt: "X: Sorry, I can't make it today.\nY: ________",
    explanation: "Ta odpowiedź sygnalizuje zrozumienie i elastyczność.",
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
    mode: "reactions",
    category: "Opinia",
    prompt: "X: Do you mind if I open the window?\nY: ________",
    explanation: "W tym pytaniu odpowiedź oznacza, że nie masz nic przeciwko.",
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
    mode: "reactions",
    category: "Spotkania",
    prompt: "X: Thanks for waiting for me.\nY: ________",
    explanation: "Naturalna reakcja potwierdza, że to nie był problem.",
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
    mode: "reactions",
    category: "Przeprosiny",
    prompt: "X: Sorry, I forgot to call you yesterday.\nY: ________",
    explanation: "W tej sytuacji najlepiej zareagować spokojnie i zaakceptować przeprosiny.",
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
  const base = mode === "reactions" ? MOCK_REACTIONS_QUESTIONS : MOCK_REACTIONS_QUESTIONS;

  return base.slice(0, safeCount).map((question) => ({
    ...question,
    options: toThreeOptions(question.options),
  }));
}
