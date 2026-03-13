"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { AccessTier, E8SetDefinition } from "@/lib/quiz/set-catalog";
import { E8_SET_SLOTS } from "@/lib/quiz/set-catalog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SetAccessResponse = {
  tier?: AccessTier;
  visibleSets?: E8SetDefinition[];
  lockedSets?: E8SetDefinition[];
  error?: string;
};

const TIER_LABEL: Record<AccessTier, string> = {
  unregistered: "Niezalogowany",
  registered: "Konto bez planu",
  premium: "Premium (uczen)",
  premium_plus: "Premium+ (uczen+)",
};

function fallbackForTier(tier: AccessTier): { visibleSets: E8SetDefinition[]; lockedSets: E8SetDefinition[] } {
  const visibleCount = tier === "unregistered" ? 1 : 3;

  return {
    visibleSets: E8_SET_SLOTS.slice(0, visibleCount),
    lockedSets: E8_SET_SLOTS.slice(visibleCount),
  };
}

function lockedBadgeText(tier: AccessTier): string {
  if (tier === "unregistered") {
    return "Zaloguj sie";
  }

  if (tier === "registered") {
    return "Wymaga premium";
  }

  if (tier === "premium") {
    return "Wymaga premium+";
  }

  return "Wylaczone";
}

export function QuizSetAccessGrid() {
  const [tier, setTier] = useState<AccessTier>("unregistered");
  const [visibleSets, setVisibleSets] = useState<E8SetDefinition[]>(() => fallbackForTier("unregistered").visibleSets);
  const [lockedSets, setLockedSets] = useState<E8SetDefinition[]>(() => fallbackForTier("unregistered").lockedSets);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let mounted = true;

    const loadSetAccess = async (accessToken?: string | null) => {
      try {
        const response = await fetch("/api/e8/set-access", {
          cache: "no-store",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });

        const data = (await response.json().catch(() => ({}))) as SetAccessResponse;

        if (!mounted) {
          return;
        }

        if (!response.ok) {
          const fallbackTier: AccessTier = accessToken ? "registered" : "unregistered";
          const fallback = fallbackForTier(fallbackTier);
          setTier(fallbackTier);
          setVisibleSets(fallback.visibleSets);
          setLockedSets(fallback.lockedSets);
          setIsReady(true);
          return;
        }

        const nextTier = data.tier ?? "unregistered";
        const fallback = fallbackForTier(nextTier);

        setTier(nextTier);
        setVisibleSets(Array.isArray(data.visibleSets) && data.visibleSets.length > 0 ? data.visibleSets : fallback.visibleSets);
        setLockedSets(Array.isArray(data.lockedSets) ? data.lockedSets : fallback.lockedSets);
        setIsReady(true);
      } catch {
        if (!mounted) {
          return;
        }

        const fallback = fallbackForTier("unregistered");
        setTier("unregistered");
        setVisibleSets(fallback.visibleSets);
        setLockedSets(fallback.lockedSets);
        setIsReady(true);
      }
    };

    void (async () => {
      const { data } = await supabase.auth.getSession();
      await loadSetAccess(data.session?.access_token ?? null);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await loadSetAccess(session?.access_token ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const totalSets = visibleSets.length + lockedSets.length;
  const entitlementLabel = `${TIER_LABEL[tier]}: ${visibleSets.length}/${Math.max(totalSets, 1)} zestawow`;

  return (
    <section className="mt-4 w-full max-w-[340px] space-y-2.5 sm:max-w-[440px] lg:max-w-[460px]">
      <div className="flex items-center justify-between px-0.5">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-indigo-200/82 uppercase">Zestawy startowe</p>
        <p className="text-[11px] text-indigo-100/68">{isReady ? entitlementLabel : "Sprawdzam dostep..."}</p>
      </div>

      <div className="space-y-2.5">
        {visibleSets.map((setItem, index) => (
          <Link
            key={setItem.id}
            href={`/e8/quiz?mode=${encodeURIComponent(setItem.mode)}&set=${encodeURIComponent(setItem.id)}`}
            className="group block rounded-2xl border border-white/12 bg-[linear-gradient(145deg,rgba(16,20,40,0.95),rgba(10,14,30,0.92))] px-3.5 py-3 transition-[border-color,background-color,transform] duration-150 hover:border-indigo-200/35 hover:bg-[linear-gradient(145deg,rgba(26,32,58,0.95),rgba(14,20,40,0.92))] active:scale-[0.993]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.12em] text-indigo-200/72 uppercase">Zestaw {index + 1}</p>
                <p className="mt-1 text-sm font-semibold text-white">{setItem.title}</p>
              </div>
              <span className="rounded-lg border border-indigo-300/24 bg-indigo-500/15 px-2 py-1 text-[10px] font-semibold text-indigo-100">
                {setItem.questionCount} pytan
              </span>
            </div>
            <p className="mt-1.5 text-xs text-indigo-100/72">{setItem.subtitle}</p>
          </Link>
        ))}

        {lockedSets.map((setItem, index) => (
          <div
            key={setItem.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3 opacity-68"
            aria-hidden
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.12em] text-indigo-200/56 uppercase">Zestaw {visibleSets.length + index + 1}</p>
                <p className="mt-1 text-sm font-semibold text-white/72">{setItem.title}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-gray-200/90">
                <Lock className="h-3.5 w-3.5" />
                {lockedBadgeText(tier)}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-indigo-100/56">{setItem.subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


