import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text?.trim()) {
    return NextResponse.json({ error: "No text" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "No ElevenLabs key" }, { status: 503 });
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || "hpp4J3VqNfWAUOO0d1Us";
  console.log(`[speak] using voiceId=${voiceId} (from env: ${!!process.env.ELEVENLABS_VOICE_ID})`);

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: text.slice(0, 1000),
        model_id: "eleven_flash_v2_5",
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.75,
          style: 0.1,
          use_speaker_boost: true,
          speed: 1.2, // max allowed by ElevenLabs
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error(`ElevenLabs ${res.status}:`, body);
    return NextResponse.json({ error: `ElevenLabs error ${res.status}` }, { status: 502 });
  }

  const audioBuffer = await res.arrayBuffer();

  return new NextResponse(audioBuffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
