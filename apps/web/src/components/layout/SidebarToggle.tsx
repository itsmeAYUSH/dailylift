"use client";

import { ChevronRight } from "lucide-react";
import { useSidebar } from "@dailylift/ui/components/sidebar";
import { cn } from "@dailylift/ui/lib/utils";

/**
 * Sidebar open/close button. Shows a chevron that points left ("<") when the
 * sidebar is open (click to close) and right (">") when it's collapsed (click
 * to open). The single icon rotates for a smooth transition. Works for both the
 * desktop icon-collapse and the mobile drawer.
 */
export function SidebarToggle({ className }: { className?: string }) {
  const { state, isMobile, openMobile, toggleSidebar } = useSidebar();
  const open = isMobile ? openMobile : state === "expanded";

  return (
    <button
      onClick={toggleSidebar}
      aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      aria-expanded={open}
      className={cn(
        "group grid size-10 shrink-0 place-items-center rounded-xl border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        className,
      )}
    >
      <ChevronRight
        className={cn(
          "size-5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "rotate-180" : "rotate-0",
        )}
      />
    </button>
  );
}
