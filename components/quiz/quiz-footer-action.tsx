import { Spinner } from "@/components/ui/spinner";

type QuizFooterActionProps = {
  canAct: boolean;
  isTransitioning: boolean;
  failedSaveCount: number;
  actionLabel: string;
  helperText?: string;
  onAction: () => void;
  className?: string;
};

function syncMessage(count: number): string {
  if (count <= 0) {
    return "";
  }

  if (count === 1) {
    return "1 odpowiedź czeka na synchronizację.";
  }

  return `${count} odpowiedzi czekają na synchronizację.`;
}

export function QuizFooterAction({
  canAct,
  isTransitioning,
  failedSaveCount,
  actionLabel,
  helperText,
  onAction,
  className,
}: QuizFooterActionProps) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-[linear-gradient(180deg,rgba(5,5,16,0)_0%,rgba(5,5,16,0.9)_18%,rgba(5,5,16,0.985)_100%)] px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+0.95rem)] backdrop-blur-md ${className ?? ""}`}
    >
      <div className="mx-auto w-full max-w-md xl:max-w-[1340px]">
        <button
          type="button"
          onClick={onAction}
          disabled={!canAct || isTransitioning}
          className="flex min-h-[3.5rem] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-3.5 text-base font-semibold text-white shadow-[0_14px_34px_-22px_rgba(59,130,246,0.8)] transition-all duration-150 active:scale-[0.992] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isTransitioning ? (
            <>
              <Spinner size="sm" className="border-white/20 border-t-white border-r-indigo-200" />
              <span>Ładowanie...</span>
            </>
          ) : (
            actionLabel
          )}
        </button>

        <p className="mt-1.5 text-center text-[11px] text-indigo-100/68">
          {helperText ?? syncMessage(failedSaveCount)}
        </p>
      </div>
    </div>
  );
}
