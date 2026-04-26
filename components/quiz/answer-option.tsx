import { Check, X } from "lucide-react";
import type { QuizOption } from "@/lib/quiz/types";

type AnswerVisualState = "default" | "selected" | "correct" | "revealed_correct" | "wrong" | "disabled" | "eliminated";

type AnswerOptionProps = {
  option: QuizOption;
  state: AnswerVisualState;
  onSelect: (optionId: string) => void;
};

function getClasses(state: AnswerVisualState) {
  switch (state) {
    case "selected":
      return [
        "bg-[var(--color-option-selected)]",
        "text-[var(--color-app)]",
        "ring-[var(--color-option-selected-ring)]",
      ].join(" ");
    case "correct":
      return "bg-emerald-500/[0.12] text-[var(--color-app)] ring-emerald-300/24";
    case "revealed_correct":
      return "bg-emerald-500/[0.06] text-[var(--color-app)] ring-emerald-300/18";
    case "wrong":
      return "bg-rose-500/[0.08] text-[var(--color-app)] ring-rose-300/16";
    case "disabled":
      return "bg-transparent text-gray-400 ring-white/8 opacity-60";
    case "eliminated":
      return "bg-[var(--color-option-bg)] text-gray-500 ring-[var(--color-option-border)] opacity-45";
    default:
      return [
        "bg-[var(--color-option-bg)]",
        "text-[var(--color-app)]",
        "ring-[var(--color-option-border)]",
        "hover:bg-[var(--color-option-hover-bg)]",
        "hover:ring-[var(--color-option-hover-ring)]",
      ].join(" ");
  }
}

function getBadgeClasses(state: AnswerVisualState) {
  switch (state) {
    case "correct":
      return "border border-emerald-300/28 bg-emerald-500/16 text-emerald-50";
    case "revealed_correct":
      return "border border-emerald-300/24 bg-transparent text-emerald-100";
    case "wrong":
      return "border border-rose-300/28 bg-rose-500/16 text-rose-50";
    case "selected":
      return "border border-indigo-300/35 bg-indigo-500/22 text-indigo-50";
    case "disabled":
      return "border border-[var(--color-border)] bg-[var(--color-option-bg)] text-[var(--color-app-muted)]";
    case "eliminated":
      return "border border-[var(--color-border)] bg-[var(--color-option-bg)] text-[var(--color-app-muted)]";
    default:
      return [
        "border border-[var(--color-badge-border)]",
        "bg-[var(--color-badge-bg)]",
        "text-[var(--color-badge-text)]",
      ].join(" ");
  }
}

export function AnswerOption({ option, state, onSelect }: AnswerOptionProps) {
  const isInteractive = state === "default" || state === "selected";
  const content = state === "eliminated" ? "Usunięto przez 50/50" : option.text;

  return (
    <button
      type="button"
      onClick={() => onSelect(option.id)}
      disabled={!isInteractive}
      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3.5 text-left ring-1 transition-all duration-200 active:scale-[0.992] disabled:cursor-default xl:rounded-2xl xl:px-4.5 xl:py-4 ${getClasses(state)}`}
    >
      <span className="flex min-w-0 items-center gap-2.5 xl:gap-3">
        <span
          className={`inline-flex h-7 min-w-[1.9rem] shrink-0 items-center justify-center rounded-md px-2 text-[11px] font-semibold tracking-[0.04em] xl:h-8 xl:min-w-[2rem] xl:text-xs ${getBadgeClasses(state)}`}
        >
          {option.label}
        </span>
        <span className="text-[0.95rem] leading-6 xl:text-[1.02rem] xl:leading-7">{content}</span>
      </span>

      {state === "correct" ? (
        <span className="inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border border-emerald-300/32 text-emerald-300">
          <Check className="h-[14px] w-[14px]" />
        </span>
      ) : null}
      {state === "wrong" ? (
        <span className="inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border border-rose-300/32 text-rose-300">
          <X className="h-[14px] w-[14px]" />
        </span>
      ) : null}
    </button>
  );
}

export type { AnswerVisualState };
