import "server-only";
import { z } from "zod";
import { env } from "./env";

export async function geminiJson<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  const e = env();

  // Discover valid models for this API key
  let available: string[] = [];
  try {
    const listRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": e.GEMINI_API_KEY },
      cache: "no-store",
    });
    if (listRes.ok) {
      const listData = (await listRes.json()) as { models?: { name?: string; supportedGenerationMethods?: string[] }[] };
      available = (listData.models ?? [])
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m) => m.name?.replace(/^models\//, "") ?? "")
        .filter((m) => m.startsWith("gemini-") && !m.includes("tts") && !m.includes("audio") && !m.includes("embedding") && !m.includes("image"));
    } else {
      const err = (await listRes.json()) as { error?: { message?: string } };
      throw new Error(`ListModels HTTP ${listRes.status}: ${err.error?.message ?? ""}`);
    }
  } catch (err) {
    throw new Error(`Gemini auth/list failed: ${err instanceof Error ? err.message : "unknown"}`);
  }

  const model = available.includes(e.GEMINI_MODEL)
    ? e.GEMINI_MODEL
    : available.find((m) => m.includes("flash")) ?? available[0];

  if (!model) {
    throw new Error(`No models supporting generateContent found. Available: ${available.join(", ")}`);
  }

  // Prioritize models
  const modelsToTry = [
    model,
    ...available.filter((m) => m !== model),
  ];

  let lastError: Error | null = null;
  for (const m of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": e.GEMINI_API_KEY },
          cache: "no-store",
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
          }),
        }
      );
      if (!r.ok) {
        const err = (await r.json()) as { error?: { message?: string } };
        lastError = new Error(`Gemini (${m}) failed HTTP ${r.status}: ${err.error?.message ?? ""}`);
        // If invalid model, quota, or server error, break to try next available model
        if (r.status >= 400) break;
        throw lastError;
      }
      const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
      try {
        return schema.parse(JSON.parse(text ?? ""));
      } catch {
        // retry once
      }
    }
  }

  throw lastError ?? new Error("Model returned invalid JSON twice");
}
