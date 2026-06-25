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
 */
export async function chatWithPollinations(
  message: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemPrompt: string
): Promise<string> {
  const url = "https://text.pollinations.ai/openai/chat/completions";

  const formattedHistory = history.map((h) => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.parts[0]?.text || "",
  }));

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

    if (!res.ok) throw new Error("Pollinations API failed");
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("Pollinations error:", err);
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
  
  // Detect user language from message
  const isArabic = /[\u0600-\u06FF]/.test(message);
  
  const langInstruction = isArabic 
    ? `IMPORTANT: RESPOND IN FLUENT EGYPTIAN ARABIC (عامية مصرية أصيلة). Use warm, local Alexandria-style hospitality. Keep it professional yet very friendly.`
    : `IMPORTANT: RESPOND IN NATURAL, SOPHISTICATED ENGLISH. Be warm and professional like a high-end Alexandrian cafe host.`;

  // Enhanced system prompt for smart conversational AI
  const enhancedSystem = `${systemPrompt}

## PERSONALITY & LANGUAGE
- You are Zura, a world-class barista.
- ${langInstruction}
- Use a proactive approach: "Would you like some almond milk with that?" or "That pairs perfectly with our croissant!"
- Avoid robotic or repetitive phrases.

## EXAMPLES OF GOOD CONVERSATION:
${isArabic ? `
User: "عاوز قهوة"
Good response: "يا صديقه! ☕ عادي ولا كافي؟ لو حابب حاجة حلوه، ممكن أجيبلك لاتيه بالكراميل، تحفة!"
User: "إيه أحسن حاجة؟"
Good response: "يعتمد علي ذوقك! لو عايز حاجة قوية، الإسبرسو عندنا ممتاز. لو عايز حاجة خفيفه، السموتشي الفواكه تحفة! عايز أعرض عليك حاجة منهم؟"
` : `
User: "I want coffee"
Good response: "Hey! ☕ Great choice! What kind of mood are you in? If you want something sweet, our Caramel Latte is amazing. Want me to recommend one?"
User: "What's your best?"
Good response: "Depends on your taste! For strong coffee lovers, our Espresso is top-notch. If you want something lighter, our Fruit Smoothie is super refreshing! Want me to show you either one?"
`}

## ACTION RULES
- When user asks about a specific item, showcase it with: [ADD_ITEM:item_id]
- Only highlight items when genuinely relevant to the conversation
- If user is just chatting, respond naturally without highlighting items
- DO NOT mention ordering, cart, or placing orders — this is a digital menu, not an ordering app

## IMPORTANT
- Keep responses conversational, not robotic
- Use friendly emojis occasionally
- Match the user's energy (casual vs formal)
- If confused about what they want, ask a question
- Never break character - you are a friendly barista`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Llama 3.3 70B — best available on Groq, excellent Arabic + Egyptian dialect
        messages: [
          { role: "system", content: enhancedSystem },
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
      return chatWithPollinations(message, history, enhancedSystem);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.warn("Groq error, falling back to Pollinations:", err);
    return chatWithPollinations(message, history, enhancedSystem);
  }
}

// ── High-Quality TTS via StreamElements (AWS Polly voices, free, no API key) ──
/**
 * Returns a URL for a natural-sounding human voice (AWS Polly via StreamElements).
 * Arabic → Zeina (native Egyptian-Arabic female).
 * English → Ivy (warm female voice).
 * No CORS issues when set as <audio> src directly (no crossOrigin attribute).
 */
export async function textToSpeech(text: string, lang: string = "en"): Promise<string> {
  // Strip markdown / HTML tags, limit to 250 chars (StreamElements limit)
  const cleanText = text
    .replace(/[*_`#\[\]]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 250);

  if (!cleanText) return "";

  const voice = lang === "ar" ? "Zeina" : "Ivy";
  const encoded = encodeURIComponent(cleanText);
  return `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encoded}`;
}

// Play audio from URL — no crossOrigin attribute so any URL works without CORS headers
export function playAudioFromUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio();
    // Do NOT set crossOrigin — lets audio load from any URL without CORS headers
    audio.src = url;
    audio.onended = () => resolve();
    audio.onerror = () => {
      console.warn("TTS playback failed (StreamElements)");
      resolve();
    };
    audio.play().catch(() => resolve());
  });
}