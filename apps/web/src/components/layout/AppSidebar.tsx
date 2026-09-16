"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  ChevronRight,
  ClipboardList,
  Droplets,
  Dumbbell,
  Flame,
  Heart,
  LayoutDashboard,
  LibraryBig,
  Scale,
  TrendingUp,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@dailylift/ui/components/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@dailylift/ui/components/collapsible";
import { Avatar, AvatarFallback } from "@dailylift/ui/components/avatar";
import { useAuthStore } from "@/stores/authStore";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/plans", label: "Plans", icon: ClipboardList },
  { href: "/exercises", label: "Exercises", icon: LibraryBig },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/meals", label: "Meal plans", icon: UtensilsCrossed },
];

const calculators = [
  { id: "bmi", label: "BMI", icon: Scale },
  { id: "bmr", label: "BMR", icon: Flame },
  { id: "calories", label: "Daily calories", icon: Zap },
  { id: "bodyfat", label: "Body fat", icon: Heart },
  { id: "water", label: "Water intake", icon: Droplets },
];

/** A nav item is active for its own route and any nested route beneath it. */
function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const { user, profile } = useAuthStore();
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  if (!user) return null;

  const closeMobileDrawer = () => {
    if (isMobile) setOpenMobile(false);
  };

  const name = profile?.full_name?.trim();
  const initials = name
    ? name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("")
    : (user.email?.[0] ?? "U").toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center p-3 group-data-[collapsible=icon]:p-2">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-2.5 rounded-lg px-1 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          onClick={closeMobileDrawer}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl text-primary-foreground shadow-sm gradient-primary">
            <Dumbbell className="size-5" />
          </span>
          <span className="truncate font-display text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            DailyLift
          </span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      {/* data-lenis-prevent: let the wheel scroll the sidebar itself instead of
          the page's smooth-scroll hijacking it. */}
      <SidebarContent className="px-1.5 py-2" data-lenis-prevent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isRouteActive(pathname, item.href)}
                    tooltip={item.label}
                    className="h-11 gap-3 rounded-xl px-3 text-[0.95rem] font-medium [&>svg]:size-[1.3rem]"
                  >
                    <Link href={item.href} onClick={closeMobileDrawer}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Calculators — collapsible dropdown of every calculator. */}
              <Collapsible
                asChild
                defaultOpen={pathname.startsWith("/calculators")}
                className="group/calc"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Calculators"
                      isActive={pathname.startsWith("/calculators")}
                      className="h-11 gap-3 rounded-xl px-3 text-[0.95rem] font-medium [&>svg]:size-[1.3rem]"
                    >
                      <Calculator />
                      <span>Calculators</span>
                      <ChevronRight className="ml-auto !size-4 transition-transform duration-200 group-data-[state=open]/calc:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mr-0 gap-0.5 pr-0">
                      {calculators.map((c) => (
                        <SidebarMenuSubItem key={c.id}>
                          <SidebarMenuSubButton
                            asChild
                            className="h-9 gap-2.5 [&>svg]:size-4 [&>svg]:text-muted-foreground"
                          >
                            <Link
                              href={`/calculators?type=${c.id}`}
                              onClick={closeMobileDrawer}
                            >
                              <c.icon />
                              <span>{c.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarSeparator className="mx-0 mb-1" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/profile"}
              tooltip={name || "Profile"}
              className="h-12 gap-3 rounded-xl px-2.5"
            >
              <Link href="/profile" onClick={closeMobileDrawer}>
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate font-medium">{name || "Profile"}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
