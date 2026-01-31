import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { sendFeedbackEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

const reportFeedbackSchema = z.object({
	title: z.string().min(1).max(200),
	description: z.string().min(1).max(5000),
	pageUrl: z.string().url(),
	userAgent: z.string().optional(),
	images: z.array(z.string()).max(5).optional(), // Array of base64 data URLs
});

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const result = reportFeedbackSchema.safeParse(body);

		if (!result.success) {
			return NextResponse.json(
				{ error: "Invalid request body" },
				{ status: 400 },
			);
		}

		const { title, description, pageUrl, userAgent, images } = result.data;

		// Get current date and time in a readable format
		const now = new Date();
		const reportDate = now.toLocaleDateString("es-AR", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
		const reportTime = now.toLocaleTimeString("es-AR", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});

		await sendFeedbackEmail({
			title,
			description,
			pageUrl,
			reportDate,
			reportTime,
			userAgent,
			images: images || [],
		});

		logger.info({ pageUrl, title }, "Feedback report email sent successfully");

		return NextResponse.json({ success: true });
	} catch (error) {
		logger.error({ error }, "Failed to send feedback report email");

		return NextResponse.json(
			{ error: "Failed to send feedback report" },
			{ status: 500 },
		);
	}
}
