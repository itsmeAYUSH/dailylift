"use client";

import { useState } from "react";
import { useExercises } from "@/hooks/queries";
import { Input } from "@dailylift/ui/components/input";
import { Badge } from "@dailylift/ui/components/badge";
import { Skeleton } from "@dailylift/ui/components/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@dailylift/ui/components/dialog";
import { Plus, Search } from "lucide-react";

export interface ExercisePick {
  exercise_id: string | null;
  name: string;
  muscle_group: string | null;
}

/**
 * Shared exercise picker: searches the library and returns the chosen exercise
 * (or a custom name). Used by both the workout logger and plan editing so there
 * is a single implementation.
 */
export function ExercisePickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = "Add exercise",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSelect: (input: ExercisePick) => void;
  title?: string;
}) {
  const { data: exercises, isLoading } = useExercises();
  const [search, setSearch] = useState("");
  const filtered = (exercises ?? []).filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search library…"
            className="pl-9"
          />
        </div>
        <div className="-mx-2 max-h-[50vh] overflow-y-auto px-2 space-y-1">
          {search && (
            <button
              onClick={() => onSelect({ exercise_id: null, name: search, muscle_group: null })}
              className="mb-2 flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-left text-sm hover:border-primary/50"
            >
              <Plus className="size-4" /> Add custom “{search}”
            </button>
          )}

          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg p-2"
              >
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No exercises found.
            </p>
          ) : (
            filtered.map((e) => (
              <button
                key={e.id}
                onClick={() => onSelect({ exercise_id: e.id, name: e.name, muscle_group: e.primary_muscle })}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left hover:bg-secondary transition-colors"
              >
                <span className="font-medium">{e.name}</span>
                <Badge variant="secondary" className="capitalize">
                  {e.primary_muscle}
                </Badge>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
