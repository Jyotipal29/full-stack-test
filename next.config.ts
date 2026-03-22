import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native driver — keep external so the serverless bundle resolves it correctly on Vercel.
  serverExternalPackages: [
    "pg",
    "ws",
    "@prisma/adapter-pg",
    "@prisma/adapter-neon",
    "@neondatabase/serverless",
  ],
};

export default nextConfig;
