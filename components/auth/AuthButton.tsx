import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { User } from "lucide-react";

export default async function AuthButton() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium tracking-wide transition-all"
        style={{
          background: "rgba(249,115,22,0.18)",
          border: "1px solid rgba(249,115,22,0.5)",
          color: "rgba(255,255,255,0.88)",
          boxShadow: "0 0 16px rgba(249,115,22,0.12)",
          WebkitTapHighlightColor: "transparent",
          minHeight: 32,
        }}
      >
        <User className="w-3 h-3" style={{ color: "rgba(249,115,22,0.8)" }} />
        <span>Sign in</span>
      </Link>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const initials = (profile?.display_name ?? user.email ?? "?")
    .split(" ")
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return (
    <Link
      href="/profile"
      className="flex items-center gap-2 text-white/35 hover:text-white/65 transition-colors"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <div
        className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-medium text-white shrink-0"
        style={{
          background: profile?.avatar_url
            ? "transparent"
            : "linear-gradient(135deg, rgba(249,115,22,0.7), rgba(20,184,166,0.7))",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <span className="text-xs tracking-wider">Profile</span>
    </Link>
  );
}
