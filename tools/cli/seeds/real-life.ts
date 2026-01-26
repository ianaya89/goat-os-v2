import * as p from "@clack/prompts";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import {
	REAL_LIFE_ATHLETE_COUNT,
	REAL_LIFE_ATHLETES,
} from "./real-life-athletes";
import { seedRealLifePayments } from "./real-life-payments";
import { seedRealLifeSessions } from "./real-life-sessions";

// Fixed constants for idempotent seeding
const REAL_LIFE_ORG_SLUG = "goat-sports";
const REAL_LIFE_ORG_NAME = "GOAT Sports";
const REAL_LIFE_USER_EMAIL = "nacho@goat.ar";
const REAL_LIFE_USER_PASSWORD = "Perico89";

// Root user (existing user that should have access to org)
const ROOT_USER_EMAIL = "root@goat.ar";

// Deterministic UUIDs for real-life entities (using prefix 200 to avoid conflicts)
const REAL_LIFE_ORG_ID = "20000000-0000-4000-8000-000000000001";
const REAL_LIFE_USER_ID = "20000000-0000-4000-8000-000000000002";
const REAL_LIFE_MEMBER_ID = "20000000-0000-4000-8000-000000000003";
const REAL_LIFE_ACCOUNT_ID = "20000000-0000-4000-8000-000000000004";
const ROOT_MEMBER_ID = "20000000-0000-4000-8000-000000000005";

// Locations
const LOCATION_CAMPO_VERDE_ID = "20000000-0000-4000-8000-000000000010";
const LOCATION_CAMPO_AZUL_ID = "20000000-0000-4000-8000-000000000011";

// Coaches (user, member, coach)
const COACH_PILAR_USER_ID = "20000000-0000-4000-8000-000000000020";
const COACH_PILAR_MEMBER_ID = "20000000-0000-4000-8000-000000000021";
const COACH_PILAR_ID = "20000000-0000-4000-8000-000000000022";

const COACH_SANTI_USER_ID = "20000000-0000-4000-8000-000000000030";
const COACH_SANTI_MEMBER_ID = "20000000-0000-4000-8000-000000000031";
const COACH_SANTI_ID = "20000000-0000-4000-8000-000000000032";

const COACH_IGNACIO_USER_ID = "20000000-0000-4000-8000-000000000040";
const COACH_IGNACIO_MEMBER_ID = "20000000-0000-4000-8000-000000000041";
const COACH_IGNACIO_ID = "20000000-0000-4000-8000-000000000042";

// Additional coaches from calendar
// RS = Manuel Saman
const COACH_MANUEL_USER_ID = "20000000-0000-4000-8000-000000000050";
const COACH_MANUEL_MEMBER_ID = "20000000-0000-4000-8000-000000000051";
const COACH_MANUEL_ID = "20000000-0000-4000-8000-000000000052";

// SA = Sasha London
const COACH_SASHA_USER_ID = "20000000-0000-4000-8000-000000000060";
const COACH_SASHA_MEMBER_ID = "20000000-0000-4000-8000-000000000061";
const COACH_SASHA_ID = "20000000-0000-4000-8000-000000000062";

// TS = Santiago Tarazona
const COACH_SANTIAGO_USER_ID = "20000000-0000-4000-8000-000000000070";
const COACH_SANTIAGO_MEMBER_ID = "20000000-0000-4000-8000-000000000071";
const COACH_SANTIAGO_ID = "20000000-0000-4000-8000-000000000072";

// Tomas Suarez (SM - shares with Santi)
const COACH_TOMAS_USER_ID = "20000000-0000-4000-8000-000000000080";
const COACH_TOMAS_MEMBER_ID = "20000000-0000-4000-8000-000000000081";
const COACH_TOMAS_ID = "20000000-0000-4000-8000-000000000082";

// Athlete UUID prefix (300xxxxx to avoid conflicts)
const ATHLETE_UUID_PREFIX = "30000000-0000-4000-8000";
const ATHLETE_USER_UUID_PREFIX = "31000000-0000-4000-8000";
const ATHLETE_MEMBER_UUID_PREFIX = "32000000-0000-4000-8000";

// Fixed athlete data
const ATHLETE_PASSWORD = "Goat2025";
const ATHLETE_BIRTH_DATE = new Date(2012, 0, 1); // January 1, 2012 (all athletes ~13 years old)
const ATHLETE_LEVEL = "intermediate" as const;
const ATHLETE_SPORT = "Hockey";

// Coach password
const COACH_PASSWORD = "Goat2025";

// Coach account IDs
const COACH_PILAR_ACCOUNT_ID = "20000000-0000-4000-8000-000000000023";
const COACH_SANTI_ACCOUNT_ID = "20000000-0000-4000-8000-000000000033";
const COACH_IGNACIO_ACCOUNT_ID = "20000000-0000-4000-8000-000000000043";
const COACH_MANUEL_ACCOUNT_ID = "20000000-0000-4000-8000-000000000053";
const COACH_SASHA_ACCOUNT_ID = "20000000-0000-4000-8000-000000000063";
const COACH_SANTIAGO_ACCOUNT_ID = "20000000-0000-4000-8000-000000000073";
const COACH_TOMAS_ACCOUNT_ID = "20000000-0000-4000-8000-000000000083";

// Athlete Groups
const GROUP_PRETEMPORADA_ID = "20000000-0000-4000-8000-000000000100";
const GROUP_SUB10_ID = "20000000-0000-4000-8000-000000000101";

// Age Categories
const AGE_CATEGORY_SUB10_ID = "20000000-0000-4000-8000-000000000110";
const AGE_CATEGORY_SUB12_ID = "20000000-0000-4000-8000-000000000111";
const AGE_CATEGORY_SUB14_ID = "20000000-0000-4000-8000-000000000112";
const AGE_CATEGORY_SUB16_ID = "20000000-0000-4000-8000-000000000113";
const AGE_CATEGORY_SUB18_ID = "20000000-0000-4000-8000-000000000114";

// Events
const EVENT_CAMPUS_VERANO_ID = "20000000-0000-4000-8000-000000000120";

interface RealLifeCoach {
	firstName: string;
	lastName: string;
	email: string;
	userId: string;
	memberId: string;
	coachId: string;
	accountId: string;
	specialty: string;
	bio: string;
}

const COACHES: RealLifeCoach[] = [
	{
		firstName: "Pilar",
		lastName: "Palacios",
		email: "pilar.palacios@goat.ar",
		userId: COACH_PILAR_USER_ID,
		memberId: COACH_PILAR_MEMBER_ID,
		coachId: COACH_PILAR_ID,
		accountId: COACH_PILAR_ACCOUNT_ID,
		specialty: "Técnica Individual",
		bio: "Entrenadora especializada en desarrollo técnico y formación de juveniles.",
	},
	{
		firstName: "Santi",
		lastName: "Maceratezi",
		email: "santi.maceratezi@goat.ar",
		userId: COACH_SANTI_USER_ID,
		memberId: COACH_SANTI_MEMBER_ID,
		coachId: COACH_SANTI_ID,
		accountId: COACH_SANTI_ACCOUNT_ID,
		specialty: "Preparación Física",
		bio: "Preparador físico con amplia experiencia en alto rendimiento deportivo.",
	},
	{
		firstName: "Ignacio",
		lastName: "Pacheco",
		email: "ignacio.pacheco@goat.ar",
		userId: COACH_IGNACIO_USER_ID,
		memberId: COACH_IGNACIO_MEMBER_ID,
		coachId: COACH_IGNACIO_ID,
		accountId: COACH_IGNACIO_ACCOUNT_ID,
		specialty: "Táctica Grupal",
		bio: "Entrenador táctico con enfoque en estrategia y trabajo en equipo.",
	},
	{
		firstName: "Manuel",
		lastName: "Saman",
		email: "manuel.saman@goat.ar",
		userId: COACH_MANUEL_USER_ID,
		memberId: COACH_MANUEL_MEMBER_ID,
		coachId: COACH_MANUEL_ID,
		accountId: COACH_MANUEL_ACCOUNT_ID,
		specialty: "Técnica de Arrastre",
		bio: "Especialista en técnica de arrastre y control de pelota.",
	},
	{
		firstName: "Sasha",
		lastName: "London",
		email: "sasha.london@goat.ar",
		userId: COACH_SASHA_USER_ID,
		memberId: COACH_SASHA_MEMBER_ID,
		coachId: COACH_SASHA_ID,
		accountId: COACH_SASHA_ACCOUNT_ID,
		specialty: "Desarrollo Juvenil",
		bio: "Entrenadora enfocada en el desarrollo integral de atletas juveniles.",
	},
	{
		firstName: "Santiago",
		lastName: "Tarazona",
		email: "santiago.tarazona@goat.ar",
		userId: COACH_SANTIAGO_USER_ID,
		memberId: COACH_SANTIAGO_MEMBER_ID,
		coachId: COACH_SANTIAGO_ID,
		accountId: COACH_SANTIAGO_ACCOUNT_ID,
		specialty: "Técnica de Arrastre",
		bio: "Experto en técnicas de arrastre y movimientos especializados.",
	},
	{
		firstName: "Tomas",
		lastName: "Suarez",
		email: "tomas.suarez@goat.ar",
		userId: COACH_TOMAS_USER_ID,
		memberId: COACH_TOMAS_MEMBER_ID,
		coachId: COACH_TOMAS_ID,
		accountId: COACH_TOMAS_ACCOUNT_ID,
		specialty: "Preparación Física",
		bio: "Preparador físico especializado en resistencia y potencia.",
	},
];

interface RealLifeLocation {
	id: string;
	name: string;
	address: string;
	city: string;
	state: string;
	capacity: number;
}

const LOCATIONS: RealLifeLocation[] = [
	{
		id: LOCATION_CAMPO_VERDE_ID,
		name: "Campo Verde",
		address: "Av. del Libertador 1500",
		city: "Buenos Aires",
		state: "Buenos Aires",
		capacity: 50,
	},
	{
		id: LOCATION_CAMPO_AZUL_ID,
		name: "Campo Azul",
		address: "Calle San Martín 800",
		city: "Buenos Aires",
		state: "Buenos Aires",
		capacity: 40,
	},
];

interface RealLifeGroup {
	id: string;
	name: string;
	description: string;
	maxCapacity?: number;
}

const GROUPS: RealLifeGroup[] = [
	{
		id: GROUP_PRETEMPORADA_ID,
		name: "Pretemporada Hockey 2026",
		description:
			"Grupo de preparación física y técnica para la temporada 2026 de hockey.",
		maxCapacity: 50,
	},
	{
		id: GROUP_SUB10_ID,
		name: "Sub 10 Hockey",
		description:
			"Categoría Sub 10 de hockey - Jugadores nacidos en 2016 o después.",
		maxCapacity: 25,
	},
];

interface RealLifeAgeCategory {
	id: string;
	name: string;
	displayName: string;
	birthYearFrom: number; // Oldest birth year in category
	birthYearTo: number; // Youngest birth year in category
	sortOrder: number;
}

// Age categories based on birth year (2 years per category)
// In 2026: Sub 10 = 10 years old or younger = born 2016+
const AGE_CATEGORIES: RealLifeAgeCategory[] = [
	{
		id: AGE_CATEGORY_SUB10_ID,
		name: "Sub 10",
		displayName: "Sub 10 (2016-2015)",
		birthYearFrom: 2015,
		birthYearTo: 2016,
		sortOrder: 1,
	},
	{
		id: AGE_CATEGORY_SUB12_ID,
		name: "Sub 12",
		displayName: "Sub 12 (2014-2013)",
		birthYearFrom: 2013,
		birthYearTo: 2014,
		sortOrder: 2,
	},
	{
		id: AGE_CATEGORY_SUB14_ID,
		name: "Sub 14",
		displayName: "Sub 14 (2012-2011)",
		birthYearFrom: 2011,
		birthYearTo: 2012,
		sortOrder: 3,
	},
	{
		id: AGE_CATEGORY_SUB16_ID,
		name: "Sub 16",
		displayName: "Sub 16 (2010-2009)",
		birthYearFrom: 2009,
		birthYearTo: 2010,
		sortOrder: 4,
	},
	{
		id: AGE_CATEGORY_SUB18_ID,
		name: "Sub 18",
		displayName: "Sub 18 (2008-2007)",
		birthYearFrom: 2007,
		birthYearTo: 2008,
		sortOrder: 5,
	},
];

interface RealLifeEvent {
	id: string;
	title: string;
	slug: string;
	description: string;
	eventType:
		| "campus"
		| "camp"
		| "clinic"
		| "showcase"
		| "tournament"
		| "tryout"
		| "other";
	status:
		| "draft"
		| "published"
		| "registration_open"
		| "registration_closed"
		| "in_progress"
		| "completed"
		| "cancelled";
	startDate: Date;
	endDate: Date;
	registrationOpenDate: Date;
	registrationCloseDate: Date;
	locationId: string;
	maxCapacity: number;
	venueDetails?: string;
}

const EVENTS: RealLifeEvent[] = [
	{
		id: EVENT_CAMPUS_VERANO_ID,
		title: "Campus Verano 2026",
		slug: "campus-verano-2026",
		description:
			"Campus de verano de hockey GOAT Academy. Entrenamiento intensivo durante enero con los mejores coaches. Incluye preparación física, técnica individual, táctica grupal y partidos amistosos.",
		eventType: "campus",
		status: "registration_open",
		startDate: new Date(2026, 0, 6), // January 6, 2026
		endDate: new Date(2026, 0, 31), // January 31, 2026
		registrationOpenDate: new Date(2025, 10, 1), // November 1, 2025
		registrationCloseDate: new Date(2026, 0, 3), // January 3, 2026
		locationId: LOCATION_CAMPO_VERDE_ID,
		maxCapacity: 100,
		venueDetails:
			"Campo Verde - Canchas 1 y 2. Vestuarios disponibles. Cantina con servicio de almuerzo.",
	},
];

// Generate deterministic UUIDs for athlete entities
function athleteUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${ATHLETE_UUID_PREFIX}-${indexHex}`;
}

function athleteUserUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${ATHLETE_USER_UUID_PREFIX}-${indexHex}`;
}

function athleteMemberUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${ATHLETE_MEMBER_UUID_PREFIX}-${indexHex}`;
}

// Generate email from athlete name (normalized)
function generateAthleteEmail(
	firstName: string,
	lastName: string,
	index: number,
): string {
	const normalizedFirst = firstName
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // Remove accents
		.replace(/[^a-z]/g, "");
	const normalizedLast = lastName
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z]/g, "");

	if (normalizedLast) {
		return `${normalizedFirst}.${normalizedLast}@goat-academy.local`;
	}
	return `${normalizedFirst}${index}@goat-academy.local`;
}

/**
 * Run the "real-life" seed with fixed data for GOAT Sports organization
 * This seed is fully idempotent - safe to run multiple times
 */
export async function runRealLifeSeed(): Promise<void> {
	const db = getDb();

	// 1. Create or get organization
	const orgSpinner = p.spinner();
	orgSpinner.start("Setting up GOAT Sports organization...");

	const existingOrg = await db.query.organizationTable.findFirst({
		where: eq(schema.organizationTable.slug, REAL_LIFE_ORG_SLUG),
	});

	let organizationId: string;

	if (existingOrg) {
		organizationId = existingOrg.id;
		orgSpinner.stop(`Organization exists: ${existingOrg.name}`);
	} else {
		await db.insert(schema.organizationTable).values({
			id: REAL_LIFE_ORG_ID,
			name: REAL_LIFE_ORG_NAME,
			slug: REAL_LIFE_ORG_SLUG,
			timezone: "America/Argentina/Buenos_Aires",
		});
		organizationId = REAL_LIFE_ORG_ID;
		orgSpinner.stop(`Created organization: ${REAL_LIFE_ORG_NAME}`);
	}

	// 2. Create or get user nacho@goat.ar
	const userSpinner = p.spinner();
	userSpinner.start("Setting up user nacho@goat.ar...");

	const existingUser = await db.query.userTable.findFirst({
		where: eq(schema.userTable.email, REAL_LIFE_USER_EMAIL),
	});

	let userId: string;

	if (existingUser) {
		userId = existingUser.id;
		userSpinner.stop(`User exists: ${existingUser.email}`);
	} else {
		// Hash password
		const { hashPassword } = await import("better-auth/crypto");
		const hashedPassword = await hashPassword(REAL_LIFE_USER_PASSWORD);

		await db.insert(schema.userTable).values({
			id: REAL_LIFE_USER_ID,
			name: "Nacho",
			email: REAL_LIFE_USER_EMAIL,
			emailVerified: true,
			role: "admin",
			onboardingComplete: true,
		});

		// Create credential account
		await db.insert(schema.accountTable).values({
			id: REAL_LIFE_ACCOUNT_ID,
			userId: REAL_LIFE_USER_ID,
			accountId: REAL_LIFE_USER_ID,
			providerId: "credential",
			password: hashedPassword,
		});

		userId = REAL_LIFE_USER_ID;
		userSpinner.stop(`Created user: ${REAL_LIFE_USER_EMAIL}`);
	}

	// 3. Ensure nacho@goat.ar is member of organization (owner role)
	const memberSpinner = p.spinner();
	memberSpinner.start("Setting up nacho@goat.ar membership...");

	const existingMembership = await db.query.memberTable.findFirst({
		where: and(
			eq(schema.memberTable.userId, userId),
			eq(schema.memberTable.organizationId, organizationId),
		),
	});

	if (!existingMembership) {
		await db.insert(schema.memberTable).values({
			id: REAL_LIFE_MEMBER_ID,
			organizationId,
			userId,
			role: "owner",
		});
		memberSpinner.stop("Created owner membership for nacho@goat.ar");
	} else {
		memberSpinner.stop("Membership exists for nacho@goat.ar");
	}

	// 4. Add root@goat.ar to organization if exists
	const rootSpinner = p.spinner();
	rootSpinner.start("Setting up root@goat.ar membership...");

	const rootUser = await db.query.userTable.findFirst({
		where: eq(schema.userTable.email, ROOT_USER_EMAIL),
	});

	if (rootUser) {
		const existingRootMembership = await db.query.memberTable.findFirst({
			where: and(
				eq(schema.memberTable.userId, rootUser.id),
				eq(schema.memberTable.organizationId, organizationId),
			),
		});

		if (!existingRootMembership) {
			await db.insert(schema.memberTable).values({
				id: ROOT_MEMBER_ID,
				organizationId,
				userId: rootUser.id,
				role: "owner",
			});
			rootSpinner.stop("Created owner membership for root@goat.ar");
		} else {
			rootSpinner.stop("Membership exists for root@goat.ar");
		}
	} else {
		rootSpinner.stop("User root@goat.ar not found - skipping membership");
	}

	// 5. Create locations
	const locSpinner = p.spinner();
	locSpinner.start("Setting up locations...");

	let locationsCreated = 0;
	for (const loc of LOCATIONS) {
		const existingLoc = await db.query.locationTable.findFirst({
			where: and(
				eq(schema.locationTable.organizationId, organizationId),
				eq(schema.locationTable.name, loc.name),
			),
		});

		if (!existingLoc) {
			await db
				.insert(schema.locationTable)
				.values({
					id: loc.id,
					organizationId,
					name: loc.name,
					address: loc.address,
					city: loc.city,
					state: loc.state,
					country: "Argentina",
					postalCode: "1000",
					capacity: loc.capacity,
					isActive: true,
				})
				.onConflictDoNothing();
			locationsCreated++;
		}
	}

	locSpinner.stop(
		locationsCreated > 0
			? `Created ${locationsCreated} location(s)`
			: "Locations already exist",
	);

	// 6. Create athlete groups (check by name + org to be resilient)
	const groupSpinner = p.spinner();
	groupSpinner.start("Setting up athlete groups...");

	let groupsCreated = 0;
	for (const group of GROUPS) {
		const existingGroup = await db.query.athleteGroupTable.findFirst({
			where: and(
				eq(schema.athleteGroupTable.organizationId, organizationId),
				eq(schema.athleteGroupTable.name, group.name),
			),
		});

		if (!existingGroup) {
			await db
				.insert(schema.athleteGroupTable)
				.values({
					id: group.id,
					organizationId,
					name: group.name,
					description: group.description,
					maxCapacity: group.maxCapacity,
					isActive: true,
				})
				.onConflictDoNothing();
			groupsCreated++;
		}
	}

	groupSpinner.stop(
		groupsCreated > 0
			? `Created ${groupsCreated} athlete group(s)`
			: "Athlete groups already exist",
	);

	// 7. Create age categories (check by name + org to be resilient)
	const ageCatSpinner = p.spinner();
	ageCatSpinner.start("Setting up age categories...");

	let ageCategoriesCreated = 0;
	for (const cat of AGE_CATEGORIES) {
		const existingCat = await db.query.ageCategoryTable.findFirst({
			where: and(
				eq(schema.ageCategoryTable.organizationId, organizationId),
				eq(schema.ageCategoryTable.name, cat.name),
			),
		});

		if (!existingCat) {
			await db
				.insert(schema.ageCategoryTable)
				.values({
					id: cat.id,
					organizationId,
					name: cat.name,
					displayName: cat.displayName,
					minBirthYear: cat.birthYearFrom,
					maxBirthYear: cat.birthYearTo,
					sortOrder: cat.sortOrder,
					isActive: true,
				})
				.onConflictDoNothing();
			ageCategoriesCreated++;
		}
	}

	ageCatSpinner.stop(
		ageCategoriesCreated > 0
			? `Created ${ageCategoriesCreated} age category(ies)`
			: "Age categories already exist",
	);

	// 8. Create events (check by slug + org to be resilient)
	const eventSpinner = p.spinner();
	eventSpinner.start("Setting up events...");

	let eventsCreated = 0;
	for (const event of EVENTS) {
		const existingEvent = await db.query.sportsEventTable.findFirst({
			where: and(
				eq(schema.sportsEventTable.organizationId, organizationId),
				eq(schema.sportsEventTable.slug, event.slug),
			),
		});

		if (!existingEvent) {
			await db
				.insert(schema.sportsEventTable)
				.values({
					id: event.id,
					organizationId,
					title: event.title,
					slug: event.slug,
					description: event.description,
					eventType: event.eventType,
					status: event.status,
					startDate: event.startDate,
					endDate: event.endDate,
					registrationOpenDate: event.registrationOpenDate,
					registrationCloseDate: event.registrationCloseDate,
					locationId: event.locationId,
					maxCapacity: event.maxCapacity,
					venueDetails: event.venueDetails,
					enableWaitlist: true,
					allowPublicRegistration: true,
				})
				.onConflictDoNothing();
			eventsCreated++;
		}
	}

	eventSpinner.stop(
		eventsCreated > 0
			? `Created ${eventsCreated} event(s)`
			: "Events already exist",
	);

	// 9. Create coaches with user accounts (check by email to be resilient)
	const coachSpinner = p.spinner();
	coachSpinner.start("Setting up coaches with user accounts...");

	// Hash password once for all coaches
	const { hashPassword } = await import("better-auth/crypto");
	const coachHashedPassword = await hashPassword(COACH_PASSWORD);

	let coachesCreated = 0;
	for (const coach of COACHES) {
		// Check if user exists by email (more resilient than ID)
		const existingCoachUser = await db.query.userTable.findFirst({
			where: eq(schema.userTable.email, coach.email),
		});

		let coachUserId = coach.userId;

		if (!existingCoachUser) {
			// Create user for coach
			await db
				.insert(schema.userTable)
				.values({
					id: coach.userId,
					name: `${coach.firstName} ${coach.lastName}`,
					email: coach.email,
					emailVerified: true,
					role: "user",
					onboardingComplete: true,
				})
				.onConflictDoNothing();

			// Create credential account for login
			await db
				.insert(schema.accountTable)
				.values({
					id: coach.accountId,
					userId: coach.userId,
					accountId: coach.userId,
					providerId: "credential",
					password: coachHashedPassword,
				})
				.onConflictDoNothing();
		} else {
			coachUserId = existingCoachUser.id;
		}

		// Check if coach already exists for this user in this org
		const existingCoach = await db.query.coachTable.findFirst({
			where: and(
				eq(schema.coachTable.organizationId, organizationId),
				eq(schema.coachTable.userId, coachUserId),
			),
		});

		if (existingCoach) {
			continue;
		}

		// Check if membership exists
		const existingCoachMembership = await db.query.memberTable.findFirst({
			where: and(
				eq(schema.memberTable.userId, coachUserId),
				eq(schema.memberTable.organizationId, organizationId),
			),
		});

		if (!existingCoachMembership) {
			await db
				.insert(schema.memberTable)
				.values({
					id: coach.memberId,
					organizationId,
					userId: coachUserId,
					role: "staff",
				})
				.onConflictDoNothing();
		}

		// Create coach record
		await db
			.insert(schema.coachTable)
			.values({
				id: coach.coachId,
				organizationId,
				userId: coachUserId,
				specialty: coach.specialty,
				bio: coach.bio,
				status: "active",
			})
			.onConflictDoNothing();

		coachesCreated++;
	}

	coachSpinner.stop(
		coachesCreated > 0
			? `Created ${coachesCreated} coach(es) with user accounts`
			: "Coaches already exist",
	);

	// 10. Create athletes with user accounts (check by email to be resilient)
	const athleteSpinner = p.spinner();
	athleteSpinner.start(
		`Setting up ${REAL_LIFE_ATHLETE_COUNT} athletes with user accounts...`,
	);

	// Hash password for all athletes (reuse hashPassword from above)
	const athleteHashedPassword = await hashPassword(ATHLETE_PASSWORD);

	let athletesCreated = 0;

	for (let i = 0; i < REAL_LIFE_ATHLETES.length; i++) {
		const athlete = REAL_LIFE_ATHLETES[i];
		if (!athlete) continue;

		const athleteId = athleteUUID(i + 1);
		const athleteUserId = athleteUserUUID(i + 1);
		const athleteMemberId = athleteMemberUUID(i + 1);

		const fullName = athlete.lastName
			? `${athlete.firstName} ${athlete.lastName}`
			: athlete.firstName;

		const email = generateAthleteEmail(
			athlete.firstName,
			athlete.lastName,
			i + 1,
		);

		// Check if user with this email already exists
		const existingUser = await db.query.userTable.findFirst({
			where: eq(schema.userTable.email, email),
		});

		let userId = athleteUserId;

		if (!existingUser) {
			// Create user for athlete
			await db
				.insert(schema.userTable)
				.values({
					id: athleteUserId,
					name: fullName,
					email,
					emailVerified: true,
					role: "user",
					onboardingComplete: true,
				})
				.onConflictDoNothing();

			// Create credential account
			await db
				.insert(schema.accountTable)
				.values({
					id: `33000000-0000-4000-8000-${(i + 1).toString(16).padStart(12, "0")}`,
					userId: athleteUserId,
					accountId: athleteUserId,
					providerId: "credential",
					password: athleteHashedPassword,
				})
				.onConflictDoNothing();
		} else {
			userId = existingUser.id;
		}

		// Check if athlete already exists for this user in this org
		const existingAthlete = await db.query.athleteTable.findFirst({
			where: and(
				eq(schema.athleteTable.organizationId, organizationId),
				eq(schema.athleteTable.userId, userId),
			),
		});

		if (existingAthlete) {
			continue;
		}

		// Check if membership exists
		const existingMembership = await db.query.memberTable.findFirst({
			where: and(
				eq(schema.memberTable.userId, userId),
				eq(schema.memberTable.organizationId, organizationId),
			),
		});

		if (!existingMembership) {
			// Create member record
			await db
				.insert(schema.memberTable)
				.values({
					id: athleteMemberId,
					organizationId,
					userId,
					role: "member",
				})
				.onConflictDoNothing();
		}

		// Create athlete linked to user
		await db
			.insert(schema.athleteTable)
			.values({
				id: athleteId,
				organizationId,
				userId, // Link to user account
				sport: ATHLETE_SPORT,
				birthDate: ATHLETE_BIRTH_DATE,
				level: ATHLETE_LEVEL,
				status: "active",
				nationality: "Argentina",
			})
			.onConflictDoNothing();

		athletesCreated++;
	}

	athleteSpinner.stop(
		athletesCreated > 0
			? `Created ${athletesCreated} athlete(s) with user accounts`
			: "Athletes already exist",
	);

	// 11. Create training sessions from calendar
	await seedRealLifeSessions();

	// 12. Create hockey personalizado payments
	await seedRealLifePayments();

	// Summary
	p.note(
		`Organization: ${REAL_LIFE_ORG_NAME} (${REAL_LIFE_ORG_SLUG})
User: ${REAL_LIFE_USER_EMAIL} (password: ${REAL_LIFE_USER_PASSWORD})
Root user: ${ROOT_USER_EMAIL} (added to org if exists)
Locations: Campo Verde, Campo Azul
Groups: Pretemporada Hockey 2026, Sub 10 Hockey
Age Categories: Sub 10, Sub 12, Sub 14, Sub 16, Sub 18
Events: Campus Verano 2026
Coaches: Pilar, Santi, Ignacio, Manuel, Sasha, Santiago, Tomas (password: ${COACH_PASSWORD})
Athletes: ${REAL_LIFE_ATHLETE_COUNT} GOAT Academy athletes (password: ${ATHLETE_PASSWORD})
Training Sessions: January 2026 calendar sessions
Payments: Hockey Personalizado (Enero 2026)`,
		"Real-Life Seed Summary",
	);
}
