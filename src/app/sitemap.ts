import type { MetadataRoute } from "next";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://batatasdaval.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: site, lastModified: new Date(), changeFrequency: "daily", priority: 1 }];
}
