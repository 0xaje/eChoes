import { NextResponse } from "next/server";
import { dbGetRecentConversations, dbGetTopMemories, dbGetEmotionalThemes } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
    }

    // Retrieve recent conversation history, top memories, and emotional themes
    const [recentConversations, topMemories, themes] = await Promise.all([
      dbGetRecentConversations(sessionId, 5),
      dbGetTopMemories(sessionId, 5),
      dbGetEmotionalThemes(sessionId),
    ]);

    // Determine the last emotional state of the user to resume the atmosphere
    const lastConversation = recentConversations[0];
    const resumeEmotion = lastConversation?.detected_mood || "calm";

    return NextResponse.json({
      emotion: resumeEmotion,
      memories: topMemories,
      themes,
      history: recentConversations.reverse().map((conv) => [
        { role: "user", content: conv.user_message },
        { role: "assistant", content: conv.ai_response },
      ]).flat(),
    });
  } catch (error) {
    console.error("Session Retrieval Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve session data." },
      { status: 500 }
    );
  }
}
