"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@dailylift/ui/components/button";
import { Input } from "@dailylift/ui/components/input";
import { Label } from "@dailylift/ui/components/label";
import { supabase } from "@/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    return () => subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    if (password !== confirmPassword) return toast.error("Passwords do not match.");
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. You can now sign in.");
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  return (
    <main className="min-h-screen bg-background grid place-items-center p-4">
      <section className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold">Choose a new password</h1>
        <p className="text-muted-foreground mt-2">{ready ? "Enter a new password for your account." : "Open this page using the reset link from your email."}</p>
        {ready && <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input id="password" type={isPasswordVisible ? "text" : "password"} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="pr-10" />
              <button type="button" aria-label={isPasswordVisible ? "Hide password" : "Show password"} aria-pressed={isPasswordVisible} onClick={() => setIsPasswordVisible((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <div className="relative">
              <Input id="confirm-password" type={isConfirmPasswordVisible ? "text" : "password"} required minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="pr-10" />
              <button type="button" aria-label={isConfirmPasswordVisible ? "Hide password" : "Show password"} aria-pressed={isConfirmPasswordVisible} onClick={() => setIsConfirmPasswordVisible((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {isConfirmPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button className="w-full" disabled={isLoading}>{isLoading ? "Saving…" : "Update password"}</Button>
        </form>}
      </section>
    </main>
  );
}
