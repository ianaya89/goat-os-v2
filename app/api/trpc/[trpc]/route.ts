import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "@/trpc/context";
import { appRouter } from "@/trpc/routers/app";

const ALLOWED_ORIGINS = [
	"https://montegrande.goatsports.ar",
	"https://goatsports.ar",
	"https://www.goatsports.ar",
];

function getCorsHeaders(req: Request): Record<string, string> {
	const origin = req.headers.get("origin") ?? "";

	if (!ALLOWED_ORIGINS.includes(origin) && !origin.endsWith(".goatsports.ar")) {
		return {};
	}

	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Max-Age": "86400",
	};
}

export function OPTIONS(req: Request) {
	return new Response(null, {
		status: 204,
		headers: getCorsHeaders(req),
	});
}

async function handler(req: Request) {
	const response = await fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: createTRPCContext,
	});

	const corsHeaders = getCorsHeaders(req);
	for (const [key, value] of Object.entries(corsHeaders)) {
		response.headers.set(key, value);
	}

	return response;
}

export { handler as GET, handler as POST };
