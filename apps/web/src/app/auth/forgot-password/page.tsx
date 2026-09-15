"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@dailylift/ui/components/button";
import { Input } from "@dailylift/ui/components/input";
import { Label } from "@dailylift/ui/components/label";
import { supabase } from "@/supabase/client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });
    setIsLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-screen bg-background grid place-items-center p-4">
      <section className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold">Reset your password</h1>
        <p className="text-muted-foreground mt-2">{sent ? "If an account exists for this email, a reset link is on its way." : "Enter your email and we’ll send a reset link."}</p>
        {!sent && <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <Button className="w-full" disabled={isLoading}>{isLoading ? "Sending…" : "Send reset link"}</Button>
        </form>}
        <Link href="/auth" className="block text-center text-sm text-primary hover:underline mt-6">Back to sign in</Link>
      </section>
    </main>
  );
}
