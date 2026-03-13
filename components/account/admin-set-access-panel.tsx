"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ACCESS_TIERS,
  E8_SET_SLOTS,
  type AccessTier,
  type E8SetDefinition,
  type SetAccessConfig,
} from "@/lib/quiz/set-catalog";
import { ADMIN_SET_CATALOG_CHANGED_EVENT } from "@/lib/quiz/admin-events";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AdminSetAccessApiResponse = {
  sets?: E8SetDefinition[];
  config?: SetAccessConfig;
  set?: E8SetDefinition;
  removed?: boolean;
  removedSetId?: string;
  error?: string;
  details?: string;
};

const TIER_LABEL: Record<AccessTier, string> = {
  unregistered: "Unregistered",
  registered: "Registered (bez planu)",
  premium: "Premium (uczen)",
  premium_plus: "Premium+ (uczen+)",
};

const BUILTIN_SET_IDS = new Set(E8_SET_SLOTS.map((setItem) => setItem.id));

function createEmptyConfig(): SetAccessConfig {
  return {
    tiers: {
      unregistered: [],
      registered: [],
      premium: [],
      premium_plus: [],
    },
    updated_at: new Date().toISOString(),
  };
}

function ensureConfigShape(config: SetAccessConfig | null | undefined): SetAccessConfig {
  if (!config) {
    return createEmptyConfig();
  }

  return {
    tiers: {
      unregistered: Array.isArray(config.tiers.unregistered) ? config.tiers.unregistered : [],
      registered: Array.isArray(config.tiers.registered) ? config.tiers.registered : [],
      premium: Array.isArray(config.tiers.premium) ? config.tiers.premium : [],
      premium_plus: Array.isArray(config.tiers.premium_plus) ? config.tiers.premium_plus : [],
    },
    updated_at: typeof config.updated_at === "string" ? config.updated_at : new Date().toISOString(),
  };
}

export function AdminSetAccessPanel() {
  const [sets, setSets] = useState<E8SetDefinition[]>([]);
  const [config, setConfig] = useState<SetAccessConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMutatingSetCatalog, setIsMutatingSetCatalog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getAuthHeaders = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      return {} as Record<string, string>;
    }

    return { Authorization: `Bearer ${token}` };
  }, []);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/e8/admin/set-access", {
        cache: "no-store",
        headers: authHeaders,
      });

      const data = (await response.json().catch(() => ({}))) as AdminSetAccessApiResponse;

      if (!response.ok) {
        throw new Error(`${data.error ?? "Nie udalo sie pobrac konfiguracji setow."}${data.details ? ` ${data.details}` : ""}`);
      }

      setSets(Array.isArray(data.sets) ? data.sets : []);
      setConfig(ensureConfigShape(data.config));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Wystapil blad.");
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    const onSetCatalogChanged = () => {
      void loadConfig();
    };

    window.addEventListener(ADMIN_SET_CATALOG_CHANGED_EVENT, onSetCatalogChanged);

    return () => {
      window.removeEventListener(ADMIN_SET_CATALOG_CHANGED_EVENT, onSetCatalogChanged);
    };
  }, [loadConfig]);

  const createdSets = useMemo(
    () => sets.filter((setItem) => !BUILTIN_SET_IDS.has(setItem.id)),
    [sets],
  );

  const isSetEnabledForTier = useCallback(
    (setId: string, tier: AccessTier) => {
      if (!config) {
        return false;
      }

      return (config.tiers[tier] ?? []).includes(setId);
    },
    [config],
  );

  const toggleSetTier = (setId: string, tier: AccessTier) => {
    setConfig((prev) => {
      const current = ensureConfigShape(prev);
      const currentIds = current.tiers[tier] ?? [];
      const isEnabled = currentIds.includes(setId);
      const nextIds = isEnabled
        ? currentIds.filter((entry) => entry !== setId)
        : [...currentIds, setId];

      return {
        ...current,
        tiers: {
          ...current.tiers,
          [tier]: nextIds,
        },
        updated_at: new Date().toISOString(),
      };
    });
  };

  const saveConfig = async () => {
    if (!config) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/e8/admin/set-access", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ config }),
      });

      const data = (await response.json().catch(() => ({}))) as AdminSetAccessApiResponse;

      if (!response.ok) {
        throw new Error(`${data.error ?? "Nie udalo sie zapisac konfiguracji."}${data.details ? ` ${data.details}` : ""}`);
      }

      setSets(Array.isArray(data.sets) ? data.sets : sets);
      setConfig(ensureConfigShape(data.config ?? config));
      setSuccess("Konfiguracja setow zapisana.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Wystapil blad zapisu.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSet = async (setId: string) => {
    setError(null);
    setSuccess(null);

    const confirmed = window.confirm(`Usunac zestaw ${setId}? Tej operacji nie da sie cofnac.`);

    if (!confirmed) {
      return;
    }

    setIsMutatingSetCatalog(true);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/e8/admin/set-access", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ id: setId }),
      });

      const data = (await response.json().catch(() => ({}))) as AdminSetAccessApiResponse;

      if (!response.ok) {
        throw new Error(`${data.error ?? "Nie udalo sie usunac zestawu."}${data.details ? ` ${data.details}` : ""}`);
      }

      const nextSets = Array.isArray(data.sets) ? data.sets : [];
      const nextConfig = ensureConfigShape(data.config ?? config);

      setSets(nextSets);
      setConfig(nextConfig);
      setSuccess(`Usunieto zestaw: ${setId}.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Wystapil blad usuwania zestawu.");
    } finally {
      setIsMutatingSetCatalog(false);
    }
  };

  const tierCounts = useMemo(() => {
    const current = ensureConfigShape(config);
    const countByTier = {
      unregistered: 0,
      registered: 0,
      premium: 0,
      premium_plus: 0,
    } satisfies Record<AccessTier, number>;

    for (const tier of ACCESS_TIERS) {
      const ids = new Set(current.tiers[tier] ?? []);
      countByTier[tier] = createdSets.reduce((sum, setItem) => sum + (ids.has(setItem.id) ? 1 : 0), 0);
    }

    return countByTier;
  }, [config, createdSets]);

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_44px_-34px_rgba(0,0,0,0.95)] sm:p-6">
        <h2 className="text-lg font-bold text-white">Dostep do zestawow</h2>
        <p className="mt-2 text-sm text-gray-300">Ladowanie konfiguracji...</p>
      </section>
    );
  }

  if (!config) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_44px_-34px_rgba(0,0,0,0.95)] sm:p-6">
        <h2 className="text-lg font-bold text-white">Dostep do zestawow</h2>
        <p className="mt-2 text-sm text-rose-200">Nie udalo sie zaladowac konfiguracji.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_44px_-34px_rgba(0,0,0,0.95)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Dostep do zestawow</h2>
          <p className="text-sm text-gray-300">Twoje utworzone sety i przypisanie kazdego setu do wielu tierow.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void loadConfig();
            }}
            disabled={isMutatingSetCatalog || isSaving}
            className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            Odswiez
          </button>
          <button
            type="button"
            onClick={() => {
              void saveConfig();
            }}
            disabled={isSaving || isMutatingSetCatalog}
            className="rounded-lg border border-indigo-300/30 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-100 disabled:opacity-60"
          >
            {isSaving ? "Zapisywanie..." : "Zapisz konfiguracje"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {ACCESS_TIERS.map((tier) => (
          <span key={tier} className="rounded-lg border border-white/12 bg-white/[0.03] px-2.5 py-1 text-[11px] text-indigo-100/90">
            {TIER_LABEL[tier]}: {tierCounts[tier]}
          </span>
        ))}
      </div>

      {createdSets.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#090d1f] p-4">
          <p className="text-sm text-gray-300">Brak utworzonych setow. Stworz set w panelu pytan (zaznaczenie pytan -&gt; Utworz set).</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {createdSets.map((setItem) => (
            <article key={setItem.id} className="rounded-xl border border-white/10 bg-[#090d1f] px-3.5 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{setItem.title}</p>
                  <p className="mt-1 text-[11px] text-gray-300">id: {setItem.id}</p>
                  <p className="text-[11px] text-gray-300">mode: {setItem.mode} - {setItem.questionCount} pytan</p>
                  {setItem.subtitle ? <p className="mt-1 text-[11px] text-gray-400">{setItem.subtitle}</p> : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/e8/quiz?mode=${encodeURIComponent(setItem.mode)}&set=${encodeURIComponent(setItem.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-emerald-300/35 bg-emerald-500/12 px-2 py-1 text-[10px] font-semibold text-emerald-100"
                  >
                    Testuj
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      void deleteSet(setItem.id);
                    }}
                    disabled={isMutatingSetCatalog}
                    className="rounded-md border border-rose-300/35 bg-rose-500/12 px-2 py-1 text-[10px] font-semibold text-rose-100 disabled:opacity-60"
                    title="Usun zestaw"
                  >
                    Usun
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                {ACCESS_TIERS.map((tier) => (
                  <label key={`${setItem.id}-${tier}`} className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-indigo-100/90">
                    <input
                      type="checkbox"
                      checked={isSetEnabledForTier(setItem.id, tier)}
                      onChange={() => toggleSetTier(setItem.id, tier)}
                      disabled={isSaving || isMutatingSetCatalog}
                      className="h-3.5 w-3.5 accent-indigo-500"
                    />
                    <span>{TIER_LABEL[tier]}</span>
                  </label>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {error ? <p className="mt-4 text-sm text-rose-200">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-200">{success}</p> : null}
    </section>
  );
}