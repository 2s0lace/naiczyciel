"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AvatarPicker from "@/components/avatar/avatar-picker";
import { setRoleCookie } from "@/lib/auth/role";
import {
  isSafeDisplayNameCandidate,
  resolveDisplayNameFromMetadata,
  sanitizeDisplayNameInput,
} from "@/lib/auth/display-name";
import { resolveRoleForSession } from "@/lib/auth/client-role";
import { DEFAULT_AVATAR_KEY, normalizeAvatarKey, type AvatarKey } from "@/lib/avatar/presets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function resolveNextPath(raw: string | null): string {
  if (!raw || raw.trim().length === 0) {
    return "/";
  }

  return raw.startsWith("/") ? raw : "/";
}

export default function AvatarSelectionPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [selectedAvatarKey, setSelectedAvatarKey] = useState<AvatarKey | null>(null);
  const [forceSelection, setForceSelection] = useState(false);
  const [nextPath, setNextPath] = useState("/");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const query = new URLSearchParams(window.location.search);
        const shouldForceSelection = query.get("force") === "1";
        const resolvedNextPath = resolveNextPath(query.get("next"));

        if (isMounted) {
          setForceSelection(shouldForceSelection);
          setNextPath(resolvedNextPath);
        }

        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const nextUser = data.session?.user ?? null;

        if (!isMounted) {
          return;
        }

        if (!nextUser) {
          router.replace("/login");
          return;
        }

        setUser(nextUser);
        setDisplayNameInput(resolveDisplayNameFromMetadata(nextUser.user_metadata, ""));

        const existingAvatar = normalizeAvatarKey(nextUser.user_metadata?.avatar_key);
        setSelectedAvatarKey(shouldForceSelection ? null : existingAvatar);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const normalizedDisplayName = sanitizeDisplayNameInput(displayNameInput);
  const canContinue = !isSaving && Boolean(selectedAvatarKey) && isSafeDisplayNameCandidate(normalizedDisplayName);

  const handleSave = async () => {
    if (!user) {
      return;
    }

    const avatarKey = selectedAvatarKey ?? DEFAULT_AVATAR_KEY;
    const nextDisplayName = sanitizeDisplayNameInput(displayNameInput);

    if (!isSafeDisplayNameCandidate(nextDisplayName)) {
      setDisplayNameError("Podaj imie (2-24 znaki, bez cyfr i symboli).");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setDisplayNameError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          ...(user.user_metadata ?? {}),
          avatar_key: avatarKey,
          display_name: nextDisplayName,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData.session) {
        const role = await resolveRoleForSession({
          supabase,
          session: sessionData.session,
        });
        setRoleCookie(role);
      }

      router.replace(nextPath);
      router.refresh();
    } catch (unexpectedError) {
      const message = unexpectedError instanceof Error ? unexpectedError.message : "Nie udało się zapisać avatara.";
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <main className="min-h-screen bg-[#050510]" aria-hidden="true" />;
  }

  if (!user) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050510] px-5 py-6 text-white md:px-6 md:py-8 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[28rem] bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.2)_0%,rgba(79,70,229,0.08)_34%,rgba(79,70,229,0)_72%)] lg:opacity-0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent via-[#050510]/66 to-[#050510]"
      />

      <div className="relative mx-auto flex min-h-[calc(100dvh-6.5rem)] w-full max-w-5xl items-start justify-center pt-8 sm:pt-10 md:pt-12">
        <section className="w-full max-w-[43rem] rounded-[1.8rem] border border-indigo-200/20 bg-[linear-gradient(160deg,rgba(13,19,39,0.96),rgba(8,13,28,0.95))] p-7 shadow-[0_30px_70px_-46px_rgba(79,70,229,0.65)] lg:shadow-[0_20px_40px_-34px_rgba(19,28,58,0.42)] sm:p-9">
          <div className="mx-auto max-w-[34rem] text-center">
            <h1 className="text-3xl leading-tight text-white sm:text-[2.15rem]" style={{ fontFamily: "var(--font-figtree)", fontWeight: 900 }}>
              Wybierz avatar
            </h1>
          </div>

          <div className="mx-auto mt-6 w-full max-w-[31rem] space-y-1.5">
            <label htmlFor="displayName" className="text-xs font-semibold tracking-[0.08em] text-indigo-100/76 uppercase">
              Imie
            </label>
            <input
              id="displayName"
              type="text"
              value={displayNameInput}
              onChange={(event) => {
                setDisplayNameInput(event.target.value);
                setDisplayNameError(null);
              }}
              maxLength={24}
              autoComplete="given-name"
              placeholder="Wpisz imie"
              className="w-full rounded-xl border border-white/14 bg-[#0b132c] px-3.5 py-2.5 text-sm text-white outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-indigo-100/45 focus:border-indigo-200/40 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.2)]"
            />
          </div>

          <div className="mt-7 rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(12,18,36,0.78),rgba(8,13,28,0.72))] px-4 py-5 sm:px-6">
            <AvatarPicker
              selectedKey={selectedAvatarKey}
              onSelect={setSelectedAvatarKey}
              disabled={isSaving}
              className="mx-auto w-full max-w-[31rem] gap-3.5 sm:gap-4"
              itemClassName="p-1.5 sm:p-2"
            />
          </div>

          {displayNameError ? <p className="mt-4 text-center text-sm text-red-300">{displayNameError}</p> : null}
          {errorMessage ? <p className="mt-4 text-center text-sm text-red-300">{errorMessage}</p> : null}

          <div className="mt-7 flex justify-center">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canContinue}
              className="rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_-18px_rgba(79,70,229,0.9)] transition-[transform,background-color,filter] duration-150 hover:bg-indigo-500 hover:brightness-105 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isSaving ? "Zapisywanie..." : "Kontynuuj"}
            </button>
          </div>

          {!forceSelection ? (
            <div className="mt-3 text-center">
              <Link
                href="/konto"
                className="inline-flex items-center rounded-lg border border-white/14 px-3.5 py-1.5 text-xs font-semibold text-gray-200 transition-[border-color,background-color] duration-150 hover:border-white/24 hover:bg-white/6"
              >
                Ustawienia konta
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}


