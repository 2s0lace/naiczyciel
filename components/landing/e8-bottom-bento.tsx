"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { Arimo } from "next/font/google";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  Check,
  Layers3,
  PlayCircle,
} from "lucide-react";
import { RevealOnView } from "@/components/landing/ui/reveal-on-view";
import TaskDonutChart from "@/components/landing/task-donut-chart";
import handDrawnCircle from "@/img/vecteezy_a-black-and-white-drawing-of-a-circle-with-a-line_68974229.svg";
import warningSticker from "@/img/vecteezy_a-black-and-white-drawing-of-exclamationmarks_68974229.svg";
import sunSticker from "@/img/vecteezy_a-black-and-white-drawing-of-sun_68974229.svg";

const arimo = Arimo({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "700"],
});

const EXAM_CARD_BASE =
  "group relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,rgba(248,244,238,0.68),rgba(241,235,226,0.54))] p-6 text-[#15233f] shadow-[0_18px_30px_-32px_rgba(17,24,39,0.26)] md:p-7";

const QUESTION_OPTIONS = [
  { id: "A", label: "250+ pytań" },
  { id: "B", label: "150+ pytań" },
  { id: "C", label: "300+ pytań" },
  { id: "D", label: "200+ pytań" },
] as const;

const DAYS_QUESTION_OPTIONS = [
  { id: "A", label: "mało" },
  { id: "B", label: "dużo" },
  { id: "C", label: "nie ma danych" },
] as const;

const CORRECT_OPTION_ID = "C";
const CORRECT_DAYS_OPTION_ID = "A";
const EXAM_MONTH_INDEX = 4;
const EXAM_DAY = 13;

function getNextExamDate(baseDate: Date) {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(today.getFullYear(), EXAM_MONTH_INDEX, EXAM_DAY);
  candidate.setHours(0, 0, 0, 0);

  if (candidate.getTime() >= today.getTime()) {
    return candidate;
  }

  const next = new Date(today.getFullYear() + 1, EXAM_MONTH_INDEX, EXAM_DAY);
  next.setHours(0, 0, 0, 0);
  return next;
}

function ExamCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${EXAM_CARD_BASE} ${className}`}>{children}</div>;
}

function ExamLabel({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`${arimo.className} relative z-10 flex items-center justify-between gap-3`}>
      <div className="inline-flex items-center bg-[#b8d99c] px-2 py-0.5 text-[0.96rem] font-bold leading-none text-[#102238]">
        <span>{children}</span>
      </div>
      {icon}
    </div>
  );
}

export default function E8BottomBento() {
  const router = useRouter();
  const [selectedOption] = useState<string | null>(CORRECT_OPTION_ID);
  const [selectedDaysOption] = useState<string | null>(CORRECT_DAYS_OPTION_ID);
  const [donutUnlocked] = useState(true);

  const today = useMemo(() => new Date(), []);
  const examDate = useMemo(() => getNextExamDate(today), [today]);
  const daysToExam = useMemo(
    () => Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / 86_400_000)),
    [examDate, today],
  );
  const examDateLabel = useMemo(
    () =>
      examDate.toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    [examDate],
  );

  const daysRevealed = selectedDaysOption !== null;

  return (
    <section
      id="pricing"
      aria-labelledby="e8-bento-heading"
      className={`${arimo.className} relative z-10 mx-auto w-full max-w-md px-5 pt-14 pb-16 md:max-w-4xl md:px-6 md:pt-20 md:pb-20 lg:max-w-6xl lg:px-9 lg:pt-24 lg:pb-24 xl:max-w-[82rem] xl:px-10 2xl:max-w-[94rem] 2xl:px-12`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 right-1/2 top-[-50px] bottom-0 -z-20 -ml-[50vw] -mr-[50vw] bg-[linear-gradient(180deg,rgba(249,245,237,0)_0%,rgba(249,245,237,0.88)_56px,rgba(243,236,226,0.975)_132px,rgba(243,236,226,0.975)_100%)] md:top-[-24px] lg:top-[-12px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 right-1/2 top-[-50px] bottom-0 -z-10 -ml-[50vw] -mr-[50vw] opacity-[0.38] md:top-[-24px] lg:top-[-12px]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(120,132,166,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(120,132,166,0.22) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 right-1/2 top-[-50px] bottom-0 -z-10 -ml-[50vw] -mr-[50vw] bg-[radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.52),transparent_26%),radial-gradient(circle_at_78%_64%,rgba(221,212,198,0.28),transparent_36%)] md:top-[-24px] lg:top-[-12px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 right-1/2 top-[-50px] h-[170px] -z-10 -ml-[50vw] -mr-[50vw] bg-[linear-gradient(180deg,rgba(5,5,16,0.78)_0%,rgba(5,5,16,0.62)_18%,rgba(5,5,16,0.34)_40%,rgba(161,154,147,0.12)_68%,rgba(249,245,237,0.06)_86%,rgba(249,245,237,0)_100%)] md:top-[-24px] lg:top-[-12px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 right-1/2 bottom-[-1px] h-[160px] -z-10 -ml-[50vw] -mr-[50vw] bg-[linear-gradient(180deg,rgba(243,236,226,0)_0%,rgba(243,236,226,0.08)_28%,rgba(150,144,140,0.16)_56%,rgba(5,5,16,0.56)_84%,rgba(5,5,16,0.82)_100%)]"
      />

      <RevealOnView className="mx-auto max-w-[46rem] text-center">
        <h2
          id="e8-bento-heading"
          className={`${arimo.className} text-[1.55rem] leading-[1.08] font-bold tracking-tight text-[#13203a] md:text-[2.1rem] lg:text-[2.5rem]`}
        >
          Nie pogięta kserówka, a profesjonalne materiały.
        </h2>
        <p className={`${arimo.className} mx-auto mt-3 max-w-[38rem] text-[15px] leading-relaxed text-[#39496a] md:text-[17px]`}>
          Wyjaśnienia błędów i analiza tego, co warto jeszcze powtórzyć.
          Wszystko ubrane w formę bliską arkuszowi E8.
        </p>
      </RevealOnView>

      <div className="mt-10 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-12 md:gap-4 lg:mt-14 lg:gap-5">
        <RevealOnView className="md:col-span-12" delay={0}>
          <ExamCard className="min-h-[16rem] md:min-h-[19rem] lg:min-h-[22rem]">
            <div className="relative z-10 flex h-full flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1.02fr)_minmax(240px,0.98fr)] lg:items-start lg:gap-10">
              <div className="flex h-full flex-col gap-5 lg:pt-2">
                <ExamLabel>Pytanie 1. (0—1)</ExamLabel>

                <div className="space-y-4">
                  <div>
                    <p className={`${arimo.className} text-[1.18rem] leading-tight font-bold text-[#172648] md:text-[1.42rem] lg:text-[1.62rem]`}>
                      Ile jest pytań na stronie?
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {QUESTION_OPTIONS.map((option) => {
                      const isSelected = selectedOption === option.id;
                      const isCorrect = option.id === CORRECT_OPTION_ID;
                      const showCorrectState = donutUnlocked && isCorrect;
                      const showWrongState = isSelected && !donutUnlocked && !isCorrect;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          disabled
                          className={`${arimo.className} flex min-h-[4rem] w-full items-start gap-3 rounded-[1.2rem] bg-white/34 px-4 py-3 text-left transition-all duration-200 ${
                            showCorrectState
                              ? "bg-[#cfe7bf]/80 text-[#355f32] ring-1 ring-[#8fb77a]/50"
                              : showWrongState
                                  ? "bg-[#f1d4cf]/70 text-[#8a433d] ring-1 ring-[#c48e87]/40"
                                  : "text-[#15233f]"
                          }`}
                          aria-pressed={isSelected}
                        >
                          <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center">
                            {showCorrectState ? (
                              <Image
                                src={handDrawnCircle}
                                alt=""
                                aria-hidden
                                className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[190%] w-[190%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.92]"
                              />
                            ) : null}
                            <span className="relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#edf2ff] text-[0.84rem] font-bold text-[#5d72ae]">
                              {option.id}
                            </span>
                          </span>
                          <span className="relative z-10 pt-0.5 text-[1.02rem] leading-snug font-bold md:text-[1.06rem]">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {donutUnlocked ? (
                    <p className={`${arimo.className} mt-4 max-w-[24rem] text-[1rem] leading-relaxed text-[#4a5b80]`}>
                      <span className="font-bold text-[#355f32]">300+ pytań</span>,
                      bo baza łączy materiał z{" "}
                      <span className="font-bold text-[#172648]">
                        13 działów z 3 repetytoriów
                      </span>{" "}
                      oraz{" "}
                      <span className="font-bold text-[#172648]">
                        12 zagadnień gramatycznych
                      </span>
                      .
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[1.4rem] bg-white/18 px-4 py-5 md:px-5 md:py-6 lg:min-h-[19rem] lg:self-stretch">
                <TaskDonutChart revealed={donutUnlocked} />
              </div>
            </div>
          </ExamCard>
        </RevealOnView>

        <RevealOnView className="md:col-span-5" delay={110}>
          <ExamCard className="h-full min-h-[18rem] !overflow-visible">
            <Image
              src={warningSticker}
              alt=""
              aria-hidden
              className="pointer-events-none absolute top-0 right-0 z-20 h-16 w-16 translate-x-[22%] -translate-y-[28%] rotate-[8deg] object-contain opacity-[0.94] md:h-20 md:w-20"
            />
            <ExamLabel>
              Pytanie 2. (0—1)
            </ExamLabel>

            <p className={`${arimo.className} mt-5 text-[1.16rem] leading-relaxed text-[#314264] md:text-[1.22rem]`}>
              Ile dni zostało do egzaminu?
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(170px,0.7fr)] md:items-start">
              <div className="space-y-2.5">
                {DAYS_QUESTION_OPTIONS.map((option) => {
                  const isSelected = selectedDaysOption === option.id;
                  const isCorrect = option.id === CORRECT_DAYS_OPTION_ID;
                  const showCorrect = isSelected && isCorrect;
                  const showWrong = isSelected && !isCorrect;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled
                      className={`${arimo.className} flex min-h-[4rem] w-full max-w-[18rem] items-start gap-3 rounded-[1.2rem] bg-white/34 px-4 py-3 text-left transition-all duration-200 ${
                        showCorrect
                          ? "bg-[#cfe7bf]/80 text-[#355f32] ring-1 ring-[#8fb77a]/50"
                          : showWrong
                              ? "bg-[#f1d4cf]/70 text-[#8a433d] ring-1 ring-[#c48e87]/40"
                              : "text-[#15233f] disabled:cursor-default"
                      }`}
                      aria-pressed={isSelected}
                    >
                      <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center">
                        {showCorrect ? (
                          <Image
                            src={handDrawnCircle}
                            alt=""
                            aria-hidden
                            className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[190%] w-[190%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.92]"
                          />
                        ) : null}
                        <span className="relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#edf2ff] text-[0.84rem] font-bold text-[#5d72ae]">
                          {option.id}
                        </span>
                      </span>
                      <span className="relative z-10 pt-0.5 text-[1.02rem] leading-snug font-bold md:text-[1.06rem]">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>

                <div className="flex items-end gap-3 md:justify-start md:pt-1">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-10 w-10 text-[#7286c4] md:h-11 md:w-11" strokeWidth={1.8} />
                    {!daysRevealed ? (
                      <QuestionMarkCircleIcon className="h-8 w-8 text-[#172648] md:h-9 md:w-9" />
                    ) : null}
                  </div>
                  <div>
                    <p
                      className={`${arimo.className} text-[3.4rem] leading-none font-bold tracking-[-0.06em] text-[#172648] md:text-[4rem]`}
                    >
                      {daysRevealed ? (
                        daysToExam
                      ) : null}
                    </p>
                  {daysRevealed ? (
                    <p className={`${arimo.className} mt-1 text-[0.9rem] font-bold text-[#7382a9]`}>
                      dni — {examDateLabel}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </ExamCard>
        </RevealOnView>

        <RevealOnView className="md:col-span-7" delay={170}>
          <ExamCard className="h-full min-h-[18rem] !overflow-visible">
            <div className="flex items-center gap-3">
              <ExamLabel>Twój plan</ExamLabel>
            </div>

            <div className="mt-5 flex items-end gap-4">
              <p
                className={`${arimo.className} text-[3.6rem] leading-none font-bold tracking-[-0.05em] text-[#13203a] md:text-[4.2rem]`}
              >
                24 zł
              </p>
              <p
                className={`${arimo.className} mb-2 text-[1.2rem] font-bold text-[#8596bd] line-through decoration-[#8596bd]/70`}
              >
                29 zł
              </p>
              <p
                className={`${arimo.className} mb-2.5 text-[0.85rem] font-bold text-[#5f6f98]`}
              >
                / jednorazowo
              </p>
            </div>

            <ul
              className={`${arimo.className} mt-5 grid gap-2.5 text-[1.02rem] leading-[1.45] text-[#33456b] md:grid-cols-1 md:text-[1.04rem]`}
            >
              <li className="flex items-start gap-2.5">
                <Layers3 className="mt-0.5 h-4 w-4 shrink-0 text-[#7086c1]" strokeWidth={1.8} />
                <span>Wyjaśnienie każdego błędu od razu.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7086c1]" strokeWidth={2.2} />
                <span>Krótkie zestawy — 10 minut dziennie wystarczy.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-[#7086c1]" strokeWidth={1.8} />
                <span>Zobaczysz co powtórzyć przed egzaminem.</span>
              </li>
            </ul>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className={`${arimo.className} group/cta relative flex-1 overflow-hidden rounded-[1.1rem] bg-[linear-gradient(90deg,#6c63f1_0%,#675ae7_44%,#5948d7_100%)] px-5 py-3.5 text-[0.95rem] font-bold tracking-[0.01em] text-white shadow-[0_16px_26px_-18px_rgba(72,67,210,0.52)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:brightness-[1.04] active:scale-[0.985]`}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/65 to-transparent"
                />
                <span className="relative z-10 inline-flex items-center justify-center gap-2">
                  Zacznij za 24 zł
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-0.5"
                    strokeWidth={2.2}
                  />
                </span>
              </button>

              <Link
                href="/demo"
                className={`${arimo.className} inline-flex items-center justify-center gap-2 rounded-[1.1rem] border border-[#c7cce0] bg-white/60 px-5 py-3.5 text-[0.95rem] font-bold text-[#172648] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/80 sm:w-[11.5rem]`}
              >
                Zobacz demo
                <PlayCircle className="h-4 w-4 text-[#7c8cb6]" strokeWidth={1.9} />
              </Link>
            </div>

            <p className={`${arimo.className} mt-3 text-[0.88rem] text-[#7382a9]`}>
              Bezpieczna płatność. Aktywacja od razu. Faktura na życzenie.
            </p>
            <Image
              src={sunSticker}
              alt=""
              aria-hidden
              className="pointer-events-none absolute top-0 right-0 z-20 h-16 w-16 translate-x-[20%] -translate-y-[24%] rotate-[10deg] object-contain opacity-[0.94] md:h-20 md:w-20"
            />
          </ExamCard>
        </RevealOnView>
      </div>

      <div className="mx-auto mt-12 max-w-[52rem] text-center md:mt-16">
        <h3 className={`${arimo.className} text-[0.82rem] font-bold tracking-[0.08em] text-[#5f6f98] uppercase`}>
          Trening do E8 z angielskiego
        </h3>
        <p className={`${arimo.className} mt-2 text-[1rem] leading-relaxed text-[#566789] md:text-[1.06rem]`}>
          Na tej stronie możesz ćwiczyć angielski do egzaminu ósmoklasisty w
          krótkich quizach. Zestawy obejmują reakcje językowe, reading,
          słownictwo i gramatykę, a po zakończeniu od razu zobaczysz wynik i
          krótkie wyjaśnienia.
        </p>
      </div>
    </section>
  );
}

