export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  description: string;
  featured?: boolean;
};

type PricingCardProps = {
  plan: PricingPlan;
  onSelect?: (plan: PricingPlan) => void;
};

export default function PricingCard({ plan, onSelect }: PricingCardProps) {
  return (
    <article
      className={`relative h-full overflow-hidden rounded-2xl border p-4 transition-[transform,border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none md:rounded-3xl md:p-5 lg:p-[1.15rem] ${
        plan.featured
          ? "border-indigo-300/35 bg-gradient-to-br from-indigo-500/20 via-indigo-500/10 to-slate-900/60 shadow-[0_12px_28px_-16px_rgba(99,102,241,0.7)] lg:hover:-translate-y-1.5 lg:hover:border-indigo-200/50 lg:hover:shadow-[0_20px_42px_-22px_rgba(99,102,241,0.85)]"
          : "border-white/10 bg-white/[0.02] lg:hover:-translate-y-1 lg:hover:border-white/16 lg:hover:bg-white/[0.03] lg:hover:shadow-[0_16px_34px_-24px_rgba(0,0,0,0.9)]"
      }`}
    >
      {plan.featured && (
        <span className="absolute right-3 top-3 rounded-full border border-indigo-200/40 bg-indigo-400/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-100">
          Najlepsza opcja
        </span>
      )}

      <div className="flex h-full flex-col space-y-3.5 lg:space-y-3">
        <div className={plan.featured ? "min-h-[4.75rem] pr-24 md:pr-28" : "min-h-[4.75rem]"}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-300">{plan.name}</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-white md:text-[2.05rem] lg:text-[2rem]">{plan.price}</p>
        </div>

        <p className="text-sm leading-relaxed text-gray-300 lg:min-h-[4.6rem]">{plan.description}</p>

        <p className="text-[11px] text-gray-400 lg:min-h-[1rem]">Pełny dostęp do ćwiczeń, wyjaśnień i analizy.</p>

        <div className="mt-auto pt-1.5 lg:pt-2">
          <button
            type="button"
            onClick={() => onSelect?.(plan)}
            className={`w-full rounded-xl border py-2.5 text-sm font-semibold transition-[transform,background-color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/40 motion-reduce:transform-none ${
              plan.featured
                ? "border-indigo-300/40 bg-indigo-500 text-white shadow-[0_10px_22px_-14px_rgba(99,102,241,0.7)] hover:bg-indigo-400 hover:shadow-[0_14px_26px_-14px_rgba(99,102,241,0.8)]"
                : "border-white/18 bg-white/[0.08] text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_20px_-16px_rgba(0,0,0,0.85)] hover:border-white/28 hover:bg-white/[0.12] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_12px_24px_-18px_rgba(0,0,0,0.92)]"
            }`}
          >
            Wybierz
          </button>
        </div>
      </div>
    </article>
  );
}
