import { LifeBuoy } from "lucide-react";

type QuizUtilityRowProps = {
  fiftyFiftyUsed: boolean;
  disabled: boolean;
  onHintToggle: () => void;
  onUseFiftyFifty: () => void;
};

export function QuizUtilityRow({ fiftyFiftyUsed, disabled, onHintToggle, onUseFiftyFifty }: QuizUtilityRowProps) {
  const showHintButton = !disabled || !fiftyFiftyUsed;

  return (
    <section className="mt-2 flex justify-end">
      <div className="flex items-center gap-1.5">
        {showHintButton ? (
          <button
            type="button"
            data-onboarding-target="hint-action"
            onClick={onHintToggle}
            disabled={disabled}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.02] text-indigo-100/72 ring-1 ring-white/[0.08] transition-colors hover:bg-white/[0.05] hover:text-indigo-100 hover:ring-white/16 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Pokaż wskazówkę"
            title="Wskazowka"
          >
            <LifeBuoy className="h-3.5 w-3.5" />
          </button>
        ) : null}

        <button
          type="button"
          data-onboarding-target="fifty-action"
          onClick={onUseFiftyFifty}
          disabled={disabled || fiftyFiftyUsed}
          className="inline-flex h-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] px-3 text-[11px] font-medium text-white/48 transition-colors hover:bg-white/[0.05] hover:text-white/68 disabled:cursor-not-allowed disabled:opacity-100"
          style={{
            background: fiftyFiftyUsed ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
          }}
        >
          {fiftyFiftyUsed ? "50/50 użyte" : "50/50"}
        </button>
      </div>
    </section>
  );
}
