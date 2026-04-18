"use client";

import React, { useEffect, useRef, useState } from "react";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { BookOpen, CircleHelp, Languages, MessageCircle, PencilRuler } from "lucide-react";

type TaskCategoryKey = "reading_mc" | "grammar" | "vocabulary" | "reactions";
type SetCatalogEntry = {
  id?: string;
  mode?: string;
  questionCount?: number;
};

type TaskCategory = {
  key: TaskCategoryKey;
  label: string;
  count: number;
  color: string;
  icon: React.ReactNode;
};

const FALLBACK_CATEGORIES: TaskCategory[] = [
  {
    key: "reading_mc",
    label: "Czytanie",
    count: 72,
    color: "#818cf8",
    icon: <BookOpen className="h-6 w-6" strokeWidth={2} />,
  },
  {
    key: "grammar",
    label: "Gramatyka",
    count: 84,
    color: "#a78bfa",
    icon: <PencilRuler className="h-6 w-6" strokeWidth={2} />,
  },
  {
    key: "vocabulary",
    label: "Słownictwo",
    count: 96,
    color: "#e9d5ff",
    icon: <Languages className="h-6 w-6" strokeWidth={2} />,
  },
  {
    key: "reactions",
    label: "Reakcje",
    count: 60,
    color: "#e0e7ff",
    icon: <MessageCircle className="h-6 w-6" strokeWidth={2} />,
  },
];

const RADIUS = 54;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP_DEG = 3;
const GAP_LENGTH = (GAP_DEG / 360) * CIRCUMFERENCE;
const TOTAL_GAP = GAP_LENGTH * FALLBACK_CATEGORIES.length;
const USABLE = CIRCUMFERENCE - TOTAL_GAP;

export default function TaskDonutChart({
  revealed = false,
}: {
  revealed?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [showUnknownHint, setShowUnknownHint] = useState(false);
  const [categories, setCategories] = useState<TaskCategory[]>(FALLBACK_CATEGORIES);
  const ref = useRef<HTMLDivElement>(null);
  const total = categories.reduce((sum, category) => sum + category.count, 0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCategoryCounts = async () => {
      try {
        const response = await fetch("/api/e8/set-access", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => ({}))) as {
          allSets?: SetCatalogEntry[];
        };

        if (!response.ok || !Array.isArray(data.allSets) || !isMounted) {
          return;
        }

        const counts = new Map<TaskCategoryKey, number>(
          FALLBACK_CATEGORIES.map((category) => [category.key, 0]),
        );

        for (const row of data.allSets) {
          const category = typeof row.mode === "string" ? row.mode.trim().toLowerCase() : "";
          const questionCount =
            typeof row.questionCount === "number" && Number.isFinite(row.questionCount)
              ? Math.max(0, row.questionCount)
              : 0;

          if (!counts.has(category as TaskCategoryKey)) {
            continue;
          }

          counts.set(
            category as TaskCategoryKey,
            (counts.get(category as TaskCategoryKey) ?? 0) + questionCount,
          );
        }

        setCategories((current) =>
          current.map((category) => ({
            ...category,
            count: counts.get(category.key) ?? 0,
          })),
        );
      } catch {
        // Keep fallback counts when the browser cannot fetch live data.
      }
    };

    void loadCategoryCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  const segments = categories.map((category) => {
    const segmentLength = total > 0 ? (category.count / total) * USABLE : 0;
    return {
      category,
      segmentLength,
    };
  });

  return (
    <div ref={ref} className="flex flex-col items-center justify-center gap-5">
      <div className="rounded-[1.3rem] bg-white/32 px-4 py-3 shadow-[0_14px_30px_-24px_rgba(45,63,112,0.5)]">
        <div className="flex flex-col items-center justify-center gap-2">
          <p className="text-center text-[0.82rem] font-semibold text-[#5b6280] md:text-[0.94rem]">
            The numbers{" "}
            <span className="rounded-[0.3rem] bg-[#d7efb7] px-1 text-[#244114] shadow-[0_6px_14px_-12px_rgba(94,160,57,0.9)]">
              {revealed ? "were" : "are"}
            </span>{" "}
            <span className="relative inline-flex items-center gap-1.5">
              <span className="rounded-[0.3rem] bg-[#f9e57c] px-1 text-[#201c0a] shadow-[0_6px_14px_-12px_rgba(249,229,124,0.95)]">
                unknown
              </span>
              <button
                type="button"
                onClick={() => setShowUnknownHint((current) => !current)}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-indigo-300/28 bg-white/18 text-indigo-300 transition-colors duration-200 hover:bg-white/28 hover:text-[#43517c]"
                aria-label="Pokaż tłumaczenie słowa unknown"
                aria-expanded={showUnknownHint}
              >
                <CircleHelp className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <span
                className={`pointer-events-none absolute top-[calc(100%+0.7rem)] left-1/2 z-10 -translate-x-1/2 overflow-hidden rounded-xl border border-indigo-300/18 bg-[#131329]/96 px-0 text-[10px] font-semibold whitespace-nowrap text-indigo-100 shadow-[0_12px_26px_-20px_rgba(79,70,229,0.9)] transition-all duration-200 ease-out ${
                  showUnknownHint
                    ? "max-w-[7.5rem] px-3 py-2 opacity-100"
                    : "max-w-0 py-2 opacity-0"
                }`}
              >
                <span className="absolute bottom-full left-1/2 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rotate-45 border-t border-l border-indigo-300/18 bg-[#131329]/96" />
                niewiadome
              </span>
              <span className="pointer-events-none absolute top-[calc(100%+0.12rem)] left-1/2 h-3 w-px -translate-x-1/2 bg-indigo-300/40" />
            </span>
          </p>

          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold tracking-[0.16em] text-emerald-700 uppercase">
            {revealed ? "Past Simple, bo były" : "Present Simple, bo są"}
          </span>
        </div>
      </div>

      <div className="relative h-[130px] w-[130px] shrink-0 md:h-[180px] md:w-[180px] lg:h-[220px] lg:w-[220px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden>
          {segments.map((segment, i) => {
            const cat = segment.category;
            const segmentLength = segment.segmentLength;
            const dashArray = `${segmentLength} ${CIRCUMFERENCE - segmentLength}`;
            const offset = -segments
              .slice(0, i)
              .reduce((sum, current) => sum + current.segmentLength + GAP_LENGTH, 0);

            return (
              <circle
                key={cat.label}
                cx="64"
                cy="64"
                r={RADIUS}
                fill="none"
                stroke={cat.color}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={dashArray}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{
                  opacity: isVisible ? 1 : 0,
                  strokeDasharray: isVisible ? dashArray : `0 ${CIRCUMFERENCE}`,
                  strokeDashoffset: offset,
                  transitionDelay: `${i * 150}ms`,
                }}
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
          {revealed ? (
            <span
              className={`text-[1.55rem] font-black leading-none tracking-tight text-white transition-all duration-700 md:text-[2.45rem] lg:text-[2.8rem] ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              }`}
              style={{ transitionDelay: "500ms" }}
            >
              {total}
            </span>
          ) : (
            <span
              className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-white transition-all duration-700 md:h-14 md:w-14 lg:h-16 lg:w-16 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              } animate-pulse`}
              style={{ transitionDelay: "500ms" }}
            >
              <QuestionMarkCircleIcon className="h-6 w-6 md:h-8 md:w-8 lg:h-9 lg:w-9" />
            </span>
          )}
          <span
            className={`mt-1 text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-white/40 transition-all duration-700 md:text-[0.8rem] lg:text-[0.85rem] ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
            style={{ transitionDelay: "600ms" }}
          >
            zadań
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 md:gap-x-7 md:gap-y-5">
        {categories.map((cat, i) => (
          <div
            key={cat.label}
            className={`flex items-center gap-2 rounded-[1rem] bg-white/26 px-2.5 py-2.5 shadow-[0_12px_24px_-24px_rgba(45,63,112,0.55)] transition-all duration-500 md:gap-3 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
            style={{ transitionDelay: `${300 + i * 100}ms` }}
          >
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg md:h-9 md:w-9"
              style={{ backgroundColor: `${cat.color}20` }}
            >
              <div style={{ color: cat.color }} className="scale-[0.6] md:scale-90">
                {cat.icon}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.65rem] font-bold leading-tight text-[#636364] md:text-[1.02rem]">
                {cat.label}
              </span>
              <span className="text-[0.55rem] font-semibold text-[#636364]/75 md:text-[0.92rem]">
                {revealed ? (
                  cat.count
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="rounded-full bg-[#eef2ff] px-1.5 py-0.5 text-[0.5rem] font-black tracking-[0.16em] text-[#6c7cb4] uppercase">
                      ?
                    </span>
                    Do odkrycia
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
