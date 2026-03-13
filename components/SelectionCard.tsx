import Image from "next/image";
import Link from "next/link";

type SelectionCardTone = "student" | "teacher";

interface SelectionCardProps {
  label: string;
  title: string;
  description: string;
  buttonText: string;
  href: string;
  imageSrc: string;
  altText: string;
  tone?: SelectionCardTone;
  statusText?: string;
  showArrow?: boolean;
}

export const SelectionCard = ({
  label,
  title,
  description,
  buttonText,
  href,
  imageSrc,
  altText,
  tone = "student",
  statusText,
  showArrow = true,
}: SelectionCardProps) => {
  const isTeacher = tone === "teacher";

  const cardChromeClass = isTeacher
    ? "border-white/13 shadow-[0_24px_52px_-38px_rgba(87,212,160,0.34)] hover:border-teacher/40 hover:shadow-[0_32px_62px_-42px_rgba(87,212,160,0.48)]"
    : "border-white/13 shadow-[0_24px_52px_-38px_rgba(79,70,229,0.42)] hover:border-student/42 hover:shadow-[0_30px_60px_-40px_rgba(79,70,229,0.54)]";

  const radialToneClass = isTeacher
    ? "bg-[radial-gradient(circle_at_top_right,rgba(87,212,160,0.16),rgba(87,212,160,0)_58%)]"
    : "bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),rgba(99,102,241,0)_58%)]";

  const labelToneClass = isTeacher ? "text-emerald-100/78" : "text-indigo-100/72";

  const statusToneClass = isTeacher
    ? "border-teacher/40 bg-teacher/14 text-teacher"
    : "border-student/40 bg-student/14 text-student";

  const ctaToneClass = isTeacher
    ? "border-teacher/45 bg-[linear-gradient(135deg,rgba(87,212,160,0.30),rgba(47,118,90,0.5))] text-emerald-50 group-hover:border-teacher/65"
    : "border-indigo-200/24 bg-[linear-gradient(135deg,rgba(79,70,229,0.32),rgba(37,99,235,0.25))] text-white group-hover:border-indigo-100/44";

  const ctaGlowClass = isTeacher
    ? "group-hover:shadow-[0_10px_24px_-14px_rgba(87,212,160,0.72)]"
    : "group-hover:shadow-[0_10px_24px_-14px_rgba(99,102,241,0.8)]";

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-3xl border bg-[linear-gradient(160deg,rgba(9,14,30,0.98),rgba(6,10,24,0.97))] p-6 transition-[border-color,box-shadow,transform] duration-[220ms] ease-[var(--ease-premium)] hover:-translate-y-[3px] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 ${cardChromeClass}`}
      aria-label={`${title} - ${buttonText}`}
    >
      <div className="pointer-events-none absolute inset-0">
        <Image
          src={imageSrc}
          alt={altText}
          fill
          className="object-cover object-center opacity-[0.34] saturate-[0.82] brightness-[0.56] contrast-[1.03] transition-[transform,opacity,filter] duration-[240ms] ease-[var(--ease-premium)] group-hover:translate-y-[-1px] group-hover:scale-[1.015] group-hover:opacity-[0.38] group-hover:saturate-[0.87]"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,20,0.68)_0%,rgba(5,9,22,0.48)_38%,rgba(5,9,22,0.76)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(155deg,rgba(5,9,22,0.5),rgba(7,12,27,0.38)_48%,rgba(7,12,27,0.56))]" />
        <div className={`absolute inset-0 ${radialToneClass}`} />
        <div
          className={`absolute inset-0 opacity-0 transition-opacity duration-[220ms] ease-[var(--ease-premium)] group-hover:opacity-100 ${
            isTeacher
              ? "bg-[radial-gradient(circle_at_85%_18%,rgba(87,212,160,0.11),rgba(87,212,160,0)_58%)]"
              : "bg-[radial-gradient(circle_at_84%_16%,rgba(99,102,241,0.12),rgba(99,102,241,0)_58%)]"
          }`}
        />
      </div>

      <div className="relative z-10 flex min-h-[14.5rem] flex-col justify-between md:min-h-[16rem]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-[11px] font-semibold tracking-[0.11em] uppercase ${labelToneClass}`}>{label}</p>
            {statusText ? (
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-[0.08em] uppercase ${statusToneClass}`}>
                {statusText}
              </span>
            ) : null}
          </div>

          <h2
            className="text-3xl leading-tight text-white md:text-[2rem]"
            style={{ fontFamily: "var(--font-figtree)", fontWeight: 900 }}
          >
            {title}
          </h2>
          <p className="max-w-[34ch] text-sm leading-relaxed text-indigo-100/80 md:text-[0.95rem]">{description}</p>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-[border-color,filter,transform,box-shadow] duration-[220ms] ease-[var(--ease-premium)] group-hover:brightness-110 ${ctaToneClass} ${ctaGlowClass}`}
        >
          {buttonText}
          {showArrow ? (
            <span aria-hidden className="transition-transform duration-[220ms] ease-[var(--ease-premium)] group-hover:translate-x-[2px]">
              &rarr;
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
};
