import { Router } from "express";

const router = Router();

// ── Model priority: cheapest/fastest first, most capable as fallback ──────────
const MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash",
  "gemini-2.5-flash",
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
];

// ── Rate limiting: max 10 req/min per IP ──────────────────────────────────────
const rateLimitMap = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateLimitMap.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  rateLimitMap.set(ip, hits);
  return hits.length > RATE_MAX;
}

// Clean up old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [ip, hits] of rateLimitMap.entries()) {
    const recent = hits.filter((t) => t > cutoff);
    if (recent.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, recent);
  }
}, 300_000);

// ── In-flight deduplication: avoid hammering with identical prompts ────────────
const inflightMap = new Map<string, Promise<{ content?: string; model?: string; error?: string }>>();

// ── Response cache for identical recent prompts (30s TTL) ─────────────────────
const responseCache = new Map<string, { content: string; model: string; ts: number }>();
const CACHE_TTL = 30_000;

function cacheKey(systemPrompt: string | undefined, contents: unknown[]): string {
  const last = (contents as { parts?: { text?: string }[] }[]).at(-1)?.parts?.[0]?.text || "";
  return `${(systemPrompt || "").slice(0, 80)}|${last.slice(0, 120)}`;
}

// ── Core Gemini caller ────────────────────────────────────────────────────────
async function callGemini(
  apiKey: string,
  model: string,
  contents: unknown[],
  systemPrompt?: string,
): Promise<{ ok: boolean; content?: string; error?: string }> {
  const body: Record<string, unknown> = {
    contents,
    generationConfig: { maxOutputTokens: 512, temperature: 0.82, topP: 0.9 },
  };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000), // 12s timeout
    });
  } catch (fetchErr) {
    return { ok: false, error: "SKIP" }; // network/timeout → try next model
  }

  const data = await res.json() as Record<string, unknown>;

  if (!res.ok) {
    const errMsg = ((data.error as Record<string, unknown>)?.message as string) || "error";
    const skipable = res.status === 429 || res.status === 404 || res.status === 400 ||
      errMsg.toLowerCase().includes("quota") ||
      errMsg.toLowerCase().includes("resource_exhausted") ||
      errMsg.toLowerCase().includes("not found") ||
      errMsg.toLowerCase().includes("deprecated");
    return { ok: false, error: skipable ? "SKIP" : errMsg };
  }

  const candidates = data.candidates as {
    content?: { parts?: { text?: string; thought?: boolean; functionCall?: unknown; executableCode?: unknown; codeExecutionResult?: unknown }[] };
    finishReason?: string;
  }[] | undefined;

  const parts = candidates?.[0]?.content?.parts ?? [];
  const content = parts
    .filter((p) => typeof p.text === "string" && !p.thought && !p.functionCall && !p.executableCode && !p.codeExecutionResult)
    .map((p) => p.text as string)
    .join("")
    .trim();

  return { ok: true, content };
}

// ── Cascade through models with exponential backoff on quota hits ─────────────
async function cascadeModels(
  apiKey: string,
  contents: unknown[],
  systemPrompt?: string,
): Promise<{ content: string; model: string } | null> {
  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    const result = await callGemini(apiKey, model, contents, systemPrompt);
    if (result.ok && result.content) {
      return { content: result.content, model };
    }
    if (result.error !== "SKIP") {
      // Hard error — don't try more models, surface it
      throw new Error(result.error || "AI error");
    }
    // SKIP → next model, brief stagger to avoid burst
    if (i < MODELS.length - 1) await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

// ── Route ─────────────────────────────────────────────────────────────────────
router.post("/chat", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { res.status(503).json({ error: "AI service not configured" }); return; }

  const ip = (req.headers["x-forwarded-for"] as string || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Too many requests — slow down a little ☕" }); return;
  }

  try {
    const { message, history = [], systemPrompt } = req.body as {
      message: string;
      history?: { role: string; parts: { text: string }[] }[];
      systemPrompt?: string;
    };

    if (!message?.trim()) { res.status(400).json({ error: "Message is required" }); return; }

    const contents = [
      ...history.slice(-10).filter((m) => m.role === "user" || m.role === "model"),
      { role: "user", parts: [{ text: message.slice(0, 2000) }] }, // cap input
    ];

    // Check cache for identical recent prompt
    const ck = cacheKey(systemPrompt, contents);
    const cached = responseCache.get(ck);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      res.json({ content: cached.content, model: cached.model + " (cached)" });
      return;
    }

    // Deduplicate identical in-flight requests
    if (inflightMap.has(ck)) {
      const result = await inflightMap.get(ck)!;
      if (result.content) { res.json(result); return; }
    }

    const requestPromise = (async () => {
      try {
        const result = await cascadeModels(apiKey, contents, systemPrompt);
        if (!result) return { error: "All AI models are at capacity — please try again in a moment." };
        responseCache.set(ck, { content: result.content, model: result.model, ts: Date.now() });
        return { content: result.content, model: result.model };
      } catch (err) {
        return { error: (err as Error).message || "AI error" };
      } finally {
        inflightMap.delete(ck);
      }
    })();

    inflightMap.set(ck, requestPromise);
    const result = await requestPromise;

    if (result.error) {
      res.status(result.error.includes("capacity") ? 429 : 502).json({ error: result.error });
    } else {
      res.json(result);
    }
  } catch (err) {
    req.log.error({ err }, "Gemini exception");
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
