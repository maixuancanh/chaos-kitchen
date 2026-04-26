import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const {
      text,
      voiceId,
      stability = 0.5,
      similarityBoost = 0.85,
      style = 0.55,
      speed = 1.0,
      model = "eleven_multilingual_v2",
    } = await req.json();

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: "Missing required fields: text and voiceId" },
        { status: 400 },
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error("[TTS] ELEVENLABS_API_KEY is not set");
      return NextResponse.json(
        { error: "ElevenLabs API key not configured on server" },
        { status: 500 },
      );
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

    const body = {
      text,
      model_id: model,
      output_format: "mp3_44100_128",
      voice_settings: {
        stability: Math.max(0, Math.min(1, stability)),
        similarity_boost: Math.max(0, Math.min(1, similarityBoost)),
        style: Math.max(0, Math.min(1, style)),
        // speed: 0.7–1.2  — ElevenLabs hard limit (rejects anything outside this range)
        // Relaxed staff speak slowly; panicking staff speak fast
        speed: Math.max(0.7, Math.min(1.2, speed)),
        use_speaker_boost: true,
      },
    };

    console.log(
      `[TTS] voice=${voiceId} stability=${stability.toFixed(2)} style=${style.toFixed(2)} speed=${speed.toFixed(2)} text="${text.slice(0, 60)}..."`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TTS] ElevenLabs error ${response.status}: ${errorText}`);
      return NextResponse.json(
        {
          error: "TTS generation failed",
          status: response.status,
          details: errorText,
        },
        { status: response.status },
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(
      `[TTS] Success — ${(audioBuffer.byteLength / 1024).toFixed(1)} KB`,
    );

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[TTS] Unexpected error:", message);
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 },
    );
  }
}
