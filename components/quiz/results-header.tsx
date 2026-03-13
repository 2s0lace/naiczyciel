import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type ResultsHeaderProps = {
  backHref?: string;
};

export function ResultsHeader({ backHref = "/e8" }: ResultsHeaderProps) {
  return (
    <header className="sticky top-0 z-40 -mx-4 bg-[#050510]/88 px-4 pt-1.5 pb-2.5 backdrop-blur-xl md:px-5 xl:mx-auto xl:mt-3 xl:max-w-[1120px] xl:rounded-2xl xl:border xl:border-white/10 xl:bg-[#050510]/82 xl:px-5 xl:pt-2.5 xl:pb-3">
      <div className="flex items-center">
        <Link
          href={backHref}
          className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-white/[0.04] text-gray-100 ring-1 ring-white/14 transition-colors hover:bg-white/[0.08] hover:ring-white/25 xl:h-9.5 xl:w-9.5"
          aria-label="Wroc"
        >
          <ChevronLeft className="h-4 w-4 xl:h-[18px] xl:w-[18px]" />
        </Link>
      </div>
    </header>
  );
}
