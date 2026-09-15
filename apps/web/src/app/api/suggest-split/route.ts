import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/supabase/server";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { geminiGenerate } from "@/lib/ai/gemini";
import { recommendSplit, getSplitMeta } from "@/lib/fitness/split";

export const runtime = "nodejs";
export const maxDuration = 30;

const requestSchema = z.object({
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  daysPerWeek: z.coerce.number().int().min(1).max(7),
  goal: z.string().optional(),
  location: z.string().optional(),
});

const aiNoteSchema = z.object({ note: z.string().min(1).max(600) });

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = requestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const input = parsed.data;

    // Deterministic recommendation — the source of truth. Works with AI off.
    const rec = recommendSplit(input);
    const meta = getSplitMeta(rec.split);

    // Optional AI enrichment: a short, personalized coaching note. Failures here
    // never break the response — we fall back to the deterministic rationale.
    let aiNote: string | null = null;
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && checkRateLimit(user.id).allowed) {
      try {
        const text = await geminiGenerate({
          apiKey,
          system:
            "You are a concise, encouraging strength coach. Given a chosen training split and the lifter's profile, write ONE short paragraph (2-3 sentences, max 60 words) explaining why this split suits them and one thing to focus on. No headings, no lists. Respond as JSON: {\"note\": string}.",
          user: `Split: ${meta.label}. Experience: ${input.experience}. Days/week: ${input.daysPerWeek}. Goal: ${input.goal ?? "general fitness"}. Location: ${input.location ?? "gym"}.`,
          json: true,
          maxOutputTokens: 300,
        });
        const validated = aiNoteSchema.safeParse(JSON.parse(text));
        if (validated.success) aiNote = validated.data.note;
      } catch {
        // Ignore — deterministic rationale is enough.
      }
    }

    return NextResponse.json({
      split: rec.split,
      label: meta.label,
      rationale: rec.rationale,
      aiNote,
    });
  } catch (error) {
    console.error("suggest-split error:", error);
    return NextResponse.json(
      { error: "Failed to suggest a split" },
      { status: 500 },
    );
  }
}
