"use client";

import Image from "next/image";
import { useState } from "react";
import DemoPreview from "@/components/landing/demo-preview";

import E8NumbersBento from "@/components/landing/e8-numbers-bento";
import FeatureTabs from "@/components/landing/feature-tabs";
import HeroSection from "@/components/landing/hero-section";
import HeroSteps from "@/components/landing/hero-steps";
import MobileHeader from "@/components/landing/mobile-header";
import { ParallaxGridLayer } from "@/components/landing/parallax-grid-layer";
import PricingSection from "@/components/landing/pricing-section";
import type { FeatureType } from "@/components/landing/types";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import tornPaperImage from "@/img/torn-paper-vector-vintage-sticker-with-design-space.png";
import whitePaperTextureBackground from "@/img/white-paper-texture-background.png";

function PublicE8Landing({
  activeTab,
  visitedTabs,
  onTabChange,
}: {
  activeTab: FeatureType;
  visitedTabs: FeatureType[];
  onTabChange: (tab: FeatureType) => void;
}) {
  return (
    <main className="viewport-shell relative isolate max-w-full touch-pan-y overflow-x-hidden e8-landing-headlines text-white selection:bg-indigo-500/30">
      <div className="relative">
        <ParallaxGridLayer
          fixed={false}
          className="absolute inset-y-0 left-1/2 right-1/2 -z-20 -ml-[50vw] -mr-[50vw]"
          style={{
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.98) 70%, rgba(0,0,0,0.64) 86%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.98) 70%, rgba(0,0,0,0.64) 86%, transparent 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 right-1/2 -z-10 h-28 -ml-[50vw] -mr-[50vw] bg-[linear-gradient(180deg,rgba(5,5,16,0)_0%,rgba(5,5,16,0.22)_38%,rgba(5,5,16,0.72)_78%,#050510_100%)] md:hidden"
          aria-hidden
        />

        <MobileHeader />

        <div className="mx-auto w-full max-w-md px-5 pt-9 md:max-w-4xl md:px-6 md:pt-11 lg:max-w-6xl lg:px-9 lg:pt-9 xl:max-w-[82rem] xl:px-10 xl:pt-10 2xl:max-w-[94rem] 2xl:px-12 2xl:pt-12 min-[2200px]:max-w-[124rem] min-[2200px]:px-16 min-[2200px]:pt-14">
          <section className="relative lg:grid lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-start lg:gap-9 lg:pb-3 xl:gap-12 xl:pb-4 min-[1440px]:grid-cols-[minmax(0,0.83fr)_minmax(0,1.17fr)] min-[1440px]:items-center min-[1440px]:gap-14 min-[1440px]:pb-6 2xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] 2xl:gap-16 min-[2200px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] min-[2200px]:gap-20">
            <HeroSection activeTab={activeTab} visitedTabs={visitedTabs} />

            <div
              className="motion-fade-up mx-auto mt-5 w-full max-w-[38rem] space-y-3 md:mt-8 md:max-w-[44rem] md:space-y-3.5 lg:mt-0 lg:max-w-[50rem] lg:space-y-3 lg:pt-3 xl:max-w-[52rem] 2xl:max-w-[58rem] min-[2200px]:max-w-[66rem]"
              style={{ animationDelay: "250ms", animationDuration: "520ms" }}
            >
              <p className="text-center text-sm font-semibold text-indigo-200/80 md:text-[0.95rem] lg:text-left min-[1440px]:text-[1.02rem] min-[2200px]:text-[1.14rem]">Jak to działa w praktyce</p>
              <HeroSteps activeTab={activeTab} visitedTabs={visitedTabs} variant="mobile" />
              <FeatureTabs activeTab={activeTab} onChange={onTabChange} />
              <DemoPreview activeTab={activeTab} onTabChange={onTabChange} />
            </div>
          </section>
        </div>
      </div>

      <div className="relative mt-8 overflow-clip md:mt-12">
        <div className="absolute inset-y-0 left-1/2 hidden w-[1600px] -translate-x-1/2 translate-y-[145px] overflow-visible md:block md:-translate-y-[5px] lg:w-[100vw] xl:w-[94vw] xl:translate-y-[45px] max-w-[84rem]">
          <Image
            src={tornPaperImage}
            alt=""
            aria-hidden
            fill
            className="object-cover object-center opacity-[0.95] drop-shadow-[0_12px_28px_rgba(0,0,0,0.36)] lg:object-fill lg:opacity-[0.9]"
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-8 md:max-w-4xl md:px-6 md:pb-14 lg:max-w-6xl lg:px-9 lg:pb-14 xl:max-w-[82rem] xl:px-10 2xl:max-w-[94rem] 2xl:px-12 min-[2200px]:max-w-[124rem] min-[2200px]:px-16">
          <div className="relative z-20 pb-[6rem] md:pb-0 lg:pb-0 xl:pb-[10rem]">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 bottom-0 h-full left-1/2 right-1/2 -z-20 -ml-[50vw] -mr-[50vw] opacity-[0.96] translate-y-[30px] md:translate-y-0 lg:h-[calc(100%+30px)] lg:-translate-y-[30px]"
              style={{
                backgroundImage: `url(${whitePaperTextureBackground.src})`,
                backgroundPosition: "center bottom",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                filter: "saturate(0.72) contrast(0.88) drop-shadow(0 10px 16px rgba(0,0,0,0.1))",
              }}
            />
            <div className="pointer-events-none absolute left-1/2 right-1/2 top-0 -z-10 h-60 -ml-[50vw] -mr-[50vw] bg-[linear-gradient(180deg,#050510_0%,rgba(5,5,16,0.98)_16%,rgba(5,5,16,0.82)_38%,rgba(5,5,16,0.46)_66%,rgba(5,5,16,0.12)_86%,rgba(5,5,16,0)_100%)] md:h-36 lg:h-44" />
            <E8NumbersBento />
          </div>

          <div className="relative z-10 -mt-[270px] md:-mt-[182px] lg:-mt-[182px] xl:-mt-[240px]">
            <PricingSection />
          </div>
        </div>
      </div>

      <section className="relative z-10 mx-auto mt-4 w-full max-w-[52rem] px-5 pb-16 md:mt-8 md:px-6 md:pb-20 2xl:max-w-[62rem] min-[2200px]:max-w-[72rem]">
        <h2 className="text-[0.8rem] font-medium tracking-[0.025em] text-white/42 md:text-[0.82rem]">Trening do E8 z angielskiego</h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-indigo-100/40 md:text-[13px] md:leading-relaxed">Na tej stronie możesz ćwiczyć angielski do egzaminu ósmoklasisty w krótkich quizach. Zestawy obejmują reakcje językowe, reading, słownictwo i gramatykę, a po zakończeniu od razu zobaczysz wynik i krótkie wyjaśnienia. To prosty sposób na regularne ćwiczenie typów zadań spotykanych na E8.</p>
      </section>

      <MarketingFooter />
    </main>
  );
}

export default function E8Landing() {
  const [activeTab, setActiveTab] = useState<FeatureType>("sets");
  const [visitedTabs, setVisitedTabs] = useState<FeatureType[]>([]);
  const handleTabChange = (tab: FeatureType) => {
    setActiveTab(tab);
    setVisitedTabs((prev) => {
      const nextVisitedTabs = [...prev];

      if (tab === "explaining" && !nextVisitedTabs.includes("sets")) {
        nextVisitedTabs.push("sets");
      }

      if (!nextVisitedTabs.includes(tab)) {
        nextVisitedTabs.push(tab);
      }

      return nextVisitedTabs;
    });
  };

  return <PublicE8Landing activeTab={activeTab} visitedTabs={visitedTabs} onTabChange={handleTabChange} />;
}
