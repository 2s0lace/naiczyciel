import { ChevronRight } from "lucide-react";
import Link from "next/link";
import HeroSteps from "@/components/landing/hero-steps";
import type { FeatureType } from "@/components/landing/types";

type HeroSectionProps = {
  activeTab: FeatureType;
  visitedTabs?: FeatureType[];
};

export default function HeroSection({ activeTab, visitedTabs }: HeroSectionProps) {
  return (
    <section className="flex flex-col items-center pt-2 pb-6 text-center md:pt-3 md:pb-6 lg:items-start lg:pt-2 lg:pb-0 lg:text-left xl:pt-3 min-[1440px]:pt-4 min-[1440px]:pb-3 min-[2200px]:pt-7 min-[2200px]:pb-5">
      <h1
        className="motion-fade-up mb-4 text-[2.2rem] leading-[1.05] font-black tracking-tight sm:text-[2.5rem] md:mb-4 md:max-w-[16ch] md:text-[2.9rem] lg:mb-3 lg:max-w-[13.5ch] lg:text-[2.92rem] lg:leading-[1.01] xl:text-[3.05rem] min-[1440px]:max-w-[14.2ch] min-[1440px]:text-[3.3rem] 2xl:max-w-[14.5ch] 2xl:text-[3.65rem] min-[2200px]:max-w-[15.2ch] min-[2200px]:text-[4.4rem]"
        style={{ animationDuration: "500ms" }}
      >
        <span className="bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent">Ćwicz do E8</span>
        <br />
        <span className="bg-gradient-to-r from-indigo-300 via-violet-200 to-white bg-clip-text text-transparent">
          na zadaniach
          <br />
          jak z CKE
        </span>
      </h1>

      <p
        className="motion-fade-up mb-8 max-w-[320px] text-sm leading-snug text-gray-400 sm:text-base md:mb-6 md:max-w-[40ch] md:text-[1.02rem] md:leading-relaxed lg:mb-4 lg:max-w-[34ch] lg:text-[1rem] min-[1440px]:max-w-[36ch] min-[1440px]:text-[1.06rem] 2xl:max-w-[38ch] 2xl:text-[1.12rem] min-[2200px]:max-w-[40ch] min-[2200px]:text-[1.24rem]"
        style={{ animationDelay: "110ms", animationDuration: "450ms" }}
      >
        Krótkie zestawy, wyjaśnienia błędów i analiza tego, co warto jeszcze powtórzyć.
      </p>

      <Link
        href="/e8/quiz"
        className="motion-fade-up group relative flex w-full max-w-[320px] items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition-[transform,filter,box-shadow,background-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.985] motion-reduce:transform-none sm:w-auto sm:min-w-[230px] sm:max-w-none md:min-w-[248px] md:hover:-translate-y-0.5 md:hover:bg-indigo-500 md:hover:shadow-[0_12px_28px_-16px_rgba(99,102,241,0.82)] min-[1440px]:min-w-[288px] min-[1440px]:rounded-3xl min-[1440px]:py-4 min-[1440px]:text-base min-[2200px]:min-w-[332px] min-[2200px]:py-[1.1rem] min-[2200px]:text-[1.08rem]"
        style={{ animationDelay: "190ms", animationDuration: "420ms" }}
      >
        Zacznij test
        <ChevronRight
          size={20}
          className="text-indigo-200 transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] md:group-hover:translate-x-0.5 motion-reduce:transform-none"
        />
      </Link>

      <HeroSteps activeTab={activeTab} visitedTabs={visitedTabs} variant="desktop" />
    </section>
  );
}
