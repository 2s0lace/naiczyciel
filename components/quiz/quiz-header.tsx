import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Volume2, VolumeX } from "lucide-react";
import logoNaiczycielWhite from "@/img/logonaiczyciel_white.png";

type QuizHeaderProps = {
  modeLabel: string;
  current: number;
  total: number;
  elapsedSeconds?: number;
  backHref?: string;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
};

function formatElapsed(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function QuizHeader({ current, total, elapsedSeconds, backHref = "/e8", soundEnabled = true, onToggleSound }: QuizHeaderProps) {
  const safeCurrent = Math.min(total, Math.max(0, current));
  const progress = total > 0 ? (safeCurrent / total) * 100 : 0;
  const timer = typeof elapsedSeconds === "number" ? formatElapsed(elapsedSeconds) : null;
  const roundedProgress = Math.round(progress);

  return (
    <header className="sticky top-0 z-40 -mx-4 bg-[#050510]/88 px-4 pt-1.5 pb-1.5 backdrop-blur-xl md:px-5 xl:mx-auto xl:mt-3 xl:max-w-[1120px] xl:rounded-2xl xl:border xl:border-white/10 xl:bg-[#050510]/82 xl:px-5 xl:pt-2.5 xl:pb-2 min-[1440px]:max-w-[1240px] min-[1440px]:px-6 min-[1440px]:pt-3 min-[1440px]:pb-2.5 2xl:max-w-[1380px] min-[2200px]:max-w-[1540px] min-[2200px]:px-7">
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 xl:gap-2">
          <Link
            href={backHref}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-gray-100 transition-colors hover:text-white/75 xl:h-9 xl:w-9"
            aria-label="Wróć"
          >
            <ChevronLeft className="h-4 w-4 xl:h-[18px] xl:w-[18px]" />
          </Link>

          {onToggleSound ? (
            <button
              type="button"
              onClick={onToggleSound}
              className="inline-flex h-8 w-8 items-center justify-center text-indigo-100 transition-colors hover:text-white/75 xl:h-9 xl:w-9"
              aria-label={soundEnabled ? "Wycisz dźwięki quizu" : "Włącz dźwięki quizu"}
              aria-pressed={!soundEnabled}
              title={soundEnabled ? "Dźwięk: włączony" : "Dźwięk: wyciszony"}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>
          ) : null}
        </div>

        <p className="pointer-events-none absolute top-1/2 left-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 text-sm font-semibold text-white/95 xl:text-[15px]">
          {timer ? <span className="tabular-nums text-indigo-100/88">{timer}</span> : null}
          {timer ? <span className="text-indigo-100/55">•</span> : null}
          <span className="text-white">{safeCurrent}/{total}</span>
          <span className="text-indigo-100/55">•</span>
          <span className="text-indigo-100/75">{roundedProgress}%</span>
        </p>

        <div className="relative h-5.5 w-[88px] shrink-0 opacity-90 xl:h-6.5 xl:w-[102px]">
          <Image src={logoNaiczycielWhite} alt="nAIczyciel" fill className="object-contain object-right" priority />
        </div>
      </div>

      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8 xl:mt-2 xl:h-1.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500/95 to-blue-500/95 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  );
}
