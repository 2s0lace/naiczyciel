import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulamin | nAIczyciel",
  description: "Regulamin serwisu nAIczyciel.pl – zasady korzystania, płatności, reklamacje i prawa użytkownika.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#050510] px-5 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_44px_-34px_rgba(0,0,0,0.95)] sm:p-7">
        <h1 className="text-2xl font-bold text-white">Regulamin serwisu nAIczyciel.pl</h1>
        <p className="mt-2 text-sm text-indigo-100/70">Ostatnia aktualizacja: marzec 2026</p>

        <div className="mt-6 space-y-7 text-sm leading-relaxed text-indigo-100/82">
          <section>
            <h2 className="text-base font-semibold text-white">1. Postanowienia ogólne</h2>
            <p className="mt-2">
              Niniejszy regulamin określa zasady korzystania z serwisu internetowego nAIczyciel.pl, dostępnego pod adresem naiczyciel.pl.
            </p>
            <p className="mt-2">Właścicielem i usługodawcą Serwisu jest:</p>
            <p className="mt-1">
              Patryk Taborek
              <br />
              adres: Komandosów 2/24, 26-600 Radom
              <br />
              e-mail: patryk1tk@gmail.com
              <br />
              telefon: 883362516
            </p>
            <p className="mt-2">
              Serwis służy do nauki języka angielskiego, w szczególności do treningu przed egzaminem ósmoklasisty, oraz do korzystania
              z funkcji konta użytkownika i planów dostępu.
            </p>
            <p className="mt-2">Regulamin stanowi regulamin świadczenia usług drogą elektroniczną.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">2. Definicje</h2>
            <ul className="mt-2 space-y-1">
              <li>Serwis – strona internetowa nAIczyciel.pl wraz z jej funkcjami.</li>
              <li>Użytkownik – osoba korzystająca z Serwisu.</li>
              <li>Konto – konto użytkownika w Serwisie.</li>
              <li>Plan dostępu – odpłatny dostęp do wybranych funkcji Serwisu przez określony czas.</li>
              <li>
                Usługi cyfrowe – funkcje dostępne online w ramach Serwisu, w tym quizy, wyniki, historia sesji, ustawienia konta i inne
                funkcje edukacyjne.
              </li>
              <li>
                Konsument – osoba fizyczna korzystająca z Serwisu w celu niezwiązanym bezpośrednio z działalnością gospodarczą lub
                zawodową.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">3. Wymagania techniczne</h2>
            <p className="mt-2">Do korzystania z Serwisu potrzebne są:</p>
            <ul className="mt-1 space-y-1">
              <li>urządzenie z dostępem do internetu,</li>
              <li>aktualna przeglądarka internetowa,</li>
              <li>aktywny adres e-mail do założenia Konta i korzystania z płatnych funkcji.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">4. Konto użytkownika</h2>
            <ul className="mt-2 space-y-1">
              <li>Konto jest wymagane do korzystania z pełnej wersji Serwisu.</li>
              <li>Użytkownik zobowiązuje się podawać dane prawdziwe i aktualne.</li>
              <li>Użytkownik odpowiada za bezpieczeństwo swoich danych logowania.</li>
              <li>Użytkownik nie powinien udostępniać swojego Konta osobom trzecim.</li>
              <li>Użytkownik może korzystać z ustawień konta, w tym z wyboru avatara, jeśli taka funkcja jest dostępna.</li>
              <li>Usługodawca może ograniczyć lub usunąć Konto w przypadku naruszenia Regulaminu.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">5. Zakres usług</h2>
            <p className="mt-2">Serwis może udostępniać:</p>
            <ul className="mt-1 space-y-1">
              <li>darmowy quiz próbny lub darmowy podgląd funkcji,</li>
              <li>płatne quizy i sesje treningowe,</li>
              <li>historię aktywności i wyniki,</li>
              <li>ustawienia konta użytkownika,</li>
              <li>formularz „Powiadom” dla funkcji, które nie są jeszcze dostępne.</li>
            </ul>
            <p className="mt-2">Zakres funkcji dostępnych w Serwisie może się zmieniać wraz z rozwojem produktu.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">6. Plany dostępu i płatności</h2>
            <ul className="mt-2 space-y-1">
              <li>Dostęp do płatnych funkcji Serwisu jest udzielany w formie czasowych planów dostępu.</li>
              <li>Aktualne plany, ceny i czas trwania dostępu są wskazane w Serwisie przed zakupem.</li>
              <li>Płatności są obsługiwane przez zewnętrznego operatora płatności Stripe.</li>
              <li>Dane kart płatniczych nie są przechowywane na serwerach Usługodawcy.</li>
              <li>Dostęp do planu aktywuje się po skutecznym opłaceniu zamówienia.</li>
              <li>Po upływie okresu planu dostęp wygasa, chyba że opis oferty stanowi inaczej.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">7. Zasady korzystania z Serwisu</h2>
            <p className="mt-2">Zabronione jest:</p>
            <ul className="mt-1 space-y-1">
              <li>zakłócanie działania Serwisu,</li>
              <li>obchodzenie zabezpieczeń,</li>
              <li>udostępnianie Konta osobom trzecim,</li>
              <li>
                kopiowanie, rozpowszechnianie lub wykorzystywanie materiałów Serwisu poza dozwolonym użytkiem bez zgody Usługodawcy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">8. Reklamacje</h2>
            <p className="mt-2">Reklamacje dotyczące Serwisu lub planów dostępu można składać na adres: kontakt@naiczyciel.pl.</p>
            <p className="mt-2">W zgłoszeniu warto podać:</p>
            <ul className="mt-1 space-y-1">
              <li>adres e-mail przypisany do Konta,</li>
              <li>opis problemu,</li>
              <li>datę jego wystąpienia,</li>
              <li>informacje pozwalające zidentyfikować zamówienie, jeśli sprawa dotyczy płatności.</li>
            </ul>
            <p className="mt-2">Reklamacje są rozpatrywane w terminie do 14 dni od ich otrzymania.</p>
            <p className="mt-2">W przypadku uzasadnionych problemów technicznych Usługodawca może zaproponować naprawę, przedłużenie dostępu albo zwrot.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">9. Prawo odstąpienia</h2>
            <p className="mt-2">
              Jeżeli Użytkownik jest Konsumentem, mogą mu przysługiwać prawa wynikające z przepisów o umowach zawieranych na odległość.
            </p>
            <p className="mt-2">
              Jeżeli dostęp do Usługi cyfrowej zostaje uruchomiony od razu po zakupie, zasady odstąpienia mogą zależeć od zgód złożonych
              przy składaniu zamówienia.
            </p>
            <p className="mt-2">
              Informacje o prawie odstąpienia, jeżeli mają zastosowanie, powinny zostać przekazane Użytkownikowi najpóźniej przy zakupie.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">10. Prawa autorskie</h2>
            <p className="mt-2">
              Materiały dostępne w Serwisie, w tym pytania, wyjaśnienia, teksty, grafiki, elementy interfejsu i materiały edukacyjne,
              podlegają ochronie prawnej.
            </p>
            <p className="mt-2">Materiały te są własnością Usługodawcy albo są wykorzystywane zgodnie z odpowiednią licencją.</p>
            <p className="mt-2">
              Serwis może korzystać z publicznie dostępnych materiałów egzaminacyjnych jako inspiracji edukacyjnej, ale nie jest
              oficjalnym serwisem CKE.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">11. Odpowiedzialność</h2>
            <p className="mt-2">Serwis ma charakter edukacyjny i wspierający naukę.</p>
            <p className="mt-2">Usługodawca nie gwarantuje uzyskania określonego wyniku na egzaminie.</p>
            <p className="mt-2">
              Usługodawca dokłada starań, aby Serwis działał poprawnie, ale nie wyklucza czasowych błędów lub przerw technicznych.
            </p>
            <p className="mt-2">
              Usługodawca nie ponosi odpowiedzialności za skutki korzystania z Serwisu w sposób sprzeczny z Regulaminem lub przepisami
              prawa.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">12. Dane osobowe</h2>
            <p className="mt-2">Zasady przetwarzania danych osobowych opisuje Polityka prywatności dostępna w Serwisie.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">13. Zmiany Regulaminu</h2>
            <p className="mt-2">
              Regulamin może być zmieniany z ważnych przyczyn, w szczególności w razie zmiany prawa, funkcji Serwisu lub modelu sprzedaży.
            </p>
            <p className="mt-2">Aktualna wersja Regulaminu jest publikowana w Serwisie wraz z datą aktualizacji.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">14. Kontakt</h2>
            <p className="mt-2">W sprawach związanych z Serwisem można kontaktować się pod adresem: kontakt@naiczyciel.pl.</p>
          </section>
        </div>
      </div>
    </main>
  );
}

