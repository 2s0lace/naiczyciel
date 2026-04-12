import { NextResponse } from "next/server";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import {
  getLockedSetsForTier,
  getSetSlots,
  getSetAccessConfig,
  getSetsForTier,
} from "@/lib/quiz/set-catalog";
import { loadSetCatalogState } from "@/lib/quiz/set-catalog-store";

export async function GET(request: Request) {
  const access = await resolveAccessTierFromRequest(request);
  const loaded = await loadSetCatalogState({ allowBootstrap: false });
  const config = getSetAccessConfig();

  return NextResponse.json({
    tier: access.tier,
    role: access.role,
    allSets: getSetSlots(),
    visibleSets: getSetsForTier(access.tier, config),
    lockedSets: getLockedSetsForTier(access.tier, config),
    configUpdatedAt: config.updated_at,
    storage: loaded.loaded ? "supabase" : "memory",
  });
}
