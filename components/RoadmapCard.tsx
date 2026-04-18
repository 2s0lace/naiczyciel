import Link from "next/link";

interface RoadmapCardProps {
  notifyHref: string;
}

export function RoadmapCard({ notifyHref }: RoadmapCardProps) {
  return (
    <div className="group relative block h-full overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(9,14,30,0.98),rgba(6,10,24,0.97))] px-5 py-4 transition-[border-color,box-shadow] duration-[220ms] ease-[var(--ease-premium)] hover:border-white/16 hover:shadow-[0_0_22px_rgba(255,255,255,0.03),0_20px_44px_-34px_rgba(120,130,160,0.12)]">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        {/* Ambient gradient — warm-cool split */}
        <div className="absolute inset-0 bg-[linear-gradient(152deg,rgba(99,102,241,0.06)_0%,transparent_42%,rgba(168,85,247,0.04)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,20,0.6)_0%,rgba(5,9,22,0.42)_38%,rgba(5,9,22,0.74)_100%)]" />

        {/* Diagonal line accent */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px, transparent 41px, transparent 80px)",
          }}
        />

        {/* Corner glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_92%_8%,rgba(139,92,246,0.1),transparent_52%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full min-h-[14.5rem] flex-col md:min-h-[16rem]">
        <div className="space-y-3">
          {/* Label row */}
          <p className="text-[11px] font-semibold tracking-[0.11em] text-white/36 uppercase">
            Co dalej
          </p>

          {/* Headline */}
          <h2
            className="text-[1.85rem] leading-[1.12] text-white/90 md:text-[2rem]"
            style={{ fontFamily: "var(--font-figtree)", fontWeight: 900 }}
          >
            Więcej funkcji<br />
            <span className="text-white/40">w drodze</span>
          </h2>

          {/* Editorial description — features woven into natural text */}
          <p className="max-w-[30ch] text-[0.88rem] leading-[1.6] font-medium text-indigo-100/45 md:text-[0.92rem]">
            Pracujemy nad wsparciem dla&nbsp;matury, narzędziami
            dla&nbsp;korepetytorów i&nbsp;nauczycieli, oraz&nbsp;readerem
            arkuszy egzaminacyjnych.
          </p>
        </div>

        {/* Passive CTA — text link, not a button */}
        <Link
          href={notifyHref}
          className="mt-auto inline-flex items-center gap-1.5 self-start pt-3 text-[0.82rem] font-semibold text-white/28 transition-colors duration-150 hover:text-violet-300/60"
        >
          Powiadom mnie
          <span aria-hidden className="text-[0.72rem] transition-transform duration-[220ms] ease-[var(--ease-premium)] group-hover:translate-x-[2px]">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
