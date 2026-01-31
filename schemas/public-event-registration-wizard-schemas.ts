import { z } from "zod/v4";
import { AthleteLevel } from "@/lib/db/schema/enums";

// Helper to check if birth date indicates a minor (under 18)
export function isMinorFromDate(birthDate: Date): boolean {
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

// ============================================================================
// STEP 1: EMAIL CHECK
// ============================================================================

export const emailStepSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "El email es requerido")
		.email("Ingresa un email válido")
		.max(255, "El email es muy largo"),
});

export type EmailStepInput = z.infer<typeof emailStepSchema>;

// ============================================================================
// STEP 2: PERSONAL INFORMATION
// ============================================================================

export const personalInfoStepSchema = z.object({
	fullName: z
		.string()
		.trim()
		.min(2, "El nombre debe tener al menos 2 caracteres")
		.max(200, "El nombre es muy largo"),
	birthDate: z.coerce.date("La fecha de nacimiento es requerida"),
	phone: z
		.string()
		.trim()
		.min(8, "Ingresa un número de teléfono válido")
		.max(30, "El teléfono es muy largo"),
	nationality: z
		.string()
		.trim()
		.max(100, "La nacionalidad es muy larga")
		.optional(),
	// Residence
	residenceCity: z
		.string()
		.trim()
		.max(100, "La ciudad es muy larga")
		.optional(),
	residenceCountry: z
		.string()
		.trim()
		.max(100, "El país es muy largo")
		.optional(),
	// Health information for events
	dietaryRestrictions: z
		.string()
		.trim()
		.max(500, "Las restricciones son muy largas")
		.optional(),
	allergies: z
		.string()
		.trim()
		.max(500, "Las alergias son muy largas")
		.optional(),
});

export type PersonalInfoStepInput = z.infer<typeof personalInfoStepSchema>;

// ============================================================================
// STEP 3: ATHLETE PROFILE
// ============================================================================

export const athleteProfileStepSchema = z.object({
	sport: z
		.string()
		.trim()
		.min(1, "El deporte es requerido")
		.max(100, "El deporte es muy largo"),
	level: z.nativeEnum(AthleteLevel, "El nivel es requerido"),
	position: z
		.string()
		.trim()
		.min(1, "La posición es requerida")
		.max(100, "La posición es muy larga"),
	secondaryPosition: z
		.string()
		.trim()
		.max(100, "La posición secundaria es muy larga")
		.optional(),
	currentClub: z
		.string()
		.trim()
		.max(200, "El nombre del club es muy largo")
		.optional(),
	jerseyNumber: z
		.number()
		.int("El número debe ser entero")
		.min(0, "El número debe ser positivo")
		.max(999, "El número no puede ser mayor a 999")
		.optional(),
	yearsOfExperience: z
		.number()
		.int("Los años deben ser un número entero")
		.min(0, "Los años deben ser positivos")
		.max(50, "Los años de experiencia son muy altos")
		.optional(),
});

export type AthleteProfileStepInput = z.infer<typeof athleteProfileStepSchema>;

// ============================================================================
// STEP 4: EMERGENCY CONTACT & PARENT/GUARDIAN INFO
// ============================================================================

export const emergencyContactStepSchema = z.object({
	// Emergency contact (required for all)
	emergencyContactName: z
		.string()
		.trim()
		.min(2, "El nombre del contacto es requerido")
		.max(200, "El nombre es muy largo"),
	emergencyContactPhone: z
		.string()
		.trim()
		.min(8, "Ingresa un teléfono válido")
		.max(30, "El teléfono es muy largo"),
	emergencyContactRelation: z
		.string()
		.trim()
		.min(2, "Indica la relación con el contacto")
		.max(100, "La relación es muy larga"),
	// Parent/guardian info (required for minors, optional otherwise)
	parentName: z.string().trim().max(200, "El nombre es muy largo").optional(),
	parentPhone: z.string().trim().max(30, "El teléfono es muy largo").optional(),
	parentEmail: z
		.string()
		.trim()
		.email("Ingresa un email válido")
		.max(255, "El email es muy largo")
		.optional(),
	parentRelationship: z
		.string()
		.trim()
		.max(100, "La relación es muy larga")
		.optional(),
});

export type EmergencyContactStepInput = z.infer<
	typeof emergencyContactStepSchema
>;

// ============================================================================
// STEP 5: REVIEW & CONFIRMATION
// ============================================================================

export const reviewStepSchema = z.object({
	// Terms and conditions (required for all)
	acceptTerms: z.literal(true, "Debes aceptar los términos y condiciones"),
	// Medical fitness confirmation (required for all)
	confirmMedicalFitness: z.literal(true, "Debes confirmar la aptitud física"),
	// Parental consent (required for minors, handled in combined schema)
	parentalConsent: z.boolean().optional(),
	// Optional notes
	notes: z.string().trim().max(2000, "Las notas son muy largas").optional(),
});

export type ReviewStepInput = z.infer<typeof reviewStepSchema>;

// ============================================================================
// COMBINED SCHEMA FOR FINAL SUBMISSION
// ============================================================================

export const fullRegistrationWizardSchema = emailStepSchema
	.merge(personalInfoStepSchema)
	.merge(athleteProfileStepSchema)
	.merge(emergencyContactStepSchema)
	.merge(reviewStepSchema)
	.extend({
		// Additional fields needed for submission
		ageCategoryId: z.string().uuid().optional(),
		useExistingData: z.boolean().default(false),
	})
	// Validate parent info is required for minors
	.refine(
		(data) => {
			if (isMinorFromDate(data.birthDate)) {
				return !!data.parentName && data.parentName.length >= 2;
			}
			return true;
		},
		{
			message: "El nombre del padre/tutor es requerido para menores de edad",
			path: ["parentName"],
		},
	)
	.refine(
		(data) => {
			if (isMinorFromDate(data.birthDate)) {
				return !!data.parentPhone && data.parentPhone.length >= 8;
			}
			return true;
		},
		{
			message: "El teléfono del padre/tutor es requerido para menores de edad",
			path: ["parentPhone"],
		},
	)
	.refine(
		(data) => {
			if (isMinorFromDate(data.birthDate)) {
				return data.parentalConsent === true;
			}
			return true;
		},
		{
			message: "Se requiere el consentimiento parental para menores de edad",
			path: ["parentalConsent"],
		},
	);

export type FullRegistrationWizardInput = z.infer<
	typeof fullRegistrationWizardSchema
>;

// ============================================================================
// LOOKUP ATHLETE BY EMAIL SCHEMA
// ============================================================================

export const lookupAthleteByEmailSchema = z.object({
	organizationSlug: z.string().min(1),
	eventSlug: z.string().min(1),
	email: z.string().trim().email().toLowerCase(),
});

export type LookupAthleteByEmailInput = z.infer<
	typeof lookupAthleteByEmailSchema
>;

// ============================================================================
// WIZARD STATE TYPES
// ============================================================================

export interface WizardStep {
	id: number;
	title: string;
	description?: string;
}

export const WIZARD_STEPS: WizardStep[] = [
	{ id: 1, title: "Email", description: "Verificación" },
	{ id: 2, title: "Personal", description: "Tus datos" },
	{ id: 3, title: "Atleta", description: "Perfil deportivo" },
	{ id: 4, title: "Emergencia", description: "Contacto" },
	{ id: 5, title: "Confirmar", description: "Revisión final" },
];

export interface ExistingAthleteData {
	id: string;
	sport: string;
	level: string;
	position: string | null;
	secondaryPosition: string | null;
	birthDate: Date | null;
	phone: string | null;
	nationality: string | null;
	currentClub: { id: string; name: string } | null;
	jerseyNumber: number | null;
	yearsOfExperience: number | null;
}

export interface ExistingUserData {
	id: string;
	name: string;
	email: string;
}

export interface LookupAthleteResult {
	isAlreadyRegistered: boolean;
	existingRegistration: {
		id: string;
		registrationNumber: number;
		status: string;
	} | null;
	user: ExistingUserData | null;
	athlete: ExistingAthleteData | null;
}

export interface AgeCategory {
	id: string;
	name: string;
	displayName: string | null;
	minBirthYear: number | null;
	maxBirthYear: number | null;
}

export interface PriceInfo {
	price: number;
	tierId: string | null;
	tierName: string;
	currency: string;
	registrationNumber: number;
}
