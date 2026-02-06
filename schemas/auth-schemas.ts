import { z } from "zod/v4";
import { passwordValidator } from "@/lib/auth/utils";
import { AthleteLevel } from "@/lib/db/schema/enums";

// Validation messages in Spanish
const v = {
	required: "Este campo es requerido",
	emailInvalid: "El email no es válido",
	emailRequired: "El email es requerido",
	passwordRequired: "La contraseña es requerida",
	passwordRequirements: "La contraseña no cumple con los requisitos",
	nameRequired: "El nombre es requerido",
	phoneRequired: "El teléfono es requerido",
	phoneInvalid: "El teléfono no es válido",
	maxLength: "Excede el máximo de caracteres",
	sportRequired: "El deporte es requerido",
	clubRequired: "El club es requerido",
	categoryRequired: "La categoría es requerida",
	positionRequired: "La posición es requerida",
	parentNameRequired: "El nombre del padre/tutor es requerido",
	parentPhoneRequired: "El teléfono del padre/tutor es requerido",
	parentalConsentRequired: "Se requiere el consentimiento parental",
	acceptTermsRequired: "Debes aceptar los términos y condiciones",
	confirmMedicalFitnessRequired: "Debes confirmar tu aptitud médica",
} as const;

// Sign in form validation
export const signInSchema = z.object({
	email: z.string().trim().max(255, v.maxLength),
	password: z.string().max(72, v.maxLength),
});

// Sign up form validation
export const signUpSchema = z.object({
	name: z.string().trim().min(1, v.nameRequired).max(64, v.maxLength),
	email: z
		.string()
		.trim()
		.min(1, v.emailRequired)
		.max(255, v.maxLength)
		.email(v.emailInvalid),
	password: z
		.string()
		.min(1, v.passwordRequired)
		.max(72, v.maxLength)
		.refine((arg) => passwordValidator.validate(arg).success, {
			message: v.passwordRequirements,
		}),
});

// OTP verification form
export const otpSchema = z.object({
	code: z.string().min(6).max(6),
});

// Forgot password form
export const forgotPasswordSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, v.emailRequired)
		.max(255, v.maxLength)
		.email(v.emailInvalid),
});

// Reset password form
export const resetPasswordSchema = z.object({
	password: z
		.string()
		.min(1, v.passwordRequired)
		.max(72, v.maxLength)
		.refine((arg) => passwordValidator.validate(arg).success, {
			message: v.passwordRequirements,
		}),
});

// Helper to check if birth date indicates a minor (under 18)
export function isMinor(birthDate: Date): boolean {
	const today = new Date();
	const age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();
	if (
		monthDiff < 0 ||
		(monthDiff === 0 && today.getDate() < birthDate.getDate())
	) {
		return age - 1 < 18;
	}
	return age < 18;
}

// Athlete sign up form validation (public registration for athletes)
export const athleteSignUpSchema = z
	.object({
		// User account data
		name: z.string().trim().min(1, v.nameRequired).max(64, v.maxLength),
		email: z
			.string()
			.trim()
			.min(1, v.emailRequired)
			.max(255, v.maxLength)
			.email(v.emailInvalid),
		password: z
			.string()
			.min(1, v.passwordRequired)
			.max(72, v.maxLength)
			.refine((arg) => passwordValidator.validate(arg).success, {
				message: v.passwordRequirements,
			}),
		// Contact information (required)
		phone: z
			.string()
			.trim()
			.min(1, v.phoneRequired)
			.max(20, v.maxLength)
			.regex(/^[+]?[\d\s()-]+$/, v.phoneInvalid),
		// Athlete required data
		sport: z.string().trim().min(1, v.sportRequired).max(100, v.maxLength),
		birthDate: z.coerce.date(),
		level: z.nativeEnum(AthleteLevel),
		// Category (required) - Club is assigned after joining an organization
		category: z.string().trim().min(1, v.categoryRequired).max(50, v.maxLength),
		// Profile information (required)
		position: z
			.string()
			.trim()
			.min(1, v.positionRequired)
			.max(100, v.maxLength),
		// Optional fields
		jerseyNumber: z.number().int().min(0).max(999).optional(),
		yearsOfExperience: z.number().int().min(0).max(50).optional(),

		// Parent/Guardian contact (required for minors)
		parentName: z.string().trim().max(100).optional(),
		parentPhone: z
			.string()
			.trim()
			.max(20)
			.regex(/^[+]?[\d\s()-]*$/, v.phoneInvalid)
			.optional(),
		parentEmail: z
			.string()
			.trim()
			.max(255)
			.optional()
			.refine((val) => !val || z.string().email().safeParse(val).success, {
				message: v.emailInvalid,
			}),
		parentRelationship: z.string().trim().max(50).optional(),

		// Optional signup link token (for organization-linked registration)
		signupToken: z.string().max(50).optional(),

		// Legal consents (all required)
		acceptTerms: z.boolean().refine((val) => val === true, {
			message: v.acceptTermsRequired,
		}),
		confirmMedicalFitness: z.boolean().refine((val) => val === true, {
			message: v.confirmMedicalFitnessRequired,
		}),
		parentalConsent: z.boolean().optional(), // Required only for minors
	})
	.refine(
		(data) => {
			// If minor, parent info is required
			if (isMinor(data.birthDate)) {
				return !!data.parentName && data.parentName.length >= 1;
			}
			return true;
		},
		{
			message: v.parentNameRequired,
			path: ["parentName"],
		},
	)
	.refine(
		(data) => {
			if (isMinor(data.birthDate)) {
				return !!data.parentPhone && data.parentPhone.length >= 1;
			}
			return true;
		},
		{
			message: v.parentPhoneRequired,
			path: ["parentPhone"],
		},
	)
	.refine(
		(data) => {
			if (isMinor(data.birthDate)) {
				return data.parentalConsent === true;
			}
			return true;
		},
		{
			message: v.parentalConsentRequired,
			path: ["parentalConsent"],
		},
	);

// Type exports
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type AthleteSignUpInput = z.infer<typeof athleteSignUpSchema>;
