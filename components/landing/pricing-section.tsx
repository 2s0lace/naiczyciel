"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Zap } from "lucide-react";
import PricingCard, { type PricingPlan } from "@/components/landing/pricing-card";

const plans: PricingPlan[] = [
  {
    id: "3-days",
    name: "3 dni",
    price: "5 zł",
    description: "Na szybki start i krótkie powtórki.",
  },
  {
    id: "7-days",
    name: "7 dni",
    price: "11 zł",
    description: "Na intensywny tydzień nauki przed sprawdzianem lub egzaminem.",
  },
  {
    id: "30-days",
    name: "30 dni",
    price: "24 zł",
    description: "Najlepsza opcja do regularnej nauki i spokojnego przerabiania materiału.",
    featured: true,
  },
];

const LOGIN_TOAST_MS = 2600;

export default function PricingSection() {
  const [showLoginToast, setShowLoginToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToastTimer = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearToastTimer();
  }, []);

  const handleSelectPlan = () => {
    clearToastTimer();
    setShowLoginToast(true);

    toastTimerRef.current = setTimeout(() => {
      setShowLoginToast(false);
      toastTimerRef.current = null;
    }, LOGIN_TOAST_MS);
  };

  return (
    <>
      <section id="pricing"
        className="mt-8 space-y-5 border-t border-white/5 pt-6 md:mt-9 md:space-y-6 md:pt-7 lg:mt-7 lg:space-y-5 lg:pt-6"
        aria-labelledby="pricing-heading"
      >
        <div className="mx-auto max-w-[42rem] space-y-2 text-center lg:max-w-[48rem] lg:space-y-2">
          <h2 id="pricing-heading" className="text-xl font-bold text-white md:text-[1.42rem] lg:text-[1.48rem]">
            Wszystko, czego potrzebujesz
          </h2>
          <p className="mx-auto text-sm leading-relaxed text-gray-300 md:text-[0.98rem] lg:max-w-[43rem] lg:text-[0.99rem]">
            Ten sam dostęp, różny czas korzystania. Wybierz opcję, która najbardziej Ci pasuje.
          </p>
          <p className="mx-auto text-xs text-gray-400 md:text-[0.82rem]">Ćwiczenia, wyjaśnienia i analiza w jednym miejscu.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:gap-4 xl:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className={plan.featured ? "md:col-span-2 xl:col-span-1" : ""}>
              <PricingCard plan={plan} onSelect={handleSelectPlan} />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-gray-300 md:text-xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} /> Bezpieczna płatność
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={13} /> Aktywacja od razu
          </div>
        </div>
      </section>

      <div
        className={`pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 transition-[opacity,transform] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          showLoginToast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="rounded-xl border border-indigo-200/30 bg-[#0a1020]/94 px-4 py-2.5 text-sm font-medium text-indigo-100 shadow-[0_14px_30px_-20px_rgba(0,0,0,0.9)] backdrop-blur">
          Musisz się zalogować, aby kupić plan.
        </div>
      </div>
    </>
  );
}
