import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polityka cookies | nAIczyciel",
  description: "Polityka cookies serwisu nAIczyciel.pl – informacje o plikach cookies i podobnych technologiach.",
};

export default function CookiesPolicyPage() {
  return (
    <main className="min-h-screen bg-[#050510] px-5 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_44px_-34px_rgba(0,0,0,0.95)] sm:p-7">
        <h1 className="text-2xl font-bold text-white">Polityka cookies serwisu nAIczyciel.pl</h1>
        <p className="mt-2 text-sm text-indigo-100/70">Ostatnia aktualizacja: marzec 2026</p>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-indigo-100/82">
          <p>Serwis nAIczyciel.pl używa plików cookies i podobnych technologii, aby:</p>

          <ul className="space-y-1">
            <li>zapewnić prawidłowe działanie strony,</li>
            <li>utrzymać sesję użytkownika po zalogowaniu,</li>
            <li>zwiększać bezpieczeństwo działania Serwisu,</li>
            <li>obsługiwać płatności i powiązane funkcje zewnętrznych dostawców, takich jak Stripe.</li>
          </ul>

          <p>
            Cookies niezbędne do działania strony są wykorzystywane wyłącznie w celu zapewnienia poprawnego działania i bezpieczeństwa
            usługi. Jeżeli w przyszłości w Serwisie zostaną uruchomione dodatkowe cookies analityczne lub marketingowe, polityka cookies
            i mechanizm zgód powinny zostać odpowiednio rozszerzone.
          </p>

          <p>
            Użytkownik może zarządzać cookies z poziomu swojej przeglądarki internetowej. Ograniczenie cookies może wpłynąć na działanie
            niektórych funkcji Serwisu.
          </p>

          <p>Kontakt w sprawach prywatności i cookies: kontakt@naiczyciel.pl</p>
        </div>
      </div>
    </main>
  );
}
