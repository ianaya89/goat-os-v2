import { z } from "zod/v4";

// Base schema for athlete reference
export const athleteReferenceSchema = z.object({
	name: z.string().min(2, "Name is required").max(100),
	relationship: z.string().min(2, "Relationship is required").max(50),
	organization: z.string().max(100).nullish(),
	position: z.string().max(100).nullish(),
	email: z.email().nullish(),
	phone: z.string().max(20).nullish(),
	testimonial: z.string().max(500).nullish(),
	skillsHighlighted: z.array(z.string().max(50)).max(10).default([]),
	isPublic: z.boolean().default(true),
	displayOrder: z.number().int().min(0).default(0),
});

export type AthleteReferenceInput = z.infer<typeof athleteReferenceSchema>;

// Schema for creating a new reference
export const createAthleteReferenceSchema = athleteReferenceSchema;

// Schema for updating a reference
export const updateAthleteReferenceSchema = athleteReferenceSchema
	.partial()
	.extend({
		id: z.string().uuid(),
	});

// Schema for reordering references
export const reorderAthleteReferencesSchema = z.object({
	referenceIds: z.array(z.string().uuid()),
});

// Public reference output (excludes contact info unless verified)
export const publicAthleteReferenceSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	relationship: z.string(),
	organization: z.string().nullable(),
	position: z.string().nullable(),
	testimonial: z.string().nullable(),
	skillsHighlighted: z.array(z.string()),
	isVerified: z.boolean(),
});

export type PublicAthleteReference = z.infer<
	typeof publicAthleteReferenceSchema
>;
