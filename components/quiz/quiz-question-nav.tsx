type QuestionStatus = "current" | "correct" | "wrong" | "idle";

type QuizQuestionNavProps = {
  statuses: QuestionStatus[];
  currentIndex: number;
  onJump: (index: number) => void;
  maxReachableIndex?: number;
  desktopCompact?: boolean;
};

function getQuestionButtonClasses(status: QuestionStatus, disabled: boolean) {
  if (disabled) {
    return "bg-white/[0.018] text-gray-500 ring-1 ring-white/8 opacity-55";
  }

  if (status === "current") {
    return "bg-indigo-500/30 text-white ring-1 ring-indigo-300/50";
  }

  if (status === "correct") {
    return "bg-emerald-500/18 text-emerald-100 ring-1 ring-emerald-300/35";
  }

  if (status === "wrong") {
    return "bg-rose-500/16 text-rose-100 ring-1 ring-rose-300/30";
  }

  return "bg-white/[0.03] text-gray-300 ring-1 ring-white/12";
}

export function QuizQuestionNav({ statuses, currentIndex, onJump, maxReachableIndex, desktopCompact = false }: QuizQuestionNavProps) {
  const containerClass = desktopCompact
    ? "flex justify-center gap-1 py-0.5 xl:grid xl:grid-cols-5 xl:gap-1.5"
    : "flex justify-center gap-1 py-0.5 xl:gap-1.5";

  const buttonClass = desktopCompact
    ? "inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors xl:h-7 xl:min-w-7 xl:text-[11px]"
    : "inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors xl:h-8 xl:min-w-8 xl:text-[11px]";

  return (
    <section className="mt-1.5 xl:mt-2">
      <div className={containerClass}>
        {statuses.map((status, index) => {
          const disabled = typeof maxReachableIndex === "number" && index > maxReachableIndex;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onJump(index)}
              disabled={disabled}
              className={`${buttonClass} ${getQuestionButtonClasses(status, disabled)} disabled:cursor-not-allowed`}
              aria-label={`Przejdź do pytania ${index + 1}`}
              aria-current={index === currentIndex ? "step" : undefined}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export type { QuestionStatus };
