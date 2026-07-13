import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ホームディレクトリ側の package-lock.json を誤検出しないよう、プロジェクトを明示する。
  turbopack: { root: process.cwd() },
};

export default nextConfig;
