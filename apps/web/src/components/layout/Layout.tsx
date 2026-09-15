"use client";

import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { TopNav } from './TopNav';
import { RestTimerBar } from '@/components/RestTimerBar';
import { SidebarInset, SidebarProvider } from '@dailylift/ui/components/sidebar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "15rem",
          "--sidebar-width-icon": "3.75rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="bg-transparent">
        <TopNav />
        <main className="relative min-h-[calc(100svh-4.5rem)] pb-20">
          {/* Subtle depth: a soft brand glow at the top of the content area. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-glow"
          />
          <div className="relative">{children}</div>
        </main>
        <RestTimerBar />
      </SidebarInset>
    </SidebarProvider>
  );
}
