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
  // Gemini API keys are typically 30+ characters
  // New format: AQ.xxx or AIza...
  return key.length >= 30 && (key.startsWith("AIza") || key.startsWith("AQ."));
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
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      }
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Gemini API error:", err);
    throw new Error("AI service error");
  }
  
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}