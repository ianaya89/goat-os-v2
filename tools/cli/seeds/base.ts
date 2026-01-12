import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { schema } from "../db";

// Fixed IDs for idempotent seeding
export const SEED_ORG_SLUG = "seed-organization";
export const SEED_USER_EMAIL = "seed@goat-os.local";
export const ROOT_USER_EMAIL = "root@goat.ar";
export const ROOT_USER_PASSWORD = "Perico89";

export type SeedOrg = {
	id: string;
	name: string;
	slug: string;
};

export type SeedUser = {
	id: string;
	name: string;
	email: string;
};

/**
 * Get or create the seed organization
 * This ensures idempotent seeding - always uses the same org
 */
export async function getOrCreateSeedOrganization(db: any): Promise<SeedOrg> {
	// Check if org already exists
	const existing = await db.query.organizationTable.findFirst({
		where: eq(schema.organizationTable.slug, SEED_ORG_SLUG),
	});

	if (existing) {
		return {
			id: existing.id,
			name: existing.name,
			slug: existing.slug!,
		};
	}

	// Create new seed organization
	const id = randomUUID();
	const [org] = await db
		.insert(schema.organizationTable)
		.values({
			id,
			name: "GOAT OS Seed Organization",
			slug: SEED_ORG_SLUG,
			timezone: "America/Argentina/Buenos_Aires",
		})
		.returning();

	return {
		id: org.id,
		name: org.name,
		slug: org.slug!,
	};
}

/**
 * Get or create the seed user (owner of seed org)
 */
export async function getOrCreateSeedUser(
	db: any,
	organizationId: string,
): Promise<SeedUser> {
	// Check if user already exists
	const existing = await db.query.userTable.findFirst({
		where: eq(schema.userTable.email, SEED_USER_EMAIL),
	});

	if (existing) {
		// Ensure membership exists
		const membership = await db.query.memberTable.findFirst({
			where: eq(schema.memberTable.userId, existing.id),
		});

		if (!membership) {
			await db
				.insert(schema.memberTable)
				.values({
					id: randomUUID(),
					organizationId,
					userId: existing.id,
					role: "owner",
				})
				.onConflictDoNothing();
		}

		return {
			id: existing.id,
			name: existing.name,
			email: existing.email,
		};
	}

	// Create new seed user
	const userId = randomUUID();
	const [user] = await db
		.insert(schema.userTable)
		.values({
			id: userId,
			name: "Seed Admin",
			email: SEED_USER_EMAIL,
			emailVerified: true,
			role: "admin",
			onboardingComplete: true,
		})
		.returning();

	// Create membership as owner
	await db.insert(schema.memberTable).values({
		id: randomUUID(),
		organizationId,
		userId: user.id,
		role: "owner",
	});

	return {
		id: user.id,
		name: user.name,
		email: user.email,
	};
}

/**
 * Clear all seed data for a fresh start (optional)
 */
export async function clearSeedData(
	db: any,
	organizationId: string,
): Promise<void> {
	// Delete in reverse order of dependencies
	// Note: Most will cascade from organization delete, but we do it explicitly for safety

	// The organization cascade will handle most deletions
	await db
		.delete(schema.organizationTable)
		.where(eq(schema.organizationTable.id, organizationId));
}

/**
 * Get or create the root admin user with credentials
 * This user can log in with email/password
 */
export async function getOrCreateRootUser(
	db: any,
	organizationId: string,
): Promise<SeedUser> {
	// Check if user already exists
	const existing = await db.query.userTable.findFirst({
		where: eq(schema.userTable.email, ROOT_USER_EMAIL),
	});

	if (existing) {
		// Ensure membership exists
		const membership = await db.query.memberTable.findFirst({
			where: eq(schema.memberTable.userId, existing.id),
		});

		if (!membership) {
			await db
				.insert(schema.memberTable)
				.values({
					id: randomUUID(),
					organizationId,
					userId: existing.id,
					role: "owner",
				})
				.onConflictDoNothing();
		}

		return {
			id: existing.id,
			name: existing.name,
			email: existing.email,
		};
	}

	// Hash password using better-auth
	const { hashPassword } = await import("better-auth/crypto");
	const hashedPassword = await hashPassword(ROOT_USER_PASSWORD);

	// Create new root user
	const userId = randomUUID();
	const [user] = await db
		.insert(schema.userTable)
		.values({
			id: userId,
			name: "Root Admin",
			email: ROOT_USER_EMAIL,
			emailVerified: true,
			role: "admin",
			onboardingComplete: true,
		})
		.returning();

	// Create credential account with password
	await db.insert(schema.accountTable).values({
		id: randomUUID(),
		userId: user.id,
		accountId: user.id,
		providerId: "credential",
		password: hashedPassword,
	});

	// Create membership as owner
	await db.insert(schema.memberTable).values({
		id: randomUUID(),
		organizationId,
		userId: user.id,
		role: "owner",
	});

	return {
		id: user.id,
		name: user.name,
		email: user.email,
	};
}
