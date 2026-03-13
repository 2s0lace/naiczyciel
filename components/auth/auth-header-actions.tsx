"use client";

import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { clearRoleCookie, setRoleCookie } from "@/lib/auth/role";
import { resolveRoleForSession } from "@/lib/auth/client-role";
import { normalizeAvatarKey, resolveAvatarSrc } from "@/lib/avatar/presets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AuthHeaderActionsProps = {
  loginClassName: string;
  accountClassName: string;
  containerClassName?: string;
};

export default function AuthHeaderActions({
  loginClassName,
  accountClassName,
  containerClassName,
}: AuthHeaderActionsProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      const nextUser = data.session?.user ?? null;
      setUser(nextUser);

      if (nextUser && data.session) {
        const role = await resolveRoleForSession({
          supabase,
          session: data.session,
        });

        if (isMounted) {
          setRoleCookie(role);
        }
      } else {
        clearRoleCookie();
        setIsMenuOpen(false);
      }
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (nextUser && session) {
        void (async () => {
          const role = await resolveRoleForSession({
            supabase,
            session,
          });

          if (isMounted) {
            setRoleCookie(role);
          }
        })();
      } else {
        clearRoleCookie();
        setIsMenuOpen(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    const handleScroll = () => {
      setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsMenuOpen(false);

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut({ scope: "local" });
      clearRoleCookie();
      setUser(null);
      router.replace("/");
      router.refresh();
      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const avatarSrc = useMemo(() => {
    const avatarKey = normalizeAvatarKey(user?.user_metadata?.avatar_key);
    return resolveAvatarSrc(avatarKey);
  }, [user]);

  if (!user) {
    return (
      <Link href="/login" className={loginClassName}>
        Zaloguj się
      </Link>
    );
  }

  return (
    <div className={containerClassName ?? "flex items-center gap-2"}>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className={cn(
            "group relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/16 bg-[#0b1226]/92 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_-20px_rgba(59,130,246,0.7)] transition-[border-color,background-color,transform,box-shadow] duration-150 hover:border-indigo-200/45 hover:bg-[#111b38] hover:shadow-[0_12px_24px_-18px_rgba(99,102,241,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/45",
            accountClassName,
          )}
          aria-label="Menu konta"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          data-tour="dashboard-account"
        >
          <span className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.16),rgba(255,255,255,0)_62%)]" />
          <Image
            src={avatarSrc}
            alt="Avatar użytkownika"
            width={36}
            height={36}
            className="relative h-[110%] w-[110%] translate-y-[1px] object-contain"
            unoptimized
          />
        </button>

        <div
          className={cn(
            "absolute top-[calc(100%+0.45rem)] right-0 z-[120] min-w-[8.5rem] overflow-hidden rounded-xl border border-white/16 bg-[#0b1226] p-1 shadow-[0_22px_36px_-22px_rgba(0,0,0,0.92)] transition-[opacity,transform] duration-150",
            isMenuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
          )}
          role="menu"
          aria-label="Menu konta"
        >
          <Link
            href="/konto"
            onClick={() => setIsMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/8 hover:text-white"
            role="menuitem"
          >
            Konto
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-200 transition-colors hover:bg-red-500/12 hover:text-red-100 disabled:opacity-70"
            role="menuitem"
          >
            {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
          </button>
        </div>
      </div>
    </div>
  );
}






