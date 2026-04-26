import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/stt
 *
 * Accepts multipart/form-data:
 *   audio — File (webm, mp4, wav, m4a, ogg, flac)
 *
 * Proxies to ElevenLabs /v1/speech-to-text (Scribe v1 model).
 * Returns: { text: string, language: string }
 *
 * The API key stays server-side and is never exposed to the client.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("[STT] ELEVENLABS_API_KEY is not set");
    return NextResponse.json(
      { error: "ElevenLabs API key not configured on server" },
      { status: 500 },
    );
  }

  let audioFile: File | null = null;
  try {
    const formData = await req.formData();
    audioFile = formData.get("audio") as File | null;
  } catch {
    return NextResponse.json(
      { error: "Could not parse multipart form data" },
      { status: 400 },
    );
  }

  if (!audioFile || audioFile.size === 0) {
    return NextResponse.json(
      { error: "Missing or empty audio file in field 'audio'" },
      { status: 400 },
    );
  }

  // Max 25 MB guard (ElevenLabs hard limit)
  if (audioFile.size > 25 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Audio file too large (max 25 MB)" },
      { status: 413 },
    );
  }

  console.log(
    `[STT] Transcribing ${(audioFile.size / 1024).toFixed(1)} KB of ${audioFile.type || "unknown type"}`,
  );

  const elevenForm = new FormData();
  elevenForm.append("file", audioFile, audioFile.name || "recording.webm");
  elevenForm.append("model_id", "scribe_v1");
  // language_code omitted → ElevenLabs auto-detects (best for multilingual orders)

  const response = await fetch(
    "https://api.elevenlabs.io/v1/speech-to-text",
    {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: elevenForm,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[STT] ElevenLabs error ${response.status}: ${errorText}`);
    return NextResponse.json(
      { error: "Speech-to-text failed", status: response.status, details: errorText },
      { status: response.status },
    );
  }

  const data = await response.json();
  const text: string = (data.text ?? "").trim();

  console.log(`[STT] Transcribed: "${text.slice(0, 120)}"`);

  return NextResponse.json({
    text,
    language: data.language_code ?? "unknown",
    words:    data.words?.length ?? 0,
  });
}
