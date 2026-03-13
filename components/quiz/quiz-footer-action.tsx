type QuizFooterActionProps = {
  canGoNext: boolean;
  isLastQuestion: boolean;
  isTransitioning: boolean;
  failedSaveCount: number;
  helperText?: string;
  onNext: () => void;
  className?: string;
};

function syncMessage(count: number): string {
  if (count <= 0) {
    return "Natychmiastowy feedback, zapis w tle.";
  }

  if (count === 1) {
    return "1 odpowiedź czeka na synchronizację.";
  }

  return `${count} odpowiedzi czekają na synchronizację.`;
}

export function QuizFooterAction({
  canGoNext,
  isLastQuestion,
  isTransitioning,
  failedSaveCount,
  helperText,
  onNext,
  className,
}: QuizFooterActionProps) {
  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 bg-[linear-gradient(180deg,rgba(5,5,16,0)_0%,rgba(5,5,16,0.9)_20%,rgba(5,5,16,0.98)_100%)] px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] backdrop-blur-md ${className ?? ""}`}>
      <div className="mx-auto w-full max-w-md xl:max-w-[1340px]">
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isTransitioning}
          className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 py-3.5 text-base font-semibold text-white shadow-[0_14px_34px_-22px_rgba(59,130,246,0.8)] transition-all duration-150 active:scale-[0.992] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isTransitioning ? "Ładowanie..." : isLastQuestion ? "Zobacz podsumowanie" : "Dalej"}
        </button>

        <p className="mt-1.5 text-center text-[11px] text-indigo-100/68">{helperText ?? syncMessage(failedSaveCount)}</p>
      </div>
    </div>
  );
}
