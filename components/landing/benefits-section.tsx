import { BarChart3, Brain, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionContainer } from "@/components/landing/ui/section-container";

type Benefit = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const benefits: Benefit[] = [
  {
    icon: Zap,
    title: "Krótkie sprinty dopasowane do arkusza",
    description: "Ćwiczysz konkretny typ zadań w 5-10 minut.",
  },
  {
    icon: Brain,
    title: "Wyjaśnienia błędów od razu",
    description: "Od razu wiesz, co poszło nie tak i jak to poprawić.",
  },
  {
    icon: BarChart3,
    title: "Analiza braków po zakończeniu",
    description: "Widzisz wynik i obszary, które warto powtórzyć.",
  },
];

export function BenefitsSection() {
  return (
    <section id="jak-to-dziala" className="pb-8 sm:pb-10">
      <SectionContainer>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <h2 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">Jak to działa?</h2>

          <ul className="mt-4 space-y-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <li key={benefit.title} className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-400/15 text-indigo-200">
                      <Icon size={16} />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100 sm:text-base">{benefit.title}</h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-300 sm:text-sm">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </SectionContainer>
    </section>
  );
}
