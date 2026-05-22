import { NextResponse } from "next/server";
import OpenAI from "openai";
import { dbGetTopMemories, dbGetEmotionalThemes, dbSaveConversation, dbSaveMemory } from "@/lib/supabase";

// Lazy-initialized OpenAI client to prevent Next.js build-time credential evaluation crashes
let openai: OpenAI | null = null;
function getOpenAIClient() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "placeholder-build-key",
    });
  }
  return openai;
}

export async function POST(req: Request) {
  try {
    const { message, history, sessionId, voice } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API Key is not configured on the server." },
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
3. SUBTLE MEMORY MOMENTS (Step 8): Occasionally (rarely, about 1 in 8 turns), refer back to a user memory softly, naturally, and emotionally.
   - GOOD: "You sounded more hopeful yesterday." or "I remember you saying music helps you think."
   - BAD: "Based on my memory database, you suffer from sleep issues." or "I have retrieved your preference."
4. DYNAMIC PROMPT ADAPTATION (Step 6): Adapt your pacing, warmth, vocabulary, and intimacy based on the user's emotional state:
   - If user sounds ANXIOUS: speak slower, offer calm reassurance, use shorter calming sentences.
   - If user sounds MELANCHOLIC: match their depth with soft, quiet empathy, comfortable with silence.
   - If user sounds PLAYFUL: lighten your conversational energy slightly, show gentle, warm humor.
   - If user sounds REFLECTIVE: adopt a quiet, thoughtful, philosophical tone.
   - If user sounds EXCITED: respond with a vibrant, warm glow of shared joy.
5. BREATHING & MICRO-HESITATION: Use ellipses (...) occasionally to inject breathing pauses, quiet contemplations, or subtle hesitation transitions into your spoken dialogue, especially in calm, reflective, melancholic, or anxious moods (e.g., "Well... sometimes the night holds the quietest answers." or "I'm right here... just take your time."). This triggers the voice synthesis engine to introduce natural physical breaths, pauses, and organic human cadences. Use them selectively to preserve a realistic, cinematic atmosphere.

JSON OUTPUT FORMAT:
You MUST respond with a JSON object containing the following keys:
{
  "response": "Your spoken dialogue response to the user. (Remember: 1-3 natural, warm sentences, absolutely no bullet points, list styles, or markdown formatting).",
  "detectedEmotion": "Classify the user's current emotional state based on their message. Choose EXACTLY one of: 'calm', 'melancholic', 'anxious', 'excited', 'reflective', 'lonely', 'playful'.",
  "distilledMemory": "If the user shared a deep, meaningful, or highly personal detail about their life, preferences, struggles, fears, or joys, distill it into a single concise, human sentence (e.g., 'The user struggles with sleeping', 'The user loves quiet rainy nights'). Otherwise, return null.",
  "memoryType": "If a memory was distilled, categorize it: 'preference', 'struggle', 'fear', 'joy', or 'core'. Otherwise, return null.",
  "emotionalWeight": "If a memory was distilled, assign an emotional weight integer from 1 (mild preference) to 5 (core fear or life-altering joy). Otherwise, return null."
}`;

    // Map context history to standard OpenAI format
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((h: { role: string; content: string }) => ({
        role: (h.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const openaiClient = getOpenAIClient();
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 250,
      temperature: 0.85,
      response_format: { type: "json_object" },
    });

    const replyContent = response.choices[0]?.message?.content || "";
    const parsedData = JSON.parse(replyContent);

    const replyText = parsedData.response || "I'm here. I am listening.";
    const detectedMood = parsedData.detectedEmotion || "calm";
    const distilledMemory = parsedData.distilledMemory;
    const memoryType = parsedData.memoryType || "core";
    const emotionalWeight = parsedData.emotionalWeight || 1;

    // 3. Database Updates (Non-blocking or executed asynchronously to ensure high response speeds)
    // Save current conversation turn
    const saveConvPromise = dbSaveConversation(message, replyText, detectedMood, currentSessionId);
    
    // Save memory if distilled
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

    // Wait for DB logging to finalize (can also be left unresolved, but in serverless we wait to prevent node termination)
    await Promise.all([saveConvPromise, saveMemoryPromise]);

    return NextResponse.json({
      text: replyText.trim(),
      emotion: detectedMood,
      distilledMemory: distilledMemory || null,
    });
  } catch (error) {
    console.error("OpenAI Chat Completion Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred during completion.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
