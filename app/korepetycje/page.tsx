import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Korepetycje z angielskiego | nAIczyciel",
  description:
    "Korepetycje z angielskiego A1-B2, E8 i matura. Zajęcia indywidualne online lub stacjonarnie w Radomiu.",
};

export default function TutoringPage() {
  return (
    <main className="min-h-screen bg-[#050510] px-5 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_44px_-34px_rgba(0,0,0,0.95)] sm:p-7">
          <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">Korepetycje z angielskiego</h1>
          <p className="mt-2 text-sm font-semibold tracking-[0.08em] text-indigo-100/70 uppercase">
            A1-B2 • E8 • Matura • zajęcia online i stacjonarne
          </p>
          <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-indigo-100/80 md:text-[0.95rem]">
            Pomagam uczniom uporządkować angielski bez chaosu — od reakcji językowych i gramatyki po swobodne mówienie. Zajęcia
            prowadzę indywidualnie, online lub stacjonarnie w Radomiu.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 md:gap-5">
          <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="text-lg font-semibold text-white">W czym pomagam</h2>
            <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-indigo-100/78">
              <li>egzamin ósmoklasisty</li>
              <li>matura podstawowa i rozszerzona</li>
              <li>przełamanie bariery językowej</li>
              <li>gramatyka i słownictwo w praktyce</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="text-lg font-semibold text-white">Jak wyglądają zajęcia</h2>
            <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-indigo-100/78">
              <li>indywidualne podejście</li>
              <li>autorskie materiały</li>
              <li>zajęcia online (Discord / Google Meet / Teams)</li>
              <li>możliwość zajęć stacjonarnych w Radomiu</li>
            </ul>
          </article>
        </section>

        <section className="rounded-2xl border border-indigo-300/20 bg-indigo-500/[0.06] p-5 sm:p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">Chcesz umówić pierwsze zajęcia?</h2>
          <p className="mt-2 text-sm leading-relaxed text-indigo-100/80">
            Napisz do mnie i opisz swój poziom, cel oraz preferowaną formę zajęć.
          </p>
          <Link
            href="mailto:kontakt@naiczyciel.pl"
            className="mt-4 inline-flex rounded-xl border border-indigo-200/30 bg-[linear-gradient(135deg,rgba(79,70,229,0.32),rgba(37,99,235,0.25))] px-4 py-2.5 text-sm font-semibold text-white transition-[border-color,filter,transform] duration-150 hover:border-indigo-100/44 hover:brightness-110 active:scale-[0.99]"
          >
            Napisz e-mail
          </Link>
        </section>
      </div>
    </main>
  );
}
