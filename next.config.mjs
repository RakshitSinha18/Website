/** @type {import('next').NextConfig} */

// GitHub Pages serves the site from https://<user>.github.io/<repo>/ unless you
// use a custom domain. Set NEXT_PUBLIC_BASE_PATH="/<repo>" in the Pages build so
// assets resolve correctly. For a custom domain (via Hostinger), leave it empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""

const nextConfig = {
  output: "export", // static HTML export for GitHub Pages
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
