import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    trailingSlash: true,
    output: 'standalone',
    images: {
        remotePatterns: [
            {
                protocol: 'http', //Для разработки
                hostname: 'localhost',
                port: '8000',
                pathname: '/media/**',
            },
            {
                protocol: 'http',
                hostname: 'tips.samsmu.ru/logic-trainer',
                pathname: '/media/**',
            },
        ],
    },
};

export default nextConfig;