"use client";

import Image from "next/image";
import logoWhite from "@/img/logonaiczyciel_white.png";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { setRoleCookie } from "@/lib/auth/role";
import { hasConfiguredDisplayName } from "@/lib/auth/display-name";
import { resolveRoleForSession } from "@/lib/auth/client-role";
import { normalizeAvatarKey } from "@/lib/avatar/presets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "register";
type FormView = AuthMode | "forgot";

type AuthFormProps = {
  mode: AuthMode;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function resolvePostAuthPath(): string {
  return "/";
}

function resolveAvatarPath(nextPath: string, forceSelection: boolean): string {
  const params = new URLSearchParams();
  params.set("next", nextPath);
  if (forceSelection) params.set("force", "1");
  return `/auth/avatar?${params.toString()}`;
}

const SUPABASE_ERROR_MAP: Array<[string, string]> = [
  ["Invalid login credentials", "Nieprawidłowy email lub hasło."],
  ["Email not confirmed", "Potwierdź adres email przed zalogowaniem."],
  ["Too many requests", "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę."],
  ["User not found", "Nie znaleziono użytkownika."],
  ["Invalid email", "Podaj poprawny adres email."],
  ["Signup requires a valid password", "Hasło jest nieprawidłowe."],
];

function translateError(message: string): string {
  for (const [key, translation] of SUPABASE_ERROR_MAP) {
    if (message.includes(key)) return translation;
  }
  return "Wystąpił błąd. Spróbuj ponownie.";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── shared styles ─────────────────────────────────────────────────────────────

const inputBase =
  "w-full rounded-lg border border-[#1c2a3f] bg-[#080c17] px-3.5 py-2.5 text-sm text-[#dde4f0] " +
  "outline-none placeholder:text-[#384e6a] " +
  "transition-[border-color,background-color] duration-200 " +
  "focus:border-[#3730a3] focus:bg-[#090e1b] " +
  "disabled:opacity-50";

const inputWithIcon = inputBase + " pr-10";

const labelClass = "block text-[11px] font-semibold tracking-[0.08em] text-[#5c738f] uppercase";

// ─── module-level sub-components (NEVER define inside a component render) ─────

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[15px] w-[15px]"
      aria-hidden
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[15px] w-[15px]"
      aria-hidden
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={show ? "Ukryj hasło" : "Pokaż hasło"}
      onClick={onToggle}
      className="absolute inset-y-0 right-3 flex items-center text-[#384e6a] transition-colors duration-150 hover:text-[#5c738f]"
    >
      {show ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="/"
        className="fixed left-5 top-5 z-50 flex items-center gap-1.5 text-[11px] font-medium text-[#384e6a] transition-colors duration-150 hover:text-[#5c738f]"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Strona główna
      </a>

      <div className="animate-auth-card-in w-full max-w-[22rem] rounded-2xl border border-[#141f30] bg-[#0d1422] px-7 py-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.02)]">
        {children}
      </div>
    </>
  );
}

function AuthHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="mb-8 flex flex-col items-center gap-4 text-center">
      <Image
        src={logoWhite}
        alt="nAIczyciel"
        width={130}
        height={40}
        className="select-none opacity-95"
        priority
        style={{ objectFit: "contain" }}
      />
      <p className="text-[13px] leading-relaxed text-[#5c738f]">{subtitle}</p>
    </div>
  );
}

function AuthMessages({ error, info }: { error: string | null; info: string | null }) {
  if (!error && !info) return null;
  return (
    <>
      {error ? (
        <div
          id="form-error"
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-500/15 bg-red-500/[0.07] px-3 py-2.5"
        >
          <svg className="mt-[1px] h-3.5 w-3.5 shrink-0 text-red-400/80" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-[13px] text-red-300/80">{error}</p>
        </div>
      ) : null}
      {info ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.07] px-3 py-2.5"
        >
          <svg className="mt-[1px] h-3.5 w-3.5 shrink-0 text-emerald-400/80" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-[13px] text-emerald-300/80">{info}</p>
        </div>
      ) : null}
    </>
  );
}

function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-[#141f30]" />
      <span className="text-[10px] font-medium tracking-[0.12em] text-[#2d4056] uppercase">albo</span>
      <span className="h-px flex-1 bg-[#141f30]" />
    </div>
  );
}

function GoogleButton({
  loading,
  disabled,
  onClick,
}: {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#1c2a3f] bg-[#080c17] py-2.5 text-[13px] font-medium text-[#8095a8] transition-[border-color,background-color,color] duration-150 hover:border-[#263452] hover:bg-[#0b1020] hover:text-[#a0b1c8] active:scale-[0.987] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
          <path d="M21.8 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.5a4.8 4.8 0 0 1-2 3.1v2.6h3.2c1.9-1.8 3.1-4.4 3.1-7.4Z" fill="#4285F4" />
          <path d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.6c-.9.6-2 .9-3.5.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" fill="#34A853" />
          <path d="M6.4 13.8a6 6 0 0 1 0-3.7V7.5H3.1a10 10 0 0 0 0 9l3.3-2.7Z" fill="#FBBC05" />
          <path d="M12 6.1c1.4 0 2.7.5 3.7 1.4l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6c.8-2.3 3-4 5.6-4Z" fill="#EA4335" />
        </svg>
      )}
      {loading ? "Łączenie..." : "Kontynuuj z Google"}
    </button>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();

  const [view, setView] = useState<FormView>(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isRegister = view === "register";
  const isForgot = view === "forgot";
  const isAuthenticating = isLoading || isGoogleLoading;

  function switchView(next: FormView) {
    setView(next);
    setError(null);
    setInfo(null);
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (isForgot) {
      if (!isValidEmail(email)) {
        setError("Podaj poprawny adres email.");
        return;
      }
      setIsLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (resetError) {
          setError(translateError(resetError.message));
        } else {
          setInfo("Link do resetowania hasła został wysłany na podany adres email.");
        }
      } catch {
        setError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (isRegister) {
      setError("Rejestracja jest chwilowo wstrzymana.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Podaj poprawny adres email.");
      return;
    }
    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(translateError(signInError.message));
        return;
      }

      const role = await resolveRoleForSession({ supabase, session: data.session, user: data.user });
      setRoleCookie(role);

      const nextPath = resolvePostAuthPath();
      const avatarKey = normalizeAvatarKey(data.user.user_metadata?.avatar_key);
      const hasDisplayName = hasConfiguredDisplayName(data.user.user_metadata);
      const redirectPath = avatarKey && hasDisplayName ? nextPath : resolveAvatarPath(nextPath, !avatarKey);

      router.push(redirectPath);
      router.refresh();
    } catch (unexpectedError) {
      const message =
        unexpectedError instanceof Error ? translateError(unexpectedError.message) : "Wystąpił nieoczekiwany błąd.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setInfo(null);
    setIsGoogleLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, queryParams: { prompt: "select_account" } },
      });
      if (oauthError) {
        setError(translateError(oauthError.message));
        setIsGoogleLoading(false);
      }
    } catch (unexpectedError) {
      const message =
        unexpectedError instanceof Error ? translateError(unexpectedError.message) : "Wystąpił nieoczekiwany błąd.";
      setError(message);
      setIsGoogleLoading(false);
    }
  };

  // ─── forgot password view ──────────────────────────────────────────────────

  if (isForgot) {
    return (
      <AuthCard>
        <AuthHeader subtitle="Podaj swój email, a wyślemy Ci link do zmiany hasła." />

        <form className="space-y-4" onSubmit={handleSubmit} aria-describedby={error ? "form-error" : undefined}>
          <div className="space-y-1.5">
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              aria-describedby={error ? "form-error" : undefined}
              className={inputBase}
              placeholder="twoj@email.com"
            />
          </div>

          <AuthMessages error={error} info={info} />

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3b35b8] py-2.5 text-sm font-semibold text-white/95 transition-[background-color,transform] duration-150 hover:bg-[#4338ca] active:scale-[0.987] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? <Spinner size="sm" /> : null}
            Wyślij link
          </button>
        </form>

        <button
          type="button"
          onClick={() => switchView("login")}
          className="mt-5 flex w-full items-center justify-center gap-1.5 text-[12px] text-[#384e6a] transition-colors duration-150 hover:text-[#5c738f]"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Wróć do logowania
        </button>
      </AuthCard>
    );
  }

  // ─── login / register view ─────────────────────────────────────────────────

  return (
    <AuthCard>
      <AuthHeader
        subtitle={
          isRegister
            ? "Utwórz konto i zacznij ćwiczyć E8."
            : "Zaloguj się, aby kontynuować naukę."
        }
      />

      <form className="space-y-3.5" onSubmit={handleSubmit} aria-describedby={error ? "form-error" : undefined}>
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className={labelClass}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            aria-describedby={error ? "form-error" : undefined}
            className={inputBase}
            placeholder="twoj@email.com"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={labelClass}>Hasło</label>
            {!isRegister && (
              <button
                type="button"
                onClick={() => switchView("forgot")}
                className="text-[11px] text-[#3d527a] transition-colors duration-150 hover:text-[#5c738f]"
              >
                Zapomniałem hasła
              </button>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isRegister ? "new-password" : "current-password"}
              aria-describedby={error ? "form-error" : undefined}
              className={inputWithIcon}
              placeholder="········"
            />
            <EyeToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
          </div>
        </div>

        {/* Confirm password (register only) */}
        {isRegister ? (
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className={labelClass}>Powtórz hasło</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className={inputWithIcon}
                placeholder="········"
              />
              <EyeToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword((v) => !v)} />
            </div>
          </div>
        ) : null}

        <AuthMessages error={error} info={info} />

        {/* Submit */}
        <div className="pt-0.5">
          <button
            type="submit"
            disabled={isAuthenticating}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3b35b8] py-2.5 text-sm font-semibold text-white/95 transition-[background-color,transform] duration-150 hover:bg-[#4338ca] active:scale-[0.987] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? <Spinner size="sm" /> : null}
            {isRegister ? "Utwórz konto" : "Zaloguj się"}
          </button>
        </div>

        <AuthDivider />

        <GoogleButton
          loading={isGoogleLoading}
          disabled={isAuthenticating}
          onClick={handleGoogleAuth}
        />
      </form>

      {/* Register / login switch */}
      <p className="mt-6 text-center text-[12px] text-[#2d4056]">
        {isRegister ? (
          <>
            Masz już konto?{" "}
            <a href="/login" className="link-underline text-[#4a6080] transition-colors duration-150 hover:text-[#6b82a8]">
              Zaloguj się
            </a>
          </>
        ) : (
          <>
            Nie masz konta?{" "}
            <a href="/register" className="link-underline text-[#4a6080] transition-colors duration-150 hover:text-[#6b82a8]">
              Zarejestruj się
            </a>
          </>
        )}
      </p>
    </AuthCard>
  );
}
