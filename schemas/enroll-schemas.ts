import { z } from "zod/v4";
import { passwordValidator } from "@/lib/auth/utils";
import { AthleteLevel } from "@/lib/db/schema/enums";
import { isMinor } from "@/schemas/auth-schemas";

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
	categoryRequired: "La categoría es requerida",
	positionRequired: "La posición es requerida",
	parentNameRequired: "El nombre del padre/tutor es requerido",
	parentPhoneRequired: "El teléfono del padre/tutor es requerido",
	parentalConsentRequired: "Se requiere el consentimiento parental",
	acceptTermsRequired: "Debes aceptar los términos y condiciones",
	confirmMedicalFitnessRequired: "Debes confirmar tu aptitud médica",
	groupIdRequired: "El grupo es requerido",
	passwordRequiredForAccount:
		"La contraseña es requerida cuando se crea una cuenta",
} as const;

export const enrollSchema = z
	.object({
		// Enrollment target
		groupId: z.string().uuid(v.groupIdRequired),
		createAccount: z.boolean().default(false),

		// Account (only when createAccount is true)
		password: z
			.string()
			.max(72, v.maxLength)
			.refine((arg) => passwordValidator.validate(arg).success, {
				message: v.passwordRequirements,
			})
			.optional(),

		// Personal data
		name: z.string().trim().min(1, v.nameRequired).max(64, v.maxLength),
		email: z
			.string()
			.trim()
			.min(1, v.emailRequired)
			.max(255, v.maxLength)
			.email(v.emailInvalid),
		phone: z
			.string()
			.trim()
			.min(1, v.phoneRequired)
			.max(20, v.maxLength)
			.regex(/^[+]?[\d\s()-]+$/, v.phoneInvalid),

		// Athletic data
		sport: z.string().trim().min(1, v.sportRequired).max(100, v.maxLength),
		birthDate: z.coerce.date(),
		level: z.nativeEnum(AthleteLevel),
		category: z.string().trim().min(1, v.categoryRequired).max(50, v.maxLength),
		position: z
			.string()
			.trim()
			.min(1, v.positionRequired)
			.max(100, v.maxLength),
		jerseyNumber: z.number().int().min(0).max(999).optional(),
		yearsOfExperience: z.number().int().min(0).max(50).optional(),

		// Parent/Guardian (required for minors)
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

		// Legal consents
		acceptTerms: z.boolean().refine((val) => val === true, {
			message: v.acceptTermsRequired,
		}),
		confirmMedicalFitness: z.boolean().refine((val) => val === true, {
			message: v.confirmMedicalFitnessRequired,
		}),
		parentalConsent: z.boolean().optional(),
	})
	.refine(
		(data) => {
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

export type EnrollInput = z.infer<typeof enrollSchema>;
