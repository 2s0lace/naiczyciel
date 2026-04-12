type QuestionCardProps = {
  category: string;
  prompt: string;
};

export function QuestionCard({ category, prompt }: QuestionCardProps) {
  return (
    <section>
      <p className="text-[10px] font-semibold tracking-[0.16em] text-indigo-200/72 uppercase xl:text-[11px]">{category}</p>
      <h1 className="mt-2 text-[1.14rem] leading-7 font-semibold whitespace-pre-line text-white xl:mt-2.5 xl:text-[1.36rem] xl:leading-8">{prompt}</h1>
    </section>
  );
}
