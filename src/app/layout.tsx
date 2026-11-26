import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { ToastStack } from "@/components/ui/ToastStack";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Batatas da Val • Delivery",
  description:
    "Crocante por fora, cremosa por dentro! Batatões recheados em Três Cachoeiras - RS. Qua a Dom a partir das 19:30.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body className="min-h-dvh bg-ink antialiased">
        <StoreProvider>
          <AmbientBackground />
          {children}
          <ToastStack />
        </StoreProvider>
      </body>
    </html>
  );
}
