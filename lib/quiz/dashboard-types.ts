import type { AccessTier, E8SetDefinition } from "@/lib/quiz/set-catalog";
import type { CategoryBreakdownItem } from "@/lib/quiz/types";

export type DashboardSessionStatus = "in_progress" | "completed" | "cancelled" | "unknown";

export type DashboardSession = {
  id: string;
  mode: string;
  setId: string | null;
  status: DashboardSessionStatus;
  scorePercent: number | null;
  correctAnswers: number | null;
  totalQuestions: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string | null;
  durationMinutes: number | null;
  categoryBreakdown?: CategoryBreakdownItem[];
};

export type DashboardStats = {
  sessionsStarted: number;
  sessionsCompleted: number;
  solvedQuestions: number;
  averageScorePercent: number | null;
  averageDurationMinutes: number | null;
  strongestCategory: string | null;
  weakestCategory: string | null;
  strongestMode: string | null;
  weakestMode: string | null;
  weakestTargetSource: "grammar" | "vocabulary" | "skill" | null;
  weakestTargetRaw: string | null;
  lastScorePercent: number | null;
};

export type DashboardPayload = {
  tier: AccessTier;
  role: string | null;
  visibleSets: E8SetDefinition[];
  lockedSets: E8SetDefinition[];
  recentSessions: DashboardSession[];
  stats: DashboardStats;
};
