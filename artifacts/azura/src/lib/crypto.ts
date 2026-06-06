/**
 * Simple encryption utility for API keys
 * Uses XOR cipher with a secret salt - not cryptographically secure
 * but prevents casual inspection of the key in Firebase
 */

const SECRET_SALT = "Azura2024Cafe";

export function encryptKey(key: string): string {
  if (!key) return "";
  let result = "";
  for (let i = 0; i < key.length; i++) {
    const charCode = key.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result);
}

export function decryptKey(encrypted: string): string {
  if (!encrypted) return "";
  try {
    const decoded = atob(encrypted);
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

// ── AI Chat ─────────────────────────────────────────────────
export async function chatWithAI(
  apiKey: string,
  message: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemPrompt: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        ...history.map((h) => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: h.parts,
        })),
        { role: 'user', parts: [{ text: message }] },
      ],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) throw new Error("AI service error");
  
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ── TTS (Text-to-Speech) ─────────────────────────────────────
export async function textToSpeech(apiKey: string, text: string): Promise<string> {
  // Use Gemini 2.0 Flash Experimental for TTS
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `Speak this clearly: ${text}` }]
      }],
      generationConfig: {
        responseModalities: ["audio"]
      }
    }),
  });

  if (!res.ok) throw new Error("TTS service error");
  
  const data = await res.json();
  const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!audioData) throw new Error("No audio generated");
  
  return audioData; // base64 encoded audio
}