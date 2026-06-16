import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy – Ikigai",
};

export default function PrivacyPage() {
  return (
    <main className="relative min-h-dvh px-5 pt-14 pb-24">
      <Link
        href="/"
        className="fixed top-5 left-5 z-20 flex items-center gap-1.5 text-white/25 hover:text-white/55 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="text-xs tracking-wider">Home</span>
      </Link>

      <div className="mx-auto max-w-2xl pt-6 space-y-10">
        <div className="space-y-2">
          <p className="text-[10px] tracking-[0.35em] uppercase text-white/25">Legal</p>
          <h1 className="text-2xl font-light text-white tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-white/30">Last updated: May 2026</p>
        </div>

        <Section title="Who we are">
          Ikigai is an AI-guided tool that helps you discover your life purpose. We are committed
          to protecting your personal data and respecting your privacy in accordance with the
          General Data Protection Regulation (GDPR) and applicable data protection laws.
        </Section>

        <Section title="What data we collect">
          <ul className="space-y-2 list-none">
            <Li>
              <strong className="text-white/65">Account data:</strong> When you create an account,
              we collect your email address and, if you sign in with Google, your name and profile
              picture as provided by Google.
            </Li>
            <Li>
              <strong className="text-white/65">Ikigai session data:</strong> When you save your
              results, we store the synthesis generated from your conversation (your Ikigai title,
              insights, strengths, motivations, and related content). We do not store the full
              conversation transcript.
            </Li>
            <Li>
              <strong className="text-white/65">Usage data:</strong> We do not use third-party
              analytics or tracking tools. Standard server logs (IP address, browser type) may be
              retained for up to 30 days for security purposes.
            </Li>
          </ul>
        </Section>

        <Section title="How we use your data">
          <ul className="space-y-2 list-none">
            <Li>To provide and maintain your account and saved sessions.</Li>
            <Li>To allow you to retrieve your Ikigai results across devices.</Li>
            <Li>To authenticate you securely via email or Google OAuth.</Li>
          </ul>
          <p className="mt-3">
            We do not sell, rent, or share your personal data with third parties for marketing
            purposes. We do not use your data to train AI models.
          </p>
        </Section>

        <Section title="Legal basis for processing (GDPR)">
          We process your data on the basis of:
          <ul className="space-y-2 list-none mt-2">
            <Li>
              <strong className="text-white/65">Contractual necessity</strong> — to provide the
              account and session-saving features you sign up for.
            </Li>
            <Li>
              <strong className="text-white/65">Consent</strong> — you provide consent when you
              create an account. You may withdraw this at any time by deleting your account.
            </Li>
          </ul>
        </Section>

        <Section title="Your rights (GDPR)">
          You have the right to:
          <ul className="space-y-2 list-none mt-2">
            <Li>
              <strong className="text-white/65">Access</strong> — request a copy of the data we
              hold about you.
            </Li>
            <Li>
              <strong className="text-white/65">Erasure</strong> — delete your account and all
              associated data at any time from your{" "}
              <Link href="/profile" className="underline underline-offset-2 text-white/50 hover:text-white/70">
                profile page
              </Link>
              .
            </Li>
            <Li>
              <strong className="text-white/65">Portability</strong> — your Ikigai sessions are
              viewable and copyable from your profile at any time.
            </Li>
            <Li>
              <strong className="text-white/65">Rectification</strong> — you can update your
              display name in your profile.
            </Li>
            <Li>
              <strong className="text-white/65">Object</strong> — to contact us if you believe we
              are processing your data in a way that is not justified.
            </Li>
          </ul>
        </Section>

        <Section title="Cookies and storage">
          We use cookies strictly for authentication (keeping you signed in). These are essential
          session cookies and do not require consent under the GDPR &ldquo;strictly necessary&rdquo; exemption.
          We do not use advertising or tracking cookies.
        </Section>

        <Section title="Data retention">
          Your data is retained for as long as your account is active. When you delete your
          account, all personal data is permanently removed within 30 days.
        </Section>

        <Section title="Third-party services">
          <ul className="space-y-2 list-none">
            <Li>
              <strong className="text-white/65">Supabase</strong> — our database and authentication
              provider. Data is stored in the EU (Ireland). See{" "}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-white/50 hover:text-white/70"
              >
                Supabase Privacy Policy
              </a>
              .
            </Li>
            <Li>
              <strong className="text-white/65">Google OAuth</strong> — used only if you choose to
              sign in with Google. We only receive your name, email, and profile picture. See{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-white/50 hover:text-white/70"
              >
                Google Privacy Policy
              </a>
              .
            </Li>
            <Li>
              <strong className="text-white/65">Anthropic / OpenAI</strong> — AI models are used
              to generate your Ikigai synthesis. Conversation content is sent to these APIs and
              subject to their data retention policies. We do not associate conversation data with
              your account identifier when sending to AI providers.
            </Li>
          </ul>
        </Section>

        <Section title="Contact">
          For any privacy-related questions or to exercise your rights, contact us at{" "}
          <a
            href="mailto:privacy@ikigai.app"
            className="underline underline-offset-2 text-white/50 hover:text-white/70"
          >
            privacy@ikigai.app
          </a>
          .
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-white/70 tracking-wide">{title}</h2>
      <div className="text-sm text-white/40 font-light leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span
        className="mt-2 w-1 h-1 rounded-full shrink-0"
        style={{ background: "rgba(249,115,22,0.5)" }}
      />
      <span>{children}</span>
    </li>
  );
}
