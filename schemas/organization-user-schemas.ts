import { z } from "zod/v4";
import { MemberRole } from "@/lib/db/schema/enums";

// Sortable fields for organization users
export const OrganizationUserSortField = z.enum([
	"name",
	"email",
	"role",
	"joinedAt",
]);
export type OrganizationUserSortField = z.infer<
	typeof OrganizationUserSortField
>;

// Get all organization users with filters
export const listOrganizationUsersSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: OrganizationUserSortField.default("joinedAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	filters: z
		.object({
			role: z.array(z.nativeEnum(MemberRole)).optional(),
			hasCoachProfile: z.boolean().optional(),
			hasAthleteProfile: z.boolean().optional(),
			emailVerified: z.boolean().optional(),
			joinedAt: z
				.array(z.enum(["today", "this-week", "this-month", "older"]))
				.optional(),
		})
		.optional(),
});

// Get single organization user
export const getOrganizationUserSchema = z.object({
	userId: z.string().uuid(),
});

// Update organization user role
export const updateOrganizationUserRoleSchema = z.object({
	userId: z.string().uuid(),
	role: z.nativeEnum(MemberRole),
});

// Remove user from organization
export const removeOrganizationUserSchema = z.object({
	userId: z.string().uuid(),
});

// Send password reset email
export const sendPasswordResetSchema = z.object({
	userId: z.string().uuid(),
});

// Resend verification email
export const resendVerificationEmailSchema = z.object({
	userId: z.string().uuid(),
});

// Get profile image upload URL
export const getProfileImageUploadUrlSchema = z.object({
	userId: z.string().uuid(),
	fileName: z.string().min(1),
	contentType: z.string().optional(),
});

// Save profile image after upload
export const saveProfileImageSchema = z.object({
	userId: z.string().uuid(),
	imageKey: z.string().min(1),
});

// Remove profile image
export const removeProfileImageSchema = z.object({
	userId: z.string().uuid(),
});

// Ban user from organization
export const banOrganizationUserSchema = z.object({
	userId: z.string().uuid(),
	reason: z.string().min(1, "Ban reason is required").max(1000),
	expiresAt: z.date().optional(),
});

// Unban user from organization
export const unbanOrganizationUserSchema = z.object({
	userId: z.string().uuid(),
});

// Reset MFA for a user
export const resetMfaOrganizationUserSchema = z.object({
	userId: z.string().uuid(),
});

// Create organization user
export const createOrganizationUserSchema = z.object({
	name: z.string().trim().min(1).max(200),
	email: z.string().email(),
	role: z.nativeEnum(MemberRole).default(MemberRole.member),
});

// Update organization user
export const updateOrganizationUserSchema = z.object({
	userId: z.string().uuid(),
	name: z.string().trim().min(1).max(200).optional(),
	email: z.string().email().optional(),
	role: z.nativeEnum(MemberRole).optional(),
});

// Bulk remove users from organization
export const bulkRemoveOrganizationUsersSchema = z.object({
	userIds: z.array(z.string().uuid()).min(1),
});

// Type exports
export type BulkRemoveOrganizationUsersInput = z.infer<
	typeof bulkRemoveOrganizationUsersSchema
>;
export type ListOrganizationUsersInput = z.infer<
	typeof listOrganizationUsersSchema
>;
export type GetOrganizationUserInput = z.infer<
	typeof getOrganizationUserSchema
>;
export type UpdateOrganizationUserRoleInput = z.infer<
	typeof updateOrganizationUserRoleSchema
>;
export type RemoveOrganizationUserInput = z.infer<
	typeof removeOrganizationUserSchema
>;
export type SendPasswordResetInput = z.infer<typeof sendPasswordResetSchema>;
export type ResendVerificationEmailInput = z.infer<
	typeof resendVerificationEmailSchema
>;
export type GetProfileImageUploadUrlInput = z.infer<
	typeof getProfileImageUploadUrlSchema
>;
export type SaveProfileImageInput = z.infer<typeof saveProfileImageSchema>;
export type RemoveProfileImageInput = z.infer<typeof removeProfileImageSchema>;
export type BanOrganizationUserInput = z.infer<
	typeof banOrganizationUserSchema
>;
export type UnbanOrganizationUserInput = z.infer<
	typeof unbanOrganizationUserSchema
>;
export type ResetMfaOrganizationUserInput = z.infer<
	typeof resetMfaOrganizationUserSchema
>;
export type CreateOrganizationUserInput = z.infer<
	typeof createOrganizationUserSchema
>;
export type UpdateOrganizationUserInput = z.infer<
	typeof updateOrganizationUserSchema
>;
