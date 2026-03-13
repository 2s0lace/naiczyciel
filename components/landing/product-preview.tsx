import { ArrowRight, TrendingUp, X } from "lucide-react";

type FeatureType = "sets" | "explanation" | "analysis";

export default function ProductPreview({ activeTab }: { activeTab: FeatureType }) {
  return (
    <div className="relative min-h-[220px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0F0F1A] shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full border border-red-500/50 bg-red-500/20" />
          <div className="h-2.5 w-2.5 rounded-full border border-yellow-500/50 bg-yellow-500/20" />
          <div className="h-2.5 w-2.5 rounded-full border border-green-500/50 bg-green-500/20" />
        </div>
        <span className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">Podgląd App</span>
      </div>

      <div className="p-5">
        {activeTab === "sets" && (
          <div className="space-y-4">
            <div>
              <span className="mb-2 block text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
                Pytanie 3/5
              </span>
              <p className="text-sm leading-relaxed font-medium text-white">
                X: I&apos;m sorry I&apos;m late. The bus didn&apos;t arrive.
                <br />
                Y: ___________
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-white/10 text-[10px] font-bold">
                  A
                </span>
                It doesn&apos;t matter.
              </div>
              <div className="relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-indigo-500/50 bg-indigo-500/10 px-4 py-3 text-sm text-white">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500" />
                <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-500 text-[10px] font-bold text-white">
                  B
                </span>
                Never mind.
              </div>
            </div>
          </div>
        )}

        {activeTab === "explanation" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
              <span className="flex items-center gap-3">
                <span className="font-bold">A.</span> It doesn&apos;t matter.
              </span>
              <X size={16} className="text-red-400" />
            </div>

            <div className="rounded-xl border border-indigo-500/20 bg-indigo-900/20 p-3">
              <div className="mb-2 flex items-center gap-2 text-indigo-300">
                <div className="rounded-md bg-indigo-500/20 p-1">
                  <ArrowRight size={12} />
                </div>
                <span className="text-[10px] font-bold tracking-wide uppercase">Dlaczego źle?</span>
              </div>
              <p className="text-xs leading-relaxed text-indigo-100/80">
                &quot;It doesn&apos;t matter&quot; brzmi lekceważąco. Do przyjęcia przeprosin pasuje
                &quot;Never mind&quot;.
              </p>
            </div>
          </div>
        )}

        {activeTab === "analysis" && (
          <div>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <span className="text-xs text-gray-400">Twój wynik</span>
                <div className="mt-1 text-3xl font-black text-white">68%</div>
              </div>
              <div className="text-right">
                <div className="mb-1 flex items-center justify-end gap-1 text-xs font-bold text-emerald-400">
                  <TrendingUp size={14} />
                  +12%
                </div>
                <span className="text-[10px] tracking-wider text-gray-500 uppercase">vs ostatnio</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold tracking-wider uppercase">
                  <span className="text-gray-300">Gramatyka</span>
                  <span className="text-orange-400">Do poprawy</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-[45%] bg-orange-500" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold tracking-wider uppercase">
                  <span className="text-gray-300">Słownictwo</span>
                  <span className="text-emerald-400">Świetnie</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-[85%] bg-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
