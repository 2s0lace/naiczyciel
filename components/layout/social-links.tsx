"use client";

import type { ReactNode } from "react";
import { Instagram } from "lucide-react";
import { cn } from "@/lib/utils";

const SOCIAL_URLS = {
  instagram: "https://www.instagram.com/naiczyciel",
  tiktok: "https://www.tiktok.com/@naiczyciel",
  discord: "https://discord.gg/w84qAVCN",
} as const;

type SocialLinksProps = {
  className?: string;
};

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M15.73 2.63c.98 1.13 2.17 1.83 3.64 1.92v2.79a6.63 6.63 0 0 1-3.62-1.08v6.08a5.95 5.95 0 1 1-5.13-5.9v2.88a3.08 3.08 0 1 0 2.25 2.96V2.63h2.86Z"
      />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M20.32 4.37a17.3 17.3 0 0 0-4.32-1.35l-.2.4c-.23.46-.49 1.08-.67 1.56a16 16 0 0 0-6.24 0c-.2-.49-.45-1.1-.68-1.56l-.19-.4a17.25 17.25 0 0 0-4.33 1.35C.95 8.58.2 12.68.57 16.72A17.47 17.47 0 0 0 5.9 19.4l.64-1.04c-.76-.28-1.49-.64-2.16-1.05l.52-.42c2.08.97 4.34 1.47 6.63 1.47s4.54-.5 6.62-1.47l.53.42a13.7 13.7 0 0 1-2.16 1.05l.64 1.04a17.42 17.42 0 0 0 5.33-2.68c.44-4.68-.74-8.74-3.17-12.35ZM8.84 14.24c-.96 0-1.74-.88-1.74-1.96 0-1.08.77-1.96 1.74-1.96.97 0 1.75.88 1.74 1.96 0 1.08-.77 1.96-1.74 1.96Zm6.43 0c-.96 0-1.74-.88-1.74-1.96 0-1.08.78-1.96 1.74-1.96.97 0 1.75.88 1.74 1.96 0 1.08-.77 1.96-1.74 1.96Z"
      />
    </svg>
  );
}

function SocialIconButton({ label, href, icon }: { label: string; href: string; icon: ReactNode }) {
  const isConfigured = href.trim().length > 0;

  if (!isConfigured) {
    return (
      <span
        title={`${label} (wkleję link gdy go podasz)`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-[#0b1226]/70 text-indigo-100/75"
        aria-label={label}
      >
        {icon}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-[#0b1226]/76 text-indigo-100/85 transition-[border-color,background-color,color,transform] duration-150 hover:border-indigo-200/45 hover:bg-[#121b39] hover:text-white active:scale-[0.98]"
    >
      {icon}
    </a>
  );
}

export function SocialLinks({ className }: SocialLinksProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <SocialIconButton label="Instagram" href={SOCIAL_URLS.instagram} icon={<Instagram className="h-[17px] w-[17px]" strokeWidth={2.1} />} />
      <SocialIconButton label="TikTok" href={SOCIAL_URLS.tiktok} icon={<TikTokIcon className="h-[17px] w-[17px]" />} />
      <SocialIconButton label="Discord" href={SOCIAL_URLS.discord} icon={<DiscordIcon className="h-[17px] w-[17px]" />} />
    </div>
  );
}

