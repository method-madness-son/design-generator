import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      './graphics/*.svg': {
        loaders: [{ loader: 'raw-loader' }],
        as: '*.js',
      },
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      include: resolve(__dirname, "graphics"),
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
