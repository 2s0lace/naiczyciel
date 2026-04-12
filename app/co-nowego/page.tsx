import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "nAIczyciel 1.0",
  description: "Co nowego w pierwszej publicznej wersji nAIczyciela.",
};

const alreadyWorking = [
  "krótkie quizy do E8",
  "wynik po każdej sesji",
  "krótkie wyjaśnienia odpowiedzi",
  "konto użytkownika i podstawowy panel ucznia",
  "płatne dostępy czasowe",
] as const;

const improved = [
  "bardziej przejrzysty landing /e8/",
  "prostszy wybór ścieżki użytkownika",
  "lepszy widok po zalogowaniu",
  "czytelniejszy dashboard ucznia",
] as const;

const inProgress = [
  "nowe zestawy i kategorie pytań",
  "lepsze śledzenie postępu",
  "dopracowanie flow kolejnych sesji",
  "pierwsza wersja panelu nauczyciela",
] as const;

export default function WhatsNewPage() {
  return (
    <main className="min-h-screen bg-[#050510] px-5 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_44px_-34px_rgba(0,0,0,0.95)] sm:p-7">
          <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">nAIczyciel 1.0</h1>

          <p className="mt-4 text-sm leading-relaxed text-indigo-100/80 md:text-[0.95rem]">
            To pierwsza publiczna wersja nAIczyciela — narzędzia do krótkiego treningu angielskiego pod egzamin ósmoklasisty. W tej
            wersji skupiliśmy się na najważniejszym flow ucznia: quizach, wynikach, wyjaśnieniach i prostym panelu użytkownika.
          </p>

          <div className="mt-6 space-y-5">
            <section>
              <h2 className="text-base font-semibold text-white">Co już działa</h2>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-indigo-100/78">
                {alreadyWorking.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white">Co poprawiliśmy</h2>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-indigo-100/78">
                {improved.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-white">Nad czym pracujemy</h2>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-indigo-100/78">
                {inProgress.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-indigo-100/78 md:text-[0.95rem]">
            To dopiero początek. W najbliższych tygodniach rozwijamy nAIczyciela dalej, krok po kroku, w stronę prostego i skutecznego
            narzędzia do nauki.
          </p>
        </section>
      </div>
    </main>
  );
}
