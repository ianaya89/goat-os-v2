import * as p from "@clack/prompts";
import { getDb } from "../db";
import { seedAgeCategoriesAndRegistrations } from "../seeds/age-categories";
import {
	seedAthleteCareerHistory,
	seedAthleteEvaluations,
	seedAthleteFitnessTests,
	seedAthletePhysicalMetrics,
	seedAthleteSessionFeedback,
	seedAthleteWellnessSurveys,
} from "../seeds/athlete-data";
import { seedAthleteGroups } from "../seeds/athlete-groups";
import { seedAthletes } from "../seeds/athletes";
import {
	getOrCreateRootUser,
	getOrCreateSeedOrganization,
	getOrCreateSeedUser,
	ROOT_USER_EMAIL,
	SEED_ORG_SLUG,
} from "../seeds/base";
import { seedCashRegister } from "../seeds/cash-register";
import { seedCoaches } from "../seeds/coaches";
import { seedEvents } from "../seeds/events";
import { seedExpenses } from "../seeds/expenses";
import { seedLocations } from "../seeds/locations";
import { seedTrainingPayments } from "../seeds/training-payments";
import { seedTrainingSessions } from "../seeds/training-sessions";
// Seed generators
import { seedUsers } from "../seeds/users";

export const seedOptions = [
	{ value: "users", label: "Users", hint: "Additional platform users" },
	{ value: "athletes", label: "Athletes", hint: "Athlete profiles" },
	{ value: "coaches", label: "Coaches", hint: "Coach profiles" },
	{ value: "locations", label: "Locations", hint: "Training venues" },
	{
		value: "athlete-groups",
		label: "Athlete Groups",
		hint: "Team/squad groupings",
	},
	{
		value: "training-sessions",
		label: "Training Sessions",
		hint: "Sessions with attendance",
	},
	{
		value: "training-payments",
		label: "Training Payments",
		hint: "Payments for sessions",
	},
	{ value: "events", label: "Events", hint: "Campus, camps, clinics" },
	{
		value: "age-categories",
		label: "Age Categories",
		hint: "Age categories and registrations",
	},
	{
		value: "expenses",
		label: "Expenses",
		hint: "Expense categories and records",
	},
	{
		value: "cash-register",
		label: "Cash Register",
		hint: "Daily cash control and movements",
	},
	{
		value: "athlete-metrics",
		label: "Athlete Metrics",
		hint: "Physical measurements history",
	},
	{
		value: "athlete-fitness",
		label: "Athlete Fitness Tests",
		hint: "Performance tests",
	},
	{
		value: "athlete-career",
		label: "Athlete Career History",
		hint: "Previous clubs",
	},
	{
		value: "athlete-wellness",
		label: "Athlete Wellness",
		hint: "Daily wellness surveys",
	},
	{
		value: "athlete-feedback",
		label: "Athlete Feedback",
		hint: "Session RPE and satisfaction",
	},
	{
		value: "athlete-evaluations",
		label: "Athlete Evaluations",
		hint: "Coach evaluations",
	},
	{ value: "all", label: "All Tables", hint: "Seed everything" },
];

export async function runSeeds(tables: string[], count: number): Promise<void> {
	const db = getDb();
	const isAll = tables.includes("all");

	const tablesToSeed = isAll
		? seedOptions.filter((o) => o.value !== "all").map((o) => o.value)
		: tables;

	// Get or create seed organization (idempotent)
	const seedSpinner = p.spinner();
	seedSpinner.start("Setting up seed organization...");

	const seedOrg = await getOrCreateSeedOrganization(db);
	const seedUser = await getOrCreateSeedUser(db, seedOrg.id);
	const rootUser = await getOrCreateRootUser(db, seedOrg.id);

	seedSpinner.stop(`Using organization: ${seedOrg.name} (${SEED_ORG_SLUG})`);
	p.log.info(`Root user: ${ROOT_USER_EMAIL}`);

	// Track created IDs for relationships
	const context: SeedContext = {
		organizationId: seedOrg.id,
		seedUserId: seedUser.id,
		userIds: [seedUser.id, rootUser.id],
		athleteIds: [],
		coachIds: [],
		locationIds: [],
		athleteGroupIds: [],
		trainingSessionIds: [],
		trainingPaymentIds: [],
		eventIds: [],
		ageCategoryIds: [],
		expenseCategoryIds: [],
		cashRegisterIds: [],
	};

	for (const table of tablesToSeed) {
		const spinner = p.spinner();
		spinner.start(`Seeding ${table}...`);

		try {
			switch (table) {
				case "users":
					context.userIds = [
						...context.userIds,
						...(await seedUsers(db, count, context)),
					];
					break;
				case "athletes":
					context.athleteIds = await seedAthletes(db, count, context);
					break;
				case "coaches":
					context.coachIds = await seedCoaches(db, count, context);
					break;
				case "locations":
					context.locationIds = await seedLocations(db, count, context);
					break;
				case "athlete-groups":
					context.athleteGroupIds = await seedAthleteGroups(db, count, context);
					break;
				case "training-sessions":
					context.trainingSessionIds = await seedTrainingSessions(
						db,
						count,
						context,
					);
					break;
				case "training-payments":
					context.trainingPaymentIds = await seedTrainingPayments(
						db,
						count,
						context,
					);
					break;
				case "events":
					context.eventIds = await seedEvents(db, count, context);
					break;
				case "age-categories":
					context.ageCategoryIds = await seedAgeCategoriesAndRegistrations(
						db,
						count,
						context,
					);
					break;
				case "expenses":
					context.expenseCategoryIds = await seedExpenses(db, count, context);
					break;
				case "cash-register": {
					const result = await seedCashRegister(db, count, context);
					context.cashRegisterIds = result.registerIds;
					break;
				}
				case "athlete-metrics":
					await seedAthletePhysicalMetrics(db, count, context);
					break;
				case "athlete-fitness":
					await seedAthleteFitnessTests(db, count, context);
					break;
				case "athlete-career":
					await seedAthleteCareerHistory(db, count, context);
					break;
				case "athlete-wellness":
					await seedAthleteWellnessSurveys(db, count, context);
					break;
				case "athlete-feedback":
					await seedAthleteSessionFeedback(db, count, context);
					break;
				case "athlete-evaluations":
					await seedAthleteEvaluations(db, count, context);
					break;
			}
			spinner.stop(`Seeded ${table}`);
		} catch (error) {
			spinner.stop(`Failed to seed ${table}`);
			throw error;
		}
	}
}

export type SeedContext = {
	organizationId: string;
	seedUserId: string;
	userIds: string[];
	athleteIds: string[];
	coachIds: string[];
	locationIds: string[];
	athleteGroupIds: string[];
	trainingSessionIds: string[];
	trainingPaymentIds: string[];
	eventIds: string[];
	ageCategoryIds: string[];
	expenseCategoryIds: string[];
	cashRegisterIds: string[];
};
