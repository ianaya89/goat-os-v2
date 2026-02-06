import { z } from "zod/v4";

// List signup links for the organization
export const listAthleteSignupLinksSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});

// Create a new signup link
export const createAthleteSignupLinkSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(200, "Name is too long"),
	athleteGroupId: z.string().uuid().optional().nullable(),
	isActive: z.boolean().default(true),
});

// Update an existing signup link
export const updateAthleteSignupLinkSchema = z.object({
	id: z.string().uuid(),
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(200, "Name is too long")
		.optional(),
	isActive: z.boolean().optional(),
	athleteGroupId: z.string().uuid().optional().nullable(),
});

// Delete a signup link
export const deleteAthleteSignupLinkSchema = z.object({
	id: z.string().uuid(),
});

// Validate a token (public, no auth required)
export const validateAthleteSignupTokenSchema = z.object({
	token: z.string().min(1).max(50),
});

// Type exports
export type ListAthleteSignupLinksInput = z.infer<
	typeof listAthleteSignupLinksSchema
>;
export type CreateAthleteSignupLinkInput = z.infer<
	typeof createAthleteSignupLinkSchema
>;
export type UpdateAthleteSignupLinkInput = z.infer<
	typeof updateAthleteSignupLinkSchema
>;
export type DeleteAthleteSignupLinkInput = z.infer<
	typeof deleteAthleteSignupLinkSchema
>;
export type ValidateAthleteSignupTokenInput = z.infer<
	typeof validateAthleteSignupTokenSchema
>;
