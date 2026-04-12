import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EntryCardTone = "student" | "teacher";

type EntryCardProps = {
  href: string;
  imageSrc: string;
  title: string;
  description: string;
  ctaLabel: string;
  tone: EntryCardTone;
};

const overlayClassByTone: Record<EntryCardTone, string> = {
  student: "from-[#0b1224]/90 via-[#111f44]/55 to-[#0b1224]/95",
  teacher: "from-[#081720]/90 via-[#103228]/55 to-[#081720]/95",
};

const glowClassByTone: Record<EntryCardTone, string> = {
  student: "glow-student",
  teacher: "glow-teacher",
};

export function EntryCard({
  href,
  imageSrc,
  title,
  description,
  ctaLabel,
  tone,
}: EntryCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
    >
      <Card
        tone={tone}
        interactive
        className={cn(
          "group relative min-h-[18rem] overflow-hidden p-0",
          glowClassByTone[tone],
        )}
      >
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          priority
        />
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t",
            overlayClassByTone[tone],
          )}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_48%)]"
          aria-hidden
        />

        <div className="relative z-10 flex h-full flex-col justify-end gap-3 p-5 sm:p-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
            <p className="max-w-[28ch] text-sm leading-relaxed text-slate-200">
              {description}
            </p>
          </div>

          <span
            className={buttonVariants({
              variant: tone === "student" ? "student" : "teacher",
              size: "md",
            })}
          >
            {ctaLabel}
          </span>
        </div>
      </Card>
    </Link>
  );
}
