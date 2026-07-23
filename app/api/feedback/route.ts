import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: Request) {
  try {
    const { type, description, anonId, page } = await req.json() as {
      type: string;
      description: string;
      anonId?: string;
      page?: string;
    };
    if (!type || !description?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const admin = adminSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("analytics_events").insert({
      event: "user_feedback",
      anon_id: anonId ?? null,
      metadata: { type, description: description.trim(), page: page ?? "unknown" },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
