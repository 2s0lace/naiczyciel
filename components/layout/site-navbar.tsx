"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthHeaderActions from "@/components/auth/auth-header-actions";
import { buttonVariants } from "@/components/ui/button";
import logoNaiczycielWhite from "@/img/logonaiczyciel_white.png";

export function SiteNavbar() {
  const pathname = usePathname();

  const authPaths = ["/login", "/register", "/konto"];
  if (pathname === "/" || pathname === "/e8" || pathname.startsWith("/e8/quiz") || authPaths.includes(pathname)) {
    return null;
  }

  const loginVariant = pathname.startsWith("/edu")
    ? "teacher"
    : pathname.startsWith("/e8")
      ? "student"
      : "secondary";

  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[#050a16]/80 backdrop-blur">
      <div className="page-shell">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg p-2 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            aria-label="Strona główna"
          >
            <Image
              src={logoNaiczycielWhite}
              alt="nAIczyciel"
              width={24}
              height={24}
              className="rounded-sm"
            />
          </Link>

          <AuthHeaderActions
            containerClassName="flex items-center gap-2"
            loginClassName={buttonVariants({
              variant: loginVariant,
              size: "sm",
              className: "rounded-xl px-5",
            })}
            accountClassName=""
          />
        </div>
      </div>
    </header>
  );
}


