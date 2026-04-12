import type { ReactNode } from "react";
import Link from "next/link";
import { buttonVariants, type ButtonVariant } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FeatureItem = {
  icon: string;
  title: string;
  description: string;
};

type SplitLandingHeroProps = {
  kicker: string;
  title: string;
  description: string;
  cta: {
    href: string;
    label: string;
    variant?: ButtonVariant;
  };
  tone: "student" | "teacher";
  featureItems: [FeatureItem, FeatureItem, FeatureItem] | FeatureItem[];
  panel: ReactNode;
};

export function SplitLandingHero({
  kicker,
  title,
  description,
  cta,
  tone,
  featureItems,
  panel,
}: SplitLandingHeroProps) {
  return (
    <section className="relative overflow-hidden py-10 sm:py-14 lg:py-24 xl:py-28">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-10",
          tone === "student"
            ? "bg-[radial-gradient(circle_at_24%_20%,rgba(108,134,255,0.22),transparent_56%)]"
            : "bg-[radial-gradient(circle_at_24%_20%,rgba(87,212,160,0.2),transparent_56%)]",
        )}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(3,7,18,0.25)_0%,rgba(3,7,18,0)_32%,rgba(3,7,18,0.35)_100%)]"
        aria-hidden
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:items-start lg:gap-14 xl:gap-20">
        <div className="max-w-[43rem]">
          <p className="type-kicker mb-4 sm:mb-5">{kicker}</p>
          <h1 className="text-[clamp(2.45rem,8vw,5.3rem)] leading-[0.96] font-bold tracking-[-0.02em] text-app sm:max-w-[11ch]">
            {title}
          </h1>
          <p className="mt-4 max-w-[52ch] text-[1.02rem] leading-8 text-app-muted sm:mt-6 sm:text-[1.18rem]">
            {description}
          </p>

          <ul className="mt-8 space-y-3.5 sm:mt-10" aria-label="Kluczowe korzyści">
            {featureItems.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base",
                      tone === "student"
                        ? "bg-student/14 text-student"
                        : "bg-teacher/14 text-teacher",
                    )}
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-app sm:text-[1.1rem]">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-app-muted sm:text-[0.98rem]">
                      {item.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 sm:mt-10">
            <Link
              href={cta.href}
              className={buttonVariants({
                variant: cta.variant ?? (tone === "student" ? "student" : "teacher"),
                size: "lg",
                className: "h-12 rounded-full px-8 text-[1rem] font-semibold",
              })}
            >
              {cta.label}
            </Link>
          </div>
        </div>

        <div className="lg:translate-x-2 lg:pt-8 xl:translate-x-5 xl:pt-10">
          <div className="mx-auto w-full max-w-[40rem] lg:max-w-[44rem]">{panel}</div>
        </div>
      </div>
    </section>
  );
}

