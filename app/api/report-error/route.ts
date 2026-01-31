import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { sendErrorReportEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

const reportErrorSchema = z.object({
	errorMessage: z.string().min(1).max(5000),
	errorDigest: z.string().optional(),
	errorUrl: z.string().url(),
	userAgent: z.string().optional(),
});

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const result = reportErrorSchema.safeParse(body);

		if (!result.success) {
			return NextResponse.json(
				{ error: "Invalid request body" },
				{ status: 400 },
			);
		}

		const { errorMessage, errorDigest, errorUrl, userAgent } = result.data;

		// Get current date and time in a readable format
		const now = new Date();
		const errorDate = now.toLocaleDateString("es-AR", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
		const errorTime = now.toLocaleTimeString("es-AR", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});

		await sendErrorReportEmail({
			errorMessage,
			errorDigest,
			errorUrl,
			errorDate,
			errorTime,
			userAgent,
		});

		logger.info(
			{ errorDigest, errorUrl },
			"Error report email sent successfully",
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		logger.error({ error }, "Failed to send error report email");

		return NextResponse.json(
			{ error: "Failed to send error report" },
			{ status: 500 },
		);
	}
}
