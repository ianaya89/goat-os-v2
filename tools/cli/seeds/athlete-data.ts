import { randomUUID } from "node:crypto";
import type { DrizzleClient } from "@/lib/db/types";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";

const fitnessTestTypes = [
	"sprint_40m",
	"sprint_60m",
	"vertical_jump",
	"standing_long_jump",
	"yo_yo_test",
	"beep_test",
	"agility_t_test",
	"plank_hold",
	"push_ups",
	"sit_ups",
] as const;

const fitnessTestUnits: Record<string, string> = {
	sprint_40m: "seconds",
	sprint_60m: "seconds",
	vertical_jump: "cm",
	standing_long_jump: "cm",
	yo_yo_test: "level",
	beep_test: "level",
	agility_t_test: "seconds",
	plank_hold: "seconds",
	push_ups: "reps",
	sit_ups: "reps",
};

const clubNames = [
	"Club Atlético River Plate",
	"Club Atlético Boca Juniors",
	"Club Atlético Independiente",
	"Racing Club",
	"San Lorenzo de Almagro",
	"Club Atlético Vélez Sarsfield",
	"Estudiantes de La Plata",
	"Club Atlético Lanús",
];

const positions = [
	"Arquero",
	"Defensor Central",
	"Lateral Derecho",
	"Lateral Izquierdo",
	"Mediocampista",
	"Volante",
	"Delantero",
];

function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function seedAthletePhysicalMetrics(
	db: DrizzleClient,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	if (context.athleteIds.length === 0) return [];

	const metrics: Array<typeof schema.athletePhysicalMetricsTable.$inferInsert> =
		[];
	const now = new Date();

	for (const athleteId of context.athleteIds) {
		const numMeasurements = Math.min(count, 6);
		for (let i = 0; i < numMeasurements; i++) {
			const measuredAt = addDays(now, -i * 30);

			metrics.push({
				id: randomUUID(),
				athleteId,
				measuredAt,
				height: 150 + Math.floor(Math.random() * 40) + Math.floor(i * 0.5),
				weight: 50000 + Math.floor(Math.random() * 30000) + i * 500,
				bodyFatPercentage: 100 + Math.floor(Math.random() * 100),
				muscleMass: 30000 + Math.floor(Math.random() * 20000),
				wingspan: 160 + Math.floor(Math.random() * 30),
				standingReach: 200 + Math.floor(Math.random() * 30),
				recordedBy: context.seedUserId,
			});
		}
	}

	const result = await db
		.insert(schema.athletePhysicalMetricsTable)
		.values(metrics)
		.onConflictDoNothing()
		.returning({ id: schema.athletePhysicalMetricsTable.id });
	return result.map((r: { id: string }) => r.id);
}

export async function seedAthleteFitnessTests(
	db: DrizzleClient,
	_count: number,
	context: SeedContext,
): Promise<string[]> {
	if (context.athleteIds.length === 0) return [];

	const tests: Array<typeof schema.athleteFitnessTestTable.$inferInsert> = [];
	const now = new Date();

	for (const athleteId of context.athleteIds) {
		const numTests = 3 + Math.floor(Math.random() * 3);
		const shuffledTests = [...fitnessTestTypes]
			.sort(() => 0.5 - Math.random())
			.slice(0, numTests);

		for (const testType of shuffledTests) {
			const testDate = addDays(now, -Math.floor(Math.random() * 90));

			let result: number;
			switch (testType) {
				case "sprint_40m":
					result = 50 + Math.floor(Math.random() * 20);
					break;
				case "sprint_60m":
					result = 75 + Math.floor(Math.random() * 25);
					break;
				case "vertical_jump":
					result = 30 + Math.floor(Math.random() * 40);
					break;
				case "standing_long_jump":
					result = 180 + Math.floor(Math.random() * 80);
					break;
				case "yo_yo_test":
					result = 140 + Math.floor(Math.random() * 60);
					break;
				case "beep_test":
					result = 80 + Math.floor(Math.random() * 50);
					break;
				case "agility_t_test":
					result = 90 + Math.floor(Math.random() * 30);
					break;
				case "plank_hold":
					result = 60 + Math.floor(Math.random() * 120);
					break;
				case "push_ups":
					result = 20 + Math.floor(Math.random() * 40);
					break;
				case "sit_ups":
					result = 25 + Math.floor(Math.random() * 35);
					break;
				default:
					result = 100;
			}

			tests.push({
				id: randomUUID(),
				athleteId,
				testDate,
				testType,
				result,
				unit: fitnessTestUnits[testType] ?? "units",
				evaluatedBy: context.seedUserId,
			});
		}
	}

	const resultData = await db
		.insert(schema.athleteFitnessTestTable)
		.values(tests)
		.onConflictDoNothing()
		.returning({ id: schema.athleteFitnessTestTable.id });
	return resultData.map((r: { id: string }) => r.id);
}

export async function seedAthleteCareerHistory(
	db: DrizzleClient,
	_count: number,
	context: SeedContext,
): Promise<string[]> {
	if (context.athleteIds.length === 0) return [];

	const history: Array<typeof schema.athleteCareerHistoryTable.$inferInsert> =
		[];
	const now = new Date();

	for (const athleteId of context.athleteIds) {
		if (Math.random() > 0.5) {
			const numClubs = 1 + Math.floor(Math.random() * 3);

			for (let i = 0; i < numClubs; i++) {
				const yearsAgo = (i + 1) * 2 + Math.floor(Math.random() * 2);
				const startDate = addDays(now, -yearsAgo * 365);
				const endDate = addDays(
					startDate,
					(1 + Math.floor(Math.random() * 2)) * 365,
				);

				history.push({
					id: randomUUID(),
					athleteId,
					clubName:
						clubNames[Math.floor(Math.random() * clubNames.length)] ?? "Club",
					startDate,
					endDate,
					position:
						positions[Math.floor(Math.random() * positions.length)] ?? "N/A",
					achievements:
						Math.random() > 0.7
							? "Campeón juvenil, Mejor jugador del torneo"
							: null,
					wasNationalTeam: Math.random() > 0.85,
					nationalTeamLevel: Math.random() > 0.85 ? "Sub-17" : null,
				});
			}
		}
	}

	if (history.length === 0) return [];

	const result = await db
		.insert(schema.athleteCareerHistoryTable)
		.values(history)
		.onConflictDoNothing()
		.returning({ id: schema.athleteCareerHistoryTable.id });
	return result.map((r: { id: string }) => r.id);
}

export async function seedAthleteWellnessSurveys(
	db: DrizzleClient,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	if (context.athleteIds.length === 0) return [];

	const surveys: Array<typeof schema.athleteWellnessSurveyTable.$inferInsert> =
		[];
	const now = new Date();
	const daysOfSurveys = Math.min(count, 14);

	for (let day = 0; day < daysOfSurveys; day++) {
		const surveyDate = addDays(now, -day);

		for (const athleteId of context.athleteIds) {
			if (Math.random() > 0.3) {
				surveys.push({
					id: randomUUID(),
					athleteId,
					organizationId: context.organizationId,
					surveyDate,
					sleepHours: 300 + Math.floor(Math.random() * 240),
					sleepQuality: 4 + Math.floor(Math.random() * 6),
					fatigue: 2 + Math.floor(Math.random() * 6),
					muscleSoreness: 1 + Math.floor(Math.random() * 6),
					energy: 4 + Math.floor(Math.random() * 5),
					mood: 5 + Math.floor(Math.random() * 4),
					stressLevel: 2 + Math.floor(Math.random() * 5),
				});
			}
		}
	}

	if (surveys.length === 0) return [];

	const result = await db
		.insert(schema.athleteWellnessSurveyTable)
		.values(surveys)
		.onConflictDoNothing()
		.returning({ id: schema.athleteWellnessSurveyTable.id });
	return result.map((r: { id: string }) => r.id);
}

export async function seedAthleteSessionFeedback(
	db: DrizzleClient,
	_count: number,
	context: SeedContext,
): Promise<string[]> {
	if (
		context.athleteIds.length === 0 ||
		context.trainingSessionIds.length === 0
	)
		return [];

	const feedbacks: Array<
		typeof schema.athleteSessionFeedbackTable.$inferInsert
	> = [];

	for (const sessionId of context.trainingSessionIds) {
		const numFeedbacks = 3 + Math.floor(Math.random() * 4);
		const shuffledAthletes = [...context.athleteIds]
			.sort(() => 0.5 - Math.random())
			.slice(0, numFeedbacks);

		for (const athleteId of shuffledAthletes) {
			if (Math.random() > 0.2) {
				feedbacks.push({
					id: randomUUID(),
					sessionId,
					athleteId,
					rpeRating: 4 + Math.floor(Math.random() * 5),
					satisfactionRating: 5 + Math.floor(Math.random() * 4),
					notes:
						Math.random() > 0.7 ? "Buen entrenamiento, me sentí bien" : null,
				});
			}
		}
	}

	if (feedbacks.length === 0) return [];

	const result = await db
		.insert(schema.athleteSessionFeedbackTable)
		.values(feedbacks)
		.onConflictDoNothing()
		.returning({ id: schema.athleteSessionFeedbackTable.id });
	return result.map((r: { id: string }) => r.id);
}

export async function seedAthleteEvaluations(
	db: DrizzleClient,
	_count: number,
	context: SeedContext,
): Promise<string[]> {
	if (
		context.athleteIds.length === 0 ||
		context.trainingSessionIds.length === 0
	)
		return [];

	const evaluations: Array<typeof schema.athleteEvaluationTable.$inferInsert> =
		[];

	for (const sessionId of context.trainingSessionIds) {
		const numEvaluations = 2 + Math.floor(Math.random() * 3);
		const shuffledAthletes = [...context.athleteIds]
			.sort(() => 0.5 - Math.random())
			.slice(0, numEvaluations);

		for (const athleteId of shuffledAthletes) {
			evaluations.push({
				id: randomUUID(),
				sessionId,
				athleteId,
				performanceRating: 2 + Math.floor(Math.random() * 4),
				attitudeRating: 3 + Math.floor(Math.random() * 3),
				physicalFitnessRating: 2 + Math.floor(Math.random() * 4),
				performanceNotes: Math.random() > 0.6 ? "Buen desempeño técnico" : null,
				attitudeNotes: Math.random() > 0.7 ? "Muy comprometido" : null,
				generalNotes: Math.random() > 0.8 ? "Sigue mejorando" : null,
				evaluatedBy: context.seedUserId,
			});
		}
	}

	if (evaluations.length === 0) return [];

	const result = await db
		.insert(schema.athleteEvaluationTable)
		.values(evaluations)
		.onConflictDoNothing()
		.returning({ id: schema.athleteEvaluationTable.id });
	return result.map((r: { id: string }) => r.id);
}
