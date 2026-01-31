import { z } from "zod/v4";

// ============================================================================
// CLUB SCHEMAS
// ============================================================================

export const createClubSchema = z.object({
	name: z.string().trim().min(1, "El nombre es requerido").max(200),
	shortName: z.string().trim().max(50).optional(),
	country: z.string().trim().max(100).optional(),
	city: z.string().trim().max(100).optional(),
	website: z
		.string()
		.trim()
		.url("URL inválida")
		.max(500)
		.optional()
		.or(z.literal("")),
	notes: z.string().trim().max(1000).optional(),
});

export const updateClubSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1, "El nombre es requerido").max(200).optional(),
	shortName: z.string().trim().max(50).optional().nullable(),
	country: z.string().trim().max(100).optional().nullable(),
	city: z.string().trim().max(100).optional().nullable(),
	website: z
		.string()
		.trim()
		.url("URL inválida")
		.max(500)
		.optional()
		.nullable()
		.or(z.literal("")),
	notes: z.string().trim().max(1000).optional().nullable(),
});

export const deleteClubSchema = z.object({
	id: z.string().uuid(),
});

export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;

// ============================================================================
// NATIONAL TEAM SCHEMAS
// ============================================================================

export const createNationalTeamSchema = z.object({
	name: z.string().trim().min(1, "El nombre es requerido").max(200),
	country: z.string().trim().min(1, "El país es requerido").max(100),
	category: z.string().trim().max(100).optional(),
	notes: z.string().trim().max(1000).optional(),
});

export const updateNationalTeamSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1, "El nombre es requerido").max(200).optional(),
	country: z.string().trim().min(1, "El país es requerido").max(100).optional(),
	category: z.string().trim().max(100).optional().nullable(),
	notes: z.string().trim().max(1000).optional().nullable(),
});

export const deleteNationalTeamSchema = z.object({
	id: z.string().uuid(),
});

export type CreateNationalTeamInput = z.infer<typeof createNationalTeamSchema>;
export type UpdateNationalTeamInput = z.infer<typeof updateNationalTeamSchema>;

// ============================================================================
// LIST SCHEMAS
// ============================================================================

export const listInstitutionsSchema = z.object({
	type: z.enum(["club", "nationalTeam", "all"]).default("all"),
});

export type ListInstitutionsInput = z.infer<typeof listInstitutionsSchema>;

// ============================================================================
// LOGO UPLOAD SCHEMAS
// ============================================================================

const allowedLogoTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export const getClubLogoUploadUrlSchema = z.object({
	clubId: z.string().uuid(),
	filename: z.string().min(1),
	contentType: z.enum(allowedLogoTypes),
});

export const updateClubLogoSchema = z.object({
	clubId: z.string().uuid(),
	logoKey: z.string().min(1),
});

export const deleteClubLogoSchema = z.object({
	clubId: z.string().uuid(),
});

export const getClubLogoDownloadUrlSchema = z.object({
	clubId: z.string().uuid(),
});

export const getNationalTeamLogoUploadUrlSchema = z.object({
	nationalTeamId: z.string().uuid(),
	filename: z.string().min(1),
	contentType: z.enum(allowedLogoTypes),
});

export const updateNationalTeamLogoSchema = z.object({
	nationalTeamId: z.string().uuid(),
	logoKey: z.string().min(1),
});

export const deleteNationalTeamLogoSchema = z.object({
	nationalTeamId: z.string().uuid(),
});

export const getNationalTeamLogoDownloadUrlSchema = z.object({
	nationalTeamId: z.string().uuid(),
});

// ============================================================================
// BULK ACTION SCHEMAS
// ============================================================================

export const bulkDeleteClubsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

export const bulkDeleteNationalTeamsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

export type BulkDeleteClubsInput = z.infer<typeof bulkDeleteClubsSchema>;
export type BulkDeleteNationalTeamsInput = z.infer<
	typeof bulkDeleteNationalTeamsSchema
>;
