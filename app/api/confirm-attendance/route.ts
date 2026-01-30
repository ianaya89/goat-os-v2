import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { appConfig } from "@/config/app.config";
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
import {
	getEmailTranslations,
	type SupportedLocale,
} from "@/lib/email/translations";
import { logger } from "@/lib/logger";
import { verifyConfirmationToken } from "@/lib/notifications/confirmation-token";

// Brand colors matching email templates
const BRAND_COLORS = {
	primary: "#00237c",
	primaryText: "#ffffff",
	success: "#10b981",
	error: "#dc2626",
	warning: "#f59e0b",
	bodyText: "#1f2937",
	mutedText: "#6b7280",
	border: "#e5e7eb",
	background: "#f9fafb",
} as const;

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const token = searchParams.get("token");
	const locale = (searchParams.get("locale") || "es") as SupportedLocale;
	const t = getEmailTranslations(locale);

	if (!token) {
		return createHtmlResponse({
			title: t.confirmAttendance.error.invalidLink.title,
			message: t.confirmAttendance.error.invalidLink.message,
			type: "error",
			locale,
		});
	}

	// Verify token
	const payload = verifyConfirmationToken(token);

	if (!payload) {
		return createHtmlResponse({
			title: t.confirmAttendance.error.linkExpired.title,
			message: t.confirmAttendance.error.linkExpired.message,
			type: "error",
			locale,
		});
	}

	const { sessionId, athleteId } = payload;

	try {
		// Get session details
		const session = await db.query.trainingSessionTable.findFirst({
			where: eq(trainingSessionTable.id, sessionId),
			with: {
				organization: { columns: { name: true, locale: true } },
			},
		});

		if (!session) {
			return createHtmlResponse({
				title: t.confirmAttendance.error.sessionNotFound.title,
				message: t.confirmAttendance.error.sessionNotFound.message,
				type: "error",
				locale,
			});
		}

		// Use organization locale if available
		const orgLocale = (session.organization?.locale ||
			locale) as SupportedLocale;
		const tOrg = getEmailTranslations(orgLocale);

		// Check if session is cancelled
		if (session.status === TrainingSessionStatus.cancelled) {
			return createHtmlResponse({
				title: tOrg.confirmAttendance.warning.sessionCancelled.title,
				message: tOrg.confirmAttendance.warning.sessionCancelled.message,
				type: "warning",
				orgName: session.organization?.name,
				locale: orgLocale,
			});
		}

		// Check if session already completed (with 2-hour grace period for late confirmations)
		const sessionEndTime = new Date(session.endTime);
		const gracePeriodMs = 2 * 60 * 60 * 1000; // 2 hours
		const cutoffTime = new Date(sessionEndTime.getTime() + gracePeriodMs);

		if (new Date() > cutoffTime) {
			return createHtmlResponse({
				title: tOrg.confirmAttendance.warning.sessionEnded.title,
				message: tOrg.confirmAttendance.warning.sessionEnded.message,
				type: "warning",
				orgName: session.organization?.name,
				locale: orgLocale,
			});
		}

		// Get athlete details
		const athlete = await db.query.athleteTable.findFirst({
			where: eq(athleteTable.id, athleteId),
			with: {
				user: { columns: { name: true } },
			},
		});

		if (!athlete) {
			return createHtmlResponse({
				title: tOrg.confirmAttendance.error.athleteNotFound.title,
				message: tOrg.confirmAttendance.error.athleteNotFound.message,
				type: "error",
				locale: orgLocale,
			});
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
		const orgName = session.organization?.name;

		const successMessage = tOrg.confirmAttendance.success.message
			.replace("{athleteName}", athleteName)
			.replace("{sessionTitle}", sessionTitle);

		return createHtmlResponse({
			title: tOrg.confirmAttendance.success.title,
			message: successMessage,
			type: "success",
			orgName,
			locale: orgLocale,
		});
	} catch (error) {
		logger.error(
			{ error, sessionId, athleteId },
			"Failed to confirm attendance",
		);

		return createHtmlResponse({
			title: t.confirmAttendance.error.somethingWentWrong.title,
			message: t.confirmAttendance.error.somethingWentWrong.message,
			type: "error",
			locale,
		});
	}
}

type HtmlResponseOptions = {
	title: string;
	message: string;
	type: "success" | "error" | "warning";
	orgName?: string;
	locale: SupportedLocale;
};

function createHtmlResponse({
	title,
	message,
	type,
	orgName,
	locale,
}: HtmlResponseOptions): NextResponse {
	const t = getEmailTranslations(locale);
	const appName = appConfig.appName;

	const typeConfig = {
		success: {
			iconBg: BRAND_COLORS.success,
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
		},
		error: {
			iconBg: BRAND_COLORS.error,
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
		},
		warning: {
			iconBg: BRAND_COLORS.warning,
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
		},
	};

	const { iconBg, icon } = typeConfig[type];

	const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${appName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: ${BRAND_COLORS.background};
      padding: 24px;
    }

    .container {
      max-width: 440px;
      width: 100%;
    }

    .branding {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 24px;
    }

    .branding-logo {
      width: 36px;
      height: 36px;
    }

    .branding-title {
      color: ${BRAND_COLORS.primary};
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 48px 40px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
      border: 1px solid ${BRAND_COLORS.border};
    }

    .icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: ${iconBg};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .title {
      color: ${BRAND_COLORS.bodyText};
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .message {
      color: ${BRAND_COLORS.mutedText};
      font-size: 15px;
      line-height: 1.6;
    }

    .org-badge {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid ${BRAND_COLORS.border};
    }

    .org-name {
      color: ${BRAND_COLORS.bodyText};
      font-size: 14px;
      font-weight: 500;
    }

    .footer {
      margin-top: 24px;
      text-align: center;
    }

    .footer-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: ${BRAND_COLORS.mutedText};
      font-size: 13px;
    }

    .footer-brand {
      color: ${BRAND_COLORS.primary};
      font-weight: 500;
      text-decoration: none;
    }

    .footer-brand:hover {
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .card {
        padding: 32px 24px;
      }

      .title {
        font-size: 20px;
      }

      .message {
        font-size: 14px;
      }

      .branding-logo {
        width: 32px;
        height: 32px;
      }

      .branding-title {
        font-size: 18px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="branding">
      <img
        src="${appConfig.baseUrl}/logo.svg"
        alt="${appName}"
        class="branding-logo"
        onerror="this.style.display='none'"
      >
      <span class="branding-title">${appName}</span>
    </div>

    <div class="card">
      <div class="icon-wrapper">
        ${icon}
      </div>
      <h1 class="title">${escapeHtml(title)}</h1>
      <p class="message">${escapeHtml(message)}</p>
      ${
				orgName
					? `
        <div class="org-badge">
          <span class="org-name">${escapeHtml(orgName)}</span>
        </div>
      `
					: ""
			}
    </div>

    <footer class="footer">
      <div class="footer-content">
        <span>${t.confirmAttendance.poweredBy}</span>
        <a href="${appConfig.baseUrl}" class="footer-brand" target="_blank" rel="noopener noreferrer">
          ${appName}
        </a>
      </div>
    </footer>
  </div>
</body>
</html>
  `.trim();

	return new NextResponse(html, {
		status: 200,
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
	const htmlEntities: Record<string, string> = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	};
	return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}
