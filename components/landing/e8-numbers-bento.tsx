import Image from "next/image";
import { BookOpen, GraduationCap, PencilRuler, Sparkles, Target } from "lucide-react";
import { RevealOnView } from "@/components/landing/ui/reveal-on-view";
import strzalki from "@/img/Bez nazwy-4.png";

export default function E8NumbersBento() {
  const numberGradientClass =
    "bg-gradient-to-b from-white via-indigo-50 to-indigo-150 bg-clip-text text-transparent";
  const labelClass =
    "text-[#FBF7EF] [text-shadow:0_4px_14px_rgba(0,0,0,0.36)]";

  return (
    <>
      <section
        className="relative mt-12 top-[56px] overflow-hidden px-4 py-5 md:top-0 md:mt-14 md:px-5 md:py-8 lg:mt-12 lg:px-6 lg:py-10"
        aria-labelledby="e8-numbers-heading"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[42rem] text-center">
          <h2
            id="e8-numbers-heading"
            className="text-[1.45rem] leading-tight font-black tracking-tight text-white md:text-[1.8rem]"
          >
            Nie pogięta kserówka, a profesjonalne materiały.
          </h2>
        </div>

        <div className="relative z-10 mx-auto mt-8 max-w-[72rem] pb-[3.8rem] md:mt-12 md:pb-[5.5rem] lg:mt-14 lg:pb-[8.5rem]">
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-[1.1rem] top-[4.25rem] z-10 md:hidden">
            <GraduationCap className="absolute right-[5.75rem] top-[4.1rem] h-8 w-8 rotate-[-10deg] text-slate-500/30" strokeWidth={1.8} />
            <PencilRuler className="absolute right-[5.35rem] top-[18.3rem] h-8 w-8 rotate-[9deg] text-slate-500/28" strokeWidth={1.8} />
            <BookOpen className="absolute right-[5.9rem] top-[31rem] h-8 w-8 rotate-[-8deg] text-slate-500/30" strokeWidth={1.8} />
            <BookOpen className="absolute right-[2.9rem] top-[2.6rem] h-8 w-8 rotate-[-12deg] text-slate-500/30" strokeWidth={1.8} />
            <Sparkles className="absolute right-[3.1rem] top-[13.2rem] h-7 w-7 rotate-[8deg] text-slate-400/32" strokeWidth={1.9} />
            <Target className="absolute right-[2.85rem] top-[25.1rem] h-7 w-7 rotate-[-6deg] text-slate-500/28" strokeWidth={1.8} />
            <BookOpen className="absolute right-[0.05rem] top-[0.1rem] h-9 w-9 rotate-[10deg] text-slate-500/42" strokeWidth={1.8} />
            <GraduationCap className="absolute right-[0.65rem] top-[9.6rem] h-9 w-9 rotate-[-8deg] text-slate-500/38" strokeWidth={1.8} />
            <Target className="absolute right-[0.15rem] top-[15.8rem] h-8 w-8 rotate-[7deg] text-slate-500/36" strokeWidth={1.8} />
            <Sparkles className="absolute right-[0.05rem] top-[22.1rem] h-8 w-8 rotate-[6deg] text-slate-400/40" strokeWidth={1.9} />
            <PencilRuler className="absolute right-[0.55rem] top-[28.8rem] h-8 w-8 rotate-[-10deg] text-slate-500/34" strokeWidth={1.8} />
          </div>
          <Image
            src={strzalki}
            alt=""
            aria-hidden
            className="pointer-events-none absolute top-[0.9rem] left-[53%] hidden h-auto w-[15rem] -translate-x-1/2 opacity-[0.48] lg:block xl:top-[0.4rem] xl:w-[17rem]"
          />

          <div className="grid grid-cols-1 gap-y-7 md:gap-y-12 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-6">
            <RevealOnView className="lg:col-span-7 lg:row-span-2 lg:self-start" delay={0} threshold={0.16}>
              <div className="max-w-[14rem] md:max-w-[16rem] lg:max-w-[34rem] lg:translate-x-[50px]">
                <p className="bg-gradient-to-b from-white via-indigo-50 to-indigo-150 bg-clip-text text-[5.15rem] leading-none font-black tracking-[-0.07em] text-transparent [filter:drop-shadow(0_20px_32px_rgba(0,0,0,0.76))] md:text-[7rem] lg:text-[9.5rem]">
                  300+
                </p>
                <div className="mt-0.5 lg:mt-2">
                  <p className={`text-[1.5rem] leading-none font-black tracking-tight md:text-[1.8rem] lg:hidden ${labelClass}`}>
                    zadań
                  </p>
                  <p className={`hidden text-[2.2rem] leading-none font-black tracking-tight lg:block ${labelClass}`}>
                    zadań z 4 rodzajów pytań
                  </p>
                  <p className="mt-2 hidden text-sm leading-relaxed font-medium text-[#686869] blur-[0.6px] lg:block">
                    Słuchanie i email wkrótce
                  </p>
                </div>
              </div>
            </RevealOnView>

            <RevealOnView className="lg:col-span-5 lg:col-start-8 lg:self-start" delay={70} threshold={0.16}>
              <div className="max-w-[18rem] sm:max-w-[20rem] lg:ml-auto lg:max-w-[20rem] lg:-translate-x-[25px]">
                <div className="lg:flex lg:items-end lg:gap-4">
                  <p
                    className={`${numberGradientClass} text-[4.55rem] leading-none font-black tracking-[-0.045em] [filter:drop-shadow(0_16px_28px_rgba(0,0,0,0.76))] [-webkit-text-stroke:0.6px_rgba(255,255,255,0.18)] md:text-[5.8rem] lg:text-[6.5rem]`}
                  >
                    14
                  </p>
                  <p className={`mt-1 max-w-[9ch] text-[1.2rem] leading-[0.95] font-black tracking-tight md:text-[1.45rem] lg:mt-0 lg:mb-2 ${labelClass}`}>
                    działów słownictwa
                  </p>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed font-medium text-[#686869] lg:hidden">
                  z 3 repetytoriów
                </p>
              </div>
            </RevealOnView>

            <RevealOnView
              className="lg:col-span-5 lg:col-start-8 lg:-mt-2 lg:self-start"
              delay={130}
              threshold={0.16}
            >
              <div className="max-w-[14rem] md:max-w-[15rem] lg:ml-auto lg:max-w-[20rem] lg:-translate-x-[25px]">
                <div className="lg:flex lg:items-end lg:gap-4">
                  <p
                    className={`${numberGradientClass} text-[4.25rem] leading-none font-black tracking-[-0.06em] [filter:drop-shadow(0_16px_28px_rgba(0,0,0,0.76))] md:text-[5.2rem] lg:text-[6rem]`}
                  >
                    12
                  </p>
                  <p className={`mt-1 max-w-[10ch] text-[1.18rem] leading-[0.95] font-black tracking-tight md:text-[1.4rem] lg:mt-0 lg:mb-2 ${labelClass}`}>
                    zagadnień gramatycznych
                  </p>
                </div>
              </div>
            </RevealOnView>

            <RevealOnView className="lg:hidden" delay={190} threshold={0.16}>
              <div className="max-w-[15rem] md:max-w-[17rem]">
                <p
                  className={`${numberGradientClass} text-[3.85rem] leading-none font-black tracking-[-0.06em] [filter:drop-shadow(0_16px_28px_rgba(0,0,0,0.76))] md:text-[4.8rem]`}
                >
                  4
                </p>
                <p className={`mt-1.5 text-[1.25rem] leading-[0.95] font-black tracking-tight md:text-[1.45rem] ${labelClass}`}>
                  rodzaje pytań
                </p>
                <p className="mt-2 text-sm leading-relaxed font-medium text-[#686869] blur-[0.6px]">
                  Słuchanie i email wkrótce
                </p>
              </div>
            </RevealOnView>
          </div>
        </div>
      </section>
    </>
  );
}
