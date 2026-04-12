import { QuizSessionBootstrap } from "@/components/quiz/quiz-session-bootstrap";

type QuizStartPageProps = {
  searchParams: Promise<{ mode?: string; set?: string; count?: string; modes?: string; focus?: string; focusSource?: string; focusRaw?: string }>;
};

export default async function QuizStartPage({ searchParams }: QuizStartPageProps) {
  const query = await searchParams;

  return (
    <QuizSessionBootstrap
      mode={query.mode ?? "auto"}
      setId={query.set}
      count={query.count}
      modes={query.modes}
      focus={query.focus}
      focusSource={query.focusSource}
      focusRaw={query.focusRaw}
    />
  );
}
