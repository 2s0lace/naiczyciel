import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StepCardProps = {
  step: string;
  title: string;
  children: ReactNode;
};

function StepCard({ step, title, children }: StepCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-[1.125rem]">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-app-muted">{step}</p>
      <p className="mt-1.5 text-lg font-semibold text-app">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function EduPreviewPanel() {
  return (
    <Card
      tone="neutral"
      className="relative overflow-hidden rounded-[1.9rem] border border-white/12 bg-[linear-gradient(145deg,rgba(7,25,24,0.98),rgba(6,18,17,0.94))] p-0 shadow-[0_35px_95px_-45px_rgba(58,154,119,0.55)]"
    >
      <div className="border-b border-white/10 px-5 py-4 text-xs font-semibold tracking-[0.14em] text-app-muted sm:px-6">
        GENERATOR EDU
      </div>

      <div className="space-y-3.5 p-5 sm:p-6">
        <StepCard step="Krok 1" title="Wybierz temat">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-teacher/35 bg-teacher/12 px-3 py-1.5 text-sm text-teacher">
              Present Simple
            </span>
            <span className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-app">
              Klasa 7-8
            </span>
          </div>
        </StepCard>

        <StepCard step="Krok 2" title="AI generuje pytania">
          <div className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-3.5">
            <p className="text-sm text-app">Przetwarzanie 10 pytań...</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className={cn("h-full w-2/3 rounded-full bg-teacher")} />
            </div>
          </div>
        </StepCard>

        <StepCard step="Krok 3" title="Wyślij link uczniom">
          <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-black/25 p-2">
            <p className="min-w-0 flex-1 truncate px-2 text-sm text-app-muted">naiczyciel.pl/edu/123</p>
            <button
              type="button"
              className="rounded-lg border border-teacher/40 bg-teacher/14 px-3 py-1.5 text-sm font-medium text-teacher"
            >
              Kopiuj
            </button>
          </div>
        </StepCard>
      </div>

      <div className="pointer-events-none absolute -right-2 top-4 rounded-2xl border border-white/14 bg-[#102826]/95 px-3.5 py-2.5 shadow-xl sm:right-4">
        <p className="text-sm font-semibold text-app">✨  Gotowe!</p>
        <p className="text-xs text-app-muted">Quiz wygenerowany</p>
      </div>
    </Card>
  );
}

