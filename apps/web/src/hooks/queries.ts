"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchExercises, fetchExercise } from "@/lib/db/exercises";
import {
  fetchWorkout,
  fetchWorkoutHistory,
  fetchActiveWorkout,
} from "@/lib/db/workouts";
import {
  fetchPlans,
  fetchPlan,
  fetchActivePlan,
  setActivePlan,
  archivePlan,
  deletePlan,
} from "@/lib/db/plans";
import {
  fetchBodyWeightLogs,
  logBodyWeight,
  fetchPersonalRecords,
  fetchDashboardData,
} from "@/lib/db/metrics";

export const qk = {
  exercises: ["exercises"] as const,
  exercise: (id: string) => ["exercise", id] as const,
  plans: ["plans"] as const,
  plan: (id: string) => ["plan", id] as const,
  activePlan: ["plan", "active"] as const,
  workout: (id: string) => ["workout", id] as const,
  activeWorkout: ["workout", "active"] as const,
  history: ["workouts", "history"] as const,
  bodyWeight: ["bodyWeight"] as const,
  prs: ["personalRecords"] as const,
  dashboard: ["dashboard"] as const,
};

const STALE = 60_000;

export function useExercises() {
  return useQuery({ queryKey: qk.exercises, queryFn: fetchExercises, staleTime: STALE });
}

export function useExercise(id: string) {
  return useQuery({ queryKey: qk.exercise(id), queryFn: () => fetchExercise(id), enabled: !!id });
}

export function usePlans() {
  return useQuery({ queryKey: qk.plans, queryFn: fetchPlans, staleTime: STALE });
}

export function usePlan(id: string) {
  return useQuery({ queryKey: qk.plan(id), queryFn: () => fetchPlan(id), enabled: !!id });
}

export function useActivePlan() {
  return useQuery({ queryKey: qk.activePlan, queryFn: fetchActivePlan, staleTime: STALE });
}

export function useActiveWorkout() {
  return useQuery({ queryKey: qk.activeWorkout, queryFn: fetchActiveWorkout, staleTime: 5_000 });
}

export function useWorkout(id: string) {
  return useQuery({ queryKey: qk.workout(id), queryFn: () => fetchWorkout(id), enabled: !!id });
}

export function useWorkoutHistory() {
  return useQuery({ queryKey: qk.history, queryFn: () => fetchWorkoutHistory(), staleTime: STALE });
}

export function useBodyWeightLogs() {
  return useQuery({ queryKey: qk.bodyWeight, queryFn: () => fetchBodyWeightLogs(), staleTime: STALE });
}

export function usePersonalRecords() {
  return useQuery({ queryKey: qk.prs, queryFn: fetchPersonalRecords, staleTime: STALE });
}

export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard, queryFn: fetchDashboardData, staleTime: 30_000 });
}

/* ------------------------------ mutations -------------------------------- */

export function useLogBodyWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ weightKg, loggedOn }: { weightKg: number; loggedOn?: string }) =>
      logBodyWeight(weightKg, loggedOn),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.bodyWeight });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function useSetActivePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setActivePlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.plans });
      qc.invalidateQueries({ queryKey: qk.activePlan });
    },
  });
}

export function useArchivePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archivePlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.plans });
      qc.invalidateQueries({ queryKey: qk.activePlan });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.plans });
      qc.invalidateQueries({ queryKey: qk.activePlan });
    },
  });
}
