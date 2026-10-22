import type { NextConfig } from "next";

// Inside Docker the web container reaches the API by service name, not the public URL.
const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  images: {
    // Media renditions are pre-generated JPEGs served by the Go API/Caddy
    // (build-out plan §6.2); Next's built-in (sharp) optimizer would decode
    // and re-encode on every request, which we can't afford on 1 vCPU.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
  async headers() {
    // Theme artwork and audio are constant files with unversioned names: cache for a day so repeat visits skip
    // the re-check, and let browsers serve a stale copy for a week while they refresh it in the background.
    return [
      {
        source: "/themes/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
  async rewrites() {
    // Local dev convenience: in production Caddy serves /media/* directly
    // before requests reach Next (deploy/Caddyfile), so this rule never runs.
    return [{ source: "/media/:path*", destination: `${API_INTERNAL_URL}/media/:path*` }];
  },
};

export default nextConfig;
