"use client";

import Link from "next/link";
import { SocialLinks } from "@/components/layout/social-links";

const legalLinks = [
  { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
  { href: "/polityka-cookies", label: "Polityka cookies" },
  { href: "/regulamin", label: "Regulamin" },
] as const;

const contentLinks = [
  { href: "/korepetycje", label: "Korepetycje" },
  { href: "/co-nowego", label: "Co nowego" },
  { href: "/credits", label: "Credits" },
] as const;

type MarketingFooterProps = {
  showSocialLinks?: boolean;
};

export function MarketingFooter({ showSocialLinks = false }: MarketingFooterProps) {
  return (
    <footer className="z-10 mx-auto w-full max-w-6xl px-5 pb-7 text-center md:px-6 md:pb-9 xl:max-w-[82rem] xl:px-10 2xl:max-w-[94rem] 2xl:px-12 min-[2200px]:max-w-[112rem] min-[2200px]:px-16">
      <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      <p className="mt-4 text-sm font-medium tracking-tight text-white/68">nAIczyciel</p>

      <nav className="mt-3 flex flex-col items-center text-sm text-indigo-100/54">
        <div className="flex flex-col items-center gap-1.5 min-[769px]:flex-row min-[769px]:gap-x-5">
          {legalLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-1 py-0.5 transition-colors duration-150 hover:text-white/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/35"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="my-2 h-px w-28 bg-white/10 min-[769px]:my-2.5 min-[769px]:w-[24rem]" />
        <div className="flex flex-col items-center gap-1.5 min-[769px]:flex-row min-[769px]:gap-x-5">
          {contentLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-1 py-0.5 transition-colors duration-150 hover:text-white/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/35"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {showSocialLinks ? (
        <div className="mt-3 flex justify-center">
          <SocialLinks />
        </div>
      ) : null}

      <p className="mt-3 text-xs text-gray-500/85">© 2026 nAIczyciel • Uczciwie, konkretnie, bez magii.</p>
    </footer>
  );
}
