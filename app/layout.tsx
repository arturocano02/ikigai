import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import AuthButton from "@/components/auth/AuthButton";
import GdprBanner from "@/components/auth/GdprBanner";
import InfoButton from "@/components/InfoButton";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ikigai - Find Your Purpose",
  description: "A conversation that helps you understand what you're truly meant to do.",
  openGraph: {
    title: "Ikigai - Find Your Purpose",
    description: "An AI-guided voice experience that reveals your life's purpose.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full bg-cinematic antialiased">
        {/* Top-right controls — on every page */}
        <div className="fixed top-4 right-4 z-30 flex items-center gap-2">
          <InfoButton />
          <Suspense>
            <AuthButton />
          </Suspense>
        </div>

        {children}

        <GdprBanner />
      </body>
    </html>
  );
}
