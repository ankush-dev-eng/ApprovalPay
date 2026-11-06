import "server-only";
import { z } from "zod";
import { env } from "./env";

export async function geminiJson<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  const e = env();
  const primaryModel = e.GEMINI_MODEL || "gemini-1.5-flash";
  const candidateModels = [primaryModel];
  if (primaryModel !== "gemini-1.5-flash") {
    candidateModels.push("gemini-1.5-flash");
  }

  let lastError: Error | null = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": e.GEMINI_API_KEY },
            cache: "no-store",
            signal: AbortSignal.timeout(15000),
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
            }),
          }
        );

        if (!r.ok) {
          const err = (await r.json().catch(() => ({}))) as { error?: { message?: string } };
          const errorMsg = err.error?.message || `HTTP ${r.status}`;
          lastError = new Error(`Gemini (${model}): ${errorMsg}`);

          if (r.status === 404) {
            // Model name not found on this API version; try fallback model
            break;
          }
          if (r.status === 429) {
            throw new Error("Gemini quota or rate limit exceeded. Please wait a moment and try again.");
          }
          continue;
        }

        const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          lastError = new Error(`Gemini (${model}) returned an empty candidate`);
          continue;
        }

        return schema.parse(JSON.parse(text));
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (lastError.message.includes("rate limit") || lastError.message.includes("quota")) {
          throw lastError;
        }
      }
    }
  }

  throw lastError ?? new Error("Failed to parse structured JSON from model");
}
