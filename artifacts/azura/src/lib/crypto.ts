/**
 * Simple encryption utility for API keys
 * Uses XOR cipher with a secret salt - not cryptographically secure
 * but prevents casual inspection of the key in Firebase
 */

const SECRET_SALT = "Azura2024Cafe";

// Markers to identify encrypted vs plain text keys
const ENCRYPTED_PREFIX = "___ENC___";

export function encryptKey(key: string): string {
  if (!key) return "";
  let result = "";
  for (let i = 0; i < key.length; i++) {
    const charCode = key.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
    result += String.fromCharCode(charCode);
  }
  return ENCRYPTED_PREFIX + btoa(result);
}

export function decryptKey(encrypted: string): string {
  if (!encrypted) return "";
  
  // Check if it's actually encrypted
  if (!encrypted.startsWith(ENCRYPTED_PREFIX)) {
    // Not encrypted, return as-is
    return encrypted;
  }
  
  try {
    const base64Part = encrypted.slice(ENCRYPTED_PREFIX.length);
    const decoded = atob(base64Part);
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    return "";
  }
}

// Check if key looks valid (basic validation)
export function isValidApiKey(key: string): boolean {
  if (!key) return false;
  // Groq keys start with gsk_
  // Gemini keys: AIza... or AQ...
  return key.length >= 30 && (key.startsWith("gsk_") || key.startsWith("AIza") || key.startsWith("AQ."));
}

// ── AI Chat ─────────────────────────────────────────────────

/**
 * Fallback AI Chat using Pollinations.ai (Free text API)
 * Features a highly resilient GET fallback if the POST endpoint is offline or 502'ing.
 */
export async function chatWithPollinations(
  message: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemPrompt: string
): Promise<string> {
  const formattedHistory = history.map((h) => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.parts[0]?.text || "",
  }));

  // First try the official OpenAI-compatible POST endpoint
  const url = "https://text.pollinations.ai/openai/chat/completions";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          ...formattedHistory,
          { role: "user", content: message }
        ],
        model: "openai",
        temperature: 0.7
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return content;
    }
  } catch (err) {
    console.warn("Pollinations POST endpoint failed, trying GET fallback:", err);
  }

  // Fallback to GET endpoint which is robust and bypasses Cloudflare 502 Bad Gateway
  try {
    const historyText = history.map((h) => `${h.role === 'model' ? 'Assistant' : 'User'}: ${h.parts[0]?.text || ""}`).join("\n");
    const fullPrompt = historyText ? `${historyText}\nUser: ${message}` : message;

    // Append model=openai to utilize the full free reasoning model on pollinations.ai
    const getUrl = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?system=${encodeURIComponent(systemPrompt)}&model=openai`;

    const res = await fetch(getUrl);
    if (res.ok) {
      const text = await res.text();
      if (text) return text;
    }
    throw new Error(`GET request failed with status: ${res.status}`);
  } catch (err) {
    console.error("Pollinations GET fallback failed:", err);
    throw err;
  }
}

// Using Groq API with smart conversational AI (Primary)
export async function chatWithAI(
  apiKey: string,
  message: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemPrompt: string
): Promise<string> {
  // Load settings to determine provider
  let aiProvider = "groq";
  let openaiEndpoint = "";

  try {
    const { db, ref, get } = await import("./firebase");
    const snap = await get(ref(db, "api-settings"));
    if (snap.exists()) {
      const data = snap.val();
      aiProvider = data.aiProvider || "groq";
      openaiEndpoint = data.openaiEndpoint || "";
    }
  } catch (e) {
    console.warn("Could not load AI settings, defaulting to groq", e);
  }

  const formattedHistory = history.map((h) => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.parts[0]?.text || "",
  }));

  // Pollinations.ai (Free Fallback)
  if (aiProvider === "pollinations" || (!apiKey && aiProvider !== "pollinations")) {
    return chatWithPollinations(message, history, systemPrompt);
  }

  // OpenAI Compatible
  if (aiProvider === "openai" && openaiEndpoint) {
    try {
      const res = await fetch(`${openaiEndpoint.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            ...formattedHistory,
            { role: "user", content: message }
          ]
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "";
      }
    } catch (e) {
      console.error("OpenAI provider error:", e);
    }
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // High quality best Arabic support model
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map((h) => ({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: h.parts[0]?.text || "",
          })),
          { role: "user", content: message }
        ],
        temperature: 0.85,
        max_tokens: 700,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn("Groq API error, falling back to Pollinations:", err);
      return chatWithPollinations(message, history, systemPrompt);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.warn("Groq error, falling back to Pollinations:", err);
    return chatWithPollinations(message, history, systemPrompt);
  }
}

// ── TTS via Web Speech API (browser built-in, zero CORS, no API key) ──
/**
 * Speaks text using the browser's built-in SpeechSynthesis engine.
 * Arabic → ar-EG locale.  English → en-US locale.
 * Falls back silently if the browser does not support speechSynthesis.
 */
export function speakText(text: string, lang: string = "en"): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) { resolve(); return; }
    window.speechSynthesis.cancel();

    const clean = text
      .replace(/[*_`#\[\]]/g, "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);

    if (!clean) { resolve(); return; }

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang    = lang === "ar" ? "ar-EG" : "en-US";
    utterance.rate    = lang === "ar" ? 0.88 : 1.0;
    utterance.pitch   = 1.0;
    utterance.volume  = 1.0;
    utterance.onend   = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

/** @deprecated Use speakText() directly */
export async function textToSpeech(_text: string, _lang: string = "en"): Promise<string> {
  return "";
}

/** @deprecated Use speakText() directly */
export function playAudioFromUrl(_url: string): Promise<void> {
  return Promise.resolve();
}