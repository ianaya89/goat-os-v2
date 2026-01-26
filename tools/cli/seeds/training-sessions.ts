import { eq } from "drizzle-orm";
import type { DrizzleClient } from "@/lib/db/types";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";
import {
	ENTITY_ATTENDANCE,
	ENTITY_SESSION,
	ENTITY_SESSION_COACH,
	seedUUID,
} from "./utils";

const sessionTitles = [
	"Entrenamiento Técnico",
	"Preparación Física",
	"Táctica Defensiva",
	"Táctica Ofensiva",
	"Práctica de Penales",
	"Entrenamiento de Arqueros",
	"Circuito de Velocidad",
	"Partido de Práctica",
	"Recuperación Activa",
	"Trabajo de Fuerza",
];

const objectives = [
	"Mejorar técnica de pase corto y largo",
	"Desarrollar resistencia cardiovascular",
	"Perfeccionar movimientos tácticos defensivos",
	"Trabajar coordinación y agilidad",
	"Fortalecer tren inferior",
];

const statuses = ["pending", "confirmed", "completed"] as const;

function addHours(date: Date, hours: number): Date {
	return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function seedTrainingSessions(
	db: DrizzleClient,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	// Check for existing seed sessions
	const existingSessions = await db.query.trainingSessionTable.findMany({
		where: eq(
			schema.trainingSessionTable.organizationId,
			context.organizationId,
		),
	});

	if (existingSessions.length >= count) {
		return existingSessions.slice(0, count).map((s: any) => s.id);
	}

	const existingTitles = new Set(existingSessions.map((s: any) => s.title));
	const sessions: Array<typeof schema.trainingSessionTable.$inferInsert> = [];
	const sessionIds: string[] = existingSessions.map((s: any) => s.id);
	const now = new Date();

	for (let i = 0; i < count; i++) {
		const title = `${sessionTitles[i % sessionTitles.length]} #${i + 1}`;
		if (existingTitles.has(title)) continue;

		const sessionId = seedUUID(ENTITY_SESSION, i + 1);
		const dayOffset = (i % 30) - 15; // -15 to +14 days
		const startTime = addDays(now, dayOffset);
		startTime.setHours(8 + (i % 12), 0, 0, 0);

		const status = i < count / 2 ? "completed" : statuses[i % statuses.length];

		sessions.push({
			id: sessionId,
			organizationId: context.organizationId,
			title,
			description: `Sesión de entrenamiento #${i + 1}`,
			startTime,
			endTime: addHours(startTime, 1.5),
			status,
			locationId:
				context.locationIds.length > 0
					? context.locationIds[i % context.locationIds.length]
					: null,
			athleteGroupId:
				context.athleteGroupIds.length > 0 && i % 2 === 0
					? context.athleteGroupIds[i % context.athleteGroupIds.length]
					: null,
			objectives: objectives[i % objectives.length],
			createdBy: context.seedUserId,
		});

		sessionIds.push(sessionId);
	}

	if (sessions.length > 0) {
		await db
			.insert(schema.trainingSessionTable)
			.values(sessions)
			.onConflictDoNothing();
	}

	// Add coaches to sessions if not already added
	const firstSessionId = sessionIds[0];
	if (context.coachIds.length > 0 && sessionIds.length > 0 && firstSessionId) {
		const existingCoaches = await db.query.trainingSessionCoachTable.findMany({
			where: eq(schema.trainingSessionCoachTable.sessionId, firstSessionId),
		});

		if (existingCoaches.length === 0) {
			const sessionCoaches: Array<
				typeof schema.trainingSessionCoachTable.$inferInsert
			> = [];

			for (let s = 0; s < sessionIds.length; s++) {
				const sessionId = sessionIds[s];
				if (!sessionId) continue;
				const numCoaches = Math.min(2, context.coachIds.length);

				for (let i = 0; i < numCoaches; i++) {
					const coachIndex = (s + i) % context.coachIds.length;
					const coachId = context.coachIds[coachIndex];
					if (!coachId) continue;
					sessionCoaches.push({
						id: seedUUID(ENTITY_SESSION_COACH, s * 100 + i + 1),
						sessionId,
						coachId,
						isPrimary: i === 0,
					});
				}
			}

			if (sessionCoaches.length > 0) {
				await db
					.insert(schema.trainingSessionCoachTable)
					.values(sessionCoaches)
					.onConflictDoNothing();
			}
		}
	}

	// Add attendance records for completed sessions if not already added
	// First, get all completed sessions (both existing and new)
	const allCompletedSessions = await db.query.trainingSessionTable.findMany({
		where: eq(
			schema.trainingSessionTable.organizationId,
			context.organizationId,
		),
	});

	const completedSessionsWithoutAttendance = allCompletedSessions.filter(
		(s: any) => s.status === "completed",
	);

	if (
		context.athleteIds.length > 0 &&
		completedSessionsWithoutAttendance.length > 0
	) {
		// Check which sessions already have attendance
		const sessionsWithAttendance = new Set<string>();
		for (const session of completedSessionsWithoutAttendance) {
			const existing = await db.query.attendanceTable.findFirst({
				where: eq(schema.attendanceTable.sessionId, session.id),
			});
			if (existing) {
				sessionsWithAttendance.add(session.id);
			}
		}

		const sessionsNeedingAttendance = completedSessionsWithoutAttendance.filter(
			(s: any) => !sessionsWithAttendance.has(s.id),
		);

		if (sessionsNeedingAttendance.length > 0) {
			const attendances: Array<typeof schema.attendanceTable.$inferInsert> = [];
			const attendanceStatuses = [
				"present",
				"absent",
				"late",
				"excused",
			] as const;

			for (let s = 0; s < sessionsNeedingAttendance.length; s++) {
				const session = sessionsNeedingAttendance[s];
				if (!session) continue;

				const numAthletes = Math.min(8, context.athleteIds.length);

				for (let j = 0; j < numAthletes; j++) {
					const athleteIndex = (s + j) % context.athleteIds.length;
					const athleteId = context.athleteIds[athleteIndex];
					if (!athleteId) continue;
					attendances.push({
						id: seedUUID(ENTITY_ATTENDANCE, s * 100 + j + 1),
						sessionId: session.id,
						athleteId,
						status:
							attendanceStatuses[j % attendanceStatuses.length] ?? "present",
						recordedBy: context.seedUserId,
					});
				}
			}

			if (attendances.length > 0) {
				await db
					.insert(schema.attendanceTable)
					.values(attendances)
					.onConflictDoNothing();
			}
		}
	}

	return sessionIds;
}
