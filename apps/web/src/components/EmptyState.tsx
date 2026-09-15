"use client";

import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@dailylift/ui/components/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-accent text-primary">
          <Icon className="size-7" />
        </div>
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </CardContent>
    </Card>
  );
}
