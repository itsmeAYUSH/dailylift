"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Consistent page header: a breadcrumb trail, a large title, a description, and
 * optional actions — shown at the top of every page. When `breadcrumbs` is
 * omitted it defaults to "Home › {title}".
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
}) {
  const crumbs: Crumb[] = breadcrumbs ?? [
    { label: "Home", href: "/dashboard" },
    { label: title },
  ];

  return (
    <div className="mb-8 animate-fade-in-up">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground/50" />}
              {c.href && !last ? (
                <Link href={c.href} className="text-muted-foreground transition-colors hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span className={last ? "font-medium text-foreground" : "text-muted-foreground"}>{c.label}</span>
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-[2.25rem] md:leading-tight">
            {title}
          </h1>
          {subtitle && <p className="mt-1 max-w-2xl text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 pt-1">{actions}</div>}
      </div>
    </div>
  );
}
