/** @type {import('next').NextConfig} */
const nextConfig = {
  // No `output: "standalone"` — Runflare's buildpack runs `next build` + `next start`
  // directly (no Docker), and standalone output makes `next start` warn/misbehave.
  reactStrictMode: true,
  // ASSUMPTION: lint/type errors shouldn't block the production build for this catalogue;
  // run `npm run lint` separately during development.
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ["mongoose", "@aws-sdk/client-s3", "web-push", "bcryptjs"],
  images: {
    // Product/category images are served from the public S3-compatible bucket.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
