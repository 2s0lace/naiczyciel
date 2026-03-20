import "server-only";
import { createHash } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const USER_HOURLY_LIMIT = 10;
const USER_DAILY_LIMIT = 50;
const GUEST_DAILY_LIMIT = 3;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const AI_GENERATION_RATE_LIMIT_ACTION = "ai_generation";

type WindowKind = "hour" | "day";

type CounterResult = {
  allowed: boolean;
  limit: number;
  window: WindowKind;
  resetAt: string;
  retryAfterSeconds: number;
};

type RateLimitAllowed = {
  allowed: true;
};

type RateLimitBlocked = {
  allowed: false;
  limit: number;
  window: WindowKind;
  resetAt: string;
  retryAfterSeconds: number;
};

export type RateLimitDecision = RateLimitAllowed | RateLimitBlocked;

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
  }

  return 0;
}

function startOfWindow(date: Date, window: WindowKind): Date {
  if (window === "hour") {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), 0, 0, 0));
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function resetForWindow(windowStart: Date, window: WindowKind): Date {
  const nextTime = windowStart.getTime() + (window === "hour" ? HOUR_MS : DAY_MS);
  return new Date(nextTime);
}

function secondsUntil(isoDate: string): number {
  const resetUnix = Date.parse(isoDate);

  if (!Number.isFinite(resetUnix)) {
    return 1;
  }

  const remainingMs = Math.max(0, resetUnix - Date.now());
  return Math.max(1, Math.ceil(remainingMs / 1000));
}

function clientIp(request: Request): string {
  const cloudflare = asText(request.headers.get("cf-connecting-ip"));
  const realIp = asText(request.headers.get("x-real-ip"));
  const forwarded = asText(request.headers.get("x-forwarded-for"))
    .split(",")
    .map((entry) => entry.trim())
    .find((entry) => entry.length > 0);

  return cloudflare || realIp || forwarded || "";
}

function guestKeyFromRequest(request: Request): string {
  const ip = clientIp(request);
  const userAgent = asText(request.headers.get("user-agent")) || "unknown";
  const fingerprint = ip || `ua:${userAgent.slice(0, 180)}`;
  const hash = createHash("sha256").update(fingerprint).digest("hex").slice(0, 24);
  return `ip:${hash}`;
}

async function consumeCounter(params: {
  subjectId: string;
  action: string;
  limit: number;
  window: WindowKind;
}): Promise<CounterResult> {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  const windowStart = startOfWindow(now, params.window);
  const windowStartIso = windowStart.toISOString();
  const resetAt = resetForWindow(windowStart, params.window).toISOString();

  const existing = await supabase
    .from("rate_limits")
    .select("count")
    .eq("user_id", params.subjectId)
    .eq("action", params.action)
    .eq("window_start", windowStartIso)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message ?? "Rate limit read failed.");
  }

  const currentCount = asCount(existing.data?.count);
  const nextCount = currentCount + 1;

  if (nextCount > params.limit) {
    return {
      allowed: false,
      limit: params.limit,
      window: params.window,
      resetAt,
      retryAfterSeconds: secondsUntil(resetAt),
    };
  }

  if (existing.data) {
    const updated = await supabase
      .from("rate_limits")
      .update({ count: nextCount })
      .eq("user_id", params.subjectId)
      .eq("action", params.action)
      .eq("window_start", windowStartIso);

    if (updated.error) {
      throw new Error(updated.error.message ?? "Rate limit update failed.");
    }
  } else {
    const inserted = await supabase.from("rate_limits").insert({
      user_id: params.subjectId,
      action: params.action,
      count: 1,
      window_start: windowStartIso,
    });

    if (inserted.error) {
      if (inserted.error.code === "23505") {
        const retryRead = await supabase
          .from("rate_limits")
          .select("count")
          .eq("user_id", params.subjectId)
          .eq("action", params.action)
          .eq("window_start", windowStartIso)
          .maybeSingle();

        if (retryRead.error) {
          throw new Error(retryRead.error.message ?? "Rate limit retry read failed.");
        }

        const retryCount = asCount(retryRead.data?.count) + 1;

        if (retryCount > params.limit) {
          return {
            allowed: false,
            limit: params.limit,
            window: params.window,
            resetAt,
            retryAfterSeconds: secondsUntil(resetAt),
          };
        }

        const retryUpdate = await supabase
          .from("rate_limits")
          .update({ count: retryCount })
          .eq("user_id", params.subjectId)
          .eq("action", params.action)
          .eq("window_start", windowStartIso);

        if (retryUpdate.error) {
          throw new Error(retryUpdate.error.message ?? "Rate limit retry update failed.");
        }
      } else {
        throw new Error(inserted.error.message ?? "Rate limit insert failed.");
      }
    }
  }

  return {
    allowed: true,
    limit: params.limit,
    window: params.window,
    resetAt,
    retryAfterSeconds: secondsUntil(resetAt),
  };
}

export function buildRateLimitErrorPayload(limit: RateLimitBlocked) {
  return {
    error: "Przekroczono limit zapytan AI.",
    details:
      limit.window === "hour"
        ? `Limit ${limit.limit}/godzine zostal przekroczony.`
        : `Limit ${limit.limit}/dzien zostal przekroczony.`,
    resetAt: limit.resetAt,
    retryAfterSeconds: limit.retryAfterSeconds,
    window: limit.window,
    limit: limit.limit,
  };
}

export async function enforceAiRateLimit(params: {
  request: Request;
  action: string;
  userId: string | null;
  role: string | null;
}): Promise<RateLimitDecision> {
  if (params.role === "admin") {
    return { allowed: true };
  }

  const actionBase = asText(params.action) || AI_GENERATION_RATE_LIMIT_ACTION;

  if (params.userId) {
    const hourly = await consumeCounter({
      subjectId: params.userId,
      action: `${actionBase}:hourly`,
      limit: USER_HOURLY_LIMIT,
      window: "hour",
    });

    if (!hourly.allowed) {
      return hourly;
    }

    const daily = await consumeCounter({
      subjectId: params.userId,
      action: `${actionBase}:daily`,
      limit: USER_DAILY_LIMIT,
      window: "day",
    });

    if (!daily.allowed) {
      return daily;
    }

    return { allowed: true };
  }

  const guestKey = guestKeyFromRequest(params.request);
  const guestDaily = await consumeCounter({
    subjectId: guestKey,
    action: `${actionBase}:guest_daily`,
    limit: GUEST_DAILY_LIMIT,
    window: "day",
  });

  if (!guestDaily.allowed) {
    return guestDaily;
  }

  return { allowed: true };
}
