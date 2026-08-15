import type { MetadataRoute } from "next"

const SITE_URL = "https://sinharakshit.com"

// Generates a static robots.txt at build time (works with output: "export").
export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login/", "/admin/", "/portal/", "/reset/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
