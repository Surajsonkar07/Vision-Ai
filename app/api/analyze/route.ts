import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const MODELS = [
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
  "google/gemma-3-4b-it:free",
  "nvidia/nemotron-nano-12b-v2-vl:free",
];

const Body = z.object({
  image: z
    .string()
    .startsWith("data:image/", "Send the image as a data URL.")
    .max(12_000_000, "Image is too large. Use a photo under 8 MB."),
  targetLanguage: z.string().min(2).max(40).default("English"),
  deepSearch: z.boolean().default(false),
});

/** Lets the client know whether "Describe with AI" is available. Never exposes the key. */
export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.OPENROUTER_API_KEY) });
}

function buildPrompt(language: string, deep: boolean) {
  const shared = `Respond with one valid JSON object only. No markdown, no code fences.
Translate "object" and "explanation" into ${language} inside "translation".`;
  return deep
    ? `Analyse this image with maximum precision. Identify the main object or text.
${shared}
Fields:
- "object": full formal name in English
- "explanation": a detailed 4-5 sentence analysis in English
- "translation": { "object", "explanation" } in ${language}
- "detected_lang": original language of any visible text, or "none"
- "deep_info": scientific or technical background in English
- "examples": three distinct real-world examples in English`
    : `Analyse this image. Identify the main object or text.
${shared}
Fields:
- "object": short name in English
- "explanation": 1-2 sentences in English
- "translation": { "object", "explanation" } in ${language}
- "detected_lang": original language of any visible text, or "none"`;
}

export async function POST(req: Request) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "AI description is not configured on this server (OPENROUTER_API_KEY)." },
      { status: 503 },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  const { image, targetLanguage, deepSearch } = parsed.data;
  const prompt = buildPrompt(targetLanguage, deepSearch);
  const origin = req.headers.get("origin") ?? "https://vision-ai.app";

  let lastError = "No model responded.";
  for (const model of MODELS) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": origin,
          "X-Title": "VisionAI",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: image } },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(45_000),
      });
      const data = await response.json();
      const content: unknown = data?.choices?.[0]?.message?.content;
      if (data.error || typeof content !== "string") {
        lastError = data.error?.message ?? `Empty response from ${model}`;
        continue;
      }
      const jsonText = content.replace(/```json|```/g, "").trim();
      const start = jsonText.indexOf("{");
      const end = jsonText.lastIndexOf("}");
      const result = JSON.parse(jsonText.slice(start, end + 1));
      return NextResponse.json({ ...result, used_model: model });
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network or parsing error";
    }
  }
  return NextResponse.json(
    { error: `All ${MODELS.length} vision models failed. Last error: ${lastError}` },
    { status: 502 },
  );
}
