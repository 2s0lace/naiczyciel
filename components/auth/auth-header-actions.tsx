"use client";

import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { clearRoleCookie, setRoleCookie } from "@/lib/auth/role";
import { resolveRoleForSession } from "@/lib/auth/client-role";
import { normalizeAvatarKey, resolveAvatarSrc } from "@/lib/avatar/presets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import loginPaperCutElement from "@/img/paper-cut-design-element (2).png";

type AuthHeaderActionsProps = {
  loginClassName: string;
  accountClassName: string;
  containerClassName?: string;
  loginVariant?: "paper-cut" | "box";
};

export default function AuthHeaderActions({
  loginClassName,
  accountClassName,
  containerClassName,
  loginVariant = "paper-cut",
}: AuthHeaderActionsProps) {
  const pathname = usePathname();
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

  if (pathname === "/auth/callback") {
    return null;
  }

  if (!user) {
    const hiddenLoginPaths = [
      "/login",
      "/polityka-prywatnosci",
      "/polityka-cookies",
      "/regulamin",
      "/korepetycje",
      "/co-nowego",
      "/credits",
    ];

    if (hiddenLoginPaths.includes(pathname)) {
      return null;
    }

    if (loginVariant === "box") {
      return (
        <Link
          href="/login"
          className={cn(
            "inline-flex items-center justify-center rounded-xl border border-white/14 bg-white/6 px-4 text-sm font-semibold text-gray-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-150 hover:border-white/22 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/45",
            loginClassName,
          )}
        >
          Zaloguj się
        </Link>
      );
    }

    return (
      <Link href="/login" className={cn("group relative inline-flex items-center justify-center overflow-hidden", loginClassName)}>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-3 bottom-1 h-5 rounded-full bg-black/30 blur-md transition-opacity duration-150 group-hover:bg-black/36"
        />
        <Image
          src={loginPaperCutElement}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-fill opacity-95"
        />
        <LockKeyhole
          aria-hidden
          className="pointer-events-none absolute right-5 top-1/2 z-10 h-[0.72rem] w-[0.72rem] -translate-y-1/2 text-[#1a1a1a]/16 md:h-[0.84rem] md:w-[0.84rem] md:text-[#1a1a1a]/24"
          strokeWidth={1.65}
        />
        <span
          className="relative z-10 px-6 text-[0.82rem] tracking-[-0.01em] text-[#1a1a1a]/72 transition-transform duration-150 group-hover:scale-[1.015] md:text-[1.02rem] md:text-[#1a1a1a]"
          style={{ fontFamily: "var(--font-gloria-hallelujah)", fontWeight: 700, textShadow: "0 1px 0 rgba(3,10,20,0.22)" }}
        >
          ZALOGUJ
        </span>
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
            "group relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/16 bg-[#0b1226]/92 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_-20px_rgba(59,130,246,0.7)] transition-[border-color,background-color,transform,box-shadow] duration-150 hover:border-indigo-200/45 hover:bg-[#111b38] hover:shadow-[0_12px_24px_-18px_rgba(99,102,241,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/45 after:pointer-events-none after:absolute after:-inset-2 after:-z-10 after:rounded-full after:bg-[radial-gradient(circle,rgba(96,165,250,0.2)_0%,rgba(96,165,250,0.12)_40%,rgba(96,165,250,0)_74%)]",
            accountClassName,
          )}
          aria-label="Menu konta"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          data-tour="dashboard-account"
        >
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.16),rgba(255,255,255,0)_62%)]" />
          <Image
            src={avatarSrc}
            alt="Avatar użytkownika"
            width={36}
            height={36}
            className="relative h-[110%] w-[110%] translate-y-[1px] rounded-full object-cover"
            unoptimized
          />
        </button>

        <div
          className={cn(
            "absolute top-[calc(100%+0.45rem)] right-0 z-[120] min-w-[9.5rem] overflow-hidden rounded-2xl border border-white/20 bg-[#0f1733]/98 p-1.5 shadow-[0_24px_40px_-20px_rgba(0,0,0,0.92)] backdrop-blur-md transition-[opacity,transform] duration-150",
            isMenuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
          )}
          role="menu"
          aria-label="Menu konta"
        >
          <Link
            href="/konto"
            onClick={() => setIsMenuOpen(false)}
            className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white/92 transition-colors hover:bg-white/8 hover:text-white"
            role="menuitem"
          >
            Konto
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="block w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-white/88 transition-colors hover:bg-red-500/12 hover:text-red-100 disabled:opacity-70"
            role="menuitem"
          >
            {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
          </button>
        </div>
      </div>
    </div>
  );
}






