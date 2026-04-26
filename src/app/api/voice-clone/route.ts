import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const voiceName = formData.get("name") as string;

    if (!audioFile || !voiceName) {
      return NextResponse.json({ error: "Missing audio file or voice name" }, { status: 400 });
    }

    // Create voice clone using ElevenLabs IVC API
    const cloneFormData = new FormData();
    cloneFormData.append("name", voiceName);
    cloneFormData.append("description", `Cloned voice for The Chaos Kitchen - ${voiceName}`);
    cloneFormData.append("files", audioFile);
    cloneFormData.append("labels", JSON.stringify({ "use_case": "chaos_kitchen_staff" }));

    const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: cloneFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("ElevenLabs Voice Clone Error:", error);
      return NextResponse.json({ error: "Voice cloning failed", details: error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({
      voiceId: data.voice_id,
      name: voiceName,
      success: true,
    });
  } catch (error) {
    console.error("Voice clone route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
    }

    const { voiceId } = await req.json();
    if (!voiceId) {
      return NextResponse.json({ error: "Missing voiceId" }, { status: 400 });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      method: "DELETE",
      headers: { "xi-api-key": apiKey },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to delete voice" }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Voice delete route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
