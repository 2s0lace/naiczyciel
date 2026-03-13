import { ShieldCheck, Zap } from "lucide-react";

export default function PaymentSection() {
  return (
    <section className="mt-8 space-y-5 border-t border-white/5 pt-6">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-bold">W jednym miejscu: ćwiczenia, wyjaśnienia i analiza</h2>
        <p className="text-sm text-gray-500">Odblokuj pełny dostęp i zacznij naukę.</p>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] bg-indigo-600 p-6 shadow-xl shadow-indigo-900/20">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex items-end justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-widest text-indigo-200 uppercase">Pakiet E8 2026</span>
            <div className="text-3xl font-black text-white">49 zł</div>
          </div>
          <div className="text-right">
            <span className="mb-1 block text-[10px] font-bold text-indigo-100">Dostęp dożywotni</span>
            <div className="rounded-md bg-white/20 px-2 py-1 text-[9px] font-black tracking-tighter text-white uppercase">
              Bestseller
            </div>
          </div>
        </div>

        <button className="mt-6 w-full rounded-2xl bg-white py-4 text-xs font-black tracking-widest text-indigo-600 uppercase shadow-lg transition-all hover:bg-gray-100 active:scale-[0.98]">
          Wykup dostęp
        </button>

        <div className="mt-4 flex items-center justify-center gap-4 opacity-70">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-100">
            <ShieldCheck size={12} /> Bezpieczna płatność
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-100">
            <Zap size={12} /> Aktywacja od razu
          </div>
        </div>
      </div>
    </section>
  );
}

