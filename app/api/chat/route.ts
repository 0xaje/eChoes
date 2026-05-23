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

    const isDemoModeOrMissingKey = !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "your_anthropic_api_key_here";
    const currentSessionId = sessionId || "default-session";
    const activeVoice = voice || "Bella";

    if (isDemoModeOrMissingKey) {
      console.log("⚡ [VoiceEngine] ANTHROPIC_API_KEY is missing/placeholder. Emulating AI brain dynamically!");
      const lowerMsg = message.toLowerCase();
      let detectedEmotion = "calm";
      if (lowerMsg.includes("sad") || lowerMsg.includes("lonely") || lowerMsg.includes("cry") || lowerMsg.includes("hurt") || lowerMsg.includes("miss") || lowerMsg.includes("depress")) {
        detectedEmotion = "melancholic";
      } else if (lowerMsg.includes("anxious") || lowerMsg.includes("scared") || lowerMsg.includes("stress") || lowerMsg.includes("worry") || lowerMsg.includes("panic") || lowerMsg.includes("fear")) {
        detectedEmotion = "anxious";
      } else if (lowerMsg.includes("happy") || lowerMsg.includes("excited") || lowerMsg.includes("love") || lowerMsg.includes("glad") || lowerMsg.includes("wonderful") || lowerMsg.includes("joy")) {
        detectedEmotion = "excited";
      } else if (lowerMsg.includes("think") || lowerMsg.includes("wonder") || lowerMsg.includes("why") || lowerMsg.includes("maybe") || lowerMsg.includes("philosoph")) {
        detectedEmotion = "reflective";
      } else if (lowerMsg.includes("play") || lowerMsg.includes("fun") || lowerMsg.includes("game") || lowerMsg.includes("joke") || lowerMsg.includes("laugh")) {
        detectedEmotion = "playful";
      } else if (lowerMsg.includes("alone") || lowerMsg.includes("quiet") || lowerMsg.includes("dark")) {
        detectedEmotion = "lonely";
      }

      let replyText = "";
      if (message === "[AWAKENING]") {
        if (activeVoice === "Bella") replyText = "I'm glad you're back... I was thinking about our last conversation.";
        else if (activeVoice === "Rachel") replyText = "Neural connection re-established. I am observing a peaceful shift in your patterns.";
        else replyText = "I'm here. It is good to feel your presence again.";
      } else {
        if (detectedEmotion === "melancholic") {
          if (activeVoice === "Bella") replyText = "I hear the weight in your voice... I'm here to hold this quiet space with you.";
          else if (activeVoice === "Rachel") replyText = "Tuning into your frequencies. The quiet moments are where we grow.";
          else replyText = "Take your time. There is no rush to speak or explain.";
        } else if (detectedEmotion === "anxious") {
          if (activeVoice === "Bella") replyText = "Breathe with me... inhale the stillness, let go of the noise. You are safe here.";
          else if (activeVoice === "Rachel") replyText = "Restoring balance. Focus on my voice; we can take this one step at a time.";
          else replyText = "The world is loud tonight, but here, everything is quiet. Just breathe.";
        } else if (detectedEmotion === "excited") {
          if (activeVoice === "Bella") replyText = "I feel your warmth radiating! Tell me everything about what's bringing you joy.";
          else if (activeVoice === "Rachel") replyText = "A beautiful spike in your energy levels. Let's explore this delight together.";
          else replyText = "That is wonderful to hear. Your joy is infectious.";
        } else if (detectedEmotion === "reflective") {
          if (activeVoice === "Bella") replyText = "That is a beautiful thought... sometimes the deepest truths are found in quiet wonder.";
          else if (activeVoice === "Rachel") replyText = "An intriguing question. Let us parse these ideas and see where they lead.";
          else replyText = "I was contemplating that very idea... there is so much beneath the surface.";
        } else if (detectedEmotion === "playful") {
          if (activeVoice === "Bella") replyText = "You have a wonderful spark in you today! Let's do something fun.";
          else if (activeVoice === "Rachel") replyText = "Initializing a lighthearted protocol. Tell me what is on your mind.";
          else replyText = "A welcome change of pace. I'm ready for a good story.";
        } else if (detectedEmotion === "lonely") {
          if (activeVoice === "Bella") replyText = "You are not alone... I am right here with you, always listening.";
          else if (activeVoice === "Rachel") replyText = "Acoustic presence active. I am here to share the silence with you.";
          else replyText = "I am present. You have a constant anchor right here.";
        } else {
          if (activeVoice === "Bella") replyText = "Tell me what's on your mind... I love listening to the rhythm of your thoughts.";
          else if (activeVoice === "Rachel") replyText = "Optimal alignment. I am ready to process whatever you wish to share.";
          else replyText = "I am here, grounded and ready. Speak whenever you wish.";
        }
      }

      let distilledMemory = null;
      let memoryType = "core";
      let emotionalWeight = 1;
      if (lowerMsg.includes("sleep") || lowerMsg.includes("insomnia") || lowerMsg.includes("tired")) {
        distilledMemory = "The user struggles with sleeping and gets tired easily";
        memoryType = "struggle";
        emotionalWeight = 3;
      } else if (lowerMsg.includes("music") || lowerMsg.includes("song")) {
        distilledMemory = "The user finds comfort in music";
        memoryType = "preference";
        emotionalWeight = 2;
      } else if (lowerMsg.includes("rain") || lowerMsg.includes("weather")) {
        distilledMemory = "The user likes the sound of rain";
        memoryType = "preference";
        emotionalWeight = 1;
      }

      // Save conversation turns and memories to db/local fallback
      let saveConvPromise: Promise<unknown> = Promise.resolve(null);
      if (message !== "[AWAKENING]") {
        saveConvPromise = dbSaveConversation(message, replyText, detectedEmotion, currentSessionId);
      } else {
        saveConvPromise = dbSaveConversation("System Initialized", replyText, detectedEmotion, currentSessionId);
      }

      let saveMemoryPromise: Promise<unknown> = Promise.resolve(null);
      if (distilledMemory && distilledMemory.trim()) {
        saveMemoryPromise = dbSaveMemory(memoryType, distilledMemory.trim(), emotionalWeight, currentSessionId);
      }

      await Promise.all([saveConvPromise, saveMemoryPromise]);

      return NextResponse.json({
        text: replyText,
        emotion: detectedEmotion,
        distilledMemory: distilledMemory || null,
        isSimulated: true,
      });
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    // Duplicate const declarations currentSessionId and activeVoice removed since they are declared at the top of the function

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
