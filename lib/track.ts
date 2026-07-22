function getAnonId(): string {
  try {
    let id = localStorage.getItem("ikigai_anon_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("ikigai_anon_id", id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

export function trackEvent(
  event: "page_view" | "conversation_start" | "reveal_view" | "mic_error",
  metadata?: Record<string, string>
) {
  try {
    const anonId = getAnonId();
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, anonId, metadata }),
    }).catch(() => {});
  } catch { /* silently ignore */ }
}
