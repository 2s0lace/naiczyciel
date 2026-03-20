import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import AuthHeaderActions from "@/components/auth/auth-header-actions";
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

const PANEL_SELECTION_BG_STYLE: CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect x='0' y='0' width='2' height='2' fill='white' fill-opacity='0.18'/%3E%3C/svg%3E\"), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
  backgroundSize: "32px 32px, 32px 32px, 32px 32px",
  backgroundPosition: "0 0, 0 0, 0 0",
};

type FloatingSquare = {
  size: number;
  top: string;
  left: string;
  rotate: number;
  opacity: number;
  fill: boolean;
};

const FLOATING_SQUARES: FloatingSquare[] = [
  { size: 14, top: "4%", left: "3%", rotate: -12, opacity: 0.34, fill: false },
  { size: 11, top: "8%", left: "18%", rotate: 16, opacity: 0.28, fill: true },
  { size: 12, top: "10%", left: "93%", rotate: 22, opacity: 0.3, fill: false },
  { size: 10, top: "18%", left: "84%", rotate: -9, opacity: 0.26, fill: true },
  { size: 15, top: "26%", left: "5%", rotate: 13, opacity: 0.34, fill: false },
  { size: 11, top: "34%", left: "14%", rotate: -20, opacity: 0.28, fill: true },
  { size: 13, top: "41%", left: "94%", rotate: 18, opacity: 0.32, fill: false },
  { size: 10, top: "49%", left: "8%", rotate: -14, opacity: 0.28, fill: true },
  { size: 14, top: "57%", left: "91%", rotate: 24, opacity: 0.34, fill: false },
  { size: 11, top: "66%", left: "4%", rotate: -8, opacity: 0.26, fill: true },
  { size: 12, top: "74%", left: "87%", rotate: 15, opacity: 0.3, fill: false },
  { size: 10, top: "82%", left: "10%", rotate: -18, opacity: 0.26, fill: true },
  { size: 14, top: "90%", left: "92%", rotate: 12, opacity: 0.34, fill: false },
  { size: 11, top: "94%", left: "24%", rotate: -10, opacity: 0.28, fill: true },
];

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#050510] text-white" style={PANEL_SELECTION_BG_STYLE}>
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
          <p className="text-[10px] font-bold tracking-[0.14em] text-fuchsia-300/85 uppercase">Mam nadzieję, że się dogadamy...</p>
          <h1
            className="motion-fade-up text-3xl leading-tight text-white md:text-[2.5rem]"
            style={
              {
                fontFamily: "var(--font-figtree)",
                fontWeight: 900,
                "--motion-duration": "520ms",
              } as CSSProperties
            }
          >
            Jak chcesz korzystać z nAIczyciela?
          </h1>
        </div>

        <div className="grid w-full gap-4 md:gap-5 lg:grid-cols-2">
          <div
            className="motion-fade-up"
            style={
              {
                "--motion-duration": "600ms",
                "--motion-delay": "160ms",
              } as CSSProperties
            }
          >
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

          <div
            className="motion-fade-up"
            style={
              {
                "--motion-duration": "620ms",
                "--motion-delay": "250ms",
              } as CSSProperties
            }
          >
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
        </div>
      </section>

      <section className="z-10 mx-auto w-full max-w-6xl px-5 pb-6 md:px-6 md:pb-7">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-[10px] font-bold tracking-[0.14em] text-fuchsia-300/85 uppercase">Bądźmy szczerzy</p>
          <h2
            className="mt-2 text-[clamp(30px,6.2vw,58px)] leading-[0.98] text-white"
            style={{ fontFamily: "var(--font-figtree)", fontWeight: 900, textShadow: "0 0 40px rgba(0,212,255,0.15)" }}
          >
            Nie zastąpimy nauczyciela, korepetytora ani Ciebie jako ucznia.
          </h2>

          <div className="mt-4 rounded-xl border-l-[3px] border-l-[#00D4FF] bg-white/[0.03] p-3.5 md:p-4">
            <p className="text-base leading-snug font-semibold text-white">Traktuj nas jak siłownię dla mózgu.</p>
            <p className="mt-1.5 text-xs leading-relaxed text-indigo-100/62">
              Nauczyciel i korepetytor dają kierunek. Ty robisz serię powtórek.
            </p>
          </div>
        </div>
      </section>

      <section className="z-10 mx-auto mt-14 w-full max-w-6xl px-5 pb-5 md:mt-0 md:px-6 md:pb-6">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="text-[0.78rem] font-medium tracking-[0.025em] text-white/42 md:text-[0.8rem]">
            Ćwiczenia do egzaminu ósmoklasisty z angielskiego
          </h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-indigo-100/38">
            nAIczyciel to narzędzie do krótkiego treningu przed egzaminem ósmoklasisty z języka angielskiego. Ćwicz reakcje językowe,
            reading, słownictwo i gramatykę w quizach inspirowanych typami zadań egzaminacyjnych. Po każdej sesji zobaczysz wynik,
            procent i krótkie wyjaśnienia, które pomagają lepiej zrozumieć zadania z E8.
          </p>
        </div>
      </section>

      <MarketingFooter showSocialLinks />

      <div aria-hidden className="pointer-events-none absolute inset-0 z-[6] overflow-hidden">
        {FLOATING_SQUARES.map((square, index) => (
          <span
            key={`floating-square-${index}`}
            className="absolute block"
            style={{
              width: `${square.size}px`,
              height: `${square.size}px`,
              top: square.top,
              left: square.left,
              transform: `rotate(${square.rotate}deg)`,
              opacity: square.opacity,
              border: square.fill ? undefined : "1px solid rgba(255,255,255,0.36)",
              backgroundColor: square.fill ? "rgba(255,255,255,0.22)" : "transparent",
              filter: "blur(0.2px)",
              boxShadow: square.fill ? "0 0 8px rgba(255,255,255,0.1)" : "0 0 6px rgba(255,255,255,0.08)",
              mixBlendMode: "screen",
            }}
          />
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














