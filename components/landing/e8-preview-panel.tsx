import { Card } from "@/components/ui/card";

export function E8PreviewPanel() {
  return (
    <Card
      tone="neutral"
      className="relative overflow-hidden rounded-[1.9rem] border border-white/12 bg-[linear-gradient(145deg,rgba(11,20,43,0.98),rgba(8,14,30,0.94))] p-0 shadow-[0_35px_95px_-45px_rgba(76,96,199,0.55)]"
    >
      <div className="border-b border-white/10 px-5 py-4 text-xs font-semibold tracking-[0.14em] text-app-muted sm:px-6">
        ANGIELSKI E8
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <p className="text-lg font-semibold leading-8 text-app sm:text-2xl">
          X: I&apos;m sorry I&apos;m late. The bus didn&apos;t arrive.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-red-400/35 bg-red-500/9 px-4 py-3.5">
            <span className="text-sm font-medium text-red-100 sm:text-base">A  It doesn&apos;t matter.</span>
            <span className="text-red-300">✕</span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-emerald-400/35 bg-emerald-500/9 px-4 py-3.5">
            <span className="text-sm font-medium text-emerald-100 sm:text-base">B  Never mind.</span>
            <span className="text-emerald-300">✓</span>
          </div>
        </div>

        <div className="rounded-2xl border border-student/30 bg-student/[0.12] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.09em] text-student">Dlaczego B?</p>
          <p className="mt-1.5 text-sm leading-6 text-app-muted sm:text-[0.96rem]">
            Używamy &quot;Never mind&quot; jako utartej reakcji językowej, która najlepiej pasuje do kontekstu.
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute -right-2 top-4 rounded-2xl border border-white/14 bg-[#141e3b]/95 px-3.5 py-2.5 shadow-xl sm:right-4">
        <p className="text-sm font-semibold text-app">🔥  3 dni</p>
        <p className="text-xs text-app-muted">Seria nauki</p>
      </div>
    </Card>
  );
}
