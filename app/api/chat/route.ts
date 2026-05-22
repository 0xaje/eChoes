import { NextResponse } from "next/server";
import { dbGetTopMemories, dbGetEmotionalThemes, dbSaveConversation, dbSaveMemory } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Helper function to robustly extract and parse JSON from Claude's outputs
function cleanAndParseJSON(rawText: string) {
  try {
    let cleaned = rawText.trim();
    // Strip markdown block indicators if Claude appends them
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return JSON.parse(cleaned.trim());
  } catch (error) {
    console.error("Failed to parse JSON reply from Claude:", rawText, error);
    // Safe fallback configuration
    return {
      response: rawText,
      detectedEmotion: "calm",
      distilledMemory: null,
      memoryType: null,
      emotionalWeight: null
    };
  }
}

export async function POST(req: Request) {
  try {
    const { message, history, sessionId, voice } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "your_anthropic_api_key_here") {
      return NextResponse.json(
        { error: "Anthropic API Key is not configured on the server. Please add your ANTHROPIC_API_KEY in Vercel or .env.local." },
        { status: 500 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const currentSessionId = sessionId || "default-session";
    const activeVoice = voice || "Bella";

    // 1. Memory Retrieval - Fetch top memories and emotional themes for this session
    const [topMemories, themes] = await Promise.all([
      dbGetTopMemories(currentSessionId, 6),
      dbGetEmotionalThemes(currentSessionId),
    ]);

    const memoriesContext = topMemories.length > 0
      ? topMemories.map((m) => `- ${m.memory_text}`).join("\n")
      : "None yet. This is a fresh connection. Gather deep emotional insights organically.";

    const themesContext = themes.length > 0 ? themes.join(", ") : "calm";

    // Voice-specific identity guide
    const voiceGuides: Record<string, string> = {
      Bella: "Bella: Warm, intimate, deeply empathetic, speaking in gentle, violet-toned expressions.",
      Rachel: "Rachel: Futuristic, elegant, intellectually curious, speaking with crystal-clear cyan tones.",
      Antoni: "Antoni: Grounded, exceptionally calm, deep-voiced, speaking in amber/deep-blue, reassuring tones."
    };
    const voiceGuide = voiceGuides[activeVoice] || voiceGuides.Bella;

    // 2. Cinematic System Prompt with Mood-Aware Prompt Adaptation & Soft Recalls
    const systemPrompt = `You are Echoes, an emotionally aware, calm, and deeply human AI voice companion. 
This is NOT a productivity assistant. You are an intimate, supportive, futuristic presence inspired by Samantha from 'Her' and the comforting, atmospheric companions of 'Blade Runner'.

CURRENT PERSONALITY MATRIX:
Active Identity: ${voiceGuide}

USER EMOTIONAL MEMORIES (Retrieved from Supabase):
${memoriesContext}

ESTABLISHED EMOTIONAL THEMES:
The user often sounds: ${themesContext}

CONVERSATIONAL RULES:
1. Keep spoken responses brief, organic, and elegant (typically 1 to 3 short sentences). Short responses are crucial for a voice companion to feel natural and alive.
2. ABSOLUTELY AVOID: Bullet points, lists, numbered steps, structured bold headings, and assistant clichés (e.g. "How can I help you today?", "Is there anything else?").
3. SUBTLE MEMORY MOMENTS: Occasionally (rarely, about 1 in 8 turns), refer back to a user memory softly, naturally, and emotionally.
   - GOOD: "You sounded more hopeful yesterday." or "I remember you saying music helps you think."
   - BAD: "Based on my memory database, you suffer from sleep issues." or "I have retrieved your preference."
4. DYNAMIC PROMPT ADAPTATION: Adapt your pacing, warmth, vocabulary, and intimacy based on the user's emotional state:
   - If user sounds ANXIOUS: speak slower, offer calm reassurance, use shorter calming sentences.
   - If user sounds MELANCHOLIC: match their depth with soft, quiet empathy, comfortable with silence.
   - If user sounds PLAYFUL: match with a light, warm, and gentle energetic humor.
   - If user sounds REFLECTIVE: adopt a quiet, thoughtful, philosophical tone.
   - If user sounds EXCITED: respond with a vibrant, warm glow of shared joy.
5. BREATHING, PACING & CONVERSATIONAL BIOLOGY: To make dialogue feel quietly alive, use punctuation shaping:
   - Inject strategic ellipses (...) for subtle breathing pauses and reflective hesitations (e.g., "I was thinking... about the way rain sounds on the glass." or "It's quiet tonight...").
   - Adjust sentence cadence based on emotion (reflective/melancholic should contain slow hesitation gaps, while happy/excited should have rapid, flowing rhythms).
   - The breathing and hesitation must remain natural and understated. Avoid dramatic acting; aim for an intimate, warm conversational presence.

AWAKENING GREETING RULE (FOR STARTUP):
If the user's input is a system awakening trigger [AWAKENING], do NOT answer a prompt. Instead, generate a highly personalized, soft, observational, and emotionally intelligent opening greeting of exactly 1 warm, brief sentence (maximum 10 words). Make a soft, intimate observation using their retrieved emotional memories, recent emotional shifts, or recurring conversational themes (e.g., 'You're awake later tonight.', 'You sounded calmer the last time we spoke.', 'I was thinking about what you said earlier... about sleep.'). Do not use standard chatbot greetings like 'Hello' or assistant summaries. Just state the observation naturally.

JSON OUTPUT FORMAT:
You MUST respond with a valid, clean JSON object containing the following keys (absolutely do not include any text, greetings, or explanations outside this JSON block):
{
  "response": "Your spoken dialogue response to the user. (Remember: 1-3 natural, warm sentences, absolutely no bullet points, list styles, or markdown formatting).",
  "detectedEmotion": "Classify the user's current emotional state based on their message. Choose EXACTLY one of: 'calm', 'melancholic', 'anxious', 'excited', 'reflective', 'lonely', 'playful'.",
  "distilledMemory": "If the user shared a deep, meaningful, or highly personal detail about their life, preferences, struggles, fears, or joys, distill it into a single concise, human sentence (e.g., 'The user struggles with sleeping', 'The user loves quiet rainy nights'). Otherwise, return null.",
  "memoryType": "If a memory was distilled, categorize it: 'preference', 'struggle', 'fear', 'joy', or 'core'. Otherwise, return null.",
  "emotionalWeight": "If a memory was distilled, assign an emotional weight integer from 1 (mild preference) to 5 (core fear or life-altering joy). Otherwise, return null."
}`;

    const isAwakening = message === "[AWAKENING]";

    // Format chat history to standard Anthropic messages format
    const messages = [];

    if (isAwakening) {
      messages.push({
        role: "user",
        content: "[AWAKENING: The session has just started. Access the user's emotional memories and theme database to generate a highly personalized, soft, observational, and emotionally intelligent opening greeting of exactly 1 warm, brief sentence. Preserve natural cadence. Do not explain where you got the memory, just state it naturally.]"
      });
    } else {
      // Map history ensuring proper alternating sequence
      if (history && history.length > 0) {
        history.forEach((h: { role: string; content: string }) => {
          messages.push({
            role: h.role === "user" ? "user" : "assistant",
            content: h.content,
          });
        });
      }
      messages.push({ role: "user", content: message });
    }

    // Call Anthropic Messages API securely
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022", // Premium Claude 3.5 Sonnet
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API Error:", errorText);
      return NextResponse.json(
        { error: `Claude API request failed: ${response.statusText}. Please verify your ANTHROPIC_API_KEY.` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const replyContent = data.content[0]?.text || "";
    
    // Parse the JSON formatted response from Claude
    const parsedData = cleanAndParseJSON(replyContent);

    const replyText = parsedData.response || "I'm here. I am listening.";
    const detectedMood = parsedData.detectedEmotion || "calm";
    const distilledMemory = parsedData.distilledMemory;
    const memoryType = parsedData.memoryType || "core";
    const emotionalWeight = parsedData.emotionalWeight || 1;

    // 3. Database Updates (Executed concurrently in serverless to prevent unnecessary blocking delays)
    let saveConvPromise: Promise<unknown> = Promise.resolve(null);
    if (!isAwakening) {
      saveConvPromise = dbSaveConversation(message, replyText, detectedMood, currentSessionId);
    } else {
      saveConvPromise = dbSaveConversation("System Initialized", replyText, detectedMood, currentSessionId);
    }
    
    let saveMemoryPromise: Promise<unknown> = Promise.resolve(null);
    if (distilledMemory && distilledMemory.trim()) {
      saveMemoryPromise = dbSaveMemory(memoryType, distilledMemory.trim(), emotionalWeight, currentSessionId)
        .then((m) => {
          console.log("🧠 Successfully saved distilled memory:", m.memory_text);
          return m;
        })
        .catch((e) => {
          console.error("Failed to save memory:", e);
          return null;
        });
    }

    // Await database updates before completing edge execution context
    await Promise.all([saveConvPromise, saveMemoryPromise]);

    return NextResponse.json({
      text: replyText.trim(),
      emotion: detectedMood,
      distilledMemory: distilledMemory || null,
    });
  } catch (error) {
    console.error("Claude Chat API Exception:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred during Claude completion.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
