import { LifeBuoy } from "lucide-react";

type QuizUtilityRowProps = {
  fiftyFiftyUsed: boolean;
  disabled: boolean;
  onHintToggle: () => void;
  onUseFiftyFifty: () => void;
};

export function QuizUtilityRow({ fiftyFiftyUsed, disabled, onHintToggle, onUseFiftyFifty }: QuizUtilityRowProps) {
  return (
    <section className="mt-1.5 flex justify-end">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          data-onboarding-target="hint-action"
          onClick={onHintToggle}
          disabled={disabled}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.03] text-indigo-100 ring-1 ring-white/12 transition-colors hover:bg-white/[0.07] hover:ring-white/22 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Pokaż wskazówkę"
          title="Wskazówka (UWAGA)"
        >
          <LifeBuoy className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          data-onboarding-target="fifty-action"
          onClick={onUseFiftyFifty}
          disabled={disabled || fiftyFiftyUsed}
          className="inline-flex h-8 items-center justify-center rounded-full px-3 text-[11px] font-semibold text-indigo-100 ring-1 ring-white/16 transition-colors disabled:cursor-not-allowed disabled:opacity-45"
          style={{
            background: fiftyFiftyUsed ? "rgba(79,70,229,0.2)" : "rgba(255,255,255,0.04)",
          }}
        >
          {fiftyFiftyUsed ? "50/50 użyte" : "50/50"}
        </button>
      </div>
    </section>
  );
}
