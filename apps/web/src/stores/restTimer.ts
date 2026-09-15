import { create } from "zustand";

/**
 * Global rest timer. Lives outside the page tree so it keeps counting while the
 * user scrolls or navigates within a workout. State (the target end time) is
 * mirrored to localStorage so a refresh recovers a running timer instead of
 * losing it. A single interval, started on demand, drives all subscribers.
 */

const STORAGE_KEY = "dailylift.restTimer";

interface Persisted {
  endsAt: number; // epoch ms
  duration: number; // seconds
}

interface RestTimerState {
  running: boolean;
  duration: number; // total seconds for the current rest
  remaining: number; // seconds left
  start: (seconds: number) => void;
  addTime: (seconds: number) => void;
  skip: () => void;
  _tick: () => void;
  _hydrate: () => void;
}

let interval: ReturnType<typeof setInterval> | null = null;

function ensureInterval(get: () => RestTimerState) {
  if (interval) return;
  interval = setInterval(() => get()._tick(), 250);
}

function clearPersisted() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function persist(endsAt: number, duration: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ endsAt, duration } satisfies Persisted));
  } catch {
    /* ignore */
  }
}

export const useRestTimer = create<RestTimerState>((set, get) => ({
  running: false,
  duration: 0,
  remaining: 0,

  start: (seconds) => {
    const s = Math.max(5, Math.round(seconds || 60));
    const endsAt = Date.now() + s * 1000;
    persist(endsAt, s);
    set({ running: true, duration: s, remaining: s });
    ensureInterval(get);
  },

  addTime: (seconds) => {
    const { running, remaining, duration } = get();
    if (!running) return;
    const nextRemaining = Math.max(0, remaining + seconds);
    const endsAt = Date.now() + nextRemaining * 1000;
    persist(endsAt, duration + Math.max(0, seconds));
    set({ remaining: nextRemaining, duration: duration + Math.max(0, seconds) });
  },

  skip: () => {
    clearPersisted();
    set({ running: false, remaining: 0, duration: 0 });
  },

  _tick: () => {
    const { running } = get();
    if (!running) return;
    let endsAt = 0;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) endsAt = (JSON.parse(raw) as Persisted).endsAt;
    } catch {
      /* ignore */
    }
    const remaining = endsAt ? Math.max(0, Math.round((endsAt - Date.now()) / 1000)) : 0;
    if (remaining <= 0) {
      clearPersisted();
      set({ running: false, remaining: 0 });
      // Best-effort completion beep; ignored if audio is blocked.
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctx) {
          const ctx = new Ctx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }
      } catch {
        /* ignore */
      }
      return;
    }
    set({ remaining });
  },

  _hydrate: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const { endsAt, duration } = JSON.parse(raw) as Persisted;
      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      if (remaining > 0) {
        set({ running: true, duration, remaining });
        ensureInterval(get);
      } else {
        clearPersisted();
      }
    } catch {
      /* ignore */
    }
  },
}));

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
