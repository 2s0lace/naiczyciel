"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildCanonicalCategoryBreakdown } from "@/lib/quiz/session-category-stats";
function isLocalSessionId(sessionId: string) {
  return sessionId.startsWith("local_");
}
import type { CategoryBreakdownItem, QuizAnswerSnapshot, QuizQuestion, QuizSummary } from "@/lib/quiz/types";

type QuizOpenAIFeedbackPanelProps = {
  sessionId: string;
  mode: string;
  summary: QuizSummary;
  questions?: QuizQuestion[];
  answers?: QuizAnswerSnapshot[];
};

const CANONICAL_LABEL_PL: Record<string, string> = {
  Reactions: "Reakcje",
  Vocabulary: "Słownictwo",
  Grammar: "Gramatyka",
  "Reading MC": "Czytanie",
};

const CANONICAL_ORDER = ["Reactions", "Vocabulary", "Grammar", "Reading MC"] as const;

function pickCanonicalBreakdown(
  questions: QuizQuestion[] | undefined,
  answers: QuizAnswerSnapshot[] | undefined,
  fallback: CategoryBreakdownItem[],
): CategoryBreakdownItem[] {
  if (questions && questions.length > 0 && answers) {
    return buildCanonicalCategoryBreakdown({ questions, answers });
  }

  const byLabel = new Map(fallback.map((item) => [item.label, item]));

  return CANONICAL_ORDER.map((label) => {
    const match = byLabel.get(label);

    if (match) {
      return match;
    }

    return {
      label,
      attempts: 0,
      correct: 0,
      percent: null,
      has_data: false,
    } as CategoryBreakdownItem;
  });
}

type StoredOpenAIFeedback = {
  feedback: string;
};

type OpenAIFeedbackSuccess = {
  feedback?: string;
};

type OpenAIFeedbackError = {
  error?: string;
  details?: string;
};

type FeedbackBlocks = {
  overall: string;
  strengths: string;
  improvements: string;
  plan7: string;
};

type BlockKey = keyof FeedbackBlocks;

const STORAGE_KEY_PREFIX = "e8_quiz_openai_feedback_v3_";
const EMPTY_BLOCKS: FeedbackBlocks = {
  overall: "",
  strengths: "",
  improvements: "",
  plan7: "",
};

function storageKeyFor(sessionId: string) {
  return `${STORAGE_KEY_PREFIX}${sessionId}`;
}

function normalizeToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
}

function cleanLine(value: string) {
  return value
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/[*_`>]/g, "")
    .replace(/^[-+*]\s*/, "")
    .replace(/^\d+[.)-]\s*/, "")
    .replace(/^"|"$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toOneSentence(value: string) {
  const parts = value
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const first = parts[0] ?? value.trim();
  return first.length > 180 ? `${first.slice(0, 177).trimEnd()}...` : first;
}

function detectBlock(line: string): BlockKey | null {
  const token = normalizeToken(line);

  if (!token) {
    return null;
  }

  if (token.startsWith("diagnoza") || token.startsWith("overall") || token.includes("ocena ogolna")) {
    return "overall";
  }

  if (token.startsWith("mocna strona") || token.startsWith("strength") || token.includes("co idzie dobrze")) {
    return "strengths";
  }

  if (token.startsWith("do poprawy") || token.startsWith("improvement") || token.includes("co poprawic")) {
    return "improvements";
  }

  if (token.startsWith("na teraz") || token.startsWith("plan") || token.includes("7 dni")) {
    return "plan7";
  }

  return null;
}

function stripLabel(value: string) {
  return cleanLine(
    value
      .replace(/^diagnoza\s*:\s*/i, "")
      .replace(/^overall\s*:\s*/i, "")
      .replace(/^ocena ogolna\s*:\s*/i, "")
      .replace(/^mocna strona\s*:\s*/i, "")
      .replace(/^strengths?\s*:\s*/i, "")
      .replace(/^co idzie dobrze\s*:\s*/i, "")
      .replace(/^do poprawy\s*:\s*/i, "")
      .replace(/^improvements?\s*:\s*/i, "")
      .replace(/^co poprawic\s*:\s*/i, "")
      .replace(/^na teraz\s*:\s*/i, "")
      .replace(/^plan(?: na 7 dni)?\s*:\s*/i, ""),
  );
}

function parseFeedback(rawFeedback: string): FeedbackBlocks {
  const text = rawFeedback.trim();

  if (!text) {
    return EMPTY_BLOCKS;
  }

  const blocks: FeedbackBlocks = {
    overall: "",
    strengths: "",
    improvements: "",
    plan7: "",
  };

  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map(cleanLine)
    .filter((line) => line.length > 0);

  let active: BlockKey | null = null;

  for (const line of lines) {
    const block = detectBlock(line);

    if (block) {
      active = block;
      const value = stripLabel(line);

      if (value && !blocks[block]) {
        blocks[block] = value;
      }

      continue;
    }

    if (active && !blocks[active]) {
      blocks[active] = stripLabel(line);
      continue;
    }

    if (!blocks.overall) {
      blocks.overall = stripLabel(line);
    }
  }

  blocks.overall = toOneSentence(blocks.overall || "Wynik pokazuje, na czym warto skupic kolejna sesje.");
  blocks.strengths = toOneSentence(blocks.strengths || "Masz juz dzialajace schematy w najlatwiejszych reakcjach.");
  blocks.improvements = toOneSentence(blocks.improvements || "Najwiecej zyskasz, poprawiajac powtarzalny blad z tego zestawu.");
  blocks.plan7 = toOneSentence(blocks.plan7 || "Przez 7 dni zrob codziennie jeden krotki zestaw z obszaru do poprawy.");

  return blocks;
}

function ReportLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-medium tracking-[0.12em] text-white/30 uppercase">{children}</p>;
}

function buildMockDiagnosis(parsed: FeedbackBlocks) {
  return [
    parsed.overall,
    `Najmocniej widać to tutaj: ${parsed.strengths.charAt(0).toLowerCase()}${parsed.strengths.slice(1)}`,
    `Do poprawy na kolejnej sesji: ${parsed.improvements.charAt(0).toLowerCase()}${parsed.improvements.slice(1)}`,
    `Na teraz najlepszy ruch to: ${parsed.plan7.charAt(0).toLowerCase()}${parsed.plan7.slice(1)}`,
  ].join(" ");
}

function cleanFeedbackText(value: string): string {
  return value
    .replace(/\r/g, "")
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*#{1,6}\s*/, "")
        .replace(/\*\*/g, "")
        .replace(/[*_`>]/g, "")
        .replace(/^\s*[-+•]\s*/, "")
        .replace(/^\s*\d+[.)-]\s*/, "")
        .replace(
          /^\s*(ocena\s+og[oó]lna|mocna\s+strona|mocne\s+strony|do\s+poprawy|na\s+teraz|plan(?:\s+na\s+7\s+dni)?|diagnoza|strengths?|improvements?|overall)\s*:\s*/i,
          "",
        )
        .trim(),
    )
    .filter((line) => line.length > 0)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function QuizOpenAIFeedbackPanel({
  sessionId,
  mode,
  summary,
  questions,
  answers,
}: QuizOpenAIFeedbackPanelProps) {
  const storageKey = useMemo(() => storageKeyFor(sessionId), [sessionId]);

  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasGeneratedForSession, setHasGeneratedForSession] = useState(false);
  const [hasAttemptedAutoGenerate, setHasAttemptedAutoGenerate] = useState(false);
  const [isCacheChecked, setIsCacheChecked] = useState(false);

  const requestInFlightRef = useRef(false);

  const diagnosisParagraph = useMemo(() => cleanFeedbackText(feedback), [feedback]);
  const canonicalBreakdown = useMemo(
    () => pickCanonicalBreakdown(questions, answers, summary.categoryBreakdown),
    [questions, answers, summary.categoryBreakdown],
  );

  const copyText = useMemo(() => diagnosisParagraph, [diagnosisParagraph]);

  const persist = useCallback(
    (payload: StoredOpenAIFeedback) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {
        // ignore storage failures
      }
    },
    [storageKey],
  );

  useEffect(() => {
    setFeedback("");
    setError("");
    setCopied(false);
    setHasGeneratedForSession(false);
    setHasAttemptedAutoGenerate(false);
    setIsCacheChecked(false);
    requestInFlightRef.current = false;
  }, [storageKey]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);

      if (!raw) {
        return;
      }

      const parsedCache = JSON.parse(raw) as Partial<StoredOpenAIFeedback>;
      const cachedFeedback = typeof parsedCache.feedback === "string" ? parsedCache.feedback.trim() : "";

      if (!cachedFeedback) {
        return;
      }

      setFeedback(cachedFeedback);
      setHasGeneratedForSession(true);
      setHasAttemptedAutoGenerate(true);
    } catch {
      // ignore invalid cache
    } finally {
      setIsCacheChecked(true);
    }
  }, [storageKey]);

  const requestFeedback = useCallback(
    async (force = false) => {
      if (requestInFlightRef.current || isLoading) {
        return;
      }

      if (!force && hasGeneratedForSession) {
        return;
      }

      requestInFlightRef.current = true;
      setIsLoading(true);
      setError("");

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (!isLocalSessionId(sessionId)) {
          try {
            const supabase = getSupabaseBrowserClient();
            const { data } = await supabase.auth.getSession();
            const accessToken = data.session?.access_token;

            if (accessToken) {
              headers.Authorization = `Bearer ${accessToken}`;
            }
          } catch {
            // ignore; backend will return 401 if token truly required
          }
        }

        const bodyPayload: Record<string, unknown> = { mode };

        // For local sessions the server has no persistent store (serverless),
        // so we ship the full questions + answers in the request body.
        if (isLocalSessionId(sessionId) && questions && answers) {
          bodyPayload.questions = questions;
          bodyPayload.answers = answers;
        }

        const response = await fetch(`/api/e8/quiz/session/${encodeURIComponent(sessionId)}/feedback`, {
          method: "POST",
          headers,
          body: JSON.stringify(bodyPayload),
        });
        const raw = await response.text();
        const parsed = raw.trim().length > 0 ? (JSON.parse(raw) as OpenAIFeedbackSuccess | OpenAIFeedbackError) : null;

        if (!response.ok) {
          const fail = (parsed ?? {}) as OpenAIFeedbackError;
          const detail = typeof fail.details === "string" ? fail.details : fail.error;
          throw new Error(detail || "Nie udalo sie wygenerowac diagnozy.");
        }

        const data = (parsed ?? {}) as OpenAIFeedbackSuccess;
        const nextFeedback = typeof data.feedback === "string" ? data.feedback.trim() : "";

        if (!nextFeedback) {
          throw new Error("AI zwrocilo pusta diagnoze.");
        }

        setFeedback(nextFeedback);
        setHasGeneratedForSession(true);
        persist({ feedback: nextFeedback });
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : "Nie udalo sie wygenerowac diagnozy.";
        setError(message);
      } finally {
        requestInFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [hasGeneratedForSession, isLoading, mode, persist, sessionId],
  );

  useEffect(() => {
    if (!isCacheChecked || feedback || hasAttemptedAutoGenerate || isLoading) {
      return;
    }

    setHasAttemptedAutoGenerate(true);
    void requestFeedback(false);
  }, [feedback, hasAttemptedAutoGenerate, isCacheChecked, isLoading, requestFeedback]);

  const handleCopy = async () => {
    if (!copyText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const showWaitingState = !feedback && !error;

  return (
    <section className="border-t border-white/[0.08] pt-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.016] text-indigo-100/88 ring-1 ring-white/[0.022]">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <p className="text-[10px] font-medium tracking-[0.12em] text-white/30 uppercase">Podsumowanie AI</p>
        </div>

        {feedback ? (
          <button
            type="button"
            onClick={handleCopy}
            className="px-1 py-0.5 text-[10px] font-medium text-indigo-100/45 transition-colors hover:text-indigo-100/75"
          >
            {copied ? "Skopiowano" : "Kopiuj"}
          </button>
        ) : null}
      </div>

      {showWaitingState ? (
        <div className="mt-4 flex items-center gap-3 text-white/68">
              <Spinner size="md" />
          <p className="text-[14px] leading-[1.65]">Tworzę podsumowanie po wyniku quizu...</p>
        </div>
      ) : feedback ? (
        <article className="mt-4 space-y-4">
          <div className="border-l-2 border-l-[#6C63FF] pl-3">
            <ReportLabel>Ocena ogólna</ReportLabel>
            <p className="mt-1.5 text-[14px] leading-[1.65] text-white/70">{diagnosisParagraph}</p>
          </div>

          {canonicalBreakdown.length > 0 && (
            <div className="border-l-2 border-l-white/10 pl-3">
              <ReportLabel>Kategorie</ReportLabel>
              <ul className="mt-2 space-y-1.5">
                {canonicalBreakdown.map((c) => (
                  <li key={c.label} className="flex items-center justify-between gap-4">
                    <span className="text-[13px] text-white/55">{CANONICAL_LABEL_PL[c.label] ?? c.label}</span>
                    <span
                      className={`text-[13px] tabular-nums font-medium ${
                        !c.has_data || c.percent === null
                          ? "text-white/20"
                          : c.percent === 0
                            ? "text-white/30"
                            : c.percent >= 70
                              ? "text-emerald-400/80"
                              : c.percent >= 40
                                ? "text-amber-400/80"
                                : "text-rose-400/80"
                      }`}
                    >
                      {!c.has_data || c.percent === null ? "—" : `${c.percent}%`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ) : null}

      {error ? (
        <div className="mt-2.5 flex items-center gap-2 text-[13px] leading-[1.65] text-white/58">
          <p className="shrink-0">Nie udało się przygotować diagnozy.</p>
          <button
            type="button"
            onClick={() => {
              void requestFeedback(true);
            }}
            disabled={isLoading}
            className="shrink-0 font-medium text-[13px] text-[#5B52E8] transition-colors hover:text-[#7B74FF] disabled:opacity-60"
          >
            Spróbuj ponownie
          </button>
        </div>
      ) : null}
    </section>
  );
}


