import { QuizScreen } from "@/components/quiz/quiz-screen";

type QuizSessionPageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ mode?: string; review?: string; set?: string }>;
};

export default async function QuizSessionPage({ params, searchParams }: QuizSessionPageProps) {
  const { sessionId } = await params;
  const query = await searchParams;
  const isReviewMode = query.review === "1" || query.review === "true";

  return <QuizScreen sessionId={sessionId} initialMode={query.mode ?? "reactions"} initialReviewMode={isReviewMode} initialSetId={query.set} />;
}
