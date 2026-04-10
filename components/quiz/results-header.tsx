type ResultsHeaderProps = {
  backHref?: string;
};

export function ResultsHeader({ backHref = "/e8" }: ResultsHeaderProps) {
  void backHref;

  return (
    <header className="px-5 pt-5 pb-1">
      <div className="flex items-center">
        <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center opacity-0" />
      </div>
    </header>
  );
}
