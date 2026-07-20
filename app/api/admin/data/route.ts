import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database";

const ADMIN_EMAIL = "arturocanobusi@gmail.com";

function adminSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function detectLanguage(synthesis: Record<string, unknown>): "es" | "en" {
  const text = [synthesis.subtitle, synthesis.explanation].filter(Boolean).join(" ");
  return /\b(que|para|con|una|del|muy|también|su|hay|los|las|por|como)\b/i.test(text) ? "es" : "en";
}

function synthesisDepth(synthesis: Record<string, unknown>): number {
  const arr = (k: string) => Array.isArray(synthesis[k]) ? (synthesis[k] as unknown[]).length : 0;
  return arr("patterns") + arr("strengths") + arr("deepDive") + arr("careerPaths") * 2 + arr("sideQuests");
}

function extractSession(s: {
  id: string; user_id: string; title: string; subtitle: string | null;
  synthesis: unknown; conversation_data: unknown; created_at: string;
}) {
  const synth = (s.synthesis ?? {}) as Record<string, unknown>;
  const scoreObj = synth.ikigaiScore as { score?: number; reasoning?: string } | undefined;
  const convData = s.conversation_data as { messageCount?: number; messages?: unknown[]; language?: string } | null;
  const messageCount = convData?.messageCount
    ?? (Array.isArray(convData?.messages) ? convData!.messages.length : null);
  return {
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    created_at: s.created_at,
    score: typeof scoreObj?.score === "number" ? scoreObj.score : null,
    scoreReasoning: scoreObj?.reasoning ?? null,
    language: (convData?.language as "en" | "es" | undefined) ?? detectLanguage(synth),
    depth: synthesisDepth(synth),
    messageCount,
    highlights: Array.isArray(synth.highlights) ? (synth.highlights as string[]).slice(0, 3) : [],
    careerPaths: Array.isArray(synth.careerPaths)
      ? (synth.careerPaths as Array<{ title: string; tagline: string }>).map((p) => ({ title: p.title, tagline: p.tagline }))
      : [],
    sideQuests: Array.isArray(synth.sideQuests) ? (synth.sideQuests as string[]).slice(0, 3) : [],
    patterns: Array.isArray(synth.patterns) ? (synth.patterns as string[]).slice(0, 4) : [],
    strengths: Array.isArray(synth.strengths) ? (synth.strengths as string[]).slice(0, 4) : [],
    explanation: typeof synth.explanation === "string" ? synth.explanation : null,
    ikigaiTitle: s.title,
  };
}

export async function GET() {
  // 1. Verify caller is admin
  const callerClient = await createServerClient();
  const { data: { user } } = await callerClient.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = adminSupabase();

  // 2. Fetch all auth users (up to 1000)
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const authUsers = authData?.users ?? [];

  // 3. Fetch all profiles
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, avatar_url, created_at");

  // 4. Fetch ALL sessions
  const { data: sessions } = await admin
    .from("ikigai_sessions")
    .select("id, user_id, title, subtitle, synthesis, conversation_data, created_at")
    .order("created_at", { ascending: false });

  const allSessions = sessions ?? [];

  // Split: real auth sessions vs anonymous (user_id starts with "anon_")
  const authSessionsRaw = allSessions.filter((s) => !s.user_id.startsWith("anon_"));
  const anonSessionsRaw = allSessions.filter((s) => s.user_id.startsWith("anon_"));

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const sessionsByUser = new Map<string, typeof authSessionsRaw>();
  for (const s of authSessionsRaw) {
    if (!sessionsByUser.has(s.user_id)) sessionsByUser.set(s.user_id, []);
    sessionsByUser.get(s.user_id)!.push(s);
  }

  const users = authUsers.map((u) => {
    const profile = profileMap.get(u.id);
    const userSessions = (sessionsByUser.get(u.id) ?? []).map(extractSession);
    const lastSession = userSessions[0];
    return {
      id: u.id,
      email: u.email ?? "",
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at ?? null,
      sessions: userSessions,
      session_count: userSessions.length,
      latest_title: lastSession?.title ?? null,
      latest_score: lastSession?.score ?? null,
      latest_language: lastSession?.language ?? "en",
    };
  });

  // Sort: users with sessions first, then by signup date
  users.sort((a, b) => {
    if (b.session_count !== a.session_count) return b.session_count - a.session_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Group anonymous sessions by anon_id
  const anonByKey = new Map<string, typeof anonSessionsRaw>();
  for (const s of anonSessionsRaw) {
    if (!anonByKey.has(s.user_id)) anonByKey.set(s.user_id, []);
    anonByKey.get(s.user_id)!.push(s);
  }

  const anonymous_users = Array.from(anonByKey.entries()).map(([, userSessions]) => {
    const parsed = userSessions.map(extractSession);
    const last = parsed[0];
    return {
      id: userSessions[0].user_id,
      sessions: parsed,
      session_count: parsed.length,
      latest_title: last?.title ?? null,
      latest_score: last?.score ?? null,
      latest_language: last?.language ?? "en",
      first_seen: userSessions[userSessions.length - 1]?.created_at ?? null,
      last_seen: userSessions[0]?.created_at ?? null,
    };
  });

  anonymous_users.sort((a, b) =>
    new Date(b.last_seen ?? 0).getTime() - new Date(a.last_seen ?? 0).getTime()
  );

  return NextResponse.json({
    users,
    anonymous_users,
    total_users: users.length,
    total_anonymous: anonymous_users.length,
    total_sessions: allSessions.length,
    sessions_with_data: allSessions.filter((s) => s.synthesis).length,
  });
}
