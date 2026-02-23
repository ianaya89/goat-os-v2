import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ApiAuthError, validateApiKey } from "@/lib/api/auth";
import { db } from "@/lib/db/client";
import { attendanceTable, trainingSessionTable } from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { organizationId } = validateApiKey(request);
		const { sessionId } = await params;

		// Verify session belongs to this organization
		const session = await db.query.trainingSessionTable.findFirst({
			where: and(
				eq(trainingSessionTable.id, sessionId),
				eq(trainingSessionTable.organizationId, organizationId),
			),
			columns: { id: true },
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Training session not found" },
				{ status: 404 },
			);
		}

		const attendance = await db.query.attendanceTable.findMany({
			where: eq(attendanceTable.sessionId, sessionId),
			with: {
				athlete: {
					with: {
						user: {
							columns: { id: true, name: true, email: true, image: true },
						},
					},
				},
				recordedByUser: { columns: { id: true, name: true } },
			},
		});

		return NextResponse.json({ data: attendance });
	} catch (error) {
		if (error instanceof ApiAuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.statusCode },
			);
		}
		logger.error({ error }, "Failed to fetch attendance");
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
