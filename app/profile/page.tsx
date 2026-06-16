import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: sessions } = await supabase
    .from("ikigai_sessions")
    .select("id, title, subtitle, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <ProfileClient
      user={{ id: user.id, email: user.email ?? "", displayName: profile?.display_name ?? null, avatarUrl: profile?.avatar_url ?? null }}
      sessions={sessions ?? []}
    />
  );
}
