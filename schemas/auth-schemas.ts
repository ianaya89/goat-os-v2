import { z } from "zod/v4";
import { passwordValidator } from "@/lib/auth/utils";
import { AthleteLevel } from "@/lib/db/schema/enums";

// Sign in form validation
export const signInSchema = z.object({
	email: z.string().trim().max(255, "Maximum 255 characters allowed."),
	password: z.string().max(72, "Maximum 72 characters allowed."),
});

// Sign up form validation
export const signUpSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required.")
		.max(64, "Maximum 64 characters allowed."),
	email: z
		.string()
		.trim()
		.min(1, "Email is required.")
		.max(255, "Maximum 255 characters allowed.")
		.email("Enter a valid email address."),
	password: z
		.string()
		.min(1, "Password is required.")
		.max(72, "Maximum 72 characters allowed.")
		.refine((arg) => passwordValidator.validate(arg).success, {
			message: "Password does not meet requirements.",
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
		.min(1, "Email is required.")
		.max(255, "Maximum 255 characters allowed.")
		.email("Enter a valid email address."),
});

// Reset password form
export const resetPasswordSchema = z.object({
	password: z
		.string()
		.min(1, "Password is required.")
		.max(72, "Maximum 72 characters allowed.")
		.refine((arg) => passwordValidator.validate(arg).success, {
			message: "Password does not meet requirements.",
		}),
});

// Athlete sign up form validation (public registration for athletes)
export const athleteSignUpSchema = z.object({
	// User account data
	name: z
		.string()
		.trim()
		.min(1, "El nombre es requerido.")
		.max(64, "Máximo 64 caracteres."),
	email: z
		.string()
		.trim()
		.min(1, "El email es requerido.")
		.max(255, "Máximo 255 caracteres.")
		.email("Ingresa un email válido."),
	password: z
		.string()
		.min(1, "La contraseña es requerida.")
		.max(72, "Máximo 72 caracteres.")
		.refine((arg) => passwordValidator.validate(arg).success, {
			message: "La contraseña no cumple los requisitos.",
		}),
	// Contact information (required)
	phone: z
		.string()
		.trim()
		.min(1, "El teléfono es requerido.")
		.max(20, "Máximo 20 caracteres.")
		.regex(/^[+]?[\d\s()-]+$/, "Ingresa un número de teléfono válido."),
	// Athlete required data
	sport: z
		.string()
		.trim()
		.min(1, "El deporte es requerido.")
		.max(100, "Máximo 100 caracteres."),
	birthDate: z.coerce.date(),
	level: z.nativeEnum(AthleteLevel),
	// Club and category (required)
	currentClub: z
		.string()
		.trim()
		.min(1, "El club actual es requerido.")
		.max(100, "Máximo 100 caracteres."),
	category: z
		.string()
		.trim()
		.min(1, "La categoría es requerida.")
		.max(50, "Máximo 50 caracteres."),
	// Profile information (required)
	position: z
		.string()
		.trim()
		.min(1, "La posición es requerida.")
		.max(100, "Máximo 100 caracteres."),
	// Optional fields
	secondaryPosition: z.string().trim().max(100).optional(),
	jerseyNumber: z.number().int().min(0).max(999).optional(),
	yearsOfExperience: z.number().int().min(0).max(50).optional(),
});

// Type exports
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type AthleteSignUpInput = z.infer<typeof athleteSignUpSchema>;
