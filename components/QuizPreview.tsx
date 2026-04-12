import { Check, Flame, X } from "lucide-react";

export type PreviewMode = "sets" | "feedback" | "analysis";

type QuizPreviewProps = {
  mode?: PreviewMode;
};

type PreviewContent = {
  label: string;
  question: string;
  explanationTitle: string;
  explanationText: string;
  badgeTitle: string;
  badgeSubtitle: string;
  statTitle: string;
  statSubtitle: string;
};

const CONTENT: Record<PreviewMode, PreviewContent> = {
  sets: {
    label: "Krótkie zestawy",
    question: "X: I'm sorry I'm late. The bus didn't arrive.",
    explanationTitle: "Dlaczego B?",
    explanationText: "Krótki komentarz po zadaniu pokazuje poprawny kontekst odpowiedzi.",
    badgeTitle: "3 Dni",
    badgeSubtitle: "Seria",
    statTitle: "Świetny wynik",
    statSubtitle: "Gramatyka",
  },
  feedback: {
    label: "Wyjaśnienia od razu",
    question: "X: I didn't pass the test. — That's a pity.",
    explanationTitle: "Co poszło źle?",
    explanationText: "Od razu widzisz błąd i krótkie wyjaśnienie, co poprawić następnym razem.",
    badgeTitle: "Instant",
    badgeSubtitle: "Feedback",
    statTitle: "Błąd złapany",
    statSubtitle: "Frazy",
  },
  analysis: {
    label: "Analiza po teście",
    question: "Podsumowanie sprintu: 8/10 poprawnych odpowiedzi.",
    explanationTitle: "Twoje luki",
    explanationText: "System wskazuje obszary do poprawy i podpowiada, od czego zacząć.",
    badgeTitle: "Raport",
    badgeSubtitle: "Po teście",
    statTitle: "82%",
    statSubtitle: "Wynik",
  },
};

export const QuizPreview = ({ mode = "sets" }: QuizPreviewProps) => {
  const content = CONTENT[mode];

  return (
    <div className="relative mx-auto w-full max-w-[420px] lg:mr-0">
      <div className="absolute inset-0 -z-10 translate-x-8 translate-y-8 rounded-full bg-indigo-600/20 blur-[90px]" />

      <div className="animate-bounce-slow absolute top-2 right-2 z-20 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0A0A16] p-2.5 shadow-2xl sm:-top-8 sm:-right-6 sm:p-3">
        <div className="rounded-xl bg-orange-500/10 p-2 text-orange-400">
          <Flame size={16} fill="currentColor" className="sm:hidden" />
          <Flame size={18} fill="currentColor" className="hidden sm:block" />
        </div>
        <div>
          <p className="text-xs font-bold text-white sm:text-sm">{content.badgeTitle}</p>
          <p className="text-[9px] font-medium tracking-wider text-gray-500 uppercase sm:text-[10px]">
            {content.badgeSubtitle}
          </p>
        </div>
      </div>

      <div className="relative z-10 overflow-hidden rounded-[28px] border border-white/5 bg-[#0B0B15]/90 p-5 ring-1 ring-white/5 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:rounded-[32px] sm:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between sm:mb-8">
          <div className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase sm:text-[11px]">
            {content.label}
          </div>
          <div className="h-1 w-10 rounded-full bg-white/10 sm:w-12" />
        </div>

        <h3 className="mb-5 text-base leading-relaxed font-medium text-white sm:mb-6 sm:text-lg">
          {content.question}
        </h3>

        <div className="space-y-2.5 sm:space-y-3">
          <div className="group flex cursor-default items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 text-gray-300 transition-colors hover:bg-red-500/10 sm:p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/20 text-xs font-bold text-red-400 transition-colors group-hover:bg-red-500/30">
                A
              </span>
              <span className="text-sm">It doesn&apos;t matter.</span>
            </div>
            <X size={18} className="text-red-500" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-white shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)] sm:p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-bold text-emerald-400">
                B
              </span>
              <span className="text-sm font-medium">Never mind.</span>
            </div>
            <Check size={18} className="text-emerald-400" />
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-3.5 sm:mt-6 sm:p-4">
          <h4 className="mb-1.5 text-[10px] font-bold tracking-wider text-indigo-400 uppercase sm:mb-2">
            {content.explanationTitle}
          </h4>
          <p className="text-xs leading-relaxed text-indigo-200/70">{content.explanationText}</p>
        </div>
      </div>

      <div className="absolute -bottom-3 left-3 z-20 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0A0A16] p-2.5 pr-4 shadow-2xl sm:-bottom-6 sm:-left-6 sm:gap-4 sm:p-3 sm:pr-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gray-800/50 sm:h-10 sm:w-10">
          <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36" aria-hidden>
            <path
              className="text-gray-700"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="text-indigo-500 drop-shadow-[0_0_4px_rgba(99,102,241,0.5)]"
              strokeDasharray="85, 100"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
            />
          </svg>
          <span className="absolute text-[9px] font-bold text-white">85%</span>
        </div>
        <div>
          <p className="text-xs leading-none font-bold text-white sm:text-sm">{content.statTitle}</p>
          <p className="mt-1 text-[10px] text-gray-500">{content.statSubtitle}</p>
        </div>
      </div>
    </div>
  );
};

