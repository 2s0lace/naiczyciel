import { QuizScreen } from "@/components/quiz/quiz-screen";

type QuizSessionPageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ mode?: string; review?: string; set?: string; count?: string; modes?: string; focus?: string; focusSource?: string; focusRaw?: string }>;
};

export default async function QuizSessionPage({ params, searchParams }: QuizSessionPageProps) {
  const { sessionId } = await params;
  const query = await searchParams;
  const isReviewMode = query.review === "1" || query.review === "true";

  return (
    <QuizScreen
      sessionId={sessionId}
      initialMode={query.mode ?? "reactions"}
      initialReviewMode={isReviewMode}
      initialSetId={query.set}
      initialCount={query.count}
      initialModes={query.modes}
      initialFocus={query.focus}
      initialFocusSource={query.focusSource}
      initialFocusRaw={query.focusRaw}
    />
  );
}
