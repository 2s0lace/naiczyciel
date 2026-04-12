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
  seoTitle?: string;
  seoBody?: string;
  theme?: "light" | "darkGlow";
  offset?: "flush" | "raised";
};

const footerThemes = {
  light: {
    eyebrow: "text-slate-400/70",
    brand: "text-slate-300/80",
    meta: "text-slate-400/60",
    divider: "bg-slate-300/20",
    link: "text-slate-300/75 hover:text-slate-100",
    dot: "text-slate-300/30",
  },
  darkGlow: {
    eyebrow: "text-black",
    brand: "text-black",
    meta: "text-black",
    divider: "bg-black/20",
    link: "!text-black hover:!text-black/70",
    dot: "text-black/40",
  },
} as const;

export function MarketingFooter({
  showSocialLinks = false,
  theme = "light",
  // offset is kept for API compat but no longer drives translation — layout handles this
}: MarketingFooterProps) {
  const p = footerThemes[theme];

  return (
    <footer className="relative z-[30] w-full px-5 pt-7 pb-6 min-[480px]:px-7 md:px-10 md:pt-8 md:pb-7">
      {/*
        Single constrained container — max-w keeps it from spreading on wide screens.
        Flex-wrap with row-gap so groups fall naturally on narrow desktops.
      */}
      <div className="mx-auto flex max-w-2xl flex-wrap items-start gap-x-10 gap-y-5 md:gap-x-12">

        {/* ── Brand block ──────────────────────────────────────── */}
        <div className="flex min-w-[9rem] flex-col gap-0.5">
          <p className={`text-[0.58rem] font-bold tracking-[0.22em] uppercase ${p.eyebrow}`}>
            nAIczyciel
          </p>
          <p className={`text-[0.74rem] leading-[1.3] tracking-[-0.01em] ${p.brand}`}>
            Ćwiczenia do E8<br className="hidden min-[360px]:block" /> z angielskiego
          </p>
          <p className={`mt-1 text-[0.6rem] tracking-[0.06em] uppercase ${p.meta}`}>
            © 2026 nAIczyciel
          </p>
        </div>

        {/* ── Legal links ───────────────────────────────────────── */}
        <div className="flex flex-col gap-1">
          {legalLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[0.72rem] leading-tight transition-colors duration-150 focus-visible:outline-none ${p.link}`}
              style={theme === "darkGlow" ? { color: "#000" } : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* ── Nav + social ─────────────────────────────────────── */}
        <div className="flex flex-col gap-1">
          {contentLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[0.72rem] leading-tight transition-colors duration-150 focus-visible:outline-none ${p.link}`}
              style={theme === "darkGlow" ? { color: "#000" } : undefined}
            >
              {item.label}
            </Link>
          ))}

          {showSocialLinks && (
            <div className="mt-2.5">
              <SocialLinks disableHover />
            </div>
          )}
        </div>

      </div>
    </footer>
  );
}
