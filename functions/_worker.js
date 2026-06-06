/**
 * Cloudflare Pages Function for Azura AI API
 * Handles: /api/ai/chat, /api/ai/tts
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/api/ai/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Chat endpoint
    if (url.pathname === '/api/ai/chat' && request.method === 'POST') {
      return handleChat(request, env, corsHeaders);
    }

    // TTS endpoint
    if (url.pathname === '/api/ai/tts' && request.method === 'POST') {
      return handleTTS(request, env, corsHeaders);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

async function handleChat(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { message, history = [], systemPrompt, language = 'en' } = body;

    // Get API key from header (sent from frontend with admin's stored key)
    const apiKey = request.headers.get('X-API-Key') || env.GEMINI_API_KEY || '';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured. Please add your Gemini API key in Admin Panel.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build the prompt for Gemini
    const defaultPrompt = language === 'ar' 
      ? `أنت زورا، باريستا ذكاء اصطناعي ودود في مقهى أزورا، الإسكندرية.`
      : `You are Zura, a friendly AI barista at Azura Cafe, Alexandria.`;

    const system = systemPrompt || defaultPrompt;
    
    // Format history for Gemini
    const contents = [
      ...history.map((h) => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: h.parts,
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: system }],
        },
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return new Response(JSON.stringify({ 
        error: 'AI service error',
        details: response.statusText 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleTTS(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { text, voice = 'en-US' } = body;

    // TTS requires external service - placeholder for now
    return new Response(JSON.stringify({ 
      error: 'TTS not configured',
      message: 'Text-to-speech service not yet configured.'
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'TTS error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}