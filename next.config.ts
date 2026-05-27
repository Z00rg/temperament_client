import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
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
                protocol: 'https',
                hostname: 'atlascolposcopy.ru//',
                pathname: '/media/**',
            },
        ],
    },
};

export default nextConfig;
