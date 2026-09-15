/**
 * Thin server-only wrapper around the Google Gemini REST API. Uses the built-in
 * `fetch` (no SDK dependency). Never import this from a client component — it
 * reads the API key on the server.
 */

const DEFAULT_MODEL = "gemini-3.6-flash";

function endpoint(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

export interface GeminiRequest {
  apiKey: string;
  system: string;
  user: string;
  /** Ask Gemini to return strict JSON (application/json). Default true. */
  json?: boolean;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Calls Gemini and returns the raw text of the first candidate. When `json` is
 * true the model is constrained to return a JSON document, but callers should
 * still validate the parsed result (e.g. with Zod) — never trust it blindly.
 */
export async function geminiGenerate({
  apiKey,
  system,
  user,
  json = true,
  model = DEFAULT_MODEL,
  temperature = 0.7,
  maxOutputTokens = 4000,
}: GeminiRequest): Promise<string> {
  const res = await fetch(`${endpoint(model)}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        ...(json ? { responseMimeType: "application/json" } : {}),
        temperature,
        maxOutputTokens,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    promptFeedback?: { blockReason?: string };
  };

  if (data.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked the request: ${data.promptFeedback.blockReason}`);
  }

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new Error("Gemini returned an empty response");
  return text;
}
