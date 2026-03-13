import { QuizSessionBootstrap } from "@/components/quiz/quiz-session-bootstrap";

type QuizStartPageProps = {
  searchParams: Promise<{ mode?: string; set?: string }>;
};

export default async function QuizStartPage({ searchParams }: QuizStartPageProps) {
  const query = await searchParams;

  return <QuizSessionBootstrap mode={query.mode ?? "auto"} setId={query.set} />;
}
