"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { BrainCircuit, CalendarDays, Check, Layers3, Paperclip, PenLine, PencilRuler, Pin } from "lucide-react";
import { useMemo } from "react";
import buyCtaImage from "@/img/buycta.png";
import calendarImage from "@/img/kalendarz.png";

const EXAM_MONTH_INDEX = 4;
const EXAM_DAY = 13;
const INK_SPLASH_MASK =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 420' preserveAspectRatio='none'><path fill='white' d='M62 126C74 72 118 20 198 24C272 28 321 52 393 40C468 28 523 8 622 18C716 28 760 53 856 42C957 30 1077 20 1138 64C1183 100 1172 154 1163 207C1155 253 1176 303 1151 351C1124 404 1056 409 976 400C895 391 842 410 751 416C664 421 606 398 516 404C432 410 378 430 288 418C198 406 93 414 52 368C14 325 28 270 24 216C21 172 35 152 62 126Z'/></svg>\")";

function getNextExamDate(baseDate: Date) {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);

  const candidate = new Date(today.getFullYear(), EXAM_MONTH_INDEX, EXAM_DAY);
  candidate.setHours(0, 0, 0, 0);

  if (candidate.getTime() >= today.getTime()) {
    return candidate;
  }

  const nextYearCandidate = new Date(today.getFullYear() + 1, EXAM_MONTH_INDEX, EXAM_DAY);
  nextYearCandidate.setHours(0, 0, 0, 0);
  return nextYearCandidate;
}

export default function PricingSection() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const examDate = useMemo(() => getNextExamDate(today), [today]);
  const daysToExam = useMemo(
    () => Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / 86_400_000)),
    [examDate, today],
  );
  const examDateLabel = useMemo(
    () => examDate.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" }),
    [examDate],
  );

  const handleSelectPlan = () => {
    router.push("/login");
  };

  return (
    <>
      <section
        id="pricing"
        className="relative mt-1 space-y-5 overflow-visible pt-0 pb-8 md:mt-2 md:space-y-6 md:pb-10 lg:mt-1 lg:space-y-5 lg:pb-10"
      >
        <div className="relative mx-auto mt-[72px] w-full max-w-[980px] overflow-visible pb-28 md:-mt-[10px] md:pb-32">
          <div
            aria-hidden
            className="pointer-events-none absolute left-[9%] top-[5%] z-0 hidden text-[#6f665b]/44 md:block"
          >
            <Paperclip className="h-6 w-6 rotate-[-12deg]" strokeWidth={1.8} />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute left-[20%] bottom-[10%] z-0 hidden text-[#756b60]/34 md:block"
          >
            <PencilRuler className="h-5 w-5 rotate-[-8deg]" strokeWidth={1.8} />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute right-[16%] top-[9%] z-0 hidden text-[#756b60]/40 md:block"
          >
            <PenLine className="h-6 w-6 rotate-[14deg]" strokeWidth={1.8} />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute right-[8%] bottom-[10%] z-0 hidden text-[#6f665b]/36 md:block"
          >
            <CalendarDays className="h-6 w-6 rotate-[8deg]" strokeWidth={1.7} />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute right-[30%] bottom-[16%] z-0 hidden text-[#6f665b]/32 md:block"
          >
            <Pin className="h-5 w-5 rotate-[18deg]" strokeWidth={1.8} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[6%] top-[12%] z-0 hidden text-[#74695d]/36 md:block">
            <CalendarDays className="h-4 w-4 rotate-[-6deg]" strokeWidth={1.7} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[14%] top-[16%] z-0 hidden text-[#6f665b]/34 md:block">
            <Pin className="h-4 w-4 rotate-[10deg]" strokeWidth={1.8} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[22%] top-[8%] z-0 hidden text-[#766c61]/38 md:block">
            <Paperclip className="h-5 w-5 rotate-[16deg]" strokeWidth={1.8} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[28%] top-[4%] z-0 hidden text-[#6e655b]/34 md:block">
            <PenLine className="h-4 w-4 rotate-[-18deg]" strokeWidth={1.8} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[33%] top-[11%] z-0 hidden text-[#74695f]/30 md:block">
            <PencilRuler className="h-5 w-5 rotate-[12deg]" strokeWidth={1.7} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[39%] top-[7%] z-0 hidden text-[#786d62]/28 md:block">
            <CalendarDays className="h-4 w-4 rotate-[8deg]" strokeWidth={1.7} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[47%] top-[5%] z-0 hidden text-[#71675d]/30 md:block">
            <Pin className="h-4 w-4 rotate-[-10deg]" strokeWidth={1.8} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[55%] top-[9%] z-0 hidden text-[#766c61]/34 md:block">
            <Paperclip className="h-5 w-5 rotate-[6deg]" strokeWidth={1.8} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[63%] top-[6%] z-0 hidden text-[#70675c]/28 md:block">
            <PenLine className="h-4 w-4 rotate-[20deg]" strokeWidth={1.8} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[71%] top-[12%] z-0 hidden text-[#766b60]/32 md:block">
            <CalendarDays className="h-5 w-5 rotate-[-9deg]" strokeWidth={1.7} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[79%] top-[7%] z-0 hidden text-[#6f665b]/30 md:block">
            <PencilRuler className="h-4 w-4 rotate-[15deg]" strokeWidth={1.8} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[86%] top-[14%] z-0 hidden text-[#766c60]/34 md:block">
            <Pin className="h-4 w-4 rotate-[4deg]" strokeWidth={1.8} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[10%] bottom-[20%] z-0 hidden text-[#73695d]/34 md:block">
            <Paperclip className="h-5 w-5 rotate-[-22deg]" strokeWidth={1.8} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[18%] bottom-[6%] z-0 hidden text-[#786e63]/28 md:block">
            <CalendarDays className="h-4 w-4 rotate-[11deg]" strokeWidth={1.7} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[26%] bottom-[13%] z-0 hidden text-[#71685d]/30 md:block">
            <PenLine className="h-4 w-4 rotate-[-7deg]" strokeWidth={1.8} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[36%] bottom-[9%] z-0 hidden text-[#766b61]/32 md:block">
            <Pin className="h-5 w-5 rotate-[14deg]" strokeWidth={1.8} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[48%] bottom-[5%] z-0 hidden text-[#70665c]/28 md:block">
            <PencilRuler className="h-5 w-5 rotate-[-10deg]" strokeWidth={1.8} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[60%] bottom-[14%] z-0 hidden text-[#746a5f]/30 md:block">
            <Paperclip className="h-4 w-4 rotate-[18deg]" strokeWidth={1.8} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[82%] bottom-[20%] z-0 hidden text-[#6e655a]/28 md:block">
            <PenLine className="h-4 w-4 rotate-[9deg]" strokeWidth={1.8} />
          </div>
          <div aria-hidden className="pointer-events-none absolute left-[3.5%] top-[22%] z-0 hidden md:block">
            <span className="absolute h-[7px] w-[7px] rounded-full bg-[#111522]/40" />
            <span className="absolute left-3 top-2 h-[4px] w-[4px] rounded-full bg-[#111522]/32" />
          </div>
          <div aria-hidden className="pointer-events-none absolute right-[3.5%] top-[34%] z-0 hidden md:block">
            <span className="absolute h-3 w-3 rounded-full bg-[#111522]/78 blur-[0.4px]" />
            <span className="absolute left-5 top-3 h-2 w-2 rounded-full bg-[#111522]/66" />
            <span className="absolute left-10 top-8 h-[6px] w-[6px] rounded-full bg-[#111522]/54" />
          </div>
          <div aria-hidden className="pointer-events-none absolute bottom-[13%] left-[6%] z-0 hidden md:block">
            <span className="absolute h-2 w-2 rounded-full bg-[#111522]/58" />
            <span className="absolute left-4 top-2 h-[5px] w-[5px] rounded-full bg-[#111522]/42" />
          </div>
          <div aria-hidden className="pointer-events-none absolute bottom-[18%] right-[8%] z-0 hidden md:block">
            <span className="absolute h-[7px] w-[7px] rounded-full bg-[#111522]/52" />
            <span className="absolute -left-3 top-3 h-[4px] w-[4px] rounded-full bg-[#111522]/34" />
          </div>
          <div className="relative top-[118px] z-[1] md:top-[80px]">
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,248,239,0.035)_0%,rgba(14,16,28,0.09)_18%,rgba(12,14,24,0.18)_58%,rgba(6,7,14,0.2)_100%)] opacity-[0.42]"
              style={{
                maskImage: INK_SPLASH_MASK,
                maskRepeat: "no-repeat",
                maskPosition: "center",
                maskSize: "100% 100%",
                WebkitMaskImage: INK_SPLASH_MASK,
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                WebkitMaskSize: "100% 100%",
              }}
            />

            <div
              className="relative isolate overflow-hidden bg-transparent"
              style={{
                maskImage: INK_SPLASH_MASK,
                maskRepeat: "no-repeat",
                maskPosition: "center",
                maskSize: "100% 100%",
                WebkitMaskImage: INK_SPLASH_MASK,
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                WebkitMaskSize: "100% 100%",
              }}
            >
              <Image
                src={buyCtaImage}
                alt=""
                aria-hidden
                fill
                className="absolute inset-0 hidden h-full w-full scale-[1.64] object-cover object-[center_62%] opacity-[0.96] blur-[1.5px] brightness-[0.4] saturate-[0.7] min-[900px]:block"
              />
              <div className="absolute inset-x-0 bottom-0 h-[67%] overflow-hidden min-[900px]:hidden">
                <Image
                  src={buyCtaImage}
                  alt=""
                  aria-hidden
                  fill
                  className="scale-[1.54] object-cover object-[center_68%] opacity-[0.96] blur-[1.5px] brightness-[0.4] saturate-[0.7]"
                />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.16)_0%,rgba(0,0,0,0.22)_36%,rgba(0,0,0,0.18)_72%,rgba(0,0,0,0.26)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.05),transparent_22%),radial-gradient(circle_at_84%_78%,rgba(0,0,0,0.1),transparent_28%)]" />
              <div className="absolute inset-x-0 top-0 h-[33%] overflow-hidden min-[900px]:inset-y-0 min-[900px]:left-0 min-[900px]:right-auto min-[900px]:h-auto min-[900px]:w-[24.8%]">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,8,16,0.04)_0%,rgba(6,8,16,0.02)_64%,transparent_100%)]" />
                <Image
                  src={calendarImage}
                  alt=""
                  aria-hidden
                  fill
                  className="scale-[1.12] object-cover object-[center_58%] opacity-[0.96] blur-[0.6px] brightness-[0.56] saturate-[0.78]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,12,0.26)_0%,rgba(4,6,12,0.34)_42%,rgba(4,6,12,0.48)_100%)] min-[900px]:bg-[linear-gradient(180deg,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0.18)_42%,rgba(0,0,0,0.34)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.16),transparent_42%)]" />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.028)_0%,rgba(255,255,255,0.01)_20%,rgba(0,0,0,0.03)_64%,rgba(0,0,0,0.075)_100%)]" />
              <div className="pointer-events-none absolute inset-[1px] bg-[linear-gradient(135deg,rgba(255,250,242,0.055)_0%,rgba(255,250,242,0.022)_28%,rgba(24,18,13,0.012)_62%,rgba(24,18,13,0.055)_100%)] shadow-[inset_1px_1px_0_rgba(255,249,241,0.16),inset_-1px_-1px_0_rgba(28,22,16,0.18),inset_16px_16px_20px_-20px_rgba(255,247,236,0.075),inset_-16px_-16px_20px_-20px_rgba(18,14,10,0.1)]" />
              <div className="pointer-events-none absolute inset-[3px] rounded-[inherit] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.016)_0,rgba(255,255,255,0.016)_1px,transparent_1px,transparent_5px),repeating-linear-gradient(90deg,rgba(255,255,255,0.012)_0,rgba(255,255,255,0.012)_1px,transparent_1px,transparent_6px)] opacity-[0.2] mix-blend-soft-light" />
              <div className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.055),inset_0_-2px_0_rgba(0,0,0,0.32),inset_20px_0_28px_-24px_rgba(255,255,255,0.026),inset_-24px_0_30px_-24px_rgba(0,0,0,0.16),inset_0_18px_24px_-22px_rgba(255,255,255,0.05),inset_0_-18px_24px_-20px_rgba(4,6,14,0.18)]" />

              <div className="relative px-3 py-4 md:px-4 md:py-4">
                <div className="relative flex flex-col px-6 pt-7 pb-5 text-white min-[900px]:hidden">
                  <div className="relative top-[18px] left-[5px] flex w-full max-w-[17.5rem] flex-col gap-6">
                    <div className="relative left-[10px] flex flex-col gap-3">
                      <p className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">Ile dni do egz?</p>
                      <div className="space-y-2">
                        <p className="text-[4.05rem] leading-none font-black tracking-[-0.105em] text-white/72">
                          {daysToExam}
                        </p>
                        <p className="text-[11px] font-medium text-white/34">{examDateLabel}</p>
                      </div>
                    </div>

                    <div className="relative left-[-5px] flex flex-col gap-6">
                      <div className="relative top-[8px] flex flex-col gap-1">
                        <p className="text-[9px] font-bold tracking-[0.28em] text-white/34 uppercase">Twój plan</p>
                        <p className="text-[0.96rem] font-semibold text-[#C97A7A] line-through decoration-[#C97A7A]/70">
                          29 zł
                        </p>
                      </div>

                      <p className="whitespace-nowrap text-[4.55rem] leading-[0.76] font-black tracking-[-0.065em] text-white [text-shadow:0_12px_28px_rgba(0,0,0,0.34)]">
                        24 zł
                      </p>

                      <ul className="space-y-3 text-[0.92rem] leading-[1.4] font-semibold text-white/76">
                        <li className="flex items-start gap-3">
                          <Layers3 className="mt-0.5 h-4 w-4 shrink-0 text-white/42" strokeWidth={1.8} />
                          <span>Pełen dostęp</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/42" strokeWidth={2.2} />
                          <span>Inteligentne zestawy</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-white/42" strokeWidth={1.8} />
                          <span>Analiza mocnych i słabych stron</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={handleSelectPlan}
                      className="group relative top-[-13px] left-[2px] mt-2 w-full overflow-hidden rounded-[1.05rem] border border-[#7476ff]/24 bg-[linear-gradient(90deg,rgba(112,110,255,0.96)_0%,rgba(98,93,246,0.94)_44%,rgba(78,72,220,0.96)_100%)] px-5 py-3.5 text-sm font-black tracking-[0.01em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_18px_-16px_rgba(72,67,210,0.4)] transition-[transform,filter,border-color] duration-150 ease-out hover:-translate-y-0.5 hover:border-[#8385ff]/36 hover:brightness-[1.03] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/35 motion-reduce:transform-none"
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/65 to-transparent"
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white/10 to-transparent"
                      />
                      <span className="relative z-10">Zacznij za 24 zł</span>
                    </button>

                    <p className="relative top-[-28px] left-[2px] -mt-1 text-center text-[11.5px] leading-relaxed text-white/84">
                      Bezpieczna płatność • Aktywacja od razu
                    </p>
                  </div>
                </div>

                <div className="hidden min-[900px]:grid min-[900px]:grid-cols-[minmax(0,0.62fr)_minmax(0,1.88fr)]">
                  <div className="relative min-h-[17.5rem] overflow-hidden">
                    <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(180deg,rgba(4,6,12,0.24)_0%,rgba(4,6,12,0.34)_52%,rgba(4,6,12,0.44)_100%)] min-[900px]:block" />
                    <div className="pointer-events-none absolute right-0 top-[18%] h-[64%] w-px bg-gradient-to-b from-transparent via-[#6d7cff]/28 to-transparent" />
                    <div className="pointer-events-none absolute right-0 top-[22%] h-[56%] w-[8px] translate-x-1/2 bg-[radial-gradient(circle_at_center,rgba(109,124,255,0.12)_0%,rgba(109,124,255,0.04)_42%,transparent_78%)] blur-[2px]" />

                    <div className="relative flex h-full min-h-[inherit] flex-col justify-between px-6 py-7 text-right text-white">
                      <p className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">Ile dni do egz?</p>

                      <div className="space-y-2 md:max-w-[8rem]">
                        <p className="relative left-[40px] text-[5.8rem] leading-none font-black tracking-[-0.1em] text-white/72">
                          {daysToExam}
                        </p>
                        <p className="text-[11px] font-medium text-white/34">{examDateLabel}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative min-h-[17.5rem] overflow-hidden">
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-[linear-gradient(90deg,rgba(255,248,240,0.045)_0%,rgba(255,248,240,0.015)_28%,transparent_100%)]" />

                    <div className="relative flex h-full min-h-[inherit] flex-col px-7 py-7 text-white">
                      <div className="grid h-full grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] items-stretch gap-x-12">
                        <div className="flex h-full flex-col justify-between py-2">
                          <p className="text-[9px] font-bold tracking-[0.28em] text-white/36 uppercase">Twój plan</p>
                          <div className="space-y-2">
                            <p className="text-[1.08rem] font-semibold text-white/24 line-through decoration-white/18">
                              29 zł
                            </p>
                            <p className="whitespace-nowrap text-[5.85rem] leading-[0.78] font-black tracking-[-0.06em] text-white [text-shadow:0_12px_28px_rgba(0,0,0,0.34)]">
                              24 zł
                            </p>
                          </div>
                        </div>

                        <div className="relative flex h-full flex-col justify-between gap-6 py-2 -ml-8 pl-3">
                          <div className="pointer-events-none absolute left-0 top-[12%] h-[72%] w-px bg-gradient-to-b from-transparent via-[#6d7cff]/24 to-transparent" />
                          <div className="pointer-events-none absolute left-0 top-[18%] h-[60%] w-[8px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,rgba(109,124,255,0.1)_0%,rgba(109,124,255,0.035)_46%,transparent_78%)] blur-[2px]" />
                          <ul className="space-y-3 text-[0.92rem] leading-snug font-semibold text-white/74">
                            <li className="flex items-start gap-2.5">
                              <Layers3 className="mt-0.5 h-4 w-4 shrink-0 text-white/42" strokeWidth={1.8} />
                              <span>Pełen dostęp</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/42" strokeWidth={2.2} />
                              <span>Inteligentne zestawy</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-white/42" strokeWidth={1.8} />
                              <span>Analiza mocnych i słabych stron</span>
                            </li>
                          </ul>

                          <button
                            type="button"
                            onClick={handleSelectPlan}
                            className="group relative w-full overflow-hidden rounded-[1.05rem] border border-[#7476ff]/24 bg-[linear-gradient(90deg,rgba(112,110,255,0.96)_0%,rgba(98,93,246,0.94)_44%,rgba(78,72,220,0.96)_100%)] px-5 py-3.5 text-sm font-black tracking-[0.01em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_18px_-16px_rgba(72,67,210,0.4)] transition-all duration-200 ease-out hover:-translate-y-1 hover:brightness-110 hover:shadow-[0_20px_40px_-12px_rgba(46,41,189,0.45)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/35 motion-reduce:transform-none md:max-w-[14.75rem] md:self-start"
                          >
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/65 to-transparent"
                            />
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white/10 to-transparent"
                            />
                            <span className="relative z-10">Zacznij za 24 zł</span>
                          </button>
                          <p className="pt-2.5 text-left text-xs text-white/78">
                            Bezpieczna płatność • Aktywacja od razu
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}

