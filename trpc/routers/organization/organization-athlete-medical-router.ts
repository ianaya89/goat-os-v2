import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	athleteMedicalDocumentTable,
	athleteTable,
} from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import {
	deleteObject,
	generateStorageKey,
	getBucketName,
	getSignedUploadUrl,
	getSignedUrl,
} from "@/lib/storage/s3";
import {
	createMedicalDocumentSchema,
	deleteMedicalDocumentSchema,
	getMedicalDocumentUploadUrlSchema,
	listMedicalDocumentsSchema,
	removeMedicalCertificateSchema,
	updateConsentSchema,
	updateParentalContactSchema,
	uploadMedicalCertificateSchema,
} from "@/schemas/organization-athlete-medical-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

// Helper to verify athlete belongs to organization
async function verifyAthleteOwnership(
	athleteId: string,
	organizationId: string,
) {
	const athlete = await db.query.athleteTable.findFirst({
		where: and(
			eq(athleteTable.id, athleteId),
			eq(athleteTable.organizationId, organizationId),
		),
	});
	if (!athlete) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Atleta no encontrado" });
	}
	return athlete;
}

export const organizationAthleteMedicalRouter = createTRPCRouter({
	// ============================================================================
	// MEDICAL DOCUMENTS
	// ============================================================================

	listDocuments: protectedOrganizationProcedure
		.input(listMedicalDocumentsSchema)
		.query(async ({ ctx, input }) => {
			await verifyAthleteOwnership(input.athleteId, ctx.organization.id);

			const conditions = [
				eq(athleteMedicalDocumentTable.athleteId, input.athleteId),
			];

			if (input.documentType) {
				conditions.push(
					eq(athleteMedicalDocumentTable.documentType, input.documentType),
				);
			}

			const documents = await db.query.athleteMedicalDocumentTable.findMany({
				where: and(...conditions),
				orderBy: [desc(athleteMedicalDocumentTable.createdAt)],
				with: {
					uploadedByUser: {
						columns: { id: true, name: true, image: true },
					},
				},
			});

			// Generate signed URLs for each document
			const documentsWithUrls = await Promise.all(
				documents.map(async (doc) => {
					const signedUrl = await getSignedUrl(doc.fileKey, getBucketName());
					return { ...doc, signedUrl };
				}),
			);

			return documentsWithUrls;
		}),

	createDocument: protectedOrganizationProcedure
		.input(createMedicalDocumentSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyAthleteOwnership(input.athleteId, ctx.organization.id);

			const [document] = await db
				.insert(athleteMedicalDocumentTable)
				.values({
					...input,
					uploadedBy: ctx.user.id,
				})
				.returning();

			logger.info(
				{
					athleteId: input.athleteId,
					documentId: document?.id,
					type: input.documentType,
				},
				"Medical document created",
			);

			return document;
		}),

	deleteDocument: protectedOrganizationProcedure
		.input(deleteMedicalDocumentSchema)
		.mutation(async ({ ctx, input }) => {
			// Find the document and verify ownership
			const document = await db.query.athleteMedicalDocumentTable.findFirst({
				where: eq(athleteMedicalDocumentTable.id, input.id),
			});

			if (!document) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Documento no encontrado",
				});
			}

			// Verify athlete belongs to organization
			await verifyAthleteOwnership(document.athleteId, ctx.organization.id);

			// Delete from S3
			try {
				await deleteObject(document.fileKey, getBucketName());
			} catch (error) {
				logger.error(
					{ error, fileKey: document.fileKey },
					"Failed to delete file from S3",
				);
			}

			// Delete from database
			await db
				.delete(athleteMedicalDocumentTable)
				.where(eq(athleteMedicalDocumentTable.id, input.id));

			logger.info(
				{ documentId: input.id, athleteId: document.athleteId },
				"Medical document deleted",
			);

			return { success: true };
		}),

	getUploadUrl: protectedOrganizationProcedure
		.input(getMedicalDocumentUploadUrlSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyAthleteOwnership(input.athleteId, ctx.organization.id);

			const prefix = input.isCertificate
				? "medical-certificates"
				: "medical-documents";
			const storageKey = generateStorageKey(
				prefix,
				ctx.organization.id,
				input.fileName,
			);

			const uploadUrl = await getSignedUploadUrl(storageKey, getBucketName(), {
				contentType: input.contentType,
				expiresIn: 3600, // 1 hour
			});

			return { uploadUrl, fileKey: storageKey };
		}),

	// ============================================================================
	// MEDICAL CERTIFICATE (Special - stored in athlete table)
	// ============================================================================

	uploadCertificate: protectedOrganizationProcedure
		.input(uploadMedicalCertificateSchema)
		.mutation(async ({ ctx, input }) => {
			const athlete = await verifyAthleteOwnership(
				input.athleteId,
				ctx.organization.id,
			);

			// If there's an existing certificate, delete it from S3
			if (athlete.medicalCertificateKey) {
				try {
					await deleteObject(athlete.medicalCertificateKey, getBucketName());
				} catch (error) {
					logger.error(
						{ error, fileKey: athlete.medicalCertificateKey },
						"Failed to delete old certificate from S3",
					);
				}
			}

			const [updated] = await db
				.update(athleteTable)
				.set({
					medicalCertificateKey: input.fileKey,
					medicalCertificateUploadedAt: new Date(),
					medicalCertificateExpiresAt: input.expiresAt,
				})
				.where(eq(athleteTable.id, input.athleteId))
				.returning();

			logger.info(
				{ athleteId: input.athleteId },
				"Medical certificate uploaded",
			);

			return updated;
		}),

	removeCertificate: protectedOrganizationProcedure
		.input(removeMedicalCertificateSchema)
		.mutation(async ({ ctx, input }) => {
			const athlete = await verifyAthleteOwnership(
				input.athleteId,
				ctx.organization.id,
			);

			if (athlete.medicalCertificateKey) {
				try {
					await deleteObject(athlete.medicalCertificateKey, getBucketName());
				} catch (error) {
					logger.error(
						{ error, fileKey: athlete.medicalCertificateKey },
						"Failed to delete certificate from S3",
					);
				}
			}

			const [updated] = await db
				.update(athleteTable)
				.set({
					medicalCertificateKey: null,
					medicalCertificateUploadedAt: null,
					medicalCertificateExpiresAt: null,
				})
				.where(eq(athleteTable.id, input.athleteId))
				.returning();

			logger.info(
				{ athleteId: input.athleteId },
				"Medical certificate removed",
			);

			return updated;
		}),

	getCertificateUrl: protectedOrganizationProcedure
		.input(removeMedicalCertificateSchema) // Same schema, just needs athleteId
		.query(async ({ ctx, input }) => {
			const athlete = await verifyAthleteOwnership(
				input.athleteId,
				ctx.organization.id,
			);

			if (!athlete.medicalCertificateKey) {
				return { hasCertificate: false, signedUrl: null };
			}

			const signedUrl = await getSignedUrl(
				athlete.medicalCertificateKey,
				getBucketName(),
			);

			return {
				hasCertificate: true,
				signedUrl,
				uploadedAt: athlete.medicalCertificateUploadedAt,
				expiresAt: athlete.medicalCertificateExpiresAt,
			};
		}),

	// ============================================================================
	// PARENTAL CONTACT & CONSENTS
	// ============================================================================

	updateParentalContact: protectedOrganizationProcedure
		.input(updateParentalContactSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyAthleteOwnership(input.athleteId, ctx.organization.id);

			const { athleteId, ...updateData } = input;

			const [updated] = await db
				.update(athleteTable)
				.set(updateData)
				.where(eq(athleteTable.id, athleteId))
				.returning();

			logger.info({ athleteId }, "Parental contact updated");

			return updated;
		}),

	updateConsent: protectedOrganizationProcedure
		.input(updateConsentSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyAthleteOwnership(input.athleteId, ctx.organization.id);

			const updateData: Record<string, Date | null> = {};

			if (input.parentalConsent !== undefined) {
				updateData.parentalConsentAt = input.parentalConsent
					? new Date()
					: null;
			}
			if (input.termsAccepted !== undefined) {
				updateData.termsAcceptedAt = input.termsAccepted ? new Date() : null;
			}
			if (input.medicalFitnessConfirmed !== undefined) {
				updateData.medicalFitnessConfirmedAt = input.medicalFitnessConfirmed
					? new Date()
					: null;
			}

			const [updated] = await db
				.update(athleteTable)
				.set(updateData)
				.where(eq(athleteTable.id, input.athleteId))
				.returning();

			logger.info(
				{ athleteId: input.athleteId, consents: Object.keys(updateData) },
				"Athlete consents updated",
			);

			return updated;
		}),
});
