import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, durationSeconds = 3 } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing required field: prompt" },
        { status: 400 },
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error("[SFX] ELEVENLABS_API_KEY is not set");
      return NextResponse.json(
        { error: "ElevenLabs API key not configured on server" },
        { status: 500 },
      );
    }

    // ElevenLabs sound-generation accepts 0.5–22 seconds
    const clampedDuration = Math.min(22, Math.max(0.5, durationSeconds));

    const body = {
      text: prompt,
      duration_seconds: clampedDuration,
      prompt_influence: 0.3,
    };

    console.log(
      `[SFX] prompt="${prompt.slice(0, 80)}" duration=${clampedDuration}s`,
    );

    const response = await fetch(
      "https://api.elevenlabs.io/v1/sound-generation",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SFX] ElevenLabs error ${response.status}: ${errorText}`);
      return NextResponse.json(
        {
          error: "SFX generation failed",
          status: response.status,
          details: errorText,
        },
        { status: response.status },
      );
    }

    const audioBuffer = await response.arrayBuffer();

    console.log(
      `[SFX] Success — received ${(audioBuffer.byteLength / 1024).toFixed(1)} KB`,
    );

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Audio-Bytes": String(audioBuffer.byteLength),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[SFX] Unexpected error:", message);
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 },
    );
  }
}
