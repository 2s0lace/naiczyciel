"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ChevronDown, ChevronLeft, Mars, Venus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AvatarPicker from "@/components/avatar/avatar-picker";
import { Spinner } from "@/components/ui/spinner";
import { AuthAnimatedBg } from "@/components/auth/auth-animated-bg";
import { ParallaxGridLayer } from "@/components/landing/parallax-grid-layer";
import { clearRoleCookie, isAdminEmail, sanitizeUserMetadata, setRoleCookie } from "@/lib/auth/role";
import {
  isSafeDisplayNameCandidate,
  resolveDisplayNameFromMetadata,
  sanitizeDisplayNameInput,
} from "@/lib/auth/display-name";
import { resolveRoleForSession } from "@/lib/auth/client-role";
import { DEFAULT_AVATAR_KEY, normalizeAvatarKey, resolveAvatarSrc, type AvatarKey } from "@/lib/avatar/presets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import logoWhite from "@/img/logonaiczyciel_white.png";

type ProfileGender = "female" | "male" | "unspecified";

function normalizeGenderMetadata(value: unknown): ProfileGender {
  if (value === "female" || value === "male" || value === "unspecified") {
    return value;
  }
  return "unspecified";
}

function formatPremiumUntil(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "Brak aktywnego planu";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Brak aktywnego planu";
  }
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

async function ensureAvatarMetadata(supabase: SupabaseClient, user: User): Promise<{ user: User; avatarKey: AvatarKey }> {
  const currentAvatarKey = normalizeAvatarKey(user.user_metadata?.avatar_key);
  if (currentAvatarKey) {
    return { user, avatarKey: currentAvatarKey };
  }
  const { data, error } = await supabase.auth.updateUser({
    data: sanitizeUserMetadata({ ...(user.user_metadata ?? {}), avatar_key: DEFAULT_AVATAR_KEY }),
  });
  if (error || !data.user) {
    return {
      user: {
        ...user,
        user_metadata: { ...(user.user_metadata ?? {}), avatar_key: DEFAULT_AVATAR_KEY },
      } as User,
      avatarKey: DEFAULT_AVATAR_KEY,
    };
  }
  return { user: data.user, avatarKey: DEFAULT_AVATAR_KEY };
}

// ─── Design tokens ─────────────────────────────────────────────────────────────

const inputBase =
  "w-full rounded-lg border border-[#1c2a3f] bg-[#080c17] px-3.5 py-2.5 text-sm text-[#dde4f0] " +
  "outline-none placeholder:text-[#384e6a] " +
  "transition-[border-color,background-color] duration-200 " +
  "focus:border-[#3730a3] focus:bg-[#090e1b] " +
  "disabled:opacity-50";

const sectionLabel = "block text-[10px] font-semibold tracking-[0.14em] text-[#4a6080] uppercase";

const divider = "border-t border-[#131e30]";

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState("user");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedAvatarKey, setSelectedAvatarKey] = useState<AvatarKey | null>(null);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<ProfileGender>("unspecified");
  const [isGenderSaving, setIsGenderSaving] = useState(false);
  const [genderError, setGenderError] = useState<string | null>(null);
  const [genderMessage, setGenderMessage] = useState<string | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [isDisplayNameSaving, setIsDisplayNameSaving] = useState(false);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [displayNameMessage, setDisplayNameMessage] = useState<string | null>(null);
  const [isTutorialResetting, setIsTutorialResetting] = useState(false);
  const [tutorialError, setTutorialError] = useState<string | null>(null);
  const [tutorialMessage, setTutorialMessage] = useState<string | null>(null);
  const [isProgressResetting, setIsProgressResetting] = useState(false);
  const [progressResetError, setProgressResetError] = useState<string | null>(null);
  const [progressResetMessage, setProgressResetMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarMessage) return;
    const id = window.setTimeout(() => setAvatarMessage(null), 2200);
    return () => window.clearTimeout(id);
  }, [avatarMessage]);

  useEffect(() => {
    if (!genderMessage) return;
    const id = window.setTimeout(() => setGenderMessage(null), 2200);
    return () => window.clearTimeout(id);
  }, [genderMessage]);

  useEffect(() => {
    if (!progressResetMessage) return;
    const id = window.setTimeout(() => setProgressResetMessage(null), 2600);
    return () => window.clearTimeout(id);
  }, [progressResetMessage]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      const nextUser = data.session?.user ?? null;

      if (nextUser && data.session) {
        const nextRole = await resolveRoleForSession({ supabase, session: data.session });
        if (!isMounted) return;
        setRole(nextRole);
        setRoleCookie(nextRole);

        const ensured = await ensureAvatarMetadata(supabase, nextUser);
        if (!isMounted) return;

        setUser(ensured.user);
        setSelectedAvatarKey(ensured.avatarKey);
        setIsAvatarPickerOpen(false);
        setSelectedGender(normalizeGenderMetadata(ensured.user.user_metadata?.gender));
        setDisplayNameInput(resolveDisplayNameFromMetadata(ensured.user.user_metadata, ""));
        setDisplayNameError(null);
        setDisplayNameMessage(null);
      } else {
        setUser(null);
        setRole("user");
        setSelectedAvatarKey(null);
        setIsAvatarPickerOpen(false);
        setSelectedGender("unspecified");
        setDisplayNameInput("");
        setDisplayNameError(null);
        setDisplayNameMessage(null);
        clearRoleCookie();
      }

      if (isMounted) setIsLoading(false);
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;

      if (nextUser && session) {
        void (async () => {
          const nextRole = await resolveRoleForSession({ supabase, session });
          if (!isMounted) return;
          setRole(nextRole);
          setRoleCookie(nextRole);

          const ensured = await ensureAvatarMetadata(supabase, nextUser);
          if (!isMounted) return;

          setUser(ensured.user);
          setSelectedAvatarKey(ensured.avatarKey);
          setIsAvatarPickerOpen(false);
          setSelectedGender(normalizeGenderMetadata(ensured.user.user_metadata?.gender));
          setDisplayNameInput(resolveDisplayNameFromMetadata(ensured.user.user_metadata, ""));
          setDisplayNameError(null);
          setDisplayNameMessage(null);
          setIsLoading(false);
        })();
      } else {
        setUser(null);
        setRole("user");
        setSelectedAvatarKey(null);
        setIsAvatarPickerOpen(false);
        setSelectedGender("unspecified");
        setDisplayNameInput("");
        setDisplayNameError(null);
        setDisplayNameMessage(null);
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
      setIsAvatarPickerOpen(false);
      setSelectedGender("unspecified");
      setDisplayNameInput("");
      setDisplayNameError(null);
      setDisplayNameMessage(null);
      router.push("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAvatarChange = async (nextAvatarKey: AvatarKey) => {
    if (!user || isAvatarSaving || selectedAvatarKey === nextAvatarKey) return;
    const previousAvatarKey = selectedAvatarKey;
    setAvatarError(null);
    setAvatarMessage(null);
    setIsAvatarSaving(true);
    setSelectedAvatarKey(nextAvatarKey);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.updateUser({
        data: sanitizeUserMetadata({ ...(user.user_metadata ?? {}), avatar_key: nextAvatarKey }),
      });
      if (error) throw new Error(error.message);
      setUser(
        data.user ??
          ({ ...user, user_metadata: { ...(user.user_metadata ?? {}), avatar_key: nextAvatarKey } } as User),
      );
      setSelectedAvatarKey(nextAvatarKey);
      setAvatarMessage("Avatar zapisany.");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się zapisać avatara.";
      setAvatarError(message);
      setSelectedAvatarKey(previousAvatarKey ?? DEFAULT_AVATAR_KEY);
    } finally {
      setIsAvatarSaving(false);
    }
  };

  const handleGenderChange = async (nextGender: ProfileGender) => {
    if (!user || isGenderSaving || selectedGender === nextGender) return;
    const previousGender = selectedGender;
    setGenderError(null);
    setGenderMessage(null);
    setIsGenderSaving(true);
    setSelectedGender(nextGender);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.updateUser({
        data: sanitizeUserMetadata({ ...(user.user_metadata ?? {}), gender: nextGender }),
      });
      if (error) throw new Error(error.message);
      setUser(
        data.user ??
          ({ ...user, user_metadata: { ...(user.user_metadata ?? {}), gender: nextGender } } as User),
      );
      setSelectedGender(nextGender);
      setGenderMessage("Płeć zapisana.");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się zapisać płci.";
      setGenderError(message);
      setSelectedGender(previousGender);
    } finally {
      setIsGenderSaving(false);
    }
  };

  const handleDisplayNameSave = async () => {
    if (!user || isDisplayNameSaving) return;
    const nextDisplayName = sanitizeDisplayNameInput(displayNameInput);
    if (!isSafeDisplayNameCandidate(nextDisplayName)) {
      setDisplayNameError("Podaj imię 2–24 znaki, bez cyfr i symboli.");
      setDisplayNameMessage(null);
      return;
    }
    setIsDisplayNameSaving(true);
    setDisplayNameError(null);
    setDisplayNameMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.updateUser({
        data: sanitizeUserMetadata({ ...(user.user_metadata ?? {}), display_name: nextDisplayName }),
      });
      if (error) throw new Error(error.message);
      const nextUser =
        data.user ??
        ({ ...user, user_metadata: { ...(user.user_metadata ?? {}), display_name: nextDisplayName } } as User);
      setUser(nextUser);
      setDisplayNameInput(resolveDisplayNameFromMetadata(nextUser.user_metadata, nextDisplayName));
      setDisplayNameMessage("Imię zapisane.");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się zapisać imienia.";
      setDisplayNameError(message);
    } finally {
      setIsDisplayNameSaving(false);
    }
  };

  const handleRestartDashboardTutorial = async () => {
    if (!user || isTutorialResetting) return;
    setTutorialError(null);
    setTutorialMessage(null);
    setIsTutorialResetting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.updateUser({
        data: sanitizeUserMetadata({ ...(user.user_metadata ?? {}), dashboard_onboarding_completed: false }),
      });
      if (error) throw new Error(error.message);
      setUser(
        data.user ??
          ({ ...user, user_metadata: { ...(user.user_metadata ?? {}), dashboard_onboarding_completed: false } } as User),
      );
      setTutorialMessage("Tutorial zostanie pokazany przy wejściu do panelu ucznia.");
      router.push("/e8");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się uruchomić tutorialu.";
      setTutorialError(message);
    } finally {
      setIsTutorialResetting(false);
    }
  };

  const handleProgressReset = async () => {
    if (!user || isProgressResetting) return;
    const confirmed = window.confirm(
      "Czy na pewno chcesz zresetować cały progres E8? Usuniemy historię sesji, odpowiedzi i statystyki.",
    );
    if (!confirmed) return;
    setIsProgressResetting(true);
    setProgressResetError(null);
    setProgressResetMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Sesja wygasła. Zaloguj się ponownie.");
      const response = await fetch("/api/e8/progress/reset", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; details?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.details || payload?.error || "Nie udało się zresetować progresu.");
      }
      setProgressResetMessage("Progres E8 został zresetowany.");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się zresetować progresu.";
      setProgressResetError(message);
    } finally {
      setIsProgressResetting(false);
    }
  };

  const forcedAdminByEmail = isAdminEmail(user?.email);
  const effectiveRole = useMemo(() => {
    return forcedAdminByEmail ? "admin" : role;
  }, [forcedAdminByEmail, role]);
  const isAdmin = effectiveRole === "admin";

  const genderOptions: Array<{ value: ProfileGender; label: string; icon: typeof Venus | typeof Mars | typeof X }> = [
    { value: "female", label: "Kobieta", icon: Venus },
    { value: "male", label: "Mężczyzna", icon: Mars },
    { value: "unspecified", label: "Nie chcę mówić", icon: X },
  ];

  const premiumUntilLabel = formatPremiumUntil(user?.user_metadata?.premium_until);

  return (
    <div className="relative min-h-screen text-white">
      <AuthAnimatedBg />
      <ParallaxGridLayer />

      {/* Back link */}
      <div className="relative z-10 px-5 pt-5 md:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#4a6080] transition-colors duration-150 hover:text-[#8ba4c0]"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
          Strona główna
        </Link>
      </div>

      <main className="relative z-10 flex min-h-[calc(100vh-52px)] flex-col items-center justify-center px-5 py-10">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <Spinner size="lg" className="text-[#3730a3]" />
            <p className="text-sm text-[#4a6080]">Sprawdzam sesję...</p>
          </div>
        ) : !user ? (
          <div className="w-full max-w-sm text-center">
            <Image src={logoWhite} alt="nAIczyciel" className="mx-auto mb-8 h-7 w-auto opacity-80" />
            <h1 className="text-xl font-semibold text-[#c8d8eb]">Zaloguj się, aby zobaczyć profil</h1>
            <p className="mt-2 text-sm text-[#4a6080]">Twoje ustawienia będą dostępne po zalogowaniu.</p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#3730a3] px-6 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#4338ca]"
            >
              Zaloguj się
            </Link>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-3">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <Image src={logoWhite} alt="nAIczyciel" className="h-7 w-auto opacity-80" />
            </div>

            {/* Profile card */}
            <div className="rounded-2xl border border-[#141f30] bg-[#0d1422] p-6 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">

              {/* Avatar + greeting */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen((v) => !v)}
                  aria-expanded={isAvatarPickerOpen}
                  aria-controls="account-avatar-picker"
                  className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3730a3]/50"
                >
                  <Image
                    src={resolveAvatarSrc(selectedAvatarKey)}
                    alt="Wybrany avatar"
                    width={72}
                    height={72}
                    className="h-[4.2rem] w-[4.2rem] rounded-full border border-[#1c2e48] bg-[#080c17] p-1.5"
                    unoptimized
                  />
                  <span className="absolute -right-0.5 -bottom-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#1c2e48] bg-[#0d1422]">
                    <ChevronDown
                      className={`h-3 w-3 text-[#4a6080] transition-transform duration-200 ${isAvatarPickerOpen ? "rotate-180" : ""}`}
                      strokeWidth={2.2}
                    />
                  </span>
                </button>

                <div className="min-w-0">
                  <p className="text-[1.22rem] font-bold leading-tight tracking-[-0.02em] text-[#dde4f0]">
                    {`Hej, ${resolveDisplayNameFromMetadata(user.user_metadata, "Ty")}!`}
                  </p>
                  <p className="mt-0.5 text-xs text-[#4a6080]">Twój profil nAIczyciela</p>
                </div>
              </div>

              {/* Avatar picker */}
              {isAvatarPickerOpen && (
                <div
                  id="account-avatar-picker"
                  className="mt-5 origin-top animate-[accountAvatarReveal_220ms_cubic-bezier(0.22,1,0.36,1)]"
                >
                  <div className={divider} />
                  <div className="mt-4">
                    <span className={sectionLabel}>Avatar</span>
                    <div className="mt-3">
                      <AvatarPicker
                        selectedKey={selectedAvatarKey}
                        onSelect={handleAvatarChange}
                        disabled={isAvatarSaving}
                        className="gap-3"
                        itemClassName="p-2"
                      />
                    </div>
                    {avatarError ? <p className="mt-2 text-xs text-red-400">{avatarError}</p> : null}
                    {avatarMessage ? <p className="mt-2 text-xs text-emerald-400">{avatarMessage}</p> : null}
                  </div>
                </div>
              )}

              {/* Gender */}
              <div className="mt-5">
                <div className={divider} />
                <div className="mt-4">
                  <span className={sectionLabel}>Płeć</span>
                  <div className="mt-3 flex items-center gap-2.5">
                    {genderOptions.map(({ value, label, icon: Icon }) => {
                      const isSelected = selectedGender === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleGenderChange(value)}
                          disabled={isGenderSaving}
                          aria-pressed={isSelected}
                          aria-label={label}
                          className={
                            isSelected
                              ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#4338ca]/60 bg-[#1e1b4b] text-[#a5b4fc] shadow-[0_0_0_3px_rgba(99,102,241,0.12)] transition-all duration-150"
                              : "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#1c2a3f] bg-[#080c17] text-[#4a6080] transition-all duration-150 hover:border-[#1c3050] hover:text-[#7090b0]"
                          }
                        >
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        </button>
                      );
                    })}
                    {isGenderSaving && <span className="ml-1 text-xs text-[#4a6080]">Zapisywanie...</span>}
                  </div>
                  {genderError ? <p className="mt-2 text-xs text-red-400">{genderError}</p> : null}
                  {genderMessage ? <p className="mt-2 text-xs text-emerald-400">{genderMessage}</p> : null}
                </div>
              </div>

              {/* Meta info rows */}
              <div className="mt-5">
                <div className={divider} />
                <div className="mt-4 space-y-0">
                  {[
                    { label: "Email", value: user.email ?? "–" },
                    { label: "Rola", value: effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1) },
                    { label: "Kiedy wygasa", value: premiumUntilLabel },
                  ].map(({ label, value }, i, arr) => (
                    <div
                      key={label}
                      className={`flex items-center justify-between gap-4 py-2.5 ${
                        i < arr.length - 1 ? "border-b border-[#131e30]" : ""
                      }`}
                    >
                      <span className={sectionLabel}>{label}</span>
                      <span className="truncate text-[0.82rem] font-medium text-[#8ba4c0]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Display name */}
              <div className="mt-5">
                <div className={divider} />
                <div className="mt-4">
                  <label htmlFor="account-display-name" className={sectionLabel}>
                    Imię
                  </label>
                  <div className="mt-2.5 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <input
                      id="account-display-name"
                      type="text"
                      value={displayNameInput}
                      onChange={(e) => {
                        setDisplayNameInput(e.target.value);
                        setDisplayNameError(null);
                        setDisplayNameMessage(null);
                      }}
                      maxLength={24}
                      autoComplete="given-name"
                      placeholder="Wpisz imię"
                      className={inputBase}
                    />
                    <button
                      type="button"
                      onClick={handleDisplayNameSave}
                      disabled={isDisplayNameSaving}
                      className="flex h-[2.5rem] shrink-0 items-center justify-center rounded-lg bg-[#3730a3] px-4 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#4338ca] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDisplayNameSaving ? "..." : "Zapisz"}
                    </button>
                  </div>
                  {displayNameError ? <p className="mt-2 text-xs text-red-400">{displayNameError}</p> : null}
                  {displayNameMessage ? <p className="mt-2 text-xs text-emerald-400">{displayNameMessage}</p> : null}
                </div>
              </div>
            </div>

            {/* Action buttons card */}
            <div className="rounded-2xl border border-[#141f30] bg-[#0d1422] p-4 shadow-[0_24px_48px_rgba(0,0,0,0.3)]">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleRestartDashboardTutorial}
                  disabled={isTutorialResetting}
                  className="w-full rounded-lg border border-[#1c2a3f] bg-[#080c17] py-2.5 text-sm font-medium text-[#8ba4c0] transition-[border-color,background-color,color] duration-150 hover:border-[#253650] hover:text-[#b0c8e0] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isTutorialResetting ? "Uruchamianie..." : "Uruchom tutorial"}
                </button>
                {tutorialError ? <p className="text-xs text-red-400">{tutorialError}</p> : null}
                {tutorialMessage ? <p className="text-xs text-emerald-400">{tutorialMessage}</p> : null}

                <button
                  type="button"
                  onClick={handleProgressReset}
                  disabled={isProgressResetting}
                  className="w-full rounded-lg border border-[#3f1515] bg-[#1a0808] py-2.5 text-sm font-medium text-[#f87171] transition-[border-color,background-color] duration-150 hover:border-[#5a1f1f] hover:bg-[#200a0a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProgressResetting ? "Resetowanie..." : "Zresetuj progres"}
                </button>
                {progressResetError ? <p className="text-xs text-red-400">{progressResetError}</p> : null}
                {progressResetMessage ? <p className="text-xs text-emerald-400">{progressResetMessage}</p> : null}

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full rounded-lg border border-[#141f30] bg-transparent py-2.5 text-sm font-medium text-[#4a6080] transition-[border-color,color] duration-150 hover:border-[#1c2e48] hover:text-[#6880a0] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
                </button>
              </div>
            </div>

            {/* Admin panel */}
            {isAdmin ? (
              <div className="rounded-2xl border border-[#1c2a3f] bg-[#080c17] p-4">
                <p className={`${sectionLabel} mb-1`}>Narzędzia admina</p>
                <p className="mb-3 text-xs text-[#4a6080]">Zarządzanie pytaniami i treściami.</p>
                <Link
                  href="/konto/pytania"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-[#1c2a3f] bg-[#0d1422] py-2.5 text-sm font-semibold text-[#8ba4c0] transition-[border-color,color] duration-150 hover:border-[#253650] hover:text-[#b0c8e0]"
                >
                  Otwórz panel pytań
                </Link>
              </div>
            ) : null}
          </div>
        )}
      </main>

      <style>{`
        @keyframes accountAvatarReveal {
          from { opacity: 0; transform: translateY(-6px) scaleY(0.97); }
          to   { opacity: 1; transform: translateY(0) scaleY(1); }
        }
      `}</style>
    </div>
  );
}
