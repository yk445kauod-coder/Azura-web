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
// Using Groq API with agentic capabilities
export async function chatWithAI(
  apiKey: string,
  message: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemPrompt: string
): Promise<string> {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  
  // Enhanced system prompt for smarter agentic behavior
  const enhancedSystem = `${systemPrompt}

IMPORTANT INSTRUCTIONS:
- Be conversational and natural in Egyptian Arabic when user writes in Arabic
- Keep responses SHORT (1-3 sentences max)
- When recommending items, ALWAYS end with: [ADD_ITEM:item_id]
- When user asks to modify an order, confirm with: [CONFIRM_ORDER]
- For questions about menu, ALWAYS use the menu data provided
- Be helpful, warm, and proactive - suggest add-ons and upgrades
- If user seems confused, offer to show popular items
- Remember conversation context and personalize recommendations
- Suggest combo deals or pairings when appropriate`;

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
      temperature: 0.8,
      max_tokens: 600,
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
    const encodedText = encodeURIComponent(text);
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
    audio.src = url;
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("Audio playback failed"));
    audio.play().catch(reject);
  });
}