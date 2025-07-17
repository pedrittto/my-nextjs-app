import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'ichef.bbci.co.uk',
      'static01.nyt.com',
      'cdn.breitbart.com',
      'media.cnn.com',
      'assets.bwbx.io',
      'cdn.cnn.com',
      'media.npr.org',
      'ichef.bbci.co.uk',
      'www.aljazeera.com',
      'static.foxnews.com',
      's.abcnews.com',
      'www.politico.com',
      'www.reuters.com',
      'img.huffingtonpost.com',
      'images.wsj.net',
      'www.npr.org',
      'www.bbc.co.uk',
      'www.bbc.com',
      // add more as needed
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
    };
    return config;
  },
};

export default nextConfig;
