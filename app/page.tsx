import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import AuthHeaderActions from "@/components/auth/auth-header-actions";
import { SelectionCard } from "@/components/SelectionCard";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { SocialLinks } from "@/components/layout/social-links";
import logoNaiczycielWhite from "@/img/logonaiczyciel_white.png";

const EDU_NOTIFY_MAILTO =
  "mailto:kontakt@naiczyciel.pl?subject=Powiadom%20mnie%20o%20EDU&body=Cze%C5%9B%C4%87%2C%20poprosz%C4%99%20o%20powiadomienie%20o%20starcie%20panelu%20EDU.";

export const metadata: Metadata = {
  title: "Ćwiczenia do egzaminu ósmoklasisty z angielskiego | nAIczyciel",
  description:
    "Ćwicz angielski do egzaminu ósmoklasisty w krótkich quizach. Reakcje językowe, reading, słownictwo i gramatyka z wynikiem oraz wyjaśnieniami.",
};

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#050510] text-white">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 md:px-6 md:py-7">
        <Link
          href="/"
          className="inline-flex items-center rounded-md p-1 transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/45"
          aria-label="Przejdź do landing"
        >
          <Image src={logoNaiczycielWhite} alt="nAIczyciel" priority className="h-8 w-auto" />
        </Link>

        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <SocialLinks className="pointer-events-auto" />
        </div>

        <AuthHeaderActions
          containerClassName="flex items-center gap-3"
          loginClassName="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition-[background-color,border-color,transform] duration-150 hover:bg-white/10 active:scale-[0.985]"
          accountClassName="h-10 w-10 p-1"
        />
      </header>

      <section className="z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-12 md:px-6 md:pb-14">
        <div className="mx-auto w-full max-w-3xl space-y-3 pt-3 pb-8 text-center md:pt-6 md:pb-10">
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
          <p
            className="motion-fade-up mx-auto max-w-[42rem] text-sm leading-relaxed text-indigo-100/76 md:text-base"
            style={
              {
                "--motion-duration": "560ms",
                "--motion-delay": "110ms",
              } as CSSProperties
            }
          >
            Uczeń może zacząć trening od razu. Panel nauczyciela pojawi się wkrótce.
          </p>
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

      <MarketingFooter />

      <div className="pointer-events-none absolute top-[-8rem] left-1/2 h-[26rem] w-[50rem] -translate-x-1/2 rounded-full bg-indigo-900/18 blur-[120px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-[#050510]/66 to-[#050510]" />
    </main>
  );
}














