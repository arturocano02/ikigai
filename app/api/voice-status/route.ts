import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim() ?? "";
  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || "hpp4J3VqNfWAUOO0d1Us";

  if (!apiKey) {
    return NextResponse.json({ ok: false, reason: "ELEVENLABS_API_KEY not set in Vercel env vars" });
  }

  // Test the key by hitting /v1/user (cheap, no quota used)
  let keyValid = false;
  let keyError = "";
  let subscription: Record<string, unknown> | null = null;
  try {
    const r = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": apiKey },
    });
    if (r.ok) {
      const data = await r.json() as Record<string, unknown>;
      keyValid = true;
      const sub = (data.subscription as Record<string, unknown> | undefined) ?? {};
      subscription = {
        tier: sub.tier,
        character_count: sub.character_count,
        character_limit: sub.character_limit,
      };
    } else {
      keyError = `${r.status} — ${await r.text()}`;
    }
  } catch (e) {
    keyError = String(e);
  }

  // Test the voice ID is accessible
  let voiceValid = false;
  let voiceName = "";
  let voiceError = "";
  if (keyValid) {
    try {
      const r = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
        headers: { "xi-api-key": apiKey },
      });
      if (r.ok) {
        const data = await r.json() as Record<string, unknown>;
        voiceValid = true;
        voiceName = String(data.name ?? "");
      } else {
        voiceError = `${r.status} — ${await r.text()}`;
      }
    } catch (e) {
      voiceError = String(e);
    }
  }

  return NextResponse.json({
    ok: keyValid && voiceValid,
    apiKey: apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : "(not set)",
    voiceId,
    keyValid,
    keyError: keyError || undefined,
    voiceValid,
    voiceName: voiceName || undefined,
    voiceError: voiceError || undefined,
    subscription: subscription ?? undefined,
  });
}
