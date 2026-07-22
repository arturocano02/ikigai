import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Run this SQL once in Supabase SQL editor:
// CREATE TABLE IF NOT EXISTS analytics_events (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   event text NOT NULL,
//   anon_id text,
//   metadata jsonb,
//   created_at timestamptz DEFAULT now()
// );
// CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event);
// CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: Request) {
  try {
    const { event, anonId, metadata } = await req.json() as {
      event: string;
      anonId?: string;
      metadata?: Record<string, string>;
    };
    if (!event || typeof event !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const supabase = adminSupabase();
    await supabase.from("analytics_events").insert({
      event,
      anon_id: anonId ?? null,
      metadata: metadata ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
