/** @type {import('next').NextConfig} */
const nextConfig = {
  // Wyłącz Turbopack, wymuś Webpack
  images: {
    // Wyłącz wbudowaną optymalizację i pozwól na dowolne hosty
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
    // (Możesz usunąć lub zachować poprzednie `domains` jeśli potrzebujesz restrykcji w prodzie)
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config, { isServer }) => {
    // Alias '@' → 'src'
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': require('path').resolve(__dirname, 'src'),
    };

    // Fallback dla modułów node w kliencie
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
