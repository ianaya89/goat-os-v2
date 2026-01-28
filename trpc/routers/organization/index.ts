import slugify from "@sindresorhus/slugify";
import { TRPCError } from "@trpc/server";
import { asc, eq, getTableColumns } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { assertUserIsOrgMember } from "@/lib/auth/server";
import { db, memberTable, organizationTable } from "@/lib/db";
import { creditBalanceTable } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import {
	createOrganizationSchema,
	getOrganizationByIdSchema,
} from "@/schemas/organization-schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { organizationAiRouter } from "@/trpc/routers/organization/organization-ai-router";
import { organizationAthleteEvaluationRouter } from "@/trpc/routers/organization/organization-athlete-evaluation-router";
import { organizationAthleteGroupRouter } from "@/trpc/routers/organization/organization-athlete-group-router";
import { organizationAthleteMedicalRouter } from "@/trpc/routers/organization/organization-athlete-medical-router";
import { organizationAthleteRouter } from "@/trpc/routers/organization/organization-athlete-router";
import { organizationAthleteWellnessRouter } from "@/trpc/routers/organization/organization-athlete-wellness-router";
import { organizationAttendanceRouter } from "@/trpc/routers/organization/organization-attendance-router";
import { organizationCashRegisterRouter } from "@/trpc/routers/organization/organization-cash-register-router";
import { organizationCoachRouter } from "@/trpc/routers/organization/organization-coach-router";
import { organizationCompetitionRouter } from "@/trpc/routers/organization/organization-competition-router";
import { organizationCreditRouter } from "@/trpc/routers/organization/organization-credit-router";
import { organizationDashboardRouter } from "@/trpc/routers/organization/organization-dashboard-router";
import { organizationEquipmentAuditRouter } from "@/trpc/routers/organization/organization-equipment-audit-router";
import { organizationEquipmentRouter } from "@/trpc/routers/organization/organization-equipment-router";
import { organizationEventOrganizationRouter } from "@/trpc/routers/organization/organization-event-organization-router";
import { organizationEventRotationRouter } from "@/trpc/routers/organization/organization-event-rotation-router";
import { organizationEventTemplateRouter } from "@/trpc/routers/organization/organization-event-template-router";
import { organizationExpenseRouter } from "@/trpc/routers/organization/organization-expense-router";
import { organizationFeaturesRouter } from "@/trpc/routers/organization/organization-features-router";
import { organizationLocationRouter } from "@/trpc/routers/organization/organization-location-router";
import { organizationMatchRouter } from "@/trpc/routers/organization/organization-match-router";
import { organizationNotificationRouter } from "@/trpc/routers/organization/organization-notification-router";
import { organizationPayrollRouter } from "@/trpc/routers/organization/organization-payroll-router";
import { organizationReportsRouter } from "@/trpc/routers/organization/organization-reports-router";
import { organizationSeasonRouter } from "@/trpc/routers/organization/organization-season-router";
import { organizationServiceRouter } from "@/trpc/routers/organization/organization-service-router";
import { organizationSessionFeedbackRouter } from "@/trpc/routers/organization/organization-session-feedback-router";
import { organizationSponsorRouter } from "@/trpc/routers/organization/organization-sponsor-router";
import { organizationSportsEventRouter } from "@/trpc/routers/organization/organization-sports-event-router";
import { organizationStockRouter } from "@/trpc/routers/organization/organization-stock-router";
import { organizationSubscriptionRouter } from "@/trpc/routers/organization/organization-subscription-router";
import { organizationTeamRouter } from "@/trpc/routers/organization/organization-team-router";
import { organizationTrainingPaymentRouter } from "@/trpc/routers/organization/organization-training-payment-router";
import { organizationTrainingSessionRouter } from "@/trpc/routers/organization/organization-training-session-router";
import { organizationUserRouter } from "@/trpc/routers/organization/organization-user-router";
import { organizationWaitlistRouter } from "@/trpc/routers/organization/organization-waitlist-router";

async function generateOrganizationSlug(name: string): Promise<string> {
	const baseSlug = slugify(name, {
		lowercase: true,
	});

	let slug = baseSlug;
	let hasAvailableSlug = false;

	for (let i = 0; i < 3; i++) {
		slug = `${baseSlug}-${nanoid(5)}`;

		const existing = await db.query.organizationTable.findFirst({
			where: (org, { eq }) => eq(org.slug, slug),
		});

		if (!existing) {
			hasAvailableSlug = true;
			break;
		}
	}

	if (!hasAvailableSlug) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "No available slug found",
		});
	}

	return slug;
}

export const organizationRouter = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx }) => {
		const organizations = await db
			.select({
				...getTableColumns(organizationTable),
				membersCount: db
					.$count(
						memberTable,
						eq(memberTable.organizationId, organizationTable.id),
					)
					.as("membersCount"),
				memberRole: memberTable.role,
			})
			.from(organizationTable)
			.innerJoin(
				memberTable,
				eq(organizationTable.id, memberTable.organizationId),
			)
			.where(eq(memberTable.userId, ctx.user.id))
			.orderBy(asc(organizationTable.createdAt));

		return organizations.map((org) => ({
			...org,
			slug: org.slug || "",
		}));
	}),
	get: protectedProcedure
		.input(getOrganizationByIdSchema)
		.query(async ({ ctx, input }) => {
			// Verify user is a member of this organization (throws if not)
			const { organization } = await assertUserIsOrgMember(
				input.id,
				ctx.user.id,
			);

			return organization;
		}),
	create: protectedProcedure
		.input(createOrganizationSchema)
		.mutation(async ({ input }) => {
			const organization = await auth.api.createOrganization({
				headers: await headers(),
				body: {
					name: input.name,
					slug: await generateOrganizationSlug(input.name), // Slug is kept for internal reference but not used in URLs
					metadata: input.metadata,
				},
			});

			if (!organization) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create organization",
				});
			}

			// Initialize credit balance for the new organization
			// This ensures the organization has a balance record from creation
			// rather than relying on lazy initialization
			try {
				await db
					.insert(creditBalanceTable)
					.values({ organizationId: organization.id })
					.onConflictDoNothing();
			} catch (error) {
				// Log but don't fail org creation - balance will be created lazily if needed
				logger.warn(
					{ organizationId: organization.id, error },
					"Failed to initialize credit balance for new organization",
				);
			}

			return organization;
		}),

	// Context-specific sub-routers
	ai: organizationAiRouter,
	athlete: organizationAthleteRouter,
	athleteEvaluation: organizationAthleteEvaluationRouter,
	athleteGroup: organizationAthleteGroupRouter,
	athleteMedical: organizationAthleteMedicalRouter,
	athleteWellness: organizationAthleteWellnessRouter,
	attendance: organizationAttendanceRouter,
	sessionFeedback: organizationSessionFeedbackRouter,
	coach: organizationCoachRouter,
	credit: organizationCreditRouter,
	dashboard: organizationDashboardRouter,
	location: organizationLocationRouter,
	sportsEvent: organizationSportsEventRouter,
	subscription: organizationSubscriptionRouter,
	trainingPayment: organizationTrainingPaymentRouter,
	trainingSession: organizationTrainingSessionRouter,
	notification: organizationNotificationRouter,
	user: organizationUserRouter,
	expense: organizationExpenseRouter,
	cashRegister: organizationCashRegisterRouter,
	reports: organizationReportsRouter,
	waitlist: organizationWaitlistRouter,
	eventOrganization: organizationEventOrganizationRouter,
	sponsor: organizationSponsorRouter,
	stock: organizationStockRouter,
	equipment: organizationEquipmentRouter,
	equipmentAudit: organizationEquipmentAuditRouter,
	eventTemplate: organizationEventTemplateRouter,
	payroll: organizationPayrollRouter,
	eventRotation: organizationEventRotationRouter,
	features: organizationFeaturesRouter,
	season: organizationSeasonRouter,
	service: organizationServiceRouter,
	team: organizationTeamRouter,
	competition: organizationCompetitionRouter,
	match: organizationMatchRouter,
});
