"use client";

import { ReactNode } from "react";

/**
 * Small entrance-animation wrapper. Fades + rises its children on mount, with an
 * optional stagger delay (ms). Respects prefers-reduced-motion via the global
 * media query in globals.css.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-fade-in-up opacity-0 ${className ?? ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
