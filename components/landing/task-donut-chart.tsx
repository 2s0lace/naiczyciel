"use client";

import React, { useEffect, useRef, useState } from "react";
import { BookOpen, Languages, MessageCircle, PencilRuler } from "lucide-react";

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

export default function TaskDonutChart() {
  const [isVisible, setIsVisible] = useState(false);
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

          counts.set(category as TaskCategoryKey, (counts.get(category as TaskCategoryKey) ?? 0) + questionCount);
        }

        setCategories((current) =>
          current.map((category) => ({
            ...category,
            count: counts.get(category.key) ?? 0,
          })),
        );
      } catch {
        // Keep fallback counts when Supabase is unavailable in the browser.
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
    <div
      ref={ref}
      className="flex flex-row items-center justify-center gap-6 md:flex-col md:gap-8 lg:gap-10"
    >
      <div className="relative h-[130px] w-[130px] shrink-0 md:h-[180px] md:w-[180px] lg:h-[240px] lg:w-[240px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]">
        <svg
          viewBox="0 0 128 128"
          className="h-full w-full -rotate-90"
          aria-hidden
        >
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

        <div className="absolute inset-0 flex flex-col items-center justify-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <span
            className={`text-[1.2rem] font-black leading-none tracking-tight text-white transition-all duration-700 md:text-[2rem] lg:text-[2.5rem] ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            {total}
          </span>
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

      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)] md:gap-x-10 md:gap-y-6">
        {categories.map((cat, i) => (
          <div
            key={cat.label}
            className={`flex items-center gap-2 transition-all duration-500 md:gap-4 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
            style={{ transitionDelay: `${300 + i * 100}ms` }}
          >
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg md:h-10 md:w-10"
              style={{ backgroundColor: `${cat.color}20` }}
            >
              <div style={{ color: cat.color }} className="scale-[0.6] md:scale-100">
                {cat.icon}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.65rem] font-bold leading-tight text-[#636364] md:text-[1.15rem]">
                {cat.label}
              </span>
              <span className="text-[0.55rem] font-medium text-[#636364]/60 md:text-[0.95rem]">
                {cat.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
