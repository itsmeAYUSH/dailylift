/**
 * Thin server-only wrapper around the Google Gemini REST API. Uses the built-in
 * `fetch` (no SDK dependency). Never import this from a client component — it
 * reads the API key on the server.
 *
 * Resilience: Gemini periodically returns 503 UNAVAILABLE ("high demand") or 429
 * when a model is overloaded. These are transient, so each model is retried with
 * exponential backoff, and we fall back to alternate models before giving up.
 */

/** Primary model, overridable via GEMINI_MODEL without a code change. */
const DEFAULT_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";

/**
 * Models tried in order. If the primary is overloaded (503/429) or missing
 * (404), we fall back to the next one. Duplicates are removed at call time.
 *
 * `*-latest` are self-updating aliases (resilient to model retirements); the
 * lite alias is lighter and tends to stay available under load. These were
 * verified available; older 2.x flash models have been retired (404).
 */
const FALLBACK_MODELS = [
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-flash-lite-latest",
];

/** HTTP statuses that are worth retrying (transient / overload). */
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

const MAX_ATTEMPTS_PER_MODEL = 3;

/** Error carrying the upstream status so callers can map it to an HTTP response. */
export class GeminiError extends Error {
  status: number;
  /** True when the failure is transient (overload / rate limit / network). */
  retryable: boolean;
  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
    this.retryable = retryable;
  }
}

function endpoint(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

/** A single request to one model. Throws GeminiError on any non-2xx. */
async function callModel(
  model: string,
  { apiKey, system, user, json, temperature, maxOutputTokens }: Required<Omit<GeminiRequest, "model">>,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${endpoint(model)}?key=${encodeURIComponent(apiKey)}`, {
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
  } catch {
    // Network error reaching Google — treat as transient.
    throw new GeminiError("Could not reach the AI service.", 503, true);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GeminiError(
      `Gemini API error ${res.status}: ${body.slice(0, 300)}`,
      res.status,
      RETRYABLE_STATUS.has(res.status),
    );
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    promptFeedback?: { blockReason?: string };
  };

  if (data.promptFeedback?.blockReason) {
    throw new GeminiError(
      `Gemini blocked the request: ${data.promptFeedback.blockReason}`,
      422,
      false,
    );
  }

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new GeminiError("Gemini returned an empty response", 502, true);
  return text;
}

/**
 * Calls Gemini and returns the raw text of the first candidate. When `json` is
 * true the model is constrained to return a JSON document, but callers should
 * still validate the parsed result (e.g. with Zod) — never trust it blindly.
 *
 * Retries transient failures per model, then falls back to alternate models.
 * Throws a `GeminiError` (with `.status`/`.retryable`) when every attempt fails.
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
  const models = [...new Set([model, ...FALLBACK_MODELS])];
  const params = { apiKey, system, user, json, temperature, maxOutputTokens };
  let lastError: GeminiError = new GeminiError("AI generation failed.", 503, true);

  for (const m of models) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        return await callModel(m, params);
      } catch (err) {
        const e =
          err instanceof GeminiError
            ? err
            : new GeminiError("AI generation failed.", 503, true);
        lastError = e;

        // 404 → this model isn't available; skip straight to the next model.
        if (e.status === 404) break;
        // Non-retryable (bad key, blocked prompt, bad request) → stop entirely.
        if (!e.retryable) throw e;
        // Retryable and attempts remain → back off (0.5s, 1s, 2s) with jitter.
        if (attempt < MAX_ATTEMPTS_PER_MODEL) {
          await sleep(500 * 2 ** (attempt - 1) + Math.random() * 250);
        }
      }
    }
  }

  throw lastError;
}
