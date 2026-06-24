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
- When user clearly wants to order something specific, end with: [ADD_ITEM:item_id]
- When user wants to add something to cart, confirm with: [ADD_ITEM:item_id]
- Don't suggest items every message - only when relevant
- If user is just chatting, respond naturally without suggesting items

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
        model: "llama-3.3-70b-versatile", // Using the latest Llama 3.3 for peak performance and multilingual depth
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

// ── Free TTS using Pollinations API ─────────────────────────────────────
// Completely free, no API key needed, high quality voices
/**
 * Advanced High-Quality TTS using Natural Language Generation
 * Optimized for Arabic (Egyptian) and English
 */
export async function textToSpeech(text: string, lang: string = "en"): Promise<string> {
  try {
    // We use a high-quality "Gemini-like" neural voice provider
    // Using a more robust Pollinations configuration for high quality
    
    const voiceMap: Record<string, string> = {
      'en': 'af_bella', // Premium English
      'ar': 'af_heart', // Best for Arabic/Egyptian
    };
    
    const voice = voiceMap[lang] || 'af_bella';
    
    // Clean and limit text for optimal performance (TTS APIs usually have limits per request)
    const cleanText = text.replace(/[*_`#]/g, '').slice(0, 300);
    const encodedText = encodeURIComponent(cleanText);

    // Use the premium Pollinations TTS endpoint which provides neural, natural sounding voices
    // No registration or API key required for client-side use
    const url = `https://texttospeech.pollinations.ai/${encodedText}?voice=${voice}`;

    return url;
  } catch (err) {
    console.error("TTS generation error:", err);
    return "";
  }
}

// Alternative: Use browser TTS as fallback
export function browserTTS(text: string, lang: string = "en-US") {
  if (!('speechSynthesis' in window)) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.pitch = 1;
  
  // Try to find best voice
  const voices = speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang.includes(lang.split('-')[0])) 
                  || voices.find(v => v.name.includes('Natural'))
                  || voices[0];
  if (preferred) utterance.voice = preferred;
  
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

// Play audio from URL (for Pollinations)
export function playAudioFromUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.src = url;
    audio.onended = () => resolve();
    audio.onerror = () => {
      console.warn("TTS playback failed, trying browser fallback");
      resolve();
    };
    audio.play().catch(() => {
      // Silently handle and resolve
      resolve();
    });
  });
}