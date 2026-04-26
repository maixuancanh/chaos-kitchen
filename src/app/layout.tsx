import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "The Chaos Kitchen 🔥",
  description: "Manage your chaotic AI kitchen staff powered by ElevenLabs",
  icons: { icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍳</text></svg>" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-kitchen-bg text-white antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#2d1500",
              color: "#fff",
              border: "2px solid #ff6b00",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
            },
            success: { iconTheme: { primary: "#00cc44", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ff1a00", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
