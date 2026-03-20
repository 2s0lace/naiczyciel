import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Brain, Dumbbell, Target, Zap, type LucideIcon } from "lucide-react";
import AuthHeaderActions from "@/components/auth/auth-header-actions";
import { ParallaxGridLayer } from "@/components/landing/parallax-grid-layer";
import { RevealOnView } from "@/components/landing/ui/reveal-on-view";
import { SelectionCard } from "@/components/SelectionCard";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import logoNaiczycielWhite from "@/img/logonaiczyciel_white.png";

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
};

const FLOATING_ICON_CARDS: FloatingIconCard[] = [
  { Icon: BookOpen, positionClass: "top-[11%] left-[3.5%]", rotate: -12 },
  { Icon: Zap, positionClass: "top-[47.5%] right-[4%]", rotate: 11 },
  { Icon: Target, positionClass: "bottom-[25%] left-[4.5%] md:bottom-[23%]", rotate: 9 },
  { Icon: Brain, positionClass: "bottom-[15%] right-[3.5%]", rotate: -10 },
];

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#050510] text-white">
      <ParallaxGridLayer />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 md:px-6 md:py-7">
        <Link
          href="/"
          className="inline-flex items-center rounded-md p-1 transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/45"
          aria-label="Przejdź do landing"
        >
          <Image src={logoNaiczycielWhite} alt="nAIczyciel" priority className="h-8 w-auto" />
        </Link>

        <AuthHeaderActions
          containerClassName="flex items-center gap-3"
          loginClassName="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition-[background-color,border-color,transform] duration-150 hover:bg-white/10 active:scale-[0.985]"
          accountClassName="h-10 w-10 p-1"
        />
      </header>

      <section className="z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-12 md:px-6 md:pb-14">
        <div className="mx-auto w-full max-w-3xl space-y-3 pt-3 pb-8 text-center md:pt-6 md:pb-10">
          <RevealOnView threshold={0.2}>
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

      <section className="z-10 mx-auto w-full max-w-6xl px-5 pb-6 md:px-6 md:pb-7">
        <RevealOnView threshold={0.2}>
          <div className="mx-auto w-full max-w-5xl">
            <p className="text-[10px] font-bold tracking-[0.14em] text-cyan-300/90 uppercase">Bądźmy szczerzy</p>
            <h2
              className="mt-2 text-[clamp(28px,5.3vw,52px)] leading-[1.02] text-white"
              style={{ fontFamily: "var(--font-figtree)", fontWeight: 900, textShadow: "0 0 40px rgba(0,212,255,0.15)" }}
            >
              Nie zastąpimy nauczyciela, korepetytora ani Ciebie jako ucznia.
            </h2>

            <div className="mt-4 rounded-xl border-l-[3px] border-l-[#00D4FF] bg-white/[0.03] p-3.5 md:p-4">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300/10"
                >
                  <Dumbbell size={18} strokeWidth={2.2} className="text-cyan-300/90" />
                </span>
                <div>
                  <p className="text-base leading-snug font-semibold text-white">Traktuj nas jak siłownię dla mózgu.</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-indigo-100/62 md:text-[0.95rem]">
                    Nauczyciel i korepetytor dają kierunek. Ty robisz serię powtórek.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </RevealOnView>
      </section>

      <section className="z-10 mx-auto mt-14 w-full max-w-6xl px-5 pb-5 md:mt-0 md:px-6 md:pb-6">
        <RevealOnView threshold={0.2}>
          <div className="mx-auto w-full max-w-5xl">
            <h2 className="text-[0.78rem] font-medium tracking-[0.025em] text-white/42 md:text-[0.8rem]">
              Ćwiczenia do egzaminu ósmoklasisty z angielskiego
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-indigo-100/25">
              nAIczyciel to narzędzie do krótkiego treningu przed egzaminem ósmoklasisty z języka angielskiego. Ćwicz reakcje językowe,
              reading, słownictwo i gramatykę w quizach inspirowanych typami zadań egzaminacyjnych. Po każdej sesji zobaczysz wynik,
              procent i krótkie wyjaśnienia, które pomagają lepiej zrozumieć zadania z E8.
            </p>
          </div>
        </RevealOnView>
      </section>

      <MarketingFooter showSocialLinks />

      <div aria-hidden className="pointer-events-none absolute inset-0 z-[6] overflow-hidden">
        {FLOATING_ICON_CARDS.map((card, index) => (
          <span
            key={`floating-icon-card-${index}`}
            className={`absolute flex h-[54px] w-[54px] items-center justify-center rounded-[14px] border border-white/20 bg-[linear-gradient(155deg,rgba(14,23,46,0.96),rgba(10,18,38,0.9))] opacity-[0.09] md:h-[66px] md:w-[66px] md:rounded-[16px] ${card.positionClass}`}
            style={{
              transform: `rotate(${card.rotate}deg)`,
              boxShadow: "0 0 18px rgba(123,172,255,0.18), 0 12px 26px -14px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
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
    </main>
  );
}
