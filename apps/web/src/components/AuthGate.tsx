"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout/Layout";
import { useAuthStore } from "@/stores/authStore";

/**
 * Wraps a protected page: shows a loading state until auth is initialized,
 * redirects to /auth when signed out, and (optionally) nudges to onboarding.
 * Renders children inside the sidebar Layout once the user is known.
 */
export function AuthGate({
  children,
  requireOnboarding = false,
}: {
  children: ReactNode;
  requireOnboarding?: boolean;
}) {
  const { user, profile, isLoading, isInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isLoading && !user) router.replace("/auth");
  }, [user, isLoading, isInitialized, router]);

  if (isLoading || !isInitialized || !user) {
    return (
      <Layout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (requireOnboarding && profile && !profile.onboarding_completed) {
    return (
      <Layout>
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <h1 className="font-display text-2xl font-bold">Finish your setup first</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            Complete onboarding so we can tailor your plans and track your progress.
          </p>
          <button
            onClick={() => router.push("/onboarding")}
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Complete onboarding
          </button>
        </div>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
}
