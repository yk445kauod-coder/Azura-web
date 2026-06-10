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
// Using Groq API with smart conversational AI
export async function chatWithAI(
  apiKey: string,
  message: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemPrompt: string
): Promise<string> {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  
  // Detect user language from message
  const isArabic = /[\u0600-\u06FF]/.test(message) || message.includes('في') || message.includes('ال') || message.includes('ما') || message.includes('أنا') || message.includes('إيه') || message.includes('عاوز') || message.includes('محتاج') || message.includes('عندي');
  
  const langInstruction = isArabic 
    ? `RESPOND IN EGYPTIAN ARABIC (عامية مصرية) - never use English unless user switches to English`
    : `RESPOND IN ENGLISH - be natural and friendly`;

  // Enhanced system prompt for smart conversational AI
  const enhancedSystem = `${systemPrompt}

## CONVERSATION STYLE
- Be friendly, warm, and like a real barista friend
- ${langInstruction}
- Ask questions to understand what they want
- Remember previous messages and build on them
- Don't just list items - have a real conversation

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

  // Convert history to Groq format
  const groqHistory = history.map((h) => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.parts[0]?.text || "",
  }));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: enhancedSystem },
        ...groqHistory,
        { role: "user", content: message }
      ],
      temperature: 0.85,
      max_tokens: 700,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Groq API error:", err);
    
    if (err.includes("429") || err.includes("rate_limit")) {
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    }
    if (err.includes("invalid") || err.includes("api_key")) {
      throw new Error("Invalid API key. Please check your Egytronic key in Admin settings.");
    }
    throw new Error("AI service error. Please try again.");
  }
  
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ── Free TTS using Pollinations API ─────────────────────────────────────
// Completely free, no API key needed, high quality voices
export async function textToSpeech(text: string, lang: string = "en"): Promise<string> {
  try {
    // Use Pollinations TTS - free, no auth needed
    // Voice selection: 'af_heart' (female), 'af_bella' (female), 'af_nicole' (female)
    // 'am_adam' (male), 'am_michael' (male)
    // For Arabic, use a voice that can handle Arabic or fallback to English
    
    const voiceMap: Record<string, string> = {
      'en': 'af_bella', // English female
      'ar': 'af_heart', // Arabic female (works for both)
    };
    
    const voice = voiceMap[lang] || 'af_bella';
    const encodedText = encodeURIComponent(text.slice(0, 200)); // Limit text length
    // Use Pollinations TTS endpoint
    const url = `https://api.pollen.store/tts?text=${encodedText}&voice=${voice}&model=chat`;
    
    // Return the URL for audio playback
    return url;
  } catch (err) {
    console.error("TTS error:", err);
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