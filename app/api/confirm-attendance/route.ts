import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
	AttendanceStatus,
	ConfirmationStatus,
	TrainingSessionStatus,
} from "@/lib/db/schema/enums";
import {
	athleteTable,
	attendanceTable,
	sessionConfirmationHistoryTable,
	trainingSessionTable,
} from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import { verifyConfirmationToken } from "@/lib/notifications/confirmation-token";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const token = searchParams.get("token");

	if (!token) {
		return createHtmlResponse(
			"Invalid Link",
			"The confirmation link is invalid or missing.",
			"error",
		);
	}

	// Verify token
	const payload = verifyConfirmationToken(token);

	if (!payload) {
		return createHtmlResponse(
			"Link Expired",
			"This confirmation link has expired or is invalid. Please contact your coach for a new reminder.",
			"error",
		);
	}

	const { sessionId, athleteId } = payload;

	try {
		// Get session details
		const session = await db.query.trainingSessionTable.findFirst({
			where: eq(trainingSessionTable.id, sessionId),
			with: {
				organization: { columns: { name: true } },
			},
		});

		if (!session) {
			return createHtmlResponse(
				"Session Not Found",
				"The training session could not be found.",
				"error",
			);
		}

		// Check if session is cancelled
		if (session.status === TrainingSessionStatus.cancelled) {
			return createHtmlResponse(
				"Session Cancelled",
				"This training session has been cancelled.",
				"warning",
			);
		}

		// Check if session already completed (with 2-hour grace period for late confirmations)
		const sessionEndTime = new Date(session.endTime);
		const gracePeriodMs = 2 * 60 * 60 * 1000; // 2 hours
		const cutoffTime = new Date(sessionEndTime.getTime() + gracePeriodMs);

		if (new Date() > cutoffTime) {
			return createHtmlResponse(
				"Session Already Ended",
				"This training session has already ended. You can no longer confirm attendance.",
				"warning",
			);
		}

		// Get athlete details
		const athlete = await db.query.athleteTable.findFirst({
			where: eq(athleteTable.id, athleteId),
			with: {
				user: { columns: { name: true } },
			},
		});

		if (!athlete) {
			return createHtmlResponse(
				"Athlete Not Found",
				"Your athlete profile could not be found.",
				"error",
			);
		}

		// Check if attendance already recorded
		const existingAttendance = await db.query.attendanceTable.findFirst({
			where: and(
				eq(attendanceTable.sessionId, sessionId),
				eq(attendanceTable.athleteId, athleteId),
			),
		});

		if (existingAttendance) {
			// Update existing attendance to confirmed
			await db
				.update(attendanceTable)
				.set({
					status: AttendanceStatus.present,
					notes: existingAttendance.notes
						? `${existingAttendance.notes} | Confirmed via link`
						: "Confirmed via link",
					updatedAt: new Date(),
				})
				.where(eq(attendanceTable.id, existingAttendance.id));

			logger.info(
				{ sessionId, athleteId, attendanceId: existingAttendance.id },
				"Attendance updated via confirmation link",
			);
		} else {
			// Create new attendance record
			await db.insert(attendanceTable).values({
				sessionId,
				athleteId,
				status: AttendanceStatus.present,
				notes: "Confirmed via link",
			});

			logger.info(
				{ sessionId, athleteId },
				"Attendance created via confirmation link",
			);
		}

		// Update session status to "confirmed" if it's currently "pending"
		// This confirms the session when at least one athlete responds
		if (session.status === TrainingSessionStatus.pending) {
			await db
				.update(trainingSessionTable)
				.set({
					status: TrainingSessionStatus.confirmed,
					updatedAt: new Date(),
				})
				.where(eq(trainingSessionTable.id, sessionId));

			logger.info(
				{ sessionId },
				"Session status updated to confirmed via athlete confirmation",
			);
		}

		// Update confirmation history if exists (mark as confirmed)
		await db
			.update(sessionConfirmationHistoryTable)
			.set({
				status: ConfirmationStatus.confirmed,
				confirmedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(sessionConfirmationHistoryTable.sessionId, sessionId),
					eq(sessionConfirmationHistoryTable.athleteId, athleteId),
					eq(sessionConfirmationHistoryTable.status, ConfirmationStatus.sent),
				),
			);

		const athleteName = athlete.user?.name ?? "Athlete";
		const sessionTitle = session.title;
		const orgName = session.organization?.name ?? "your organization";

		return createHtmlResponse(
			"Attendance Confirmed!",
			`Thank you, ${athleteName}! Your attendance for "${sessionTitle}" has been confirmed. See you at the session!`,
			"success",
			orgName,
		);
	} catch (error) {
		logger.error(
			{ error, sessionId, athleteId },
			"Failed to confirm attendance",
		);

		return createHtmlResponse(
			"Something Went Wrong",
			"We couldn't confirm your attendance. Please try again or contact your coach.",
			"error",
		);
	}
}

function createHtmlResponse(
	title: string,
	message: string,
	type: "success" | "error" | "warning",
	orgName?: string,
): NextResponse {
	const colors = {
		success: { bg: "#10b981", icon: "✓" },
		error: { bg: "#ef4444", icon: "✕" },
		warning: { bg: "#f59e0b", icon: "!" },
	};

	const { bg, icon } = colors[type];

	const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: ${bg};
      color: white;
      font-size: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 16px;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
    }
    .org {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${orgName ? `<p class="org">${orgName}</p>` : ""}
  </div>
</body>
</html>
  `.trim();

	return new NextResponse(html, {
		status: 200,
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
}
