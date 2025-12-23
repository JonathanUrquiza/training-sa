/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['react-bootstrap'],
  // Optimizaciones para producción
  swcMinify: true,
  // Configuración para Vercel
  output: 'standalone',
}

module.exports = nextConfig

