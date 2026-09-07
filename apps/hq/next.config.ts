import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Zoblocks components live at the repo root, outside this app's tree. Same
  // arrangement as apps/docs: transpile them from source rather than expecting
  // a built package. This app is the dogfood consumer of that registry.
  transpilePackages: ["@zoblocks/tokens"],
  // Internal tool on a public hostname. These are cheap and there is no reason
  // for any of it to be embeddable or sniffable.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
