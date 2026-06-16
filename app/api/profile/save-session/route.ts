import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { IkigaiSynthesis } from "@/types/ikigai";
import type { Json } from "@/types/database";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let synthesis: IkigaiSynthesis;
  try {
    const body = await request.json();
    synthesis = body.synthesis;
    if (!synthesis?.title) throw new Error("Invalid synthesis");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ikigai_sessions")
    .insert({
      user_id: user.id,
      title: synthesis.title,
      subtitle: synthesis.subtitle ?? null,
      synthesis: synthesis as unknown as Json,
    })
    .select("id, title, subtitle, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}
