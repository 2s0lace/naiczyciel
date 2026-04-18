type QuestionCardProps = {
  category: string;
  prompt: string;
};

export function QuestionCard({ category: _category, prompt }: QuestionCardProps) {
  return (
    <section>
      <h1 className="text-[1.14rem] leading-7 font-semibold whitespace-pre-line text-white xl:text-[1.36rem] xl:leading-8">{prompt}</h1>
    </section>
  );
}
