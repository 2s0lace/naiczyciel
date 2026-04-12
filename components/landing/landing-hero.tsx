import Link from "next/link";
import { buttonVariants, type ButtonVariant } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type HeroAction = {
  href: string;
  label: string;
  variant?: ButtonVariant;
};

type LandingHeroProps = {
  kicker: string;
  title: string;
  description: string;
  primaryAction: HeroAction;
  secondaryAction?: HeroAction;
  tone?: "student" | "teacher";
};

export function LandingHero({
  kicker,
  title,
  description,
  primaryAction,
  secondaryAction,
  tone,
}: LandingHeroProps) {
  return (
    <section className="section-space">
      <Card
        tone={tone ?? "neutral"}
        className={cn(
          "space-y-5 p-5 sm:p-7",
          tone === "student" && "glow-student",
          tone === "teacher" && "glow-teacher",
        )}
      >
        <p className="type-kicker">{kicker}</p>
        <div className="space-y-3">
          <h1 className="type-h1 max-w-[15ch]">{title}</h1>
          <p className="type-lead max-w-[56ch]">{description}</p>
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
          <Link
            href={primaryAction.href}
            className={buttonVariants({
              variant:
                primaryAction.variant ?? (tone === "teacher" ? "teacher" : "student"),
              size: "lg",
            })}
          >
            {primaryAction.label}
          </Link>

          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className={buttonVariants({
                variant: secondaryAction.variant ?? "secondary",
                size: "lg",
              })}
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
