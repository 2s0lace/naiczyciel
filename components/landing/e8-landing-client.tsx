"use client";

import dynamic from "next/dynamic";
import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import HeroSection from "@/components/landing/hero-section";
import HeroSteps from "@/components/landing/hero-steps";
import MobileHeader from "@/components/landing/mobile-header";
import { ParallaxGridLayer } from "@/components/landing/parallax-grid-layer";
import type { FeatureType } from "@/components/landing/types";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { resolveDisplayNameFromMetadata } from "@/lib/auth/display-name";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const E8AuthenticatedDashboard = dynamic(
  () => import("@/components/landing/e8-authenticated-dashboard"),
  { ssr: false },
);

const DemoPreview = dynamic(() => import("@/components/landing/demo-preview"), {
  ssr: false,
});

const E8BottomBento = dynamic(
  () => import("@/components/landing/e8-bottom-bento"),
  { ssr: false },
);

const FeatureTabs = dynamic(() => import("@/components/landing/feature-tabs"), {
  ssr: false,
});

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
          className="pointer-events-none absolute bottom-0 left-1/2 right-1/2 -z-10 h-28 -ml-[50vw] -mr-[50vw] bg-[linear-gradient(180deg,rgba(5,5,16,0)_0%,rgba(5,5,16,0.22)_38%,rgba(5,5,16,0.72)_78%,#050510_100%)] md:hidden"
          aria-hidden
        />

        <MobileHeader />

        <div className="mx-auto w-full max-w-md px-5 pt-9 min-[2200px]:max-w-[124rem] min-[2200px]:px-16 min-[2200px]:pt-14 md:max-w-4xl md:px-6 md:pt-11 lg:max-w-6xl lg:px-9 lg:pt-9 xl:max-w-[82rem] xl:px-10 xl:pt-10 2xl:max-w-[94rem] 2xl:px-12 2xl:pt-12">
          <section className="relative lg:grid lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-start lg:gap-9 lg:pb-3 min-[1440px]:grid-cols-[minmax(0,0.83fr)_minmax(0,1.17fr)] min-[1440px]:items-center min-[1440px]:gap-14 min-[1440px]:pb-6 min-[2200px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] min-[2200px]:gap-20 xl:gap-12 xl:pb-4 2xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] 2xl:gap-16">
            <HeroSection activeTab={activeTab} visitedTabs={visitedTabs} />

            <div
              className="motion-fade-up mx-auto mt-5 w-full max-w-[38rem] space-y-3 md:mt-8 md:max-w-[44rem] md:space-y-3.5 lg:mt-0 lg:max-w-[50rem] lg:space-y-3 lg:pt-3 min-[2200px]:max-w-[66rem] xl:max-w-[52rem] 2xl:max-w-[58rem]"
              style={{ animationDelay: "250ms", animationDuration: "520ms" }}
            >
              <p className="text-center text-sm font-semibold text-indigo-200/80 md:text-[0.95rem] lg:text-left min-[1440px]:text-[1.02rem] min-[2200px]:text-[1.14rem]">Jak to dziala w praktyce</p>
              <HeroSteps activeTab={activeTab} visitedTabs={visitedTabs} variant="mobile" />
              <FeatureTabs activeTab={activeTab} onChange={onTabChange} />
              <DemoPreview activeTab={activeTab} onTabChange={onTabChange} />
            </div>
          </section>
        </div>
      </div>

      <E8BottomBento />

      <MarketingFooter />
    </main>
  );
}

export default function E8LandingClient() {
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
  const shouldRunOnboarding = useMemo(
    () => shouldShowDashboardOnboarding(session?.user),
    [session?.user],
  );
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
    return (
      <E8AuthenticatedDashboard
        accessToken={session.access_token}
        userDisplayName={userDisplayName}
        shouldRunOnboarding={shouldRunOnboarding}
      />
    );
  }

  return (
    <PublicE8Landing
      activeTab={activeTab}
      visitedTabs={visitedTabs}
      onTabChange={handleTabChange}
    />
  );
}
