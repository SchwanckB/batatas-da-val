import type { Metadata } from "next";
import { ClientApp } from "@/components/client/ClientApp";
import { hoursSummary, openingHoursSchema } from "@/lib/hours";
import { MenuProvider } from "@/lib/menuStore";
import { instagramUrl } from "@/lib/format";
import { settingsOrSeed } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await settingsOrSeed();
  const title = `${s.name} • batatão recheado em ${s.city}`;
  const description = `${s.slogan}. Entrega e retirada em ${s.city}. ${hoursSummary(s)}. Peça pelo cardápio digital e acompanhe o pedido.`;
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description, url: "/" },
  };
}

export default async function Home() {
  const s = await settingsOrSeed();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: s.name,
    description: s.slogan,
    servesCuisine: ["Batata recheada", "Lanches", "Delivery"],
    priceRange: "R$ 20–60",
    telephone: s.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: s.address || s.city,
      addressLocality: s.city.split("-")[0]?.trim() || s.city,
      addressRegion: "RS",
      addressCountry: "BR",
    },
    sameAs: [instagramUrl(s.instagram)],
    openingHoursSpecification: openingHoursSchema(s),
    hasMenu: "/#cardapio",
    acceptsReservations: false,
    paymentAccepted: "Pix, cartão na entrega, dinheiro",
    currenciesAccepted: "BRL",
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Dados estruturados para a busca local do Google
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MenuProvider>
        <ClientApp />
      </MenuProvider>
    </>
  );
}
