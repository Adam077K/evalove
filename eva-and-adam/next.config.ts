import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Interface workstream config. T1's scaffold owns the production config;
  // nothing here beyond what previewing the screens requires.
  images: {
    // Fixture photographs are served remotely during design preview only.
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
};

export default nextConfig;
