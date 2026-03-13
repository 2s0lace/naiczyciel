"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearRoleCookie, setRoleCookie } from "@/lib/auth/role";
import { resolveRoleForSession } from "@/lib/auth/client-role";
import { normalizeAvatarKey } from "@/lib/avatar/presets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const SESSION_RETRIES = 6;
const RETRY_DELAY_MS = 140;

function resolvePostAuthPath(): string {
  return "/";
}

function resolveAvatarPath(nextPath: string): string {
  const params = new URLSearchParams();
  params.set("next", nextPath);
  params.set("force", "1");
  return `/auth/avatar?${params.toString()}`;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const finalizeAuth = async () => {
      const query = new URLSearchParams(window.location.search);
      const oauthError = query.get("error_description") ?? query.get("error");

      if (oauthError) {
        if (isMounted) {
          clearRoleCookie();
          setErrorMessage(decodeURIComponent(oauthError));
        }
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();

        for (let attempt = 0; attempt < SESSION_RETRIES; attempt += 1) {
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            if (isMounted) {
              clearRoleCookie();
              setErrorMessage(error.message);
            }
            return;
          }

          if (data.session?.user) {
            const role = await resolveRoleForSession({
              supabase,
              session: data.session,
            });

            setRoleCookie(role);

            const nextPath = resolvePostAuthPath();
            const avatarKey = normalizeAvatarKey(data.session.user.user_metadata?.avatar_key);
            const redirectPath = avatarKey ? nextPath : resolveAvatarPath(nextPath);

            router.replace(redirectPath);
            router.refresh();
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }

        if (isMounted) {
          clearRoleCookie();
          setErrorMessage("Nie udało się dokończyć logowania Google. Spróbuj ponownie.");
        }
      } catch (unexpectedError) {
        if (isMounted) {
          clearRoleCookie();
          const message = unexpectedError instanceof Error ? unexpectedError.message : "Wystąpił nieoczekiwany błąd.";
          setErrorMessage(message);
        }
      }
    };

    void finalizeAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-[#050510] px-5 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center shadow-[0_20px_44px_-34px_rgba(0,0,0,0.95)] sm:p-7">
          {errorMessage ? (
            <div className="space-y-4">
              <h1 className="text-xl font-bold">Błąd logowania</h1>
              <p className="text-sm text-red-300">{errorMessage}</p>
              <Link
                href="/login"
                className="inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-indigo-500 active:scale-[0.985]"
              >
                Wróć do logowania
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <h1 className="text-xl font-bold">Finalizowanie logowania...</h1>
              <p className="text-sm text-gray-300">Trwa łączenie konta Google.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

