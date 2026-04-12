import Image from "next/image";
import Link from "next/link";
import { GraduationCap, Presentation } from "lucide-react";

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
  const isStudentE8Cta = tone === "student";

  const cardChromeClass = isTeacher
    ? "border-white/10 shadow-[0_0_22px_rgba(34,197,94,0.12),0_20px_44px_-34px_rgba(87,212,160,0.2)] hover:border-teacher/28 hover:shadow-[0_0_26px_rgba(34,197,94,0.16),0_24px_50px_-36px_rgba(87,212,160,0.3)]"
    : "border-emerald-300/40 shadow-[0_0_20px_rgba(52,211,153,0.15),0_24px_52px_-38px_rgba(52,211,153,0.32)] hover:border-emerald-200/52 hover:shadow-[0_0_24px_rgba(52,211,153,0.22),0_30px_60px_-40px_rgba(52,211,153,0.42)]";

  const radialToneClass = isTeacher
    ? "bg-[radial-gradient(circle_at_86%_12%,rgba(87,212,160,0.24),rgba(87,212,160,0)_58%)]"
    : "bg-[radial-gradient(circle_at_84%_10%,rgba(52,211,153,0.22),rgba(52,211,153,0)_56%)]";

  const ambientToneClass = isTeacher
    ? "bg-[linear-gradient(140deg,rgba(41,112,85,0.26),rgba(8,24,20,0.08)_44%,rgba(87,212,160,0.18)_100%)]"
    : "bg-[linear-gradient(138deg,rgba(16,185,129,0.24),rgba(5,46,22,0.08)_42%,rgba(52,211,153,0.2)_100%)]";

  const labelToneClass = isTeacher ? "text-emerald-100/78" : "text-emerald-100/72";

  const statusToneClass = isTeacher
    ? "border-teacher/40 bg-teacher/14 text-teacher"
    : "border-emerald-400/40 bg-emerald-400/14 text-emerald-400";

  const ctaToneClass = isTeacher
    ? "border-teacher/45 bg-[linear-gradient(135deg,rgba(87,212,160,0.30),rgba(47,118,90,0.5))] text-emerald-50 group-hover:border-teacher/65"
    : "border-emerald-300/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.32),rgba(5,150,105,0.40))] text-emerald-50 group-hover:border-emerald-200/50";

  const ctaGlowClass = isTeacher
    ? "group-hover:shadow-[0_10px_24px_-14px_rgba(87,212,160,0.72)]"
    : "group-hover:shadow-[0_10px_24px_-14px_rgba(52,211,153,0.72)]";

  return (
    <Link
      href={href}
      className={`group relative block h-full overflow-hidden rounded-3xl border bg-[linear-gradient(160deg,rgba(9,14,30,0.98),rgba(6,10,24,0.97))] px-5 py-4 transition-[border-color,box-shadow,transform,opacity] duration-[220ms] ease-[var(--ease-premium)] hover:-translate-y-[3px] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 ${cardChromeClass} ${
        isTeacher ? "opacity-75" : ""
      }`}
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
        <div className={`absolute inset-0 ${ambientToneClass}`} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,20,0.68)_0%,rgba(5,9,22,0.48)_38%,rgba(5,9,22,0.76)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(155deg,rgba(5,9,22,0.5),rgba(7,12,27,0.38)_48%,rgba(7,12,27,0.56))]" />
        <div className={`absolute inset-0 ${radialToneClass}`} />
        <div
          className={`absolute inset-0 opacity-0 transition-opacity duration-[220ms] ease-[var(--ease-premium)] group-hover:opacity-100 ${
            isTeacher
              ? "bg-[radial-gradient(circle_at_85%_18%,rgba(87,212,160,0.11),rgba(87,212,160,0)_58%)]"
              : "bg-[radial-gradient(circle_at_84%_16%,rgba(52,211,153,0.12),rgba(52,211,153,0)_58%)]"
          }`}
        />
        <div className={`absolute right-4 bottom-3 text-emerald-200 opacity-[0.05]`}>
          {isTeacher ? <Presentation size={80} strokeWidth={1.8} /> : <GraduationCap size={80} strokeWidth={1.8} />}
        </div>
      </div>

      <div className="relative z-10 flex h-full min-h-[14.5rem] flex-col md:min-h-[16rem]">
        <div className="space-y-2.5">
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
          className={`mt-auto self-start pt-3 inline-flex items-center gap-2 rounded-xl border text-sm font-semibold transition-[border-color,filter,transform,box-shadow] duration-150 ease-out group-hover:brightness-110 group-active:scale-[0.96] ${
            isStudentE8Cta
              ? "w-[10.25rem] justify-center px-3.5 py-2.5 md:w-fit md:justify-start md:px-4 md:py-2.5"
              : "w-fit px-4 py-2.5"
          } ${ctaToneClass} ${ctaGlowClass}`}
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
