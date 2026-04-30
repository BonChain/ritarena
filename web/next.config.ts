import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@ritarena/sdk"],
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
