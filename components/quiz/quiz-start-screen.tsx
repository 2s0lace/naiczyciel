"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type QuizStartScreenProps = {
  mode: string;
};

type StartSessionResponse = {
  sessionId?: string;
  mode?: string;
  error?: string;
  details?: string;
};

export function QuizStartScreen({ mode }: QuizStartScreenProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      return token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : {};
    } catch {
      return {};
    }
  };

  const startSession = async () => {
    setIsStarting(true);
    setError(null);

    try {
      const authHeaders = await getAuthHeaders();

      const response = await fetch("/api/e8/quiz/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          mode,
          questionCount: 10,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as StartSessionResponse;

      if (!response.ok) {
        const message = data.error ?? data.details ?? "Nie udało się rozpocząć sesji.";
        throw new Error(message);
      }

      if (!data.sessionId) {
        throw new Error("Nieprawidłowa odpowiedź serwera.");
      }

      router.push(
        `/e8/quiz/${encodeURIComponent(data.sessionId)}?mode=${encodeURIComponent(data.mode ?? mode)}&sessionId=${encodeURIComponent(data.sessionId)}`,
      );
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Wystąpił nieznany błąd.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050510] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-3">
          <Link
            href="/e8"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/14 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-gray-100 transition-colors hover:border-white/24 hover:bg-white/[0.08]"
          >
            <ChevronLeft className="h-4 w-4" />
            Wróć do E8
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0b0c1b] p-5 shadow-[0_30px_50px_-40px_rgba(79,70,229,0.65)]">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-indigo-200/80 uppercase">E8 Quiz</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Szybka sesja mobilna</h1>
          <p className="mt-3 text-sm leading-6 text-indigo-100/80">
            10 pytań, natychmiastowy feedback, zapis odpowiedzi w tle. Skupiony flow pod ekran telefonu.
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-indigo-100/80">
            Tryb: <span className="font-semibold text-white">{mode}</span>
          </div>

          <button
            type="button"
            onClick={startSession}
            disabled={isStarting}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 py-4 text-base font-semibold text-white transition-all duration-150 active:scale-[0.992] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStarting ? "Tworzenie sesji..." : "Start sesji"}
          </button>

          {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}
        </div>
      </div>
    </main>
  );
}

