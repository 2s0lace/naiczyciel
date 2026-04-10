"use client";

import Image from "next/image";
import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import E8AuthenticatedDashboard from "@/components/landing/e8-authenticated-dashboard";
import DemoPreview from "@/components/landing/demo-preview";
import E8NumbersBento from "@/components/landing/e8-numbers-bento";
import FeatureTabs from "@/components/landing/feature-tabs";
import HeroSection from "@/components/landing/hero-section";
import HeroSteps from "@/components/landing/hero-steps";
import MobileHeader from "@/components/landing/mobile-header";
import { ParallaxGridLayer } from "@/components/landing/parallax-grid-layer";
import PricingSection from "@/components/landing/pricing-section";
import type { FeatureType } from "@/components/landing/types";
import { resolveDisplayNameFromMetadata } from "@/lib/auth/display-name";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import tornPaperImage from "@/img/torn-paper-vector-vintage-sticker-with-design-space.png";
import whitePaperTextureBackground from "@/img/white-paper-texture-background.png";

function shouldShowDashboardOnboarding(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }

  return user.user_metadata?.dashboard_onboarding_completed === false;
}

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
          className="pointer-events-none absolute bottom-0 left-1/2 right-1/2 -z-10 h-28 -ml-[50vw] -mr-[50vw] bg-[linear-gradient(180deg,rgba(5,5,16,0)_0%,rgba(5,5,16,0.22)_38%,rgba(5,5,16,0.72)_78%,#050510_100%)]"
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

      <div className="relative -mt-24 overflow-visible md:mt-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 right-1/2 -z-20 -ml-[50vw] -mr-[50vw] overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={tornPaperImage}
              alt=""
              aria-hidden
              fill
              className="scale-[6.4] translate-y-[0%] object-contain object-center opacity-[0.9] md:scale-[0.78] md:translate-y-[8%] md:object-[center_top] md:opacity-[0.88]"
            />
          </div>
          <div
            className="absolute inset-x-0 top-[-36px] h-[calc(50%+36px)] opacity-[0.96] md:hidden"
            style={{
              backgroundImage: `url(${whitePaperTextureBackground.src})`,
              backgroundPosition: "center 76%",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              filter:
                "saturate(0.58) contrast(0.74) blur(0.8px) drop-shadow(0 14px 18px rgba(0,0,0,0.12)) drop-shadow(0 28px 34px rgba(0,0,0,0.18))",
            }}
          />
          <div
            className="absolute inset-x-0 top-0 hidden h-[50%] opacity-[0.96] md:block"
            style={{
              backgroundImage: `url(${whitePaperTextureBackground.src})`,
              backgroundPosition: "center 99%",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              filter:
                "saturate(0.58) contrast(0.74) blur(0.8px) drop-shadow(0 14px 18px rgba(0,0,0,0.12)) drop-shadow(0 28px 34px rgba(0,0,0,0.18))",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-60 bg-[linear-gradient(180deg,#050510_0%,rgba(5,5,16,0.98)_16%,rgba(5,5,16,0.82)_38%,rgba(5,5,16,0.46)_66%,rgba(5,5,16,0.12)_86%,rgba(5,5,16,0)_100%)] md:h-36 lg:h-44" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-32 md:max-w-4xl md:px-6 md:pb-36 lg:max-w-6xl lg:px-9 lg:pb-36 xl:max-w-[82rem] xl:px-10 2xl:max-w-[94rem] 2xl:px-12 min-[2200px]:max-w-[124rem] min-[2200px]:px-16">
          <E8NumbersBento />
          <PricingSection />

          <section className="mx-auto mt-10 w-full max-w-[52rem] px-4 md:mt-12 md:px-5 2xl:mt-14 2xl:max-w-[62rem] min-[2200px]:max-w-[72rem]">
            <h2 className="text-[0.78rem] font-medium tracking-[0.025em] text-white/42 md:text-[0.8rem]">Trening do E8 z angielskiego</h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-indigo-100/38">Na tej stronie możesz ćwiczyć angielski do egzaminu ósmoklasisty w krótkich quizach. Zestawy obejmują reakcje językowe, reading, słownictwo i gramatykę, a po zakończeniu od razu zobaczysz wynik i krótkie wyjaśnienia. To prosty sposób na regularne ćwiczenie typów zadań spotykanych na E8.</p>
          </section>
        </div>
      </div>

      <MarketingFooter />
    </main>
  );
}

export default function E8Landing() {
  const [activeTab, setActiveTab] = useState<FeatureType>("sets");
  const [visitedTabs, setVisitedTabs] = useState<FeatureType[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [forcePlansView, setForcePlansView] = useState(false);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    try {
      const supabase = getSupabaseBrowserClient();

      void (async () => {
        try {
          const { data } = await supabase.auth.getSession();

          if (!mounted) {
            return;
          }

          setSession(data.session ?? null);
        } finally {
          if (mounted) {
            setIsAuthResolved(true);
          }
        }
      })();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!mounted) {
          return;
        }

        setSession(nextSession);
      });

      unsubscribe = () => subscription.unsubscribe();
    } catch {
      if (mounted) {
        setSession(null);
        setIsAuthResolved(true);
      }
    }

    return () => {
      mounted = false;

      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setForcePlansView(params.get("plans") === "1");
    } catch {
      setForcePlansView(false);
    }
  }, []);

  const userDisplayName = useMemo(
    () => resolveDisplayNameFromMetadata(session?.user?.user_metadata, "Ty"),
    [session?.user?.user_metadata],
  );
  const shouldRunOnboarding = useMemo(() => shouldShowDashboardOnboarding(session?.user), [session?.user]);
  const isAuthenticated = Boolean(session?.access_token && session?.user);
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

  if (!isAuthResolved) {
    return <main className="viewport-shell bg-[#050510]" aria-hidden="true" />;
  }

  if (isAuthenticated && session?.access_token && !forcePlansView) {
    return <E8AuthenticatedDashboard accessToken={session.access_token} userDisplayName={userDisplayName} shouldRunOnboarding={shouldRunOnboarding} />;
  }

  return <PublicE8Landing activeTab={activeTab} visitedTabs={visitedTabs} onTabChange={handleTabChange} />;
}
