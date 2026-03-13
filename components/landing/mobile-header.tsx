"use client";

import Image from "next/image";
import Link from "next/link";
import logoNaiczycielWhite from "@/img/logonaiczyciel_white.png";
import { useEffect, useState } from "react";
import AuthHeaderActions from "@/components/auth/auth-header-actions";
import { SocialLinks } from "@/components/layout/social-links";
import { cn } from "@/lib/utils";

export default function MobileHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isScrolled
          ? "border-b border-white/10 bg-[#050510]/94 shadow-[0_16px_32px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          : "border-b border-white/5 bg-[#050510]/85 backdrop-blur-md",
      )}
    >
      <div className="relative mx-auto flex w-full max-w-md items-center justify-between px-5 py-4 md:max-w-4xl md:px-6 lg:max-w-6xl lg:px-9 xl:max-w-[82rem] xl:px-10">
        <Link
          href="/"
          className="inline-flex items-center rounded-md p-1 transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/45"
          aria-label="Przejdź do landing"
        >
          <Image
            src={logoNaiczycielWhite}
            alt="nAIczyciel"
            priority
            className="h-8 w-auto"
          />
        </Link>

        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <SocialLinks className="pointer-events-auto" />
        </div>

        <AuthHeaderActions
          containerClassName="flex items-center gap-2"
          loginClassName="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-200 transition-[background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/10 active:scale-[0.985] motion-reduce:transform-none md:px-4 md:py-2 md:text-sm"
          accountClassName="h-9 w-9 p-1 rounded-xl"
        />
      </div>
    </header>
  );
}










