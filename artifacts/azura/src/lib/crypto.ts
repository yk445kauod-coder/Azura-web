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

// Using multi-fallback and resilient conversational AI sequence
export async function chatWithAI(
  apiKey: string,
  message: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemPrompt: string
): Promise<string> {
  let apiSettings: any = {
    aiProvider: "groq",
    groqKey: "",
    geminiKey: "",
    openrouterKey: "",
    openaiKey: "",
    zaiKey: "",
    claudeKey: "",
    openaiEndpoint: ""
  };

  try {
    const { db, ref, get } = await import("./firebase");
    const snap = await get(ref(db, "api-settings"));
    if (snap.exists()) {
      apiSettings = { ...apiSettings, ...snap.val() };
    }
  } catch (e) {
    console.warn("Could not load AI settings, using defaults", e);
  }

  const keys: Record<string, string> = {
    groq: decryptKey(apiSettings.groqKey) || apiKey,
    gemini: decryptKey(apiSettings.geminiKey) || apiKey,
    openrouter: decryptKey(apiSettings.openrouterKey) || apiKey,
    openai: decryptKey(apiSettings.openaiKey) || apiKey,
    zai: decryptKey(apiSettings.zaiKey) || apiKey,
    claude: decryptKey(apiSettings.claudeKey) || apiKey,
  };

  const formattedHistory = history.map((h) => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.parts[0]?.text || "",
  }));

  const DEFAULT_FALLBACK_SEQUENCE = [
    "groq",
    "pollinations",
    "gemini",
    "openrouter",
    "openai",
    "zai",
    "claude"
  ];

  const primary = apiSettings.aiProvider || "groq";
  const cascade = [
    primary,
    ...DEFAULT_FALLBACK_SEQUENCE.filter(p => p !== primary)
  ];

  for (const provider of cascade) {
    try {
      if (provider === "groq") {
        const key = keys.groq;
        if (!key) continue;
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              ...formattedHistory,
              { role: "user", content: message }
            ],
            temperature: 0.85,
            max_tokens: 700,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        }
        throw new Error(`Groq API error: ${res.status}`);
      }

      if (provider === "pollinations") {
        const content = await chatWithPollinations(message, history, systemPrompt);
        if (content) return content;
        throw new Error("Pollinations returned empty response");
      }

      if (provider === "gemini") {
        const key = keys.gemini;
        if (!key) continue;
        const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
          },
          body: JSON.stringify({
            model: "gemini-1.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              ...formattedHistory,
              { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 700,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        }
        throw new Error(`Gemini API error: ${res.status}`);
      }

      if (provider === "openrouter") {
        const key = keys.openrouter;
        if (!key) continue;
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`,
            "HTTP-Referer": "https://azuracafe.com"
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.3-70b-instruct:free",
            messages: [
              { role: "system", content: systemPrompt },
              ...formattedHistory,
              { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 700,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        }
        throw new Error(`OpenRouter API error: ${res.status}`);
      }

      if (provider === "openai") {
        const key = keys.openai;
        if (!key) continue;
        const endpoint = apiSettings.openaiEndpoint || "https://api.openai.com/v1";
        const res = await fetch(`${endpoint.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              ...formattedHistory,
              { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 700,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        }
        throw new Error(`OpenAI API error: ${res.status}`);
      }

      if (provider === "zai") {
        const key = keys.zai;
        if (!key) continue;
        const res = await fetch("https://api.z.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
          },
          body: JSON.stringify({
            model: "z-pro",
            messages: [
              { role: "system", content: systemPrompt },
              ...formattedHistory,
              { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 700,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        }
        throw new Error(`Z.ai API error: ${res.status}`);
      }

      if (provider === "claude") {
        const key = keys.claude;
        if (!key) continue;
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": key,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 700,
            system: systemPrompt,
            messages: formattedHistory.map(h => ({
              role: h.role,
              content: h.content
            })).concat([{ role: "user", content: message }])
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.content?.[0]?.text;
          if (content) return content;
        }
        throw new Error(`Claude API error: ${res.status}`);
      }
    } catch (err) {
      console.warn(`AI Provider '${provider}' failed, falling back to next...`, err);
    }
  }

  // Absolute final resort fallback if all cascade items fail
  try {
    return await chatWithPollinations(message, history, systemPrompt);
  } catch (err) {
    console.error("All fallback AI providers failed:", err);
    return "Sorry, I am having trouble connecting to my brain right now. Please try again in a moment!";
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