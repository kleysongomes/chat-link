/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true, // Para habilitar o minificação usando SWC
    // Rewrites são úteis se você tiver APIs externas ou precisar redirecionar rotas
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        },
      ];
    },
    // Adicione outras configurações conforme necessário
  };
  
  export default nextConfig;
  