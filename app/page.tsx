import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Brain, ChevronRight, MessageSquareMore, Repeat2, Sparkles, Target, TrendingUp, Zap, type LucideIcon } from "lucide-react";
import AuthHeaderActions from "@/components/auth/auth-header-actions";
import { ParallaxGridLayer } from "@/components/landing/parallax-grid-layer";
import { RevealOnView } from "@/components/landing/ui/reveal-on-view";
import { SelectionCard } from "@/components/SelectionCard";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import bottomCenterAsset from "@/img/8969331.png";
import landingLogo from "@/img/Bez nazwy-3.png";
import paperCutNoteElementAlt from "@/img/papirek1.png";
import paperCutNoteElement from "@/img/papirek.png";
import paperCutDesignElement from "@/img/paper-cut-design-element.png";

const EDU_NOTIFY_MAILTO =
  "mailto:kontakt@naiczyciel.pl?subject=Powiadom%20mnie%20o%20EDU&body=Cze%C5%9B%C4%87%2C%20poprosz%C4%99%20o%20powiadomienie%20o%20starcie%20panelu%20EDU.";
export const metadata: Metadata = {
  title: "Ćwiczenia do egzaminu ósmoklasisty z angielskiego | nAIczyciel",
  description:
    "Ćwicz angielski do egzaminu ósmoklasisty w krótkich quizach. Reakcje językowe, reading, słownictwo i gramatyka z wynikiem oraz wyjaśnieniami.",
};

type FloatingIconCard = {
  Icon: LucideIcon;
  positionClass: string;
  rotate: number;
  delay: string;
  duration: string;
};

type AmbientHeroSymbol =
  | {
      kind: "icon";
      Icon: LucideIcon;
      positionClass: string;
      colorClass: string;
      sizeClass: string;
      rotate: number;
      opacity: number;
      blur?: number;
    }
  | {
      kind: "glyph";
      glyph: string;
      positionClass: string;
      colorClass: string;
      sizeClass: string;
      rotate: number;
      opacity: number;
      blur?: number;
      weightClass?: string;
    };

const FLOATING_ICON_CARDS: FloatingIconCard[] = [
  { Icon: BookOpen, positionClass: "top-[11%] left-[3.5%]", rotate: -12, delay: "0s", duration: "5.8s" },
  { Icon: Zap, positionClass: "top-[47.5%] right-[4%]", rotate: 11, delay: "1.2s", duration: "6.4s" },
  { Icon: Target, positionClass: "bottom-[25%] left-[4.5%] md:bottom-[23%]", rotate: 9, delay: "2.1s", duration: "5.5s" },
  { Icon: Brain, positionClass: "bottom-[15%] right-[3.5%]", rotate: -10, delay: "0.8s", duration: "6.1s" },
];

const HONESTY_AMBIENT_SYMBOLS: AmbientHeroSymbol[] = [
  {
    kind: "icon",
    Icon: MessageSquareMore,
    positionClass: "left-[-0.75rem] top-[2.8rem] md:left-[-1.5rem] md:top-[3.8rem]",
    colorClass: "text-cyan-200/85",
    sizeClass: "h-5 w-5 md:h-6 md:w-6",
    rotate: -10,
    opacity: 0.12,
    blur: 0.6,
  },
  {
    kind: "icon",
    Icon: Repeat2,
    positionClass: "left-[2.25rem] top-[11.2rem] md:left-[4.25rem] md:top-[12.8rem]",
    colorClass: "text-indigo-100/80",
    sizeClass: "h-4 w-4 md:h-5 md:w-5",
    rotate: 8,
    opacity: 0.09,
    blur: 0.2,
  },
  {
    kind: "icon",
    Icon: TrendingUp,
    positionClass: "right-[3.25rem] top-[4.8rem] md:right-[7rem] md:top-[5.4rem]",
    colorClass: "text-emerald-200/80",
    sizeClass: "h-4 w-4 md:h-5 md:w-5",
    rotate: -6,
    opacity: 0.1,
    blur: 0.3,
  },
  {
    kind: "icon",
    Icon: Sparkles,
    positionClass: "right-[0.8rem] bottom-[4.6rem] md:right-[2rem] md:bottom-[5.5rem]",
    colorClass: "text-cyan-100/85",
    sizeClass: "h-4 w-4 md:h-5 md:w-5",
    rotate: 14,
    opacity: 0.08,
    blur: 0.5,
  },
  {
    kind: "glyph",
    glyph: "%",
    positionClass: "right-[1.75rem] top-[10.25rem] md:right-[4.25rem] md:top-[11rem]",
    colorClass: "text-cyan-100/90",
    sizeClass: "text-xl md:text-2xl",
    rotate: -12,
    opacity: 0.07,
    blur: 0.7,
    weightClass: "font-black",
  },
  {
    kind: "glyph",
    glyph: "↗",
    positionClass: "left-[52%] top-[1.2rem] md:left-[56%] md:top-[1.5rem]",
    colorClass: "text-emerald-100/80",
    sizeClass: "text-base md:text-lg",
    rotate: 9,
    opacity: 0.06,
    blur: 0.4,
    weightClass: "font-semibold",
  },
];

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#050510] text-white">
      <ParallaxGridLayer />
      <header className="relative z-30 mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-8 pb-4 md:px-6 md:pt-5 md:pb-5">
        <Link
          href="/"
          aria-label="Przejdź do landing"
        >
          <Image src={landingLogo} alt="nAIczyciel" priority className="h-8 w-auto" />
        </Link>

        <AuthHeaderActions
          containerClassName="flex items-center gap-3"
          loginClassName="h-[2.5515rem] w-[8.505rem] transition-transform duration-150 hover:scale-[1.01] active:scale-[0.985] md:h-[3.15rem] md:w-[10.5rem] md:translate-y-2"
          accountClassName="h-10 w-10 p-1"
        />
      </header>

      <section className="relative top-[18px] z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-12 md:top-0 md:px-6 md:pb-14">
        <div className="mx-auto w-full max-w-3xl space-y-2.5 pt-0 pb-6 text-center md:pt-1 md:pb-8">
          <RevealOnView threshold={0.2}>
            <p className="font-gloria-hallelujah mb-2 text-[13px] tracking-[0.04em] text-cyan-300/90">Cześć!</p>
            <h1
              className="text-[2.05rem] leading-[1.3] tracking-[-0.02em] text-white min-[769px]:text-[3.2rem]"
              style={
                {
                  fontFamily: "var(--font-figtree)",
                  fontWeight: 900,
                } as CSSProperties
              }
            >
              Jak chcesz korzystać z nAIczyciela?
            </h1>
          </RevealOnView>
        </div>

        <div className="grid w-full items-stretch gap-4 md:gap-5 lg:grid-cols-2">
          <RevealOnView className="h-full" delay={0} threshold={0.2}>
            <div className="h-full">
              <SelectionCard
                label="PANEL UCZNIA E8"
                title="Uczeń"
                description="Ćwicz angielski do E8 w krótkich quizach z wynikiem i wyjaśnieniami po każdej sesji."
                buttonText="Przejdź do E8"
                href="/e8"
                altText="Uczeń robiący notatki"
                imageSrc="/assets/student-entry.jpg"
                tone="student"
              />
            </div>
          </RevealOnView>

          <RevealOnView className="h-full" delay={80} threshold={0.2}>
            <div className="h-full">
              <SelectionCard
                label="PANEL EDU"
                title="Nauczyciel"
                description="Panel do tworzenia quizów i materiałów dla uczniów. Wkrótce udostępnimy pierwszą wersję."
                buttonText="Powiadom"
                href={EDU_NOTIFY_MAILTO}
                altText="Nauczycielka przy komputerze"
                imageSrc="/assets/teacher-entry.jpg"
                tone="teacher"
                statusText="WKRÓTCE"
              />
            </div>
          </RevealOnView>
        </div>
      </section>

      <div className="relative top-[-30px] z-10 mx-auto flex w-full max-w-6xl items-center justify-center px-5 py-8 md:px-6 md:py-12">
        <div className="flex items-center gap-5 md:gap-7" aria-hidden>
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={`paper-punch-dot-${index}`}
              className="h-5 w-5 rounded-full bg-[radial-gradient(circle_at_50%_48%,rgba(5,7,14,0.98)_0%,rgba(9,12,22,0.96)_58%,rgba(18,24,40,0.9)_100%)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.66),inset_0_-2px_5px_rgba(116,132,168,0.15),0_1px_0_rgba(255,255,255,0.04)] md:h-6 md:w-6"
            />
          ))}
        </div>
      </div>

      <section className="z-10 mx-auto w-full max-w-6xl px-5 pb-2 md:px-6 md:pb-4">
        <RevealOnView threshold={0.2}>
          <div className="relative mx-auto w-full max-w-5xl">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <span className="absolute left-[-2rem] top-[3.4rem] h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.10),rgba(0,212,255,0.03)_42%,transparent_72%)] blur-3xl md:left-[-3rem] md:top-[4.4rem] md:h-32 md:w-32" />
              <span className="absolute right-[4%] top-[1.4rem] h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.08),rgba(99,102,241,0.025)_40%,transparent_74%)] blur-3xl md:h-36 md:w-36" />
              <span className="absolute left-[34%] top-[7.2rem] h-20 w-40 bg-[radial-gradient(ellipse,rgba(255,255,255,0.035),rgba(255,255,255,0.012)_38%,transparent_72%)] blur-3xl md:left-[38%] md:top-[8rem] md:h-24 md:w-52" />
              {HONESTY_AMBIENT_SYMBOLS.map((symbol, index) =>
                symbol.kind === "icon" ? (
                  <span
                    key={`honesty-ambient-icon-${index}`}
                    className={`absolute ${symbol.positionClass} ${symbol.colorClass}`}
                    style={{ opacity: symbol.opacity, transform: `rotate(${symbol.rotate}deg)`, filter: `blur(${symbol.blur ?? 0}px)` }}
                  >
                    <symbol.Icon className={symbol.sizeClass} strokeWidth={1.8} aria-hidden />
                  </span>
                ) : (
                  <span
                    key={`honesty-ambient-glyph-${index}`}
                    className={`absolute ${symbol.positionClass} ${symbol.colorClass} ${symbol.sizeClass} ${symbol.weightClass ?? ""}`}
                    style={{ opacity: symbol.opacity, transform: `rotate(${symbol.rotate}deg)`, filter: `blur(${symbol.blur ?? 0}px)` }}
                  >
                    {symbol.glyph}
                  </span>
                ),
              )}
            </div>
              <div className="relative mx-auto h-[34rem] w-full max-w-5xl md:h-[46rem]">
                <p className="font-gloria-hallelujah absolute left-[4%] top-0 z-[4] rotate-[-4deg] text-[13px] tracking-[0.04em] text-cyan-300/90 md:left-[3%] md:text-[15px]">
                  Bądźmy szczerzy
                </p>
                <h1
                  className="absolute left-[4%] top-[2.1rem] z-[4] max-w-[19rem] text-[clamp(23px,6.2vw,28px)] leading-[1.02] text-white md:left-[3%] md:top-[2.8rem] md:max-w-[19rem] md:text-[clamp(39px,4.7vw,63px)]"
                  style={{ fontFamily: "var(--font-figtree)", fontWeight: 900 }}
                >
                  <span className="block md:hidden">AI ma pomagać w nauce,</span>
                  <span className="block md:hidden">NIE myśleć za Ciebie.</span>
                  <span className="hidden md:block">AI ma</span>
                  <span className="hidden md:block">pomagać</span>
                  <span className="hidden md:block">w nauce,</span>
                  <span className="hidden md:block">NIE</span>
                  <span className="hidden md:block">myśleć za</span>
                  <span className="hidden md:block">Ciebie.</span>
                </h1>

                <div className="pointer-events-none absolute left-[calc(50%+50px)] top-[calc(5.95rem-98px)] z-[3] w-[181.44%] -translate-x-1/2 md:left-[2%] md:top-[8.5rem] md:w-[95%] md:translate-x-[175px] md:-translate-y-[330px] relative">
                  <Image
                    src={paperCutNoteElement}
                    alt=""
                    aria-hidden
                    className="h-auto w-full object-contain [filter:drop-shadow(0_28px_52px_rgba(0,0,0,0.48))_drop-shadow(0_12px_22px_rgba(0,0,0,0.28))]"
                  />
                  <div
                    aria-hidden
                    className="absolute left-[12px] top-[68px] z-[3] hidden flex-col gap-[14px]"
                  >
                    {Array.from({ length: 6 }).map((_, index) => (
                      <span
                        key={`paper-punch-hole-${index}`}
                        className="block h-[8px] w-[8px] rounded-full bg-[#050510] md:h-[11px] md:w-[11px]"
                        style={{
                          boxShadow:
                            "inset 0 1px 1px rgba(0,0,0,0.38), inset 0 -1px 2px rgba(255,255,255,0.05), 0 0 0 1px rgba(58,46,24,0.16), 1px 1px 2px rgba(0,0,0,0.14)",
                        }}
                      />
                    ))}
                  </div>
                  <div className="absolute left-[170px] top-[178px] z-[2] flex w-[58%] flex-col items-start justify-start md:left-[260px] md:top-[290px] md:w-[58%]">
                    <div
                      className="font-gloria-hallelujah flex w-full max-w-[62%] flex-col gap-2 text-[12.52px] text-[#1a1a1a]/90 md:max-w-[60%] md:text-[16.7px]"
                      style={{ overflowWrap: "break-word", wordBreak: "normal", whiteSpace: "normal", lineHeight: 1.25 }}
                    >
                      <p>AI potrafi pomóc, ale bardzo łatwo zacząć klikać więcej, a myśleć mniej. AI ma wspierać ucznia, nie zastępować jego własnego myślenia.</p>
                      <p>Dlatego w nAIczycielu najpierw odpowiadasz Ty, a AI dopiero potem pomaga sprawdzić i wyjaśnić.</p>
                      <p className="pt-1 text-[11.64px] text-[#1a1a1a]/72 md:text-[14.1px]">Źródła: Lee et al., CHI 2025 / Microsoft Research; Khalil et al., 2025 systematic review.</p>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute left-1/2 top-[20.25rem] z-[2] hidden w-[126%] -translate-x-1/2 rotate-0 md:left-auto md:right-[2%] md:top-[18rem] md:block md:w-[108%] md:translate-x-[320px] md:-translate-y-[560px] md:rotate-[9deg]">
                  <Image
                    src={paperCutNoteElementAlt}
                    alt=""
                    aria-hidden
                    className="h-auto w-full object-contain opacity-92 [filter:drop-shadow(0_20px_34px_rgba(0,0,0,0.24))]"
                  />
                  <div aria-hidden className="absolute inset-[18%_14%_18%_14%] z-[3] hidden md:block">
                    <BookOpen className="absolute left-[16%] top-[26%] h-10 w-10 text-[#1a1a1a]/72 [filter:drop-shadow(0_1px_0_rgba(255,255,255,0.08))]" strokeWidth={2.4} />
                    <Target className="absolute left-[44%] top-[42%] h-10 w-10 text-[#1a1a1a]/72 [filter:drop-shadow(0_1px_0_rgba(255,255,255,0.08))]" strokeWidth={2.4} />
                    <Brain className="absolute right-[20%] top-[22%] h-10 w-10 translate-x-[-100px] translate-y-[300px] text-[#1a1a1a]/72 [filter:drop-shadow(0_1px_0_rgba(255,255,255,0.08))]" strokeWidth={2.4} />
                    <Zap className="absolute right-[26%] bottom-[18%] h-9 w-9 text-[#1a1a1a]/72 [filter:drop-shadow(0_1px_0_rgba(255,255,255,0.08))]" strokeWidth={2.35} />
                  </div>
                </div>

                <div
                  aria-hidden
                  className="pointer-events-none absolute hidden right-[16%] top-[14.1rem] z-[5] h-[72px] w-[126px] -translate-x-[100px] translate-y-[20px] md:block md:right-[17%] md:top-[16.5rem] md:h-[82px] md:w-[140px] md:translate-x-[130px] md:-translate-y-[160px] md:rotate-[8deg]"
                >
                  <svg viewBox="0 0 140 82" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="chart-line-gradient" x1="6" y1="70" x2="134" y2="16" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0EA5E9" stopOpacity="0.75" />
                        <stop offset="1" stopColor="#22D3EE" stopOpacity="0.95" />
                      </linearGradient>
                      <linearGradient id="chart-bar-gradient" x1="0" y1="82" x2="0" y2="0" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#22D3EE" stopOpacity="0.16" />
                        <stop offset="1" stopColor="#67E8F9" stopOpacity="0.55" />
                      </linearGradient>
                    </defs>
                    <path d="M8 70H132" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1.2" />
                    <rect x="18" y="46" width="10" height="24" rx="2.5" fill="url(#chart-bar-gradient)" />
                    <rect x="44" y="38" width="10" height="32" rx="2.5" fill="url(#chart-bar-gradient)" />
                    <rect x="70" y="30" width="10" height="40" rx="2.5" fill="url(#chart-bar-gradient)" />
                    <rect x="96" y="22" width="10" height="48" rx="2.5" fill="url(#chart-bar-gradient)" />
                    <path d="M10 62L36 53L62 45L88 32L116 21L130 16" stroke="url(#chart-line-gradient)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="10" cy="62" r="2.2" fill="#67E8F9" />
                    <circle cx="36" cy="53" r="2.2" fill="#67E8F9" />
                    <circle cx="62" cy="45" r="2.2" fill="#67E8F9" />
                    <circle cx="88" cy="32" r="2.2" fill="#67E8F9" />
                    <circle cx="116" cy="21" r="2.2" fill="#67E8F9" />
                    <circle cx="130" cy="16" r="2.2" fill="#67E8F9" />
                  </svg>
                </div>
              </div>
              <section className="relative top-[-100px] z-[8] mx-auto mt-[-2.75rem] flex w-full max-w-md flex-col items-center px-5 pb-3 text-center md:hidden">
                <p className="font-gloria-hallelujah relative top-[24px] left-[90px] mb-5 rotate-[4deg] text-[0.768rem] tracking-[0.02em] text-cyan-300/90">
                  Gotowy, żeby zacząć?
                </p>
                <Link
                  href="/e8/quiz"
                  className="group relative mt-4 flex w-full max-w-[320px] items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/30 transition-[transform,filter,box-shadow,background-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.985]"
                >
                  Zacznij test
                  <ChevronRight size={20} className="text-indigo-200 transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </Link>
              </section>
          </div>
        </RevealOnView>
      </section>

      <div aria-hidden className="pointer-events-none absolute inset-0 z-[6] overflow-hidden">
        {FLOATING_ICON_CARDS.map((card, index) => (
          <span
            key={`floating-icon-card-${index}`}
            className={`animate-floating-icon-card absolute flex h-[54px] w-[54px] items-center justify-center rounded-[14px] border border-white/20 bg-[linear-gradient(155deg,rgba(14,23,46,0.96),rgba(10,18,38,0.9))] opacity-[0.09] md:h-[66px] md:w-[66px] md:rounded-[16px] ${card.positionClass}`}
            style={{
              "--floating-icon-rotate": `${card.rotate}deg`,
              animationDelay: card.delay,
              animationDuration: card.duration,
              boxShadow: "0 0 18px rgba(123,172,255,0.18), 0 12px 26px -14px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.12)",
            } as CSSProperties}
          >
            <card.Icon className="h-6 w-6 text-indigo-100/90 md:h-[29px] md:w-[29px]" strokeWidth={2} aria-hidden />
          </span>
        ))}
      </div>
      <div
        className="pointer-events-none absolute -top-24 -right-20 h-[26rem] w-[26rem] rounded-full blur-[100px]"
        style={{ backgroundColor: "#00D4FF", opacity: 0.08 }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-20 h-[26rem] w-[26rem] rounded-full blur-[100px]"
        style={{ backgroundColor: "#7C3AED", opacity: 0.08 }}
      />
      <MarketingFooter
        showSocialLinks
        theme="darkGlow"
        offset="raised"
        seoTitle="Ćwiczenia do egzaminu ósmoklasisty z angielskiego"
        seoBody="nAIczyciel to narzędzie do krótkiego treningu przed egzaminem ósmoklasisty z języka angielskiego. Ćwicz reakcje językowe, reading, słownictwo i gramatykę w quizach inspirowanych typami zadań egzaminacyjnych. Po każdej sesji zobaczysz wynik, procent i krótkie wyjaśnienia, które pomagają lepiej zrozumieć zadania z E8."
      />

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[-2.5rem] z-[14] flex justify-center select-none md:bottom-[-70.75rem] xl:bottom-[-72.75rem]">
        <Image
          src={bottomCenterAsset}
          alt=""
          className="h-auto w-[22rem] max-w-none scale-[5] object-contain opacity-100 [filter:drop-shadow(0_-12px_38px_rgba(0,0,0,0.18))] md:w-[240rem] md:scale-100 xl:w-[300rem]"
        />
      </div>
      <div aria-hidden className="pointer-events-none absolute right-[-2.5rem] bottom-[-0.5rem] z-[15] hidden select-none md:block md:right-[-14.25rem] md:bottom-[-10rem] xl:bottom-[-11rem]">
        <Image
          src={paperCutDesignElement}
          alt=""
          className="h-auto w-[20rem] object-contain opacity-100 [filter:drop-shadow(-16px_18px_30px_rgba(0,0,0,0.24))] md:w-[30rem] xl:w-[38rem]"
        />
      </div>
    </main>
  );
}

