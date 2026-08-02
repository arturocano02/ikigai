import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text, language = "en" } = await req.json() as { text: string; language?: "en" | "es" };

  if (!text?.trim()) {
    return NextResponse.json({ error: "No text" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    console.error("[speak] ELEVENLABS_API_KEY is not set in Vercel env vars");
    return NextResponse.json({ error: "No ElevenLabs key", code: "no_key" }, { status: 503 });
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || "hpp4J3VqNfWAUOO0d1Us";
  const keyPreview = `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
  console.log(`[speak] voiceId=${voiceId} key=${keyPreview} lang=${language} chars=${text.length}`);

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
        model_id: language === "es" ? "eleven_multilingual_v2" : "eleven_flash_v2_5",
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.75,
          style: 0.1,
          use_speaker_boost: true,
          speed: 1.2,
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error(`[speak] ElevenLabs ${res.status} voiceId=${voiceId} key=${keyPreview}: ${body}`);

    // Detect quota exhaustion so client can show a specific message
    const isQuota = res.status === 429 ||
      body.includes("quota_exceeded") ||
      body.includes("quota exceeded") ||
      body.includes("character_limit") ||
      body.includes("free plan") ||
      // ElevenLabs sometimes returns 401 when free-tier quota is maxed
      (res.status === 401 && body.includes("quota"));

    return NextResponse.json(
      { error: `ElevenLabs error ${res.status}`, detail: body, code: isQuota ? "quota_exceeded" : "elevenlabs_error" },
      { status: 502 }
    );
  }

  const audioBuffer = await res.arrayBuffer();
  console.log(`[speak] OK — ${audioBuffer.byteLength} bytes`);

  return new NextResponse(audioBuffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
