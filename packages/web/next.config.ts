import type { NextConfig } from "next";

const serverBaseUrl =
	process.env.DEVOS_SERVER_BASE_URL ?? "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: `${serverBaseUrl}/api/:path*`,
			},
			{
				source: "/health",
				destination: `${serverBaseUrl}/health`,
			},
		];
	},
};

export default nextConfig;
