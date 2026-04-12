type ExplanationPanelProps = {
  isCorrect: boolean;
  explanation: string;
  patternTip?: string;
  warningTip?: string;
};

function sanitizePattern(value: string) {
  return value.replace(/^pattern\s*:\s*/i, "").trim();
}

function sanitizeWarning(value: string) {
  return value.replace(/^uwaga\s*:\s*/i, "").trim();
}

export function ExplanationPanel({ isCorrect, explanation, patternTip, warningTip }: ExplanationPanelProps) {
  const sections = [
    {
      title: "Dlaczego?",
      titleClassName: "text-emerald-300",
      content: explanation,
    },
    patternTip
      ? {
          title: "Wzorzec",
          titleClassName: "text-cyan-300",
          content: sanitizePattern(patternTip),
        }
      : null,
    warningTip
      ? {
          title: "Uwaga",
          titleClassName: "text-amber-300",
          content: sanitizeWarning(warningTip),
        }
      : null,
  ].filter((section): section is { title: string; titleClassName: string; content: string } => section !== null);

  return (
    <section
      className={`mt-2.5 rounded-2xl px-3.5 py-3.5 ring-1 shadow-[0_24px_34px_-28px_rgba(16,185,129,0.42)] xl:mt-3 xl:px-4.5 xl:py-4.5 ${
        isCorrect
          ? "bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.18),rgba(4,18,22,0.95)_60%,rgba(3,10,14,0.98)_100%)] ring-emerald-300/26"
          : "bg-[radial-gradient(circle_at_50%_0%,rgba(244,63,94,0.18),rgba(24,7,14,0.95)_60%,rgba(15,6,10,0.98)_100%)] ring-rose-300/24 shadow-[0_24px_34px_-28px_rgba(244,63,94,0.42)]"
      }`}
    >
      <div className="space-y-2.5 xl:space-y-3">
        {sections.map((section, index) => (
          <div key={section.title} className={index > 0 ? "border-t border-white/10 pt-2.5 xl:pt-3" : ""}>
            <p className={`text-[10px] font-bold tracking-[0.11em] uppercase xl:text-[11px] ${section.titleClassName}`}>{section.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-white/92 xl:mt-1.5 xl:text-[14px]">{section.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
