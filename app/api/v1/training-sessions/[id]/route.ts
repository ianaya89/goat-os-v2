import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ApiAuthError, validateApiKey } from "@/lib/api/auth";
import { db } from "@/lib/db/client";
import { trainingSessionTable } from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { organizationId } = validateApiKey(request);
		const { id } = await params;

		const session = await db.query.trainingSessionTable.findFirst({
			where: and(
				eq(trainingSessionTable.id, id),
				eq(trainingSessionTable.organizationId, organizationId),
			),
			with: {
				location: true,
				athleteGroup: {
					with: {
						members: {
							with: {
								athlete: {
									with: {
										user: {
											columns: {
												id: true,
												name: true,
												email: true,
												image: true,
											},
										},
									},
								},
							},
						},
					},
				},
				service: {
					columns: {
						id: true,
						name: true,
						currentPrice: true,
						currency: true,
					},
				},
				coaches: {
					with: {
						coach: {
							with: {
								user: {
									columns: { id: true, name: true, email: true, image: true },
								},
							},
						},
					},
				},
				athletes: {
					with: {
						athlete: {
							with: {
								user: {
									columns: { id: true, name: true, email: true, image: true },
								},
							},
						},
					},
				},
				attendances: true,
				evaluations: true,
			},
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Training session not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ data: session });
	} catch (error) {
		if (error instanceof ApiAuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.statusCode },
			);
		}
		logger.error({ error }, "Failed to fetch training session");
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
