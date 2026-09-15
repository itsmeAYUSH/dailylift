/**
 * Minimal in-memory rate limiter for expensive AI generation. Keyed by user id.
 * This is per-server-instance (resets on redeploy, not shared across regions) —
 * good enough to stop accidental double-clicks and basic abuse. Swap for a
 * Redis/Upstash limiter if the app scales horizontally.
 */

interface Window {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 8; // per user per window

const buckets = new Map<string, Window>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(userId);

  if (!existing || now >= existing.resetAt) {
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - existing.count,
    retryAfterSeconds: 0,
  };
}
