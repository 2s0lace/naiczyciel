"use client";

import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import E8AuthenticatedDashboard from "@/components/landing/e8-authenticated-dashboard";
import DemoPreview from "@/components/landing/demo-preview";
import FeatureTabs from "@/components/landing/feature-tabs";
import HeroSection from "@/components/landing/hero-section";
import HeroSteps from "@/components/landing/hero-steps";
import MobileHeader from "@/components/landing/mobile-header";
import PricingSection from "@/components/landing/pricing-section";
import type { FeatureType } from "@/components/landing/types";
import { resolveDisplayNameFromMetadata } from "@/lib/auth/display-name";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { MarketingFooter } from "@/components/layout/marketing-footer";

function shouldShowDashboardOnboarding(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }

  return user.user_metadata?.dashboard_onboarding_completed === false;
}

function PublicE8Landing({ activeTab, onTabChange }: { activeTab: FeatureType; onTabChange: (tab: FeatureType) => void }) {
  return (
    <main className="viewport-shell e8-landing-headlines text-white selection:bg-indigo-500/30">
      <MobileHeader />

      <div className="mx-auto w-full max-w-md px-5 pt-9 pb-16 md:max-w-4xl md:px-6 md:pt-11 md:pb-20 lg:max-w-6xl lg:px-9 lg:pt-9 lg:pb-20 xl:max-w-[82rem] xl:px-10 xl:pt-10 2xl:max-w-[94rem] 2xl:px-12 2xl:pt-12 min-[2200px]:max-w-[124rem] min-[2200px]:px-16 min-[2200px]:pt-14">
        <section className="relative lg:grid lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-start lg:gap-9 lg:pb-3 xl:gap-12 xl:pb-4 min-[1440px]:grid-cols-[minmax(0,0.83fr)_minmax(0,1.17fr)] min-[1440px]:items-center min-[1440px]:gap-14 min-[1440px]:pb-6 2xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] 2xl:gap-16 min-[2200px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] min-[2200px]:gap-20">
          <div
            className="pointer-events-none absolute inset-x-[-4%] -top-10 -z-10 hidden h-[22rem] bg-[radial-gradient(circle_at_52%_22%,rgba(99,102,241,0.16),transparent_66%)] lg:block"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-[-4%] -top-2 -z-10 hidden h-[20rem] bg-[linear-gradient(180deg,rgba(79,70,229,0.06)_0%,rgba(5,5,16,0)_78%)] lg:block"
            aria-hidden
          />

          <HeroSection activeTab={activeTab} />

          <div
            className="motion-fade-up mx-auto mt-5 w-full max-w-[38rem] space-y-3 md:mt-8 md:max-w-[44rem] md:space-y-3.5 lg:mt-0 lg:max-w-[50rem] lg:space-y-3 lg:pt-3 xl:max-w-[52rem] 2xl:max-w-[58rem] min-[2200px]:max-w-[66rem]"
            style={{ animationDelay: "250ms", animationDuration: "520ms" }}
          >
            <p className="text-center text-sm font-semibold text-indigo-200/80 md:text-[0.95rem] lg:text-left min-[1440px]:text-[1.02rem] min-[2200px]:text-[1.14rem]">Jak to działa w praktyce</p>
            <HeroSteps activeTab={activeTab} variant="mobile" />
            <FeatureTabs activeTab={activeTab} onChange={onTabChange} />
            <DemoPreview activeTab={activeTab} />
          </div>
        </section>

        <PricingSection />

        <section className="mx-auto mt-10 w-full max-w-[52rem] px-4 md:mt-12 md:px-5 2xl:mt-14 2xl:max-w-[62rem] min-[2200px]:max-w-[72rem]">
          <h2 className="text-[0.78rem] font-medium tracking-[0.025em] text-white/42 md:text-[0.8rem]">Trening do E8 z angielskiego</h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-indigo-100/38">Na tej stronie możesz ćwiczyć angielski do egzaminu ósmoklasisty w krótkich quizach. Zestawy obejmują reakcje językowe, reading, słownictwo i gramatykę, a po zakończeniu od razu zobaczysz wynik i krótkie wyjaśnienia. To prosty sposób na regularne ćwiczenie typów zadań spotykanych na E8.</p>
        </section>
      </div>

      <MarketingFooter />
    </main>
  );
}

export default function E8Landing() {
  const [activeTab, setActiveTab] = useState<FeatureType>("sets");
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

  if (!isAuthResolved) {
    return <main className="viewport-shell bg-[#050510]" aria-hidden="true" />;
  }

  if (isAuthenticated && session?.access_token && !forcePlansView) {
    return <E8AuthenticatedDashboard accessToken={session.access_token} userDisplayName={userDisplayName} shouldRunOnboarding={shouldRunOnboarding} />;
  }

  return <PublicE8Landing activeTab={activeTab} onTabChange={setActiveTab} />;
}













