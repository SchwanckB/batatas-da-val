import type { MetadataRoute } from "next";
import { SEED_SETTINGS } from "@/lib/data";

/** Instalar na tela inicial: o cliente abre o cardápio como um aplicativo. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SEED_SETTINGS.name} — Delivery`,
    short_name: SEED_SETTINGS.name,
    description: "Cardápio digital, pedido e acompanhamento da Batatas da Val.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#120F0C",
    theme_color: "#120F0C",
    lang: "pt-BR",
    categories: ["food", "shopping"],
    icons: [
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
