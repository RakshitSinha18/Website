import type { MetadataRoute } from "next"

// Web app manifest — branded install experience (Android/PWA) using the
// icon set that already ships in public/brand/. Colours from BRAND.md.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rakshit Sinha — BI Consultant & Mentor",
    short_name: "Rakshit Sinha",
    description:
      "Senior Business Intelligence consultant and after-hours mentor — Tableau, Power BI, SQL, Advanced Excel and Base SAS.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f19",
    theme_color: "#0b0f19",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
