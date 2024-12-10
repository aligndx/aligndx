/** @type {import('next').NextConfig} */
const standaloneConfig = {
    output: 'standalone',
};

/** @type {import('next').NextConfig} */
const staticConfig = {
    output: 'export',
    images: { unoptimized: true }, // Example: Unoptimized for static
};

const nextConfig = process.env.NEXT_PUBLIC_OUTPUT_MODE === 'static'
    ? staticConfig
    : standaloneConfig;

export default nextConfig;
