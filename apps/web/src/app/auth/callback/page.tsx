"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/supabase/client";

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Signing you in…");
  const hasExchangedCode = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next");
    const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

    if (hasExchangedCode.current) return;
    hasExchangedCode.current = true;

    async function finishSignIn() {
      if (!code) {
        setMessage("This sign-in link is invalid or has expired. Please try again.");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setMessage(error.message);
        return;
      }
      router.replace(destination);
      router.refresh();
    }

    void finishSignIn();
  }, [router, searchParams]);

  return <main className="min-h-screen grid place-items-center p-4 text-muted-foreground">{message}</main>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main className="min-h-screen grid place-items-center p-4 text-muted-foreground">Signing you in…</main>}>
      <AuthCallback />
    </Suspense>
  );
}
