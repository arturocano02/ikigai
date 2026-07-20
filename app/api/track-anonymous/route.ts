import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Json } from "@/types/database";

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: Request) {
  let body: { anonId?: string; synthesis?: { title?: string; subtitle?: string }; conversationData?: object };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { anonId, synthesis, conversationData } = body;
  if (!anonId || typeof anonId !== "string" || !synthesis?.title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = adminSupabase();

  // Use "anon_<id>" as the user_id to distinguish from real auth users
  const { error } = await admin.from("ikigai_sessions").insert({
    user_id: `anon_${anonId}`,
    title: synthesis.title,
    subtitle: synthesis.subtitle ?? null,
    synthesis: synthesis as unknown as Json,
    conversation_data: (conversationData ?? null) as unknown as Json,
  });

  if (error) {
    console.error("[track-anonymous] insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
