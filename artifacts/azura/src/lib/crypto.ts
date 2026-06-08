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
      model: "llama-3.3-70b-versatile", // Using more capable model
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
      throw new Error("Invalid API key. Please check your Egyntronic key in Admin settings.");
    }
    throw new Error("AI service error. Please try again.");
  }
  
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ── Free TTS using Edge TTS API ─────────────────────────────────────
// High quality, completely free, no API key needed
export async function textToSpeech(text: string): Promise<string> {
  // Edge TTS uses WebSocket, so we use a free proxy service
  // Or we can use the edge-tts npm package approach
  
  // For client-side, we'll use a free TTS API that works without auth
  // Using one of the free tiers or a proxy
  
  try {
    // Try using a free TTS service
    const response = await fetch("https://api.loudverse.com/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text,
        voice: "en-US-Neural", // or ar-SA
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.audio || "";
    }
  } catch {
    // Fall through to next option
  }
  
  // Fallback: Use browser's native TTS with enhanced settings
  return new Promise((resolve) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      // Try to get a better voice
      const voices = speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.includes('en') && v.name.includes('Neural')) 
                     || voices.find(v => v.lang.includes('en-US'));
      if (preferred) utterance.voice = preferred;
      
      utterance.onend = () => resolve("");
      utterance.onerror = () => resolve("");
      speechSynthesis.speak(utterance);
    } else {
      resolve("");
    }
  });
}

// Alternative: Direct Edge TTS via proxy (for production)
export async function edgeTextToSpeech(text: string, lang: string = "en-US"): Promise<string> {
  // This would use Edge TTS API through a CORS proxy
  // For now, returning empty to use fallback
  return "";
}