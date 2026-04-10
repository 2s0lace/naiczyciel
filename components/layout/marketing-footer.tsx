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
    nav: "text-slate-300/88 [text-shadow:0_0_10px_rgba(226,232,240,0.16)]",
    brandEyebrow: "text-slate-400/80",
    brandBody: "text-slate-300/85",
    brandMeta: "text-slate-400/70",
    divider: "bg-slate-300/18 shadow-[0_0_12px_rgba(226,232,240,0.12)]",
    link: "text-slate-300/82 hover:text-slate-100 focus-visible:ring-slate-200/20",
  },
  darkGlow: {
    nav: "text-black/78 [text-shadow:0_0_10px_rgba(255,255,255,0.3)]",
    brandEyebrow: "text-black/62",
    brandBody: "text-black/72",
    brandMeta: "text-black/58",
    divider: "bg-black/16 shadow-[0_0_12px_rgba(255,255,255,0.18)]",
    link: "text-black/72 hover:text-black/90 focus-visible:ring-black/15",
  },
} as const;

const footerOffsets = {
  flush: "translate-y-0 md:translate-y-0",
  raised: "translate-y-[12%] md:translate-y-[10%]",
} as const;

export function MarketingFooter({
  showSocialLinks = false,
  theme = "light",
  offset = "flush",
}: MarketingFooterProps) {
  const palette = footerThemes[theme];

  return (
    <footer
      className={`relative z-[30] mx-auto mt-2 w-full max-w-6xl px-5 pb-6 text-center md:mt-3 md:px-6 md:pb-8 xl:max-w-[82rem] xl:px-10 2xl:max-w-[94rem] 2xl:px-12 min-[2200px]:max-w-[112rem] min-[2200px]:px-16 ${footerOffsets[offset]}`}
    >
      <nav
        className={`mx-auto flex w-full max-w-[74rem] flex-col items-center gap-3.5 text-[0.92rem] min-[769px]:grid min-[769px]:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)_minmax(0,1.08fr)] min-[769px]:items-center min-[769px]:gap-7 min-[769px]:text-sm ${palette.nav}`}
      >
        <div className="flex w-full max-w-[23rem] flex-col items-center gap-1 min-[769px]:max-w-none min-[769px]:items-start min-[769px]:justify-self-start min-[769px]:text-left">
          <p className={`text-[0.72rem] font-semibold tracking-[0.28em] uppercase ${palette.brandEyebrow}`}>nAIczyciel</p>
          <p
            className={`max-w-[24ch] text-[0.95rem] leading-tight tracking-[-0.015em] min-[769px]:max-w-[23ch] min-[769px]:text-[0.94rem] ${palette.brandBody}`}
          >
            nAIczyciel - ćwiczenia do E8 z angielskiego
          </p>
          <p className={`text-[0.68rem] leading-none tracking-[0.08em] uppercase ${palette.brandMeta}`}>© 2026 nAIczyciel</p>
        </div>

        <div className="flex w-full flex-col items-center gap-2 min-[769px]:justify-self-center min-[769px]:gap-2">
          <div aria-hidden className={`h-px w-24 min-[769px]:w-full min-[769px]:max-w-[18rem] ${palette.divider}`} />
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 min-[769px]:gap-x-5">
            {legalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-1 py-0.5 leading-tight transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 ${palette.link}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex w-full max-w-[23rem] flex-col items-center gap-3 min-[769px]:max-w-none min-[769px]:items-end min-[769px]:justify-self-end min-[769px]:text-right">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 min-[769px]:justify-end min-[769px]:gap-x-5">
            {contentLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-1 py-0.5 leading-tight transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 ${palette.link}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {showSocialLinks ? (
            <div className="flex justify-center min-[769px]:mt-0.5 min-[769px]:justify-end">
              <SocialLinks className="gap-2" disableHover />
            </div>
          ) : null}
        </div>
      </nav>
    </footer>
  );
}
