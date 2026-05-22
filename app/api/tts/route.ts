import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text");
    const voiceName = searchParams.get("voice") || "Bella";
    const emotion = searchParams.get("emotion") || "calm";
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    // ElevenLabs IDs for our three distinct cinematic personalities
    const voiceMap: Record<string, string> = {
      Bella: "EXAVITQu4vr4xnSDxMaL",      // Warm, intimate (Female)
      Rachel: "21m00Tcm4TlvDq8ikWAM",     // Futuristic, elegant (Female)
      Antoni: "pNInz6obpgHsBs2R0182",     // Grounded, exceptionally calm (Male)
    };

    const voiceId = voiceMap[voiceName] || voiceMap.Bella;

    if (!text) {
      return NextResponse.json({ error: "Text parameter is required." }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key is not configured on the server." },
        { status: 500 }
      );
    }

    // 1. Dynamic Vocal Style Adaptation based on classified emotional state
    const getVoiceSettings = (emo: string) => {
      switch (emo) {
        case "melancholic":
          return {
            stability: 0.36,          // Lower stability allows rich breathy, tender, emotional texture
            similarity_boost: 0.85,   // High similarity preserves consistent character presence
            style: 0.15,              // Slight style boost to accent subtle melancholic inflections
            use_speaker_boost: true,
          };
        case "reflective":
          return {
            stability: 0.62,          // Higher stability enforces a quiet, peaceful, steady cadencing
            similarity_boost: 0.78,
            style: 0.04,              // Lower style variation for smooth contemplative delivery
            use_speaker_boost: true,
          };
        case "excited":
          return {
            stability: 0.40,          // Lower stability enables wide pitch variations and inflections
            similarity_boost: 0.82,
            style: 0.20,              // Higher style captures dynamic, animated sharing energy
            use_speaker_boost: true,
          };
        case "anxious":
          return {
            stability: 0.38,          // Tentative, slightly uneven phrasing rhythms
            similarity_boost: 0.76,
            style: 0.10,
            use_speaker_boost: true,
          };
        case "lonely":
          return {
            stability: 0.44,          // Softer, quietly hesitant, close-mic atmosphere
            similarity_boost: 0.80,
            style: 0.08,
            use_speaker_boost: true,
          };
        case "playful":
          return {
            stability: 0.46,          // Quick, lighthearted inflections
            similarity_boost: 0.82,
            style: 0.16,
            use_speaker_boost: true,
          };
        case "calm":
        default:
          return {
            stability: 0.52,          // Perfectly balanced warmth and presence
            similarity_boost: 0.80,
            style: 0.05,
            use_speaker_boost: true,
          };
      }
    };

    const voiceSettings = getVoiceSettings(emotion);

    // Call the ElevenLabs stream API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: voiceSettings,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS Error:", errorText);
      return NextResponse.json(
        { error: errorText || "Failed to fetch voice from ElevenLabs." },
        { status: response.status }
      );
    }

    // Forward the streaming binary response directly to the browser
    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("TTS API Exception:", error);
    const errorMessage = error instanceof Error ? error.message : "An exception occurred inside the TTS route.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
