import { Router } from "express";

const router = Router();

const TTS_MODELS = [
  "gemini-2.5-flash-preview-tts",
  "gemini-2.0-flash-preview-tts",
];

const VOICE_MAP: Record<string, string> = {
  female: "Aoede",
  male: "Orus",
};

function pcmToWavBase64(pcmBase64: string): string {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");
  const sampleRate = 24000;
  const channels = 1;
  const bitDepth = 16;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * (bitDepth / 8), 28);
  header.writeUInt16LE(channels * (bitDepth / 8), 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]).toString("base64");
}

router.post("/tts", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { res.status(503).json({ error: "TTS not configured" }); return; }

  const { text, persona = "female" } = req.body as {
    text: string;
    persona?: "female" | "male";
    lang?: string;
  };

  if (!text?.trim()) { res.status(400).json({ error: "text required" }); return; }

  const clean = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#+\s*/g, "")
    .replace(/\[SUGGEST:[^\]]+\]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim()
    .slice(0, 600);

  if (!clean) { res.status(400).json({ error: "empty text after cleaning" }); return; }

  const voiceName = VOICE_MAP[persona] ?? "Aoede";

  // Minimal request body — no systemInstruction (not supported by TTS models)
  const body = {
    contents: [{ parts: [{ text: clean }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  };

  for (const model of TTS_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const rawText = await response.text();

      if (!response.ok) {
        let parsed: Record<string, unknown> = {};
        try { parsed = JSON.parse(rawText); } catch { /* ignore */ }
        const errMsg = String((parsed.error as Record<string, unknown>)?.message || rawText).toLowerCase();

        req.log.warn({ model, status: response.status, err: errMsg.slice(0, 200) }, "TTS model error");

        // Quota / not found → try next model
        if (
          response.status === 429 || response.status === 404 ||
          errMsg.includes("quota") || errMsg.includes("not found") ||
          errMsg.includes("not exist") || errMsg.includes("deprecated")
        ) {
          continue;
        }

        // Other errors: stop and report
        req.log.error({ model, status: response.status, body: rawText.slice(0, 400) }, "TTS fatal error");
        res.status(502).json({ error: "TTS API error", detail: errMsg.slice(0, 120) });
        return;
      }

      let data: Record<string, unknown>;
      try { data = JSON.parse(rawText); } catch {
        req.log.error({ model }, "TTS invalid JSON response");
        continue;
      }

      type GeminiCandidate = { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } };
      const candidates = data.candidates as GeminiCandidate[] | undefined;
      const inlineData = candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;

      if (inlineData?.data) {
        const wavBase64 = pcmToWavBase64(inlineData.data);
        res.json({ audio: wavBase64, mimeType: "audio/wav", model });
        return;
      }

      req.log.warn({ model, response: rawText.slice(0, 300) }, "TTS no audio in response");
    } catch (err) {
      req.log.warn({ model, err }, "TTS exception");
    }
  }

  // All models failed — return 429 so frontend gracefully falls back to browser TTS
  res.status(429).json({ error: "TTS unavailable — all models failed or quota exceeded" });
});

export default router;
