import Image from "next/image";
import { BookOpen, Brain, TrendingUp, Zap } from "lucide-react";
import paperCutNoteElement from "@/img/papirek.png";
import paperCutNoteElementAlt from "@/img/papirek1.png";

export function E8AiHonestySection() {
  return (
    <section className="relative mx-auto mt-10 w-full max-w-[72rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#050510]/70 px-5 py-8 shadow-[0_32px_80px_-50px_rgba(0,0,0,0.95)] backdrop-blur-[6px] md:mt-12 md:px-8 md:py-10 lg:grid lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-center lg:gap-8 lg:px-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_86%_20%,rgba(59,130,246,0.08),transparent_24%)]" />

      <div className="relative z-10 max-w-[19rem]">
        <p
          className="font-gloria-hallelujah text-[0.95rem] tracking-[0.03em] text-cyan-300/90"
          style={{ transform: "rotate(-3deg)" }}
        >
          Bądźmy szczerzy
        </p>
        <h2
          className="mt-3 text-[clamp(2.25rem,5vw,4.85rem)] leading-[0.96] tracking-[-0.045em] text-white"
          style={{ fontFamily: "var(--font-figtree)", fontWeight: 900 }}
        >
          <span className="block">AI ma</span>
          <span className="block">pomagać</span>
          <span className="block">w nauce,</span>
          <span className="block">NIE</span>
          <span className="block">myśleć za</span>
          <span className="block">Ciebie.</span>
        </h2>
      </div>

      <div className="relative z-10 mt-8 min-h-[25rem] lg:mt-0">
        <div className="absolute right-0 top-0 hidden h-20 w-32 rotate-[8deg] md:block">
          <svg viewBox="0 0 140 82" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 70H132" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1.2" />
            <rect x="18" y="46" width="10" height="24" rx="2.5" fill="rgba(34,211,238,0.22)" />
            <rect x="44" y="38" width="10" height="32" rx="2.5" fill="rgba(34,211,238,0.28)" />
            <rect x="70" y="28" width="10" height="42" rx="2.5" fill="rgba(34,211,238,0.34)" />
            <rect x="96" y="18" width="10" height="52" rx="2.5" fill="rgba(34,211,238,0.4)" />
            <path d="M12 58C34 54 48 50 70 42C90 35 106 28 128 24" stroke="#22D3EE" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </div>

        <div className="relative mx-auto w-full max-w-[34rem]">
          <div className="relative w-full max-w-[29rem]">
            <Image
              src={paperCutNoteElement}
              alt=""
              aria-hidden
              className="h-auto w-full object-contain [filter:drop-shadow(0_28px_52px_rgba(0,0,0,0.48))_drop-shadow(0_12px_22px_rgba(0,0,0,0.28))]"
            />
            <div className="absolute left-[22%] top-[25%] w-[33%] font-gloria-hallelujah text-[clamp(0.24rem,0.38vw,0.32rem)] leading-[0.98] tracking-[-0.035em] text-[#1a1a1a]/90">
              <p>AI potrafi pomóc, ale bardzo łatwo zacząć klikać więcej, a myśleć mniej. AI ma wspierać ucznia, nie zastępować jego własnego myślenia.</p>
              <p className="mt-2.5">Dlatego w nAIczycielu najpierw odpowiadasz Ty, a AI dopiero potem pomaga sprawdzić i wyjaśnić.</p>
              <p className="mt-3 text-[0.82em] leading-[1.14] text-[#1a1a1a]/72">Źródła: Lee et al., CHI 2025 / Microsoft Research; Khalil et al., 2025 systematic review.</p>
            </div>
          </div>

          <div className="absolute -bottom-8 right-0 w-[72%] max-w-[22rem] rotate-[8deg] opacity-92 md:-bottom-10 md:right-2">
            <Image
              src={paperCutNoteElementAlt}
              alt=""
              aria-hidden
              className="h-auto w-full object-contain [filter:drop-shadow(0_18px_34px_rgba(0,0,0,0.22))]"
            />
            <div className="absolute inset-[18%_15%_18%_15%]">
              <BookOpen className="absolute left-[14%] top-[18%] h-7 w-7 text-[#1a1a1a]/72 md:h-8 md:w-8" strokeWidth={2.35} />
              <TrendingUp className="absolute left-[44%] top-[36%] h-7 w-7 text-[#1a1a1a]/72 md:h-8 md:w-8" strokeWidth={2.35} />
              <Brain className="absolute right-[18%] top-[16%] h-7 w-7 text-[#1a1a1a]/72 md:h-8 md:w-8" strokeWidth={2.35} />
              <Zap className="absolute right-[24%] bottom-[14%] h-6 w-6 text-[#1a1a1a]/72 md:h-7 md:w-7" strokeWidth={2.35} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
