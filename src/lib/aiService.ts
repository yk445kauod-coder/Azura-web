/**
 * AI Service with Pollinations fallback
 * Handles traffic with rate limiting and caching
 */

import { fullMenuData } from "./fullMenu";

// Rate limiting for AI requests
const aiRequestLog: { timestamp: number }[] = [];
const AI_RATE_LIMIT = 10; // Max 10 requests per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Simple cache for menu-based responses
const menuCache = new Map<string, string>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  value: string;
  timestamp: number;
}

function isAIRateLimited(): boolean {
  const now = Date.now();
  while (aiRequestLog.length > 0 && now - aiRequestLog[0].timestamp > RATE_LIMIT_WINDOW) {
    aiRequestLog.shift();
  }
  return aiRequestLog.length >= AI_RATE_LIMIT;
}

function recordAIRequest(): void {
  aiRequestLog.push({ timestamp: Date.now() });
}

// Simple menu search for fallback
function searchMenu(query: string): string {
  const lowerQuery = query.toLowerCase();
  const results: string[] = [];
  
  for (const section of fullMenuData.menu) {
    for (const item of section.items) {
      const name = item.name.toLowerCase();
      const nameAr = (item as any).nameAr?.toLowerCase() || "";
      
      if (name.includes(lowerQuery) || nameAr.includes(lowerQuery) || 
          lowerQuery.includes(name) || lowerQuery.includes(nameAr)) {
        const price = (item as any).price || item.price;
        const currency = (item as any).currency || "LE";
        results.push(`• ${item.name} - ${price} ${currency}`);
      }
    }
  }
  
  return results;
}

// Generate response using Pollinations AI (free, no API key)
export async function chatWithPollinationsAI(
  message: string,
  history: Array<{ role: string; content: string }>,
  systemPrompt: string,
  baristaName: string
): Promise<{ response: string; source: "pollinations" }> {
  // Detect language
  const isArabic = /[\u0600-\u06FF]/.test(message);
  
  // Build context from menu
  let menuContext = "";
  for (const section of fullMenuData.menu) {
    const items = section.items.map(item => {
      const price = (item as any).price || item.price;
      return `${item.name} (${price} LE)`;
    }).join(", ");
    menuContext += `${section.section}: ${items}\n`;
  }
  
  // Build conversation history
  let conversationHistory = "";
  for (const msg of history.slice(-6)) { // Last 6 messages for context
    const role = msg.role === "ai" ? baristaName : "Customer";
    conversationHistory += `${role}: ${msg.content}\n`;
  }
  
  // Create prompt for Pollinations
  const userLang = isArabic ? "arabic" : "english";
  const prompt = `${systemPrompt}

You are ${baristaName}, a friendly barista at Azura Cafe in Alexandria, Egypt.

MENU:
${menuContext}

IMPORTANT RULES:
1. Respond in ${isArabic ? "Egyptian Arabic (العامية المصرية)" : "English"}
2. Keep responses SHORT and conversational (2-3 sentences max)
3. Be friendly and helpful
4. When recommending items, mention the price
5. Never make up items not on the menu
6. If asked about items, search the menu above

Previous conversation:
${conversationHistory}
Customer: ${message}
${baristaName}:`;

  try {
    // Use Pollinations AI for chat
    const encodedPrompt = encodeURIComponent(prompt.slice(-2000)); // Limit length
    const url = `https://text.pollinations.ai/${encodedPrompt}?model=openai&seed=${Date.now()}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Pollinations API error: ${response.status}`);
    }
    
    const text = await response.text();
    return { response: text.trim(), source: "pollinations" };
  } catch (err) {
    console.warn("Pollinations AI failed, using fallback:", err);
    return { response: "", source: "pollinations" };
  }
}

// Smart fallback response when AI fails
function generateSmartFallback(message: string, isArabic: boolean): string {
  const lowerMessage = message.toLowerCase();
  
  // Check for common patterns
  if (lowerMessage.includes("coffee") || lowerMessage.includes("قهوة") || lowerMessage.includes("كوفي")) {
    return isArabic 
      ? "☕ للقهوة، أنصحك بـ Espresso أو Latte. تحب أساعدك في حاجة تانية؟"
      : "☕ For coffee, I'd recommend our Espresso or Latte. Want me to help with anything else?";
  }
  
  if (lowerMessage.includes("menu") || lowerMessage.includes("قائمة") || lowerMessage.includes("منيو")) {
    return isArabic
      ? "📋 عندنا قائمة كبيرة! فيها Break fast، Pasta، Burgers، وحلويات. عايز تشوف حاجة معينة؟"
      : "📋 We have a great menu! Including Breakfast, Pasta, Burgers, and Desserts. Looking for something specific?";
  }
  
  if (lowerMessage.includes("recommend") || lowerMessage.includes("recommendation") || 
      lowerMessage.includes("أفضل") || lowerMessage.includes("أنصح")) {
    return isArabic
      ? "💡 من أفضل أطباقنا: Chicken Grill و Alfredo Pasta و Molten Cake للتحلية! عايز تعرف أكتر؟"
      : "💡 Our favorites: Chicken Grill, Alfredo Pasta, and Molten Cake for dessert! Want to know more?";
  }
  
  if (lowerMessage.includes("price") || lowerMessage.includes("سعر") || lowerMessage.includes("كم")) {
    return isArabic
      ? "💰 الأسعار تبدأ من 29 LE للمشروبات و 150 LE للأطباق الرئيسية. عايز تعرف سعر حاجة معينة؟"
      : "💰 Prices start from 29 LE for drinks and 150 LE for main dishes. Want to know the price of something specific?";
  }
  
  if (lowerMessage.includes("hi") || lowerMessage.includes("hello") || lowerMessage.includes("أهل") || lowerMessage.includes("مرحبا") || lowerMessage.includes("السلام")) {
    return isArabic
      ? "أهلاً بيك! ☕ أنا هنا أساعدك تختار طلبك. عايز حاجة معينة ولا عايز مساعدة؟"
      : "Hey there! ☕ I'm here to help you order. Looking for something specific or need recommendations?";
  }
  
  if (lowerMessage.includes("thanks") || lowerMessage.includes("شكرا") || lowerMessage.includes("thank")) {
    return isArabic
      ? "العفو! 😊 لو محتاج حاجة تانية، أنا هنا!"
      : "You're welcome! 😊 Let me know if you need anything else!";
  }
  
  // Default response
  return isArabic
    ? "🤔 أنا مش فاهم بالظبط، ممكن توضحلي أكتر؟ عايز طلب إيه؟"
    : "🤔 I'm not sure I understand. Could you clarify what you're looking for?";
}

// Main chat function with multiple fallbacks
export async function chatWithAI(
  apiKey: string,
  message: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemPrompt: string,
  baristaName: string
): Promise<{ response: string; source: "groq" | "pollinations" | "fallback" }> {
  // Check rate limit
  if (isAIRateLimited()) {
    console.warn("AI rate limited, using fallback");
    const isArabic = /[\u0600-\u06FF]/.test(message);
    return { response: generateSmartFallback(message, isArabic), source: "fallback" };
  }
  
  recordAIRequest();
  
  // Check cache first
  const cacheKey = `${message.slice(0, 50)}-${baristaName}`;
  const cached = menuCache.get(cacheKey) as CacheEntry | undefined;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { response: cached.value, source: "fallback" };
  }
  
  // Try Groq API first if key is available
  if (apiKey && apiKey.length > 30) {
    try {
      const result = await chatWithGroq(apiKey, message, history, systemPrompt, baristaName);
      // Cache the response
      menuCache.set(cacheKey, { value: result.response, timestamp: Date.now() });
      return result;
    } catch (err) {
      console.warn("Groq API failed, trying Pollinations:", err);
    }
  }
  
  // Try Pollinations AI
  try {
    const result = await chatWithPollinationsAI(message, history.map(h => ({
      role: h.role === 'model' ? 'ai' : 'user',
      content: h.parts[0]?.text || ""
    })), systemPrompt, baristaName);
    
    if (result.response) {
      // Cache the response
      menuCache.set(cacheKey, { value: result.response, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    console.warn("Pollinations AI failed:", err);
  }
  
  // Ultimate fallback - smart menu-based response
  const isArabic = /[\u0600-\u06FF]/.test(message);
  
  // Search menu for relevant items
  const menuResults = searchMenu(message);
  let response = generateSmartFallback(message, isArabic);
  
  if (menuResults.length > 0) {
    const itemsList = menuResults.slice(0, 3).join("\n");
    response = isArabic
      ? `وجدت حاجات ممكن تعجبك! 🍽️\n${itemsList}\n\nعايز تضيف حاجة منهم؟`
      : `Found some items you might like! 🍽️\n${itemsList}\n\nWant me to add any of these?`;
  }
  
  // Cache the response
  menuCache.set(cacheKey, { value: response, timestamp: Date.now() });
  
  return { response, source: "fallback" };
}

// Groq API chat
async function chatWithGroq(
  apiKey: string,
  message: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemPrompt: string,
  baristaName: string
): Promise<{ response: string; source: "groq" }> {
  const isArabic = /[\u0600-\u06FF]/.test(message) || 
    message.includes('في') || message.includes('ال') || message.includes('ما') || 
    message.includes('أنا') || message.includes('إيه') || message.includes('عاوز') || 
    message.includes('محتاج') || message.includes('عندي');
  
  const langInstruction = isArabic 
    ? `RESPOND IN EGYPTIAN ARABIC (العامية المصرية) - never use English unless user switches to English`
    : `RESPOND IN ENGLISH - be natural and friendly`;

  const enhancedSystem = `${systemPrompt}

## CONVERSATION STYLE
- Be friendly, warm, and like a real barista friend
- ${langInstruction}
- Ask questions to understand what they want
- Keep responses conversational, not robotic
- Use friendly emojis occasionally
- If confused, ask a question`;

  const groqHistory = history.map((h) => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.parts[0]?.text || "",
  }));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq API error:", err);
      
      if (err.includes("429") || err.includes("rate_limit")) {
        throw new Error("Rate limit exceeded");
      }
      throw new Error("Groq API error");
    }
    
    const data = await res.json();
    const response = data.choices?.[0]?.message?.content || "";
    return { response, source: "groq" as const };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Clear old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of menuCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      menuCache.delete(key);
    }
  }
}, CACHE_TTL);