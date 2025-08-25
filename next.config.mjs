// next.config.js
/** @type {import('next').NextConfig} */
const isProd = process.env.GITHUB_ACTIONS === 'true';

module.exports = {
  // Export estático (reemplaza al viejo `next export`)
  output: 'export',

  // Imprescindible para GitHub Pages si usas next/image
  images: { unoptimized: true },

  // Si publicas en https://usuario.github.io/REPO, usa basePath/assetPrefix.
  // Ajusta "programacionLineal" al nombre EXACTO del repo.
  basePath: isProd ? '/programacionLineal' : '',
  assetPrefix: isProd ? '/programacionLineal/' : '',
};
