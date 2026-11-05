import "server-only";
import { z } from "zod";
import { env } from "./env";

export async function geminiJson<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  const e = env();
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(e.GEMINI_MODEL)}:generateContent`,
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
    if (!r.ok) throw new Error(`Gemini request failed (HTTP ${r.status})`);
    const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
    try {
      return schema.parse(JSON.parse(text ?? ""));
    } catch {
      // retry once
    }
  }
  throw new Error("Model returned invalid JSON twice");
}

