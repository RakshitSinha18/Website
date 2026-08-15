import type { MetadataRoute } from "next"

const SITE_URL = "https://sinharakshit.com"

// Generates a static sitemap.xml at build time (works with output: "export").
export const dynamic = "force-static"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ]
}
