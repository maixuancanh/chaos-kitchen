import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AudioUnlock from "@/components/AudioUnlock";

export const metadata: Metadata = {
  title: "The Chaos Kitchen 🔥",
  description:
    "Manage your chaotic AI kitchen staff powered by ElevenLabs. Complete orders, survive the chaos, and listen to your staff fall apart in real-time AI-generated voices.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍳</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a0a00",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-kitchen-bg text-white antialiased overflow-x-hidden">
        {/* Resumes the Web Audio API AudioContext on every touch/click.
            Required for iOS Safari which suspends audio aggressively. */}
        <AudioUnlock />

        {children}

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#2d1500",
              color: "#fff",
              border: "2px solid #ff6b00",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: "14px",
              maxWidth: "320px",
            },
            success: {
              iconTheme: { primary: "#00cc44", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#ff1a00", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
