import { Check, X } from "lucide-react";
import type { QuizOption } from "@/lib/quiz/types";

type AnswerVisualState = "default" | "selected" | "correct" | "wrong" | "disabled" | "eliminated";

type AnswerOptionProps = {
  option: QuizOption;
  state: AnswerVisualState;
  onSelect: (optionId: string) => void;
};

function getClasses(state: AnswerVisualState) {
  switch (state) {
    case "selected":
      return "bg-indigo-500/12 text-white ring-indigo-300/42";
    case "correct":
      return "bg-emerald-500/14 text-white ring-emerald-300/40";
    case "wrong":
      return "bg-rose-500/14 text-white ring-rose-300/35";
    case "disabled":
      return "bg-white/[0.018] text-gray-400 ring-white/8";
    case "eliminated":
      return "bg-white/[0.012] text-gray-500 ring-white/8 opacity-45";
    default:
      return "bg-white/[0.022] text-gray-100 ring-white/12 hover:bg-white/[0.04] hover:ring-white/18";
  }
}

function getBadgeClasses(state: AnswerVisualState) {
  switch (state) {
    case "correct":
      return "bg-emerald-500/22 text-emerald-100";
    case "wrong":
      return "bg-rose-500/22 text-rose-100";
    case "selected":
      return "bg-indigo-500/24 text-indigo-100";
    case "disabled":
      return "bg-white/8 text-gray-300";
    case "eliminated":
      return "bg-white/8 text-gray-400";
    default:
      return "bg-white/10 text-gray-100";
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
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold xl:h-9 xl:w-9 xl:text-sm ${getBadgeClasses(state)}`}
        >
          {option.label}
        </span>
        <span className="text-[0.95rem] leading-6 xl:text-[1.02rem] xl:leading-7">{content}</span>
      </span>

      {state === "correct" ? <Check className="h-4 w-4 text-emerald-200 xl:h-[18px] xl:w-[18px]" /> : null}
      {state === "wrong" ? <X className="h-4 w-4 text-rose-200 xl:h-[18px] xl:w-[18px]" /> : null}
    </button>
  );
}

export type { AnswerVisualState };
