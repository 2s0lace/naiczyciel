"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AvatarPicker from "@/components/avatar/avatar-picker";
import { clearRoleCookie, isAdminEmail, setRoleCookie } from "@/lib/auth/role";
import { resolveRoleForSession } from "@/lib/auth/client-role";
import { DEFAULT_AVATAR_KEY, normalizeAvatarKey, resolveAvatarSrc, type AvatarKey } from "@/lib/avatar/presets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

async function ensureAvatarMetadata(supabase: SupabaseClient, user: User): Promise<{ user: User; avatarKey: AvatarKey }> {
  const currentAvatarKey = normalizeAvatarKey(user.user_metadata?.avatar_key);

  if (currentAvatarKey) {
    return { user, avatarKey: currentAvatarKey };
  }

  const { data, error } = await supabase.auth.updateUser({
    data: {
      ...(user.user_metadata ?? {}),
      avatar_key: DEFAULT_AVATAR_KEY,
    },
  });

  if (error || !data.user) {
    return {
      user: {
        ...user,
        user_metadata: {
          ...(user.user_metadata ?? {}),
          avatar_key: DEFAULT_AVATAR_KEY,
        },
      } as User,
      avatarKey: DEFAULT_AVATAR_KEY,
    };
  }

  return {
    user: data.user,
    avatarKey: DEFAULT_AVATAR_KEY,
  };
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState("user");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedAvatarKey, setSelectedAvatarKey] = useState<AvatarKey | null>(null);
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [isTutorialResetting, setIsTutorialResetting] = useState(false);
  const [tutorialError, setTutorialError] = useState<string | null>(null);
  const [tutorialMessage, setTutorialMessage] = useState<string | null>(null);
  const [localNote, setLocalNote] = useState("");
  const [isLocalNoteReady, setIsLocalNoteReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      const nextUser = data.session?.user ?? null;

      if (nextUser && data.session) {
        const nextRole = await resolveRoleForSession({
          supabase,
          session: data.session,
        });

        if (!isMounted) {
          return;
        }

        setRole(nextRole);
        setRoleCookie(nextRole);

        const ensured = await ensureAvatarMetadata(supabase, nextUser);

        if (!isMounted) {
          return;
        }

        setUser(ensured.user);
        setSelectedAvatarKey(ensured.avatarKey);
      } else {
        setUser(null);
        setRole("user");
        setSelectedAvatarKey(null);
        clearRoleCookie();
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;

      if (nextUser && session) {
        void (async () => {
          const nextRole = await resolveRoleForSession({
            supabase,
            session,
          });

          if (!isMounted) {
            return;
          }

          setRole(nextRole);
          setRoleCookie(nextRole);

          const ensured = await ensureAvatarMetadata(supabase, nextUser);

          if (!isMounted) {
            return;
          }

          setUser(ensured.user);
          setSelectedAvatarKey(ensured.avatarKey);
          setIsLoading(false);
        })();
      } else {
        setUser(null);
        setRole("user");
        setSelectedAvatarKey(null);
        setIsLoading(false);
        clearRoleCookie();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      clearRoleCookie();
      setUser(null);
      setRole("user");
      setSelectedAvatarKey(null);
      router.push("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAvatarChange = async (nextAvatarKey: AvatarKey) => {
    if (!user || isAvatarSaving || selectedAvatarKey === nextAvatarKey) {
      return;
    }

    const previousAvatarKey = selectedAvatarKey;

    setAvatarError(null);
    setAvatarMessage(null);
    setIsAvatarSaving(true);
    setSelectedAvatarKey(nextAvatarKey);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...(user.user_metadata ?? {}),
          avatar_key: nextAvatarKey,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      setUser(
        data.user ??
          ({
            ...user,
            user_metadata: {
              ...(user.user_metadata ?? {}),
              avatar_key: nextAvatarKey,
            },
          } as User),
      );
      setSelectedAvatarKey(nextAvatarKey);
      setAvatarMessage("Avatar zapisany.");
      router.refresh();
    } catch (unexpectedError) {
      const message = unexpectedError instanceof Error ? unexpectedError.message : "Nie uda\u0142o si\u0119 zapisa\u0107 avatara.";
      setAvatarError(message);
      setSelectedAvatarKey(previousAvatarKey ?? DEFAULT_AVATAR_KEY);
    } finally {
      setIsAvatarSaving(false);
    }
  };

  const handleRestartDashboardTutorial = async () => {
    if (!user || isTutorialResetting) {
      return;
    }

    setTutorialError(null);
    setTutorialMessage(null);
    setIsTutorialResetting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...(user.user_metadata ?? {}),
          dashboard_onboarding_completed: false,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      setUser(
        data.user ??
          ({
            ...user,
            user_metadata: {
              ...(user.user_metadata ?? {}),
              dashboard_onboarding_completed: false,
            },
          } as User),
      );
      setTutorialMessage("Tutorial zostanie pokazany przy wej\u015bciu do panelu ucznia.");
      router.push("/e8");
      router.refresh();
    } catch (unexpectedError) {
      const message = unexpectedError instanceof Error ? unexpectedError.message : "Nie uda\u0142o si\u0119 uruchomi\u0107 tutorialu.";
      setTutorialError(message);
    } finally {
      setIsTutorialResetting(false);
    }
  };

  const forcedAdminByEmail = isAdminEmail(user?.email);

  const localNoteStorageKey = useMemo(() => {
    if (!user?.id) {
      return null;
    }

    return `naiczyciel.local-note.${user.id}`;
  }, [user?.id]);

  const effectiveRole = useMemo(() => {
    if (forcedAdminByEmail) {
      return "admin";
    }

    return role;
  }, [forcedAdminByEmail, role]);

  const isAdmin = effectiveRole === "admin";

  useEffect(() => {
    if (!localNoteStorageKey) {
      setLocalNote("");
      setIsLocalNoteReady(false);
      return;
    }

    try {
      const savedNote = window.localStorage.getItem(localNoteStorageKey);
      setLocalNote(savedNote ?? "");
    } catch {
      setLocalNote("");
    } finally {
      setIsLocalNoteReady(true);
    }
  }, [localNoteStorageKey]);

  const handleLocalNoteChange = (nextValue: string) => {
    setLocalNote(nextValue);

    if (!localNoteStorageKey) {
      return;
    }

    try {
      window.localStorage.setItem(localNoteStorageKey, nextValue);
    } catch {
      // silent fail for restricted browser storage
    }
  };

  return (
    <main className="min-h-screen bg-[#050510] px-5 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_44px_-34px_rgba(0,0,0,0.95)] sm:p-7">
          {isLoading ? (
            <div className="space-y-3 text-center">
              <h1 className="text-2xl font-bold text-white">Twoje konto</h1>
              <p className="text-sm text-gray-300">{"Sprawdzam sesj\u0119..."}</p>
            </div>
          ) : !user ? (
            <div className="space-y-5 text-center">
              <h1 className="text-2xl font-bold text-white">Twoje konto</h1>
              <p className="text-sm text-gray-300">{"Zaloguj si\u0119, aby zobaczy\u0107 ustawienia profilu."}</p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/login"
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-indigo-500 active:scale-[0.985]"
                >
                  {"Zaloguj si\u0119"}
                </Link>
</div>
            </div>
          ) : (
            <div className="space-y-4">
              <header className="rounded-2xl border border-white/12 bg-[linear-gradient(150deg,rgba(16,22,44,0.94),rgba(10,14,30,0.92))] p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <Image
                    src={resolveAvatarSrc(selectedAvatarKey)}
                    alt="Wybrany avatar"
                    width={96}
                    height={96}
                    className="h-20 w-20 rounded-full border border-indigo-200/35 bg-[#0b1430] p-1 shadow-[0_10px_26px_-18px_rgba(79,70,229,0.9)] sm:h-24 sm:w-24"
                    unoptimized
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold text-white">Hej!</p>
                    <p className="mt-1 text-sm text-indigo-100/82">Tutaj zmienisz avatar i ustawienia profilu.</p>
                    <p className="mt-1 text-xs text-indigo-200/70">{"Wi\u0119cej funkcji wkr\u00F3tce."}</p>
                  </div>
                </div>

                <div className="mt-4 border-t border-white/12">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 py-2.5">
                    <span className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">Email</span>
                    <span className="truncate text-sm text-white">{user.email ?? "-"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">Rola</span>
                    <span className="text-sm capitalize text-white">{effectiveRole}</span>
                  </div>
                </div>
              </header>

              <section className="space-y-3 rounded-2xl border border-indigo-200/22 bg-[linear-gradient(150deg,rgba(12,18,38,0.94),rgba(9,14,31,0.92))] p-4 shadow-[0_16px_34px_-24px_rgba(79,70,229,0.7)]">
                <div>
                  <h2 className="text-sm font-semibold text-white">{"Tw\u00F3j avatar"}</h2>
                  <p className="mt-1 text-xs text-indigo-100/78">{"Wybierz styl, kt\u00F3ry b\u0119dzie widoczny w Twoim koncie."}</p>
                </div>

                <AvatarPicker
                  selectedKey={selectedAvatarKey}
                  onSelect={handleAvatarChange}
                  disabled={isAvatarSaving}
                  className="gap-2.5"
                  itemClassName="p-2"
                />

                {avatarError ? <p className="text-xs text-red-300">{avatarError}</p> : null}
                {avatarMessage ? <p className="text-xs text-emerald-300">{avatarMessage}</p> : null}
              </section>

              <section className="space-y-3 rounded-2xl border border-white/8 bg-[#090d1f]/80 p-4">
                <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Przewodnik po panelu</h2>
                    <p className="mt-1 text-xs text-gray-300">{"Mo\u017Cesz uruchomi\u0107 tutorial ponownie."}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRestartDashboardTutorial}
                    disabled={isTutorialResetting}
                    className="w-full rounded-xl border border-white/16 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-indigo-100 transition-[border-color,background-color,transform] duration-150 hover:border-white/28 hover:bg-white/[0.07] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isTutorialResetting ? "Uruchamianie..." : "Uruchom ponownie"}
                  </button>

                  {tutorialError ? <p className="text-xs text-red-300">{tutorialError}</p> : null}
                  {tutorialMessage ? <p className="text-xs text-emerald-300">{tutorialMessage}</p> : null}
                </div>

                <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Szybka notatka</h2>
                    <p className="mt-1 text-xs text-gray-300">{"Notatka jest zapisywana tylko w tej przegl\u0105darce."}</p>
                  </div>

                  <textarea
                    value={localNote}
                    onChange={(event) => handleLocalNoteChange(event.target.value)}
                    placeholder={isLocalNoteReady ? "Wpisz notatk\u0119..." : "\u0141adowanie notatki..."}
                    rows={4}
                    className="w-full resize-y rounded-xl border border-white/12 bg-[#0c1228] px-3 py-2 text-sm text-white outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-gray-400/80 focus:border-indigo-200/35 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.18)]"
                  />
                </div>
              </section>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full rounded-xl border border-white/14 bg-white/[0.02] py-2.5 text-sm font-medium text-gray-200 transition-[border-color,background-color,transform,color] duration-150 hover:border-white/24 hover:bg-white/[0.06] hover:text-white active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
              </button>
            </div>
          )}
        </div>

        {!isLoading && user && isAdmin ? (
          <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-indigo-200/72 uppercase">{"Narz\u0119dzia admina"}</p>
            <p className="mt-1 text-xs text-gray-300">{"To oddzielna sekcja do zarz\u0105dzania pytaniami."}</p>
            <Link
              href="/konto/pytania"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-white/16 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-indigo-100 transition-[border-color,background-color,transform] duration-150 hover:border-white/28 hover:bg-white/[0.07] active:scale-[0.99]"
            >
              {"Otw\u00F3rz panel pyta\u0144"}
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}

