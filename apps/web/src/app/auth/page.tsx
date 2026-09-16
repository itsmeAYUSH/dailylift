"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@dailylift/ui/components/button';
import { Input } from '@dailylift/ui/components/input';
import { Label } from '@dailylift/ui/components/label';
import { AuthSkeleton } from '@/components/skeletons';
import { supabase } from '@/supabase/client';
import { toast } from 'sonner';
import { Activity, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

function AuthForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');
  const urlError = searchParams.get('error');

  const [isSignUp, setIsSignUp] = useState(modeParam === 'signup');
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const redirectPath = searchParams.get('redirect');
  const destination = redirectPath?.startsWith('/') && !redirectPath.startsWith('//')
    ? redirectPath
    : '/dashboard';

  useEffect(() => {
    if (urlError) {
      toast.error(urlError);
    }
  }, [urlError]);

  useEffect(() => {
    if (modeParam === 'signup' || modeParam === 'signin' || modeParam === 'login') {
      setIsSignUp(modeParam === 'signup');
    }
  }, [modeParam]);

  const toggleMode = (signUp: boolean) => {
    setIsSignUp(signUp);
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', signUp ? 'signup' : 'signin');
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  useEffect(() => {
    if (resendCooldown === 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((remaining) => Math.max(remaining - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const validateForm = () => {
    try {
      authSchema.parse({
        email,
        password,
        fullName: isSignUp ? fullName : undefined,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/auth/callback?next=/onboarding`;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in instead.');
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data.session) {
          toast.success('Account created successfully!');
          router.replace('/onboarding');
        } else {
          setConfirmationEmail(email);
          setResendCooldown(60);
          toast.success('Check your email to confirm your account.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please try again.');
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success('Welcome back!');
        router.replace(destination);
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const targetNext = redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//')
        ? redirectPath
        : destination;

      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(targetNext)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setIsGoogleLoading(false);
      }
    } catch {
      toast.error('Failed to initiate Google sign in. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  if (confirmationEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm text-center space-y-5">
          <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mx-auto">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Confirm your email</h1>
            <p className="text-muted-foreground mt-2">
              We sent a confirmation link to {confirmationEmail}. Open it to continue to onboarding.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoading || resendCooldown > 0}
            onClick={async () => {
              setIsLoading(true);
              try {
                const { error } = await supabase.auth.resend({
                  type: 'signup',
                  email: confirmationEmail,
                  options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
                  },
                });
                if (error) throw error;
                setResendCooldown(60);
                toast.success('Confirmation email resent.');
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Could not resend email.');
              } finally {
                setIsLoading(false);
              }
            }}
          >
            {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend confirmation email'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setConfirmationEmail(null);
              toggleMode(false);
            }}
          >
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h1 className="font-display text-2xl font-bold">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignUp 
                ? 'Start your personalized fitness journey' 
                : 'Sign in to continue to DailyLift'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  aria-pressed={isPasswordVisible}
                  onClick={() => setIsPasswordVisible((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              {!isSignUp && (
                <Link href="/auth/forgot-password" className="block w-fit text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              )}
            </div>

            <Button 
              type="submit" 
              variant="gradient" 
              className="w-full" 
              size="lg"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {isGoogleLoading ? 'Connecting to Google…' : 'Google'}
          </Button>

          {/* Toggle */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => toggleMode(!isSignUp)}
              className="text-primary hover:underline font-medium"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthForm />
    </Suspense>
  );
}
