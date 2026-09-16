"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dumbbell, LogOut, User as UserIcon, TrendingUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@dailylift/ui/components/dropdown-menu";
import { Avatar, AvatarFallback } from "@dailylift/ui/components/avatar";
import { Button } from "@dailylift/ui/components/button";
import { useAuthStore } from "@/stores/authStore";
import { ThemeToggle } from "./ThemeToggle";
import { SidebarToggle } from "./SidebarToggle";

const TITLES: { prefix: string; label: string }[] = [
  { prefix: "/dashboard", label: "Dashboard" },
  { prefix: "/workouts/history", label: "History" },
  { prefix: "/workouts", label: "Train" },
  { prefix: "/plans", label: "Plans" },
  { prefix: "/exercises", label: "Exercise library" },
  { prefix: "/progress", label: "Progress" },
  { prefix: "/meals", label: "Meal plans" },
  { prefix: "/calculators", label: "Calculators" },
  { prefix: "/profile", label: "Profile" },
];

function titleFor(pathname: string): string {
  return TITLES.find((t) => pathname.startsWith(t.prefix))?.label ?? "DailyLift";
}

export function TopNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/70 px-3 backdrop-blur-xl sm:px-5 md:h-16">
      {user ? (
        <>
          {/* On desktop the toggle lives in the sidebar header; this is the
              mobile drawer opener. */}
          <SidebarToggle className="md:hidden" />
          {/* Mobile brand */}
          <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
            <span className="grid size-8 place-items-center rounded-lg text-primary-foreground gradient-primary">
              <Dumbbell className="size-4" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">DailyLift</span>
          </Link>
          {/* Desktop: sidebar toggle sits right next to the page title */}
          <div className="hidden items-center gap-2.5 md:flex">
            <SidebarToggle />
            <h2 className="font-display text-xl font-semibold tracking-tight">
              {titleFor(pathname)}
            </h2>
          </div>
        </>
      ) : (
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl text-primary-foreground gradient-primary">
            <Dumbbell className="size-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">DailyLift</span>
        </Link>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        {user ? (
          <AccountMenu />
        ) : (
          <Link href="/auth">
            <Button size="sm">Sign in</Button>
          </Link>
        )}
      </div>
    </header>
  );
}

function initials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  }
  return (email?.[0] ?? "U").toUpperCase();
}

function AccountMenu() {
  const { user, profile, signOut } = useAuthStore();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center rounded-full outline-none ring-offset-2 ring-offset-background transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          <Avatar className="size-10 border">
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {initials(profile?.full_name, user?.email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-semibold">{profile?.full_name || "Your account"}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <UserIcon className="size-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/progress" className="cursor-pointer">
            <TrendingUp className="size-4" /> Progress
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
