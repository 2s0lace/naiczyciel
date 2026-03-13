"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearRoleCookie, setRoleCookie } from "@/lib/auth/role";
import { resolveRoleForSession } from "@/lib/auth/client-role";
import { normalizeAvatarKey } from "@/lib/avatar/presets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

function resolvePostAuthPath(): string {
  return "/";
}

function resolveAvatarPath(nextPath: string, forceSelection: boolean): string {
  const params = new URLSearchParams();
  params.set("next", nextPath);

  if (forceSelection) {
    params.set("force", "1");
  }

  return `/auth/avatar?${params.toString()}`;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isRegister = mode === "register";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (isRegister) {
      setError("Rejestracja jest chwilowo wstrzymana.");
      return;
    }


    if (isRegister && password !== confirmPassword) {
      setError("HasĹ‚a nie sÄ… takie same.");
      return;
    }

    if (password.length < 6) {
      setError("HasĹ‚o musi mieÄ‡ co najmniej 6 znakĂłw.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: "user",
              dashboard_onboarding_completed: false,
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.session && data.user) {
          const role = await resolveRoleForSession({
            supabase,
            session: data.session,
          });

          setRoleCookie(role);

          const nextPath = resolvePostAuthPath();
          const avatarKey = normalizeAvatarKey(data.user.user_metadata?.avatar_key);
          const redirectPath = avatarKey ? nextPath : resolveAvatarPath(nextPath, true);

          router.push(redirectPath);
          router.refresh();
          return;
        }

        clearRoleCookie();
        setInfo("Konto utworzone. SprawdĹş email i potwierdĹş rejestracjÄ™, a potem zaloguj siÄ™.");
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const role = await resolveRoleForSession({
        supabase,
        session: data.session,
        user: data.user,
      });

      setRoleCookie(role);

      const nextPath = resolvePostAuthPath();
      const avatarKey = normalizeAvatarKey(data.user.user_metadata?.avatar_key);
      const redirectPath = avatarKey ? nextPath : resolveAvatarPath(nextPath, false);

      router.push(redirectPath);
      router.refresh();
    } catch (unexpectedError) {
      const message = unexpectedError instanceof Error ? unexpectedError.message : "WystÄ…piĹ‚ nieoczekiwany bĹ‚Ä…d.";
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
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setIsGoogleLoading(false);
      }
    } catch (unexpectedError) {
      const message = unexpectedError instanceof Error ? unexpectedError.message : "WystÄ…piĹ‚ nieoczekiwany bĹ‚Ä…d.";
      setError(message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_44px_-34px_rgba(0,0,0,0.95)] sm:p-7">
      <div className="mb-6 space-y-2 text-center sm:mb-7">
        <h1 className="text-2xl font-bold text-white">{isRegister ? "ZaĹ‚ĂłĹĽ konto" : "Zaloguj siÄ™"}</h1>
        <p className="text-sm text-gray-300">
          {isRegister ? "UtwĂłrz konto i zacznij Ä‡wiczyÄ‡ E8." : "Zaloguj siÄ™, aby kontynuowaÄ‡ naukÄ™."}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-semibold tracking-wide text-gray-300 uppercase">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-xl border border-white/14 bg-[#090d1f] px-3.5 py-2.5 text-sm text-white outline-none transition-[border-color,box-shadow] duration-150 focus:border-indigo-300/55 focus:ring-2 focus:ring-indigo-400/20"
            placeholder="twoj@email.com"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-semibold tracking-wide text-gray-300 uppercase">
            HasĹ‚o
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete={isRegister ? "new-password" : "current-password"}
            className="w-full rounded-xl border border-white/14 bg-[#090d1f] px-3.5 py-2.5 text-sm text-white outline-none transition-[border-color,box-shadow] duration-150 focus:border-indigo-300/55 focus:ring-2 focus:ring-indigo-400/20"
            placeholder="â€˘â€˘â€˘â€˘â€˘â€˘â€˘â€˘"
          />
        </div>

        {isRegister ? (
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-semibold tracking-wide text-gray-300 uppercase">
              PowtĂłrz hasĹ‚o
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/14 bg-[#090d1f] px-3.5 py-2.5 text-sm text-white outline-none transition-[border-color,box-shadow] duration-150 focus:border-indigo-300/55 focus:ring-2 focus:ring-indigo-400/20"
              placeholder="â€˘â€˘â€˘â€˘â€˘â€˘â€˘â€˘"
            />
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {info ? <p className="text-sm text-emerald-300">{info}</p> : null}

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-[transform,background-color,box-shadow] duration-150 hover:bg-indigo-500 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Przetwarzanie..." : isRegister ? "UtwĂłrz konto" : "Zaloguj siÄ™"}
        </button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] font-medium tracking-wide text-gray-400 uppercase">albo</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading || isGoogleLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/14 bg-[#090d1f] py-2.5 text-sm font-semibold text-white transition-[border-color,background-color,transform] duration-150 hover:border-white/25 hover:bg-[#0c1229] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path
              d="M21.8 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.5a4.8 4.8 0 0 1-2 3.1v2.6h3.2c1.9-1.8 3.1-4.4 3.1-7.4Z"
              fill="#4285F4"
            />
            <path
              d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.6c-.9.6-2 .9-3.5.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
              fill="#34A853"
            />
            <path
              d="M6.4 13.8a6 6 0 0 1 0-3.7V7.5H3.1a10 10 0 0 0 0 9l3.3-2.7Z"
              fill="#FBBC05"
            />
            <path
              d="M12 6.1c1.4 0 2.7.5 3.7 1.4l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6c.8-2.3 3-4 5.6-4Z"
              fill="#EA4335"
            />
          </svg>
          {isGoogleLoading ? "Przekierowanie..." : "Kontynuuj z Google"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-300">
        Rejestracja jest chwilowo wstrzymana.
      </p>
    </div>
  );
}



