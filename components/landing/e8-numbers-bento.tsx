import Image from "next/image";
import Link from "next/link";
import React from "react";
import { ArrowRight, BookOpen, GraduationCap, PencilRuler, Sparkles, Target } from "lucide-react";
import { RevealOnView } from "@/components/landing/ui/reveal-on-view";
import TaskDonutChart from "@/components/landing/task-donut-chart";
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
            <GraduationCap className="animate-floating-icon-card absolute right-[5.75rem] top-[4.1rem] h-8 w-8 rotate-[-10deg] text-slate-500/30" style={{ "--floating-icon-rotate": "-10deg", animationDelay: "0s" } as React.CSSProperties} strokeWidth={1.8} />
            <PencilRuler className="animate-floating-icon-card absolute right-[5.35rem] top-[18.3rem] h-8 w-8 rotate-[9deg] text-slate-500/28" style={{ "--floating-icon-rotate": "9deg", animationDelay: "-2.1s" } as React.CSSProperties} strokeWidth={1.8} />
            <BookOpen className="animate-floating-icon-card absolute right-[5.9rem] top-[31rem] h-8 w-8 rotate-[-8deg] text-slate-500/30" style={{ "--floating-icon-rotate": "-8deg", animationDelay: "-4.4s" } as React.CSSProperties} strokeWidth={1.8} />
            <BookOpen className="animate-floating-icon-card absolute right-[2.9rem] top-[2.6rem] h-8 w-8 rotate-[-12deg] text-slate-500/30" style={{ "--floating-icon-rotate": "-12deg", animationDelay: "-1.3s" } as React.CSSProperties} strokeWidth={1.8} />
            <Sparkles className="animate-floating-icon-card absolute right-[3.1rem] top-[13.2rem] h-7 w-7 rotate-[8deg] text-slate-400/32" style={{ "--floating-icon-rotate": "8deg", animationDelay: "-3.5s" } as React.CSSProperties} strokeWidth={1.9} />
            <Target className="animate-floating-icon-card absolute right-[2.85rem] top-[25.1rem] h-7 w-7 rotate-[-6deg] text-slate-500/28" style={{ "--floating-icon-rotate": "-6deg", animationDelay: "-5.2s" } as React.CSSProperties} strokeWidth={1.8} />
            <BookOpen className="animate-floating-icon-card absolute right-[0.05rem] top-[0.1rem] h-9 w-9 rotate-[10deg] text-slate-500/42" style={{ "--floating-icon-rotate": "10deg", animationDelay: "-0.8s" } as React.CSSProperties} strokeWidth={1.8} />
            <GraduationCap className="animate-floating-icon-card absolute right-[0.65rem] top-[9.6rem] h-9 w-9 rotate-[-8deg] text-slate-500/38" style={{ "--floating-icon-rotate": "-8deg", animationDelay: "-2.9s" } as React.CSSProperties} strokeWidth={1.8} />
            <Target className="animate-floating-icon-card absolute right-[0.15rem] top-[15.8rem] h-8 w-8 rotate-[7deg] text-slate-500/36" style={{ "--floating-icon-rotate": "7deg", animationDelay: "-4.1s" } as React.CSSProperties} strokeWidth={1.8} />
          </div>
          <Image
            src={strzalki}
            alt=""
            aria-hidden
            className="pointer-events-none absolute top-[0.9rem] left-[53%] hidden h-auto w-[15rem] -translate-x-1/2 opacity-[0.48] xl:block xl:top-[0.4rem] xl:w-[17rem]"
          />

          <div className="grid grid-cols-1 gap-y-0 md:grid-cols-2 md:gap-x-8 md:gap-y-5 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-6">
            {/* 300+ TEXT */}
            <RevealOnView className="-translate-y-[20px] lg:translate-y-0 md:col-span-1 md:col-start-1 md:row-start-1 lg:col-span-7 lg:row-span-2 lg:col-start-1 lg:row-start-1 lg:self-start" delay={0} threshold={0.16}>
              <div className="w-max max-w-full lg:max-w-[34rem] lg:translate-x-[50px]">
                <div className="relative">
                  {/* Glow behind the number */}
                  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 translate-y-4 blur-3xl opacity-30" style={{ background: "radial-gradient(ellipse at center, #6366f1 0%, #4338ca 40%, transparent 75%)" }} />
                  <p className="relative pr-8 bg-gradient-to-b from-white via-indigo-50 to-indigo-150 bg-clip-text text-[5.15rem] leading-none font-black tracking-[-0.07em] text-transparent [filter:drop-shadow(0_20px_32px_rgba(0,0,0,0.76))] md:text-[7rem] lg:text-[9.5rem]">
                    300+
                  </p>
                </div>
                <div className="lg:mt-2">
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

            {/* DONUT CHART */}
            <RevealOnView className="order-last md:order-none md:col-start-2 md:row-start-1 md:row-span-4 lg:col-span-12 lg:col-start-1 lg:row-start-3 lg:mt-10" delay={250} threshold={0.2}>
              <div className="mx-auto max-w-[36rem] md:-translate-y-[20px] lg:translate-y-0 lg:max-w-[48rem]">
                <TaskDonutChart />
              </div>
              <div className="mt-8 flex -translate-y-[13px] justify-center lg:-translate-y-[-10px]">
                <Link
                  href="/demo"
                  className="group flex flex-col items-center gap-3 transition-all"
                >
                  <div className="relative flex items-center gap-3 overflow-hidden rounded-[1.05rem] bg-[linear-gradient(90deg,rgba(112,110,255,0.96)_0%,rgba(98,93,246,0.94)_44%,rgba(78,72,220,0.96)_100%)] px-8 py-3.5 text-[0.95rem] font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_24px_-10px_rgba(72,67,210,0.5)] transition-all duration-200 hover:-translate-y-1 hover:brightness-110 hover:shadow-[0_20px_40px_-12px_rgba(72,67,210,0.45)] active:scale-[0.98] lg:gap-6 lg:px-14 lg:py-6 lg:text-[1.3rem]">
                    <span aria-hidden className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/65 to-transparent" />
                    Zobacz demo
                    <ArrowRight className="h-4 w-4 transition-transform lg:h-6 lg:w-6" />
                  </div>
                </Link>
              </div>
            </RevealOnView>

            {/* 14 DZIAŁÓW */}
            <RevealOnView className="md:col-start-1 md:row-start-2 md:-translate-y-[30px] lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:self-start lg:translate-y-0" delay={70} threshold={0.16}>
              <div className="max-w-[18rem] sm:max-w-[20rem] lg:ml-auto lg:max-w-[20rem] lg:-translate-x-[25px]">
                <div className="lg:flex lg:items-end lg:gap-4">
                  <div className="relative">
                    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 translate-y-3 blur-3xl opacity-25" style={{ background: "radial-gradient(ellipse at center, #818cf8 0%, #4338ca 50%, transparent 75%)" }} />
                    <p
                      className={`relative ${numberGradientClass} text-[4.55rem] leading-none font-black tracking-[-0.045em] [filter:drop-shadow(0_16px_28px_rgba(0,0,0,0.76))] [-webkit-text-stroke:0.6px_rgba(255,255,255,0.18)] md:text-[5.8rem] lg:text-[6.5rem]`}
                    >
                      14
                    </p>
                  </div>
                  <p className={`mt-1 max-w-[9ch] text-[1.2rem] leading-[0.95] font-black tracking-tight md:text-[1.45rem] lg:mt-0 lg:mb-2 ${labelClass}`}>
                    działów słownictwa
                  </p>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed font-medium text-[#686869] blur-[0.6px] lg:hidden">
                  z 3 repetytoriów
                </p>
              </div>
            </RevealOnView>

            {/* 12 ZAGADNIEŃ */}
            <RevealOnView
              className="md:col-start-1 md:row-start-3 md:-translate-y-[30px] lg:col-span-5 lg:col-start-8 lg:row-start-2 lg:-mt-2 lg:self-start lg:translate-y-0"
              delay={130}
              threshold={0.16}
            >
              <div className="max-w-[14rem] md:max-w-[15rem] lg:ml-auto lg:max-w-[20rem] lg:-translate-x-[25px]">
                <div className="lg:flex lg:items-end lg:gap-4">
                  <div className="relative">
                    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 translate-y-3 blur-3xl opacity-25" style={{ background: "radial-gradient(ellipse at center, #a5b4fc 0%, #6366f1 50%, transparent 75%)" }} />
                    <p
                      className={`relative ${numberGradientClass} text-[4.25rem] leading-none font-black tracking-[-0.06em] [filter:drop-shadow(0_16px_28px_rgba(0,0,0,0.76))] md:text-[5.2rem] lg:text-[6rem]`}
                    >
                      12
                    </p>
                  </div>
                  <p className={`mt-1 max-w-[10ch] text-[1.18rem] leading-[0.95] font-black tracking-tight md:text-[1.4rem] lg:mt-0 lg:mb-2 ${labelClass}`}>
                    zagadnień gramatycznych
                  </p>
                </div>
              </div>
            </RevealOnView>

            {/* 4 RODZAJE (Tablet & Mobile) */}
            <RevealOnView className="md:col-start-1 md:row-start-4 md:-translate-y-[30px] lg:hidden" delay={190} threshold={0.16}>
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
