"use client";

import Image from "next/image";
import Link from "next/link";
import logoNaiczycielWhite from "@/img/logonaiczyciel_white.png";
import { useEffect, useState } from "react";
import AuthHeaderActions from "@/components/auth/auth-header-actions";
import { cn } from "@/lib/utils";

export default function MobileHeader() {
  const [isDetached, setIsDetached] = useState(false);

  useEffect(() => {
    const DETACH_HYSTERESIS = 14;

    const resolveDetachThreshold = () => {
      const width = window.innerWidth;

      if (width >= 1280) {
        return 96;
      }

      if (width >= 1024) {
        return 84;
      }

      if (width >= 768) {
        return 70;
      }

      return 56;
    };

    const onScroll = () => {
      const threshold = resolveDetachThreshold();
      const scrollY = window.scrollY;

      setIsDetached((current) => {
        if (current) {
          return scrollY > threshold - DETACH_HYSTERESIS;
        }

        return scrollY > threshold;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 will-change-[background-color,border-color,box-shadow,backdrop-filter] transition-[background-color,border-color,box-shadow,backdrop-filter] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isDetached
          ? "border-b border-white/10 bg-[#050510]/94 shadow-[0_16px_32px_-30px_rgba(0,0,0,0.9)] md:backdrop-blur-xl"
          : "bg-transparent shadow-none md:backdrop-blur-[6px]",
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-[76px] w-full max-w-md items-center justify-between px-5 md:h-20 md:max-w-4xl md:px-6 lg:max-w-6xl lg:px-9 xl:max-w-[82rem] xl:px-10 2xl:max-w-[94rem] 2xl:px-12 min-[2200px]:max-w-[112rem] min-[2200px]:px-16",
        )}
      >
        <Link
          href="/"
          className="inline-flex items-center rounded-md p-1 transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/45"
          aria-label="Przejdź do landing"
        >
          <Image
            src={logoNaiczycielWhite}
            alt="nAIczyciel"
            priority
            className={cn(
              "relative h-8 w-auto translate-x-[5px] md:translate-x-0 md:translate-y-0",
              isDetached ? "translate-y-[10px]" : "translate-y-[5px]",
            )}
          />
        </Link>

        <AuthHeaderActions
          containerClassName={cn("flex items-center gap-2 md:translate-y-0", isDetached ? "translate-y-[5px]" : "translate-y-0")}
          loginClassName="h-9 min-w-[8.75rem] rounded-xl px-4 text-xs md:h-10 md:px-5 md:text-sm"
          loginVariant="box"
          accountClassName="h-9 w-9 p-1 rounded-full"
        />
      </div>
    </header>
  );
}










