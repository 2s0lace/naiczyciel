import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polityka prywatności | nAIczyciel",
  description: "Polityka prywatności serwisu nAIczyciel.pl – zasady przetwarzania danych osobowych i cookies.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#050510] px-5 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_44px_-34px_rgba(0,0,0,0.95)] sm:p-7">
        <h1 className="text-2xl font-bold text-white">Polityka prywatności serwisu nAIczyciel.pl</h1>
        <p className="mt-2 text-sm text-indigo-100/70">Ostatnia aktualizacja: marzec 2026</p>

        <div className="mt-6 space-y-7 text-sm leading-relaxed text-indigo-100/82">
          <section>
            <h2 className="text-base font-semibold text-white">1. Administrator danych</h2>
            <p className="mt-2">Administratorem danych osobowych jest właściciel serwisu nAIczyciel.pl:</p>
            <p className="mt-1">
              Patryk Taborek
              <br />
              adres: Komandosów 2/24, 26-600 Radom
              <br />
              e-mail: patryk1tk@gmail.com
              <br />
              telefon: 883362516
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">2. Jakie dane przetwarzamy</h2>
            <p className="mt-2">W zależności od sposobu korzystania z Serwisu możemy przetwarzać:</p>
            <ul className="mt-1 space-y-1">
              <li>dane konta, w tym adres e-mail, identyfikator użytkownika i ustawienia profilu,</li>
              <li>
                dane związane z korzystaniem z Serwisu, w tym historię sesji, wyniki quizów, wybrany avatar i aktywność w koncie,
              </li>
              <li>dane związane z płatnością, takie jak identyfikator transakcji, status płatności i rodzaj planu,</li>
              <li>
                dane podane w formularzu kontaktowym lub formularzu „Powiadom”, w szczególności adres e-mail i treść wiadomości,
              </li>
              <li>
                dane techniczne, takie jak adres IP, typ urządzenia, przeglądarka, logi techniczne oraz dane potrzebne do bezpieczeństwa
                i działania Serwisu.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">3. Cele przetwarzania danych</h2>
            <p className="mt-2">Dane przetwarzamy w celu:</p>
            <ul className="mt-1 space-y-1">
              <li>założenia i obsługi Konta,</li>
              <li>świadczenia usług dostępnych w Serwisie,</li>
              <li>realizacji płatności i obsługi zakupionych planów,</li>
              <li>kontaktu z użytkownikiem,</li>
              <li>wysłania informacji o udostępnieniu funkcji „Powiadom”,</li>
              <li>zapewnienia bezpieczeństwa Serwisu, diagnostyki błędów i rozwoju produktu,</li>
              <li>prowadzenia podstawowej analityki technicznej, jeśli jest stosowana.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">4. Podstawy przetwarzania</h2>
            <p className="mt-2">Dane mogą być przetwarzane na podstawie:</p>
            <ul className="mt-1 space-y-1">
              <li>wykonania umowy lub działań przed jej zawarciem,</li>
              <li>obowiązku prawnego,</li>
              <li>uzasadnionego interesu Administratora,</li>
              <li>zgody użytkownika, gdy jest wymagana.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">5. Odbiorcy danych</h2>
            <p className="mt-2">Dane mogą być przekazywane podmiotom wspierającym działanie Serwisu, w szczególności:</p>
            <ul className="mt-1 space-y-1">
              <li>Stripe – obsługa płatności,</li>
              <li>Supabase – infrastruktura backendowa i baza danych,</li>
              <li>Vercel – hosting i infrastruktura wdrożeniowa,</li>
              <li>OpenAI – przetwarzanie treści w ramach funkcji AI, jeśli dana funkcja z tego korzysta,</li>
              <li>podmiotom świadczącym obsługę techniczną, księgową lub prawną, jeżeli jest to konieczne.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">6. Płatności</h2>
            <p className="mt-2">Płatności są obsługiwane przez Stripe.</p>
            <p className="mt-2">Dane kart płatniczych nie są przechowywane na serwerach Administratora.</p>
            <p className="mt-2">
              Stripe może przetwarzać dane transakcyjne, identyfikacyjne i techniczne zgodnie z własnymi zasadami prywatności i
              bezpieczeństwa.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">7. Okres przechowywania danych</h2>
            <p className="mt-2">Dane przechowujemy przez okres niezbędny do realizacji celu, dla którego zostały zebrane, w tym:</p>
            <ul className="mt-1 space-y-1">
              <li>dane konta – przez czas posiadania konta oraz okres potrzebny do rozliczeń i obrony roszczeń,</li>
              <li>dane zakupowe i płatnicze – przez okres wymagany przepisami prawa,</li>
              <li>dane z formularza kontaktowego i „Powiadom” – do czasu obsługi sprawy lub realizacji zgłoszenia,</li>
              <li>dane techniczne i logi – przez okres uzasadniony bezpieczeństwem i utrzymaniem Serwisu.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">8. Prawa użytkownika</h2>
            <p className="mt-2">Masz prawo do:</p>
            <ul className="mt-1 space-y-1">
              <li>dostępu do danych,</li>
              <li>sprostowania danych,</li>
              <li>usunięcia danych,</li>
              <li>ograniczenia przetwarzania,</li>
              <li>przenoszenia danych,</li>
              <li>sprzeciwu wobec przetwarzania w przypadkach przewidzianych prawem,</li>
              <li>cofnięcia zgody, jeśli przetwarzanie odbywa się na podstawie zgody,</li>
              <li>wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">9. Cookies i podobne technologie</h2>
            <p className="mt-2">
              Serwis używa cookies lub podobnych technologii niezbędnych do działania strony, utrzymania sesji i bezpieczeństwa.
            </p>
            <p className="mt-2">
              Serwis może korzystać z dodatkowych cookies technicznych lub analitycznych, jeśli takie narzędzia zostaną uruchomione.
            </p>
            <p className="mt-2">
              Zewnętrzni dostawcy, tacy jak Stripe, mogą również używać cookies i podobnych technologii w związku ze swoimi usługami.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">10. Dobrowolność podania danych</h2>
            <p className="mt-2">Podanie danych jest dobrowolne, ale może być niezbędne do:</p>
            <ul className="mt-1 space-y-1">
              <li>założenia Konta,</li>
              <li>zakupu planu dostępu,</li>
              <li>korzystania z płatnych funkcji,</li>
              <li>otrzymania odpowiedzi na wiadomość,</li>
              <li>zapisania się do „Powiadom”.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">11. Zmiany polityki prywatności</h2>
            <p className="mt-2">Polityka prywatności może być aktualizowana w razie zmiany prawa, technologii lub funkcji Serwisu.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">12. Kontakt</h2>
            <p className="mt-2">W sprawach dotyczących prywatności i danych osobowych można pisać na: kontakt@naiczyciel.pl</p>
          </section>
        </div>
      </div>
    </main>
  );
}
