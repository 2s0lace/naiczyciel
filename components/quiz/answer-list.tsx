import { AnswerOption, type AnswerVisualState } from "@/components/quiz/answer-option";
import type { QuizOption } from "@/lib/quiz/types";

type AnswerListProps = {
  options: QuizOption[];
  selectedOptionId: string | null;
  correctOptionId: string | null;
  hiddenOptionId: string | null;
  isLocked: boolean;
  onSelect: (optionId: string) => void;
};

function resolveOptionState(params: {
  option: QuizOption;
  selectedOptionId: string | null;
  correctOptionId: string | null;
  hiddenOptionId: string | null;
  isLocked: boolean;
}): AnswerVisualState {
  const { option, selectedOptionId, correctOptionId, hiddenOptionId, isLocked } = params;

  if (option.id === hiddenOptionId && option.id !== selectedOptionId && option.id !== correctOptionId) {
    return "eliminated";
  }

  if (!isLocked) {
    return option.id === selectedOptionId ? "selected" : "default";
  }

  if (option.id === correctOptionId) {
    return option.id === selectedOptionId ? "correct" : "revealed_correct";
  }

  if (option.id === selectedOptionId && option.id !== correctOptionId) {
    return "wrong";
  }

  return "disabled";
}

export function AnswerList({ options, selectedOptionId, correctOptionId, hiddenOptionId, isLocked, onSelect }: AnswerListProps) {
  const visibleOptions = options.slice(0, 3);

  return (
    <section className="mt-2.5 space-y-2 xl:mt-3 xl:space-y-2.5">
      {visibleOptions.map((option) => (
        <AnswerOption
          key={option.id}
          option={option}
          state={resolveOptionState({
            option,
            selectedOptionId,
            correctOptionId,
            hiddenOptionId,
            isLocked,
          })}
          onSelect={onSelect}
        />
      ))}
    </section>
  );
}
