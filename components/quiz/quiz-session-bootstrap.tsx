"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QUIZ_ACTIVE_SESSION_STORAGE_KEY, type ActiveQuizSessionMap } from "@/lib/quiz/storage-keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type QuizSessionBootstrapProps = {
  mode: string;
  setId?: string;
  count?: string;
  modes?: string;
  focus?: string;
  focusSource?: string;
  focusRaw?: string;
};

type StartSessionResponse = {
  sessionId?: string;
  mode?: string;
  setId?: string;
  modes?: string[];
  questionCount?: number;
  focusLabel?: string;
  focusSource?: string;
  focusRaw?: string;
  error?: string;
  details?: string;
};

type SessionLookupResponse = {
  sessionId?: string;
  status?: string;
};

function readActiveSessions(): ActiveQuizSessionMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(QUIZ_ACTIVE_SESSION_STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as ActiveQuizSessionMap;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeActiveSessions(value: ActiveQuizSessionMap) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(QUIZ_ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

function normalizeSetId(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseCount(value: string | undefined): number | undefined {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.max(5, Math.min(10, Math.round(parsed)));
}

function normalizeModes(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index);
}

function normalizeFocus(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeFocusSource(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "grammar" || normalized === "vocabulary" || normalized === "skill" ? normalized : undefined;
}

function buildSessionContextKey(
  mode: string,
  setId: string | undefined,
  count: number | undefined,
  modes: string[],
  focus: string | undefined,
  focusSource: string | undefined,
) {
  const modeKey = modes.length > 0 ? modes.join(",") : mode;
  const countKey = count ?? 10;
  const focusKey = focus ? `:focus:${focus.toLowerCase()}` : "";
  const focusSourceKey = focusSource ? `:focus-source:${focusSource}` : "";
  return setId ? `set:${setId}:count:${countKey}${focusSourceKey}${focusKey}` : `mode:${modeKey}:count:${countKey}${focusSourceKey}${focusKey}`;
}

function buildSessionHref(
  sessionId: string,
  mode: string,
  setId: string | undefined,
  count: number | undefined,
  modes: string[],
  focus: string | undefined,
  focusSource: string | undefined,
  focusRaw: string | undefined,
) {
  const query = new URLSearchParams({ mode });

  if (setId) {
    query.set("set", setId);
  }

  if (typeof count === "number") {
    query.set("count", String(count));
  }

  if (!setId && modes.length > 1) {
    query.set("modes", modes.join(","));
  }

  if (focus) {
    query.set("focus", focus);
  }

  if (focusSource) {
    query.set("focusSource", focusSource);
  }

  if (focusRaw) {
    query.set("focusRaw", focusRaw);
  }

  return `/e8/quiz/${encodeURIComponent(sessionId)}?${query.toString()}`;
}

export function QuizSessionBootstrap({ mode, setId, count, modes, focus, focusSource, focusRaw }: QuizSessionBootstrapProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const startedRef = useRef(false);
  const normalizedSetId = useMemo(() => normalizeSetId(setId), [setId]);
  const requestedCount = useMemo(() => parseCount(count), [count]);
  const effectiveCount = requestedCount ?? 10;
  const normalizedModes = useMemo(() => normalizeModes(modes), [modes]);
  const normalizedFocus = useMemo(() => normalizeFocus(focus), [focus]);
  const normalizedFocusSource = useMemo(() => normalizeFocusSource(focusSource), [focusSource]);
  const normalizedFocusRaw = useMemo(() => normalizeFocus(focusRaw), [focusRaw]);
  const sessionContextKey = useMemo(
    () => buildSessionContextKey(mode, normalizedSetId, requestedCount, normalizedModes, normalizedFocusRaw ?? normalizedFocus, normalizedFocusSource),
    [mode, normalizedFocus, normalizedFocusRaw, normalizedFocusSource, normalizedModes, normalizedSetId, requestedCount],
  );

  const getAuthHeaders = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      return token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : {};
    } catch {
      return {};
    }
  }, []);

  const tryResumeSession = useCallback(async () => {
    const activeSessions = readActiveSessions();
    const activeSessionId = activeSessions[sessionContextKey]?.sessionId;

    if (!activeSessionId) {
      return false;
    }

    if (activeSessionId.startsWith("local_")) {
      delete activeSessions[sessionContextKey];
      writeActiveSessions(activeSessions);
      return false;
    }

    try {
      const authHeaders = await getAuthHeaders();
      const params = new URLSearchParams({ mode });

      if (typeof requestedCount === "number") {
        params.set("count", String(requestedCount));
      }

      if (normalizedSetId) {
        params.set("set", normalizedSetId);
      } else if (normalizedModes.length > 1) {
        params.set("modes", normalizedModes.join(","));
      }

      if (normalizedFocus) {
        params.set("focus", normalizedFocus);
      }

      if (normalizedFocusSource) {
        params.set("focusSource", normalizedFocusSource);
      }

      if (normalizedFocusRaw) {
        params.set("focusRaw", normalizedFocusRaw);
      }

      const response = await fetch(
        `/api/e8/quiz/session/${encodeURIComponent(activeSessionId)}?${params.toString()}`,
        {
          cache: "no-store",
          headers: {
            ...authHeaders,
          },
        },
      );

      if (!response.ok) {
        delete activeSessions[sessionContextKey];
        writeActiveSessions(activeSessions);
        return false;
      }

      const payload = (await response.json().catch(() => ({}))) as SessionLookupResponse;

      if (payload.status === "completed") {
        delete activeSessions[sessionContextKey];
        writeActiveSessions(activeSessions);
        return false;
      }

      router.replace(buildSessionHref(activeSessionId, mode, normalizedSetId, requestedCount, normalizedModes, normalizedFocus, normalizedFocusSource, normalizedFocusRaw));
      return true;
    } catch {
      return false;
    }
  }, [
    getAuthHeaders,
    mode,
    normalizedFocus,
    normalizedFocusRaw,
    normalizedFocusSource,
    normalizedModes,
    normalizedSetId,
    requestedCount,
    router,
    sessionContextKey,
  ]);

  const startSession = useCallback(async () => {
    setIsStarting(true);
    setError(null);

    try {
      const resumed = await tryResumeSession();

      if (resumed) {
        return;
      }

      const authHeaders = await getAuthHeaders();

      const response = await fetch("/api/e8/quiz/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(
          normalizedSetId
            ? {
                mode,
                setId: normalizedSetId,
              }
            : {
                mode,
                questionCount: effectiveCount,
                modes: normalizedModes,
                focusLabel: normalizedFocus,
                focusSource: normalizedFocusSource,
                focusRaw: normalizedFocusRaw,
              },
        ),
      });

      const data = (await response.json().catch(() => ({}))) as StartSessionResponse;

      if (!response.ok || !data.sessionId) {
        throw new Error(data.error ?? data.details ?? "Nie udało się rozpocząć sesji.");
      }

      const nextMode = typeof data.mode === "string" && data.mode.length > 0 ? data.mode : mode;
      const nextSetId = normalizeSetId(data.setId);
      const nextModes =
        Array.isArray(data.modes) && data.modes.length > 0
          ? data.modes.map((entry) => entry.trim().toLowerCase()).filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index)
          : normalizedModes;
      const nextCount =
        typeof data.questionCount === "number" && Number.isFinite(data.questionCount) ? Math.max(5, Math.min(10, Math.round(data.questionCount))) : effectiveCount;
      const nextFocus = normalizeFocus(data.focusLabel) ?? normalizedFocus;
      const nextFocusSource = normalizeFocusSource(data.focusSource) ?? normalizedFocusSource;
      const nextFocusRaw = normalizeFocus(data.focusRaw) ?? normalizedFocusRaw;
      router.replace(buildSessionHref(data.sessionId, nextMode, nextSetId, nextCount, nextModes, nextFocus, nextFocusSource, nextFocusRaw));
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Wystąpił nieznany błąd.");
      setIsStarting(false);
    }
  }, [effectiveCount, getAuthHeaders, mode, normalizedFocus, normalizedFocusRaw, normalizedFocusSource, normalizedModes, normalizedSetId, router, tryResumeSession]);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    void startSession();
  }, [startSession]);

  return (
    <main className="min-h-screen bg-[#050510] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
        {error ? (
          <div className="w-full rounded-2xl border border-red-300/24 bg-red-500/10 p-4">
            <p className="text-sm text-red-100/95">{error}</p>
            <button
              type="button"
              onClick={() => {
                void startSession();
              }}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 py-2.5 text-sm font-semibold text-white"
            >
              Spróbuj ponownie
            </button>
            <Link href="/e8" className="mt-2 inline-block text-xs text-indigo-100/80 hover:text-white">
              Wróć do E8
            </Link>
          </div>
        ) : (
          <div className="w-full max-w-xs" aria-live="polite" aria-busy={isStarting}>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" />
            </div>
            <span className="sr-only">Uruchamianie sesji quizu</span>
          </div>
        )}
      </div>
    </main>
  );
}

