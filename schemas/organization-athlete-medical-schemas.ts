import { z } from "zod/v4";
import { AthleteMedicalDocumentType } from "@/lib/db/schema/enums";

// List medical documents for an athlete
export const listMedicalDocumentsSchema = z.object({
	athleteId: z.string().uuid(),
	documentType: z.nativeEnum(AthleteMedicalDocumentType).optional(),
});

// Create medical document
export const createMedicalDocumentSchema = z.object({
	athleteId: z.string().uuid(),
	documentType: z.nativeEnum(AthleteMedicalDocumentType),
	title: z.string().trim().min(1, "El título es requerido.").max(200),
	description: z.string().trim().max(1000).optional(),
	fileKey: z.string().min(1, "El archivo es requerido."),
	fileName: z.string().min(1),
	fileSize: z.number().int().positive().optional(),
	mimeType: z.string().optional(),
	documentDate: z.coerce.date().optional(),
	expiresAt: z.coerce.date().optional(),
	doctorName: z.string().trim().max(200).optional(),
	medicalInstitution: z.string().trim().max(200).optional(),
	notes: z.string().trim().max(1000).optional(),
});

// Delete medical document
export const deleteMedicalDocumentSchema = z.object({
	id: z.string().uuid(),
});

// Upload medical certificate (special - stored in athlete table)
export const uploadMedicalCertificateSchema = z.object({
	athleteId: z.string().uuid(),
	fileKey: z.string().min(1, "El archivo es requerido."),
	expiresAt: z.coerce.date().optional(),
});

// Remove medical certificate
export const removeMedicalCertificateSchema = z.object({
	athleteId: z.string().uuid(),
});

// Get presigned upload URL
export const getMedicalDocumentUploadUrlSchema = z.object({
	athleteId: z.string().uuid(),
	fileName: z.string().min(1),
	contentType: z.string().optional(),
	isCertificate: z.boolean().optional(), // true for medical certificate, false for other documents
});

// Update parental contact info
export const updateParentalContactSchema = z.object({
	athleteId: z.string().uuid(),
	parentName: z.string().trim().max(100).optional(),
	parentPhone: z.string().trim().max(20).optional(),
	parentEmail: z.string().trim().max(255).email().optional(),
	parentRelationship: z.string().trim().max(50).optional(),
});

// Update consent timestamps
export const updateConsentSchema = z.object({
	athleteId: z.string().uuid(),
	parentalConsent: z.boolean().optional(),
	termsAccepted: z.boolean().optional(),
	medicalFitnessConfirmed: z.boolean().optional(),
});

// Type exports
export type ListMedicalDocumentsInput = z.infer<
	typeof listMedicalDocumentsSchema
>;
export type CreateMedicalDocumentInput = z.infer<
	typeof createMedicalDocumentSchema
>;
export type DeleteMedicalDocumentInput = z.infer<
	typeof deleteMedicalDocumentSchema
>;
export type UploadMedicalCertificateInput = z.infer<
	typeof uploadMedicalCertificateSchema
>;
export type RemoveMedicalCertificateInput = z.infer<
	typeof removeMedicalCertificateSchema
>;
export type GetMedicalDocumentUploadUrlInput = z.infer<
	typeof getMedicalDocumentUploadUrlSchema
>;
export type UpdateParentalContactInput = z.infer<
	typeof updateParentalContactSchema
>;
export type UpdateConsentInput = z.infer<typeof updateConsentSchema>;
