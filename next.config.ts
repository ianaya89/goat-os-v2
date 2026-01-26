import { withContentCollections } from "@content-collections/next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

// Validate environment variables at build time
import "./lib/env";

const nextConfig: NextConfig = {
	serverExternalPackages: ["natural", "picocolors", "pino", "thread-stream"],
	experimental: {
		optimizePackageImports: ["recharts", "lucide-react", "date-fns"],
	},
	turbopack: {
		root: import.meta.dirname,
		resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
	},
	logging: {
		fetches: {
			fullUrl: true,
		},
	},

	reactStrictMode: true,
	poweredByHeader: false,
	images: {
		dangerouslyAllowSVG: true,
		remotePatterns: [
			{
				// google profile images
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
			{
				// random user avatars
				protocol: "https",
				hostname: "randomuser.me",
			},
			{
				// S3 bucket for uploads
				protocol: "https",
				hostname: "goat-os-dev.s3.us-east-1.amazonaws.com",
			},
			{
				// S3 bucket for uploads (wildcard for any region/bucket)
				protocol: "https",
				hostname: "*.s3.*.amazonaws.com",
			},
		],
	},
	async redirects() {
		return [
			{
				source: "/dashboard/admin",
				destination: "/dashboard/admin/users",
				permanent: false,
			},
		];
	},
	webpack: (config, { webpack }) => {
		config.plugins.push(
			new webpack.IgnorePlugin({
				resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
			}),
		);

		return config;
	},
};

// Apply next-intl plugin first to the base config
const intlConfig = withNextIntl(nextConfig);

const bundleAnalyzerConfig =
	process.env.ANALYZE === "true"
		? withBundleAnalyzer({ enabled: true })(intlConfig)
		: intlConfig;

const vercelOrCI = !!(process.env.VERCEL === "1" || process.env.CI);

const withMDX = createMDX();

export default withContentCollections(
	withMDX(
		process.env.VERCEL_ENV === "production"
			? withSentryConfig(bundleAnalyzerConfig, {
					org: process.env.SENTRY_ORG,
					project: process.env.SENTRY_PROJECT,
					authToken: process.env.SENTRY_AUTH_TOKEN,
					silent: !vercelOrCI,
					sourcemaps: {
						disable: !vercelOrCI,
					},
					tunnelRoute: "/monitoring",
					widenClientFileUpload: true,
					telemetry: false,
					reactComponentAnnotation: {
						enabled: true,
					},
					// Avoid cluttering traces with a ton of middleware spans.
					autoInstrumentMiddleware: false,
				})
			: bundleAnalyzerConfig,
	),
);
