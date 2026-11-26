import type { Metadata, Viewport } from "next";
import { Anton, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Backdrop } from "@/components/ui/Backdrop";
import { ToastProvider } from "@/lib/toast";
import { ToastStack } from "@/components/ui/ToastStack";
import { ServiceWorkerRegister } from "@/components/ui/ServiceWorker";
import { SEED_SETTINGS } from "@/lib/data";

/** Letreiro condensado, como placa de lancheria. */
// latin-ext garante Ã, Õ, Ç e companhia na caixa alta do letreiro
const anton = Anton({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-anton", display: "swap" });
/** Corpo com personalidade, boa leitura em português. */
const instrument = Instrument_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-instrument", display: "swap" });

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://batatasdaval.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: `${SEED_SETTINGS.name} • Batatão recheado em ${SEED_SETTINGS.city}`,
    template: `%s • ${SEED_SETTINGS.name}`,
  },
  description:
    "Batatão recheado feito na hora, média 500 g ou gigante 800 g. Entrega e retirada em Três Cachoeiras - RS. Peça pelo cardápio digital.",
  applicationName: SEED_SETTINGS.name,
  manifest: "/manifest.webmanifest",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  appleWebApp: { capable: true, title: SEED_SETTINGS.name, statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SEED_SETTINGS.name,
    title: `${SEED_SETTINGS.name} — batatão recheado em ${SEED_SETTINGS.city}`,
    description: "Crocante por fora, cremosa por dentro. Peça pelo site e acompanhe o pedido ao vivo.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: SEED_SETTINGS.name }],
  },
  twitter: { card: "summary", title: SEED_SETTINGS.name },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: "#120F0C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${instrument.variable}`}>
      <body className="min-h-dvh bg-ink antialiased">
        <ToastProvider>
          <Backdrop />
          {children}
          <ToastStack />
          <ServiceWorkerRegister />
        </ToastProvider>
      </body>
    </html>
  );
}
