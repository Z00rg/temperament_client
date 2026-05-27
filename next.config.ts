import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    trailingSlash: true,
    basePath: '/logic-trainer',
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://172.26.4.9:8083/logic-trainer/api/:path*',
            },
        ];
    },
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