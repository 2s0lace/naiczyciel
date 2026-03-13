"use client";

import Link from "next/link";

const footerLinks = [
  { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
  { href: "/polityka-cookies", label: "Polityka cookies" },
  { href: "/regulamin", label: "Regulamin" },
  { href: "/korepetycje", label: "Korepetycje" },
  { href: "/co-nowego", label: "Co nowego" },
  { href: "/credits", label: "Credits" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="z-10 mx-auto w-full max-w-6xl px-5 pb-7 text-center md:px-6 md:pb-9">
      <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      <p className="mt-4 text-sm font-medium tracking-tight text-white/68">nAIczyciel</p>

      <nav className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm text-indigo-100/54">
        {footerLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded px-1 py-0.5 transition-colors duration-150 hover:text-white/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/35"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <p className="mt-3 text-xs text-gray-500/85">© 2026 nAIczyciel • Uczciwie, konkretnie, bez magii.</p>
    </footer>
  );
}

