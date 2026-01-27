import { storageConfig } from "@/config/storage.config";
import { getSignedUrl } from "@/lib/storage";

export const GET = async (
	_req: Request,
	{ params }: { params: Promise<{ path: string[] }> },
) => {
	const { path } = await params;

	const [bucket, ...rest] = path;
	const filePath = rest.join("/");

	if (!(bucket && filePath)) {
		return new Response("Invalid path", { status: 400 });
	}

	if (bucket === storageConfig.bucketNames.images) {
		const signedUrl = await getSignedUrl(filePath, bucket, {
			expiresIn: 60 * 60,
		});

		// Proxy the image instead of redirecting to avoid issues with
		// components that don't handle redirects well (e.g. Radix AvatarImage)
		const imageResponse = await fetch(signedUrl);

		if (!imageResponse.ok) {
			return new Response("Image not found", { status: 404 });
		}

		return new Response(imageResponse.body, {
			headers: {
				"Content-Type":
					imageResponse.headers.get("Content-Type") || "image/jpeg",
				"Cache-Control": "public, max-age=3600",
			},
		});
	}

	return new Response("Not found", {
		status: 404,
	});
};
