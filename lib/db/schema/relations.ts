import { relations } from "drizzle-orm";
import {
	accountTable,
	ageCategoryTable,
	aiChatTable,
	athleteAchievementTable,
	athleteCareerHistoryTable,
	athleteEducationTable,
	athleteEvaluationTable,
	athleteFitnessTestTable,
	athleteGroupMemberTable,
	athleteGroupTable,
	athleteLanguageTable,
	athleteMedicalDocumentTable,
	athletePhysicalMetricsTable,
	athleteReferenceTable,
	athleteSessionFeedbackTable,
	athleteSignupLinkTable,
	athleteSponsorTable,
	athleteTable,
	athleteWellnessSurveyTable,
	attendanceTable,
	auditLogTable,
	billingEventTable,
	cashMovementTable,
	cashRegisterTable,
	clubTable,
	coachAchievementTable,
	coachEducationTable,
	coachLanguageTable,
	coachReferenceTable,
	coachSportsExperienceTable,
	coachTable,
	competitionTable,
	creditBalanceTable,
	creditDeductionFailureTable,
	creditTransactionTable,
	equipmentAssignmentTable,
	equipmentInventoryAuditTable,
	equipmentInventoryCountTable,
	equipmentMaintenanceTable,
	eventAgeCategoryTable,
	eventBudgetLineTable,
	eventChecklistTable,
	eventCoachTable,
	eventDiscountTable,
	eventDiscountUsageTable,
	eventDocumentTable,
	eventGroupMemberTable,
	eventGroupTable,
	eventInventoryTable,
	eventMilestoneTable,
	eventNoteTable,
	eventPricingTierTable,
	eventRegistrationTable,
	eventRiskLogTable,
	eventRiskTable,
	eventRotationAssignmentTable,
	eventRotationScheduleTable,
	eventSponsorAssignmentTable,
	eventSponsorBenefitTable,
	eventSponsorTable,
	eventStaffShiftTable,
	eventStaffTable,
	eventStationStaffTable,
	eventStationTable,
	eventTaskTable,
	eventTemplateTable,
	eventTimeBlockTable,
	eventVendorAssignmentTable,
	eventVendorTable,
	eventZoneStaffTable,
	eventZoneTable,
	expenseCategoryTable,
	expenseTable,
	invitationTable,
	locationTable,
	matchTable,
	memberTable,
	nationalTeamTable,
	orderItemTable,
	orderTable,
	organizationFeatureTable,
	organizationTable,
	productTable,
	recurringSessionExceptionTable,
	saleItemTable,
	saleTable,
	seasonTable,
	servicePriceHistoryTable,
	serviceTable,
	sessionConfirmationHistoryTable,
	sessionTable,
	sponsorTable,
	sportsEventTable,
	staffPayrollTable,
	stockTransactionTable,
	subscriptionItemTable,
	subscriptionTable,
	teamCompetitionTable,
	teamMemberTable,
	teamStaffTable,
	teamTable,
	trainingEquipmentTable,
	trainingPaymentSessionTable,
	trainingPaymentTable,
	trainingSessionAthleteTable,
	trainingSessionCoachTable,
	trainingSessionTable,
	twoFactorTable,
	userNotificationSettingsTable,
	userTable,
	waitlistEntryTable,
} from "./tables";

export const accountRelations = relations(accountTable, ({ one }) => ({
	user: one(userTable, {
		fields: [accountTable.userId],
		references: [userTable.id],
	}),
}));

export const invitationRelations = relations(invitationTable, ({ one }) => ({
	organization: one(organizationTable, {
		fields: [invitationTable.organizationId],
		references: [organizationTable.id],
	}),
	inviter: one(userTable, {
		fields: [invitationTable.inviterId],
		references: [userTable.id],
	}),
}));

export const athleteSignupLinkRelations = relations(
	athleteSignupLinkTable,
	({ one }) => ({
		organization: one(organizationTable, {
			fields: [athleteSignupLinkTable.organizationId],
			references: [organizationTable.id],
		}),
		athleteGroup: one(athleteGroupTable, {
			fields: [athleteSignupLinkTable.athleteGroupId],
			references: [athleteGroupTable.id],
		}),
		createdByUser: one(userTable, {
			fields: [athleteSignupLinkTable.createdBy],
			references: [userTable.id],
		}),
	}),
);

export const memberRelations = relations(memberTable, ({ one }) => ({
	organization: one(organizationTable, {
		fields: [memberTable.organizationId],
		references: [organizationTable.id],
	}),
	user: one(userTable, {
		fields: [memberTable.userId],
		references: [userTable.id],
	}),
}));

export const organizationRelations = relations(
	organizationTable,
	({ one, many }) => ({
		members: many(memberTable),
		invitations: many(invitationTable),
		subscriptions: many(subscriptionTable),
		orders: many(orderTable),
		billingEvents: many(billingEventTable),
		aiChats: many(aiChatTable),
		clubs: many(clubTable),
		nationalTeams: many(nationalTeamTable),
		coaches: many(coachTable),
		athletes: many(athleteTable),
		creditBalance: one(creditBalanceTable),
		creditTransactions: many(creditTransactionTable),
		// Training-related relations
		locations: many(locationTable),
		athleteGroups: many(athleteGroupTable),
		services: many(serviceTable),
		trainingSessions: many(trainingSessionTable),
		trainingPayments: many(trainingPaymentTable),
		waitlistEntries: many(waitlistEntryTable),
		// Sports events relations
		ageCategories: many(ageCategoryTable),
		sportsEvents: many(sportsEventTable),
		eventRegistrations: many(eventRegistrationTable),
		// eventPayments removed - unified into trainingPayments
		// Organization-level vendors and sponsors
		vendors: many(eventVendorTable),
		sponsors: many(sponsorTable),
		// Event templates
		eventTemplates: many(eventTemplateTable),
		// Feature flags
		features: many(organizationFeatureTable),
		// Athlete signup links
		athleteSignupLinks: many(athleteSignupLinkTable),
	}),
);

// Organization feature flags relations
export const organizationFeatureRelations = relations(
	organizationFeatureTable,
	({ one }) => ({
		organization: one(organizationTable, {
			fields: [organizationFeatureTable.organizationId],
			references: [organizationTable.id],
		}),
	}),
);

// Club relations
export const clubRelations = relations(clubTable, ({ one, many }) => ({
	organization: one(organizationTable, {
		fields: [clubTable.organizationId],
		references: [organizationTable.id],
	}),
	athletes: many(athleteTable),
	athleteCareerHistory: many(athleteCareerHistoryTable),
	coachSportsExperience: many(coachSportsExperienceTable),
}));

// National Team relations
export const nationalTeamRelations = relations(
	nationalTeamTable,
	({ one, many }) => ({
		organization: one(organizationTable, {
			fields: [nationalTeamTable.organizationId],
			references: [organizationTable.id],
		}),
		athletes: many(athleteTable),
		athleteCareerHistory: many(athleteCareerHistoryTable),
		coachSportsExperience: many(coachSportsExperienceTable),
	}),
);

export const sessionRelations = relations(sessionTable, ({ one }) => ({
	user: one(userTable, {
		fields: [sessionTable.userId],
		references: [userTable.id],
	}),
}));

export const twoFactorRelations = relations(twoFactorTable, ({ one }) => ({
	user: one(userTable, {
		fields: [twoFactorTable.userId],
		references: [userTable.id],
	}),
}));

export const userRelations = relations(userTable, ({ many }) => ({
	sessions: many(sessionTable),
	accounts: many(accountTable),
	invitations: many(invitationTable),
	memberships: many(memberTable),
	twoFactors: many(twoFactorTable),
	aiChats: many(aiChatTable),
	coachProfiles: many(coachTable),
	athleteProfiles: many(athleteTable),
	creditTransactions: many(creditTransactionTable),
}));

// Billing relations
export const subscriptionRelations = relations(
	subscriptionTable,
	({ one, many }) => ({
		organization: one(organizationTable, {
			fields: [subscriptionTable.organizationId],
			references: [organizationTable.id],
		}),
		items: many(subscriptionItemTable),
	}),
);

export const subscriptionItemRelations = relations(
	subscriptionItemTable,
	({ one }) => ({
		subscription: one(subscriptionTable, {
			fields: [subscriptionItemTable.subscriptionId],
			references: [subscriptionTable.id],
		}),
	}),
);

export const orderRelations = relations(orderTable, ({ one, many }) => ({
	organization: one(organizationTable, {
		fields: [orderTable.organizationId],
		references: [organizationTable.id],
	}),
	items: many(orderItemTable),
}));

export const orderItemRelations = relations(orderItemTable, ({ one }) => ({
	order: one(orderTable, {
		fields: [orderItemTable.orderId],
		references: [orderTable.id],
	}),
}));

export const billingEventRelations = relations(
	billingEventTable,
	({ one }) => ({
		organization: one(organizationTable, {
			fields: [billingEventTable.organizationId],
			references: [organizationTable.id],
		}),
	}),
);

// AI Chat relations
export const aiChatRelations = relations(aiChatTable, ({ one }) => ({
	organization: one(organizationTable, {
		fields: [aiChatTable.organizationId],
		references: [organizationTable.id],
	}),
	user: one(userTable, {
		fields: [aiChatTable.userId],
		references: [userTable.id],
	}),
}));

// Credit relations
export const creditBalanceRelations = relations(
	creditBalanceTable,
	({ one }) => ({
		organization: one(organizationTable, {
			fields: [creditBalanceTable.organizationId],
			references: [organizationTable.id],
		}),
	}),
);

export const creditTransactionRelations = relations(
	creditTransactionTable,
	({ one }) => ({
		organization: one(organizationTable, {
			fields: [creditTransactionTable.organizationId],
			references: [organizationTable.id],
		}),
		createdByUser: one(userTable, {
			fields: [creditTransactionTable.createdBy],
			references: [userTable.id],
		}),
	}),
);

export const creditDeductionFailureRelations = relations(
	creditDeductionFailureTable,
	({ one }) => ({
		organization: one(organizationTable, {
			fields: [creditDeductionFailureTable.organizationId],
			references: [organizationTable.id],
		}),
		user: one(userTable, {
			fields: [creditDeductionFailureTable.userId],
			references: [userTable.id],
			relationName: "deductionFailureUser",
		}),
		resolvedByUser: one(userTable, {
			fields: [creditDeductionFailureTable.resolvedBy],
			references: [userTable.id],
			relationName: "deductionFailureResolvedBy",
		}),
	}),
);

// Coach relations
export const coachRelations = relations(coachTable, ({ one, many }) => ({
	organization: one(organizationTable, {
		fields: [coachTable.organizationId],
		references: [organizationTable.id],
	}),
	user: one(userTable, {
		fields: [coachTable.userId],
		references: [userTable.id],
	}),
	sessionAssignments: many(trainingSessionCoachTable),
	eventAssignments: many(eventCoachTable),
	sportsExperience: many(coachSportsExperienceTable),
	achievements: many(coachAchievementTable),
	education: many(coachEducationTable),
	languages: many(coachLanguageTable),
	references: many(coachReferenceTable),
}));

// Coach sports experience relations
export const coachSportsExperienceRelations = relations(
	coachSportsExperienceTable,
	({ one }) => ({
		coach: one(coachTable, {
			fields: [coachSportsExperienceTable.coachId],
			references: [coachTable.id],
		}),
		club: one(clubTable, {
			fields: [coachSportsExperienceTable.clubId],
			references: [clubTable.id],
		}),
		nationalTeam: one(nationalTeamTable, {
			fields: [coachSportsExperienceTable.nationalTeamId],
			references: [nationalTeamTable.id],
		}),
	}),
);

export const coachAchievementRelations = relations(
	coachAchievementTable,
	({ one }) => ({
		coach: one(coachTable, {
			fields: [coachAchievementTable.coachId],
			references: [coachTable.id],
		}),
	}),
);

// Coach education relations
export const coachEducationRelations = relations(
	coachEducationTable,
	({ one }) => ({
		coach: one(coachTable, {
			fields: [coachEducationTable.coachId],
			references: [coachTable.id],
		}),
	}),
);

// Coach language relations
export const coachLanguageRelations = relations(
	coachLanguageTable,
	({ one }) => ({
		coach: one(coachTable, {
			fields: [coachLanguageTable.coachId],
			references: [coachTable.id],
		}),
	}),
);

// Coach reference relations
export const coachReferenceRelations = relations(
	coachReferenceTable,
	({ one }) => ({
		coach: one(coachTable, {
			fields: [coachReferenceTable.coachId],
			references: [coachTable.id],
		}),
	}),
);

// Athlete relations
export const athleteRelations = relations(athleteTable, ({ one, many }) => ({
	organization: one(organizationTable, {
		fields: [athleteTable.organizationId],
		references: [organizationTable.id],
	}),
	user: one(userTable, {
		fields: [athleteTable.userId],
		references: [userTable.id],
	}),
	currentClub: one(clubTable, {
		fields: [athleteTable.currentClubId],
		references: [clubTable.id],
	}),
	currentNationalTeam: one(nationalTeamTable, {
		fields: [athleteTable.currentNationalTeamId],
		references: [nationalTeamTable.id],
	}),
	groupMemberships: many(athleteGroupMemberTable),
	sessionAssignments: many(trainingSessionAthleteTable),
	attendances: many(attendanceTable),
	trainingPayments: many(trainingPaymentTable),
	evaluations: many(athleteEvaluationTable),
	waitlistEntries: many(waitlistEntryTable),
	// Scouting profile relations
	physicalMetrics: many(athletePhysicalMetricsTable),
	fitnessTests: many(athleteFitnessTestTable),
	careerHistory: many(athleteCareerHistoryTable),
	languages: many(athleteLanguageTable),
	education: many(athleteEducationTable),
	references: many(athleteReferenceTable),
	sponsors: many(athleteSponsorTable),
	achievements: many(athleteAchievementTable),
	// Wellness tracking
	wellnessSurveys: many(athleteWellnessSurveyTable),
	// Session feedback (RPE)
	sessionFeedback: many(athleteSessionFeedbackTable),
	// Sports events
	eventRegistrations: many(eventRegistrationTable),
}));

// ============================================================================
// TRAINING-RELATED RELATIONS
// ============================================================================

// Location relations
export const locationRelations = relations(locationTable, ({ one, many }) => ({
	organization: one(organizationTable, {
		fields: [locationTable.organizationId],
		references: [organizationTable.id],
	}),
	trainingSessions: many(trainingSessionTable),
	sportsEvents: many(sportsEventTable),
}));

// Athlete Group relations
export const athleteGroupRelations = relations(
	athleteGroupTable,
	({ one, many }) => ({
		organization: one(organizationTable, {
			fields: [athleteGroupTable.organizationId],
			references: [organizationTable.id],
		}),
		ageCategory: one(ageCategoryTable, {
			fields: [athleteGroupTable.ageCategoryId],
			references: [ageCategoryTable.id],
		}),
		service: one(serviceTable, {
			fields: [athleteGroupTable.serviceId],
			references: [serviceTable.id],
		}),
		members: many(athleteGroupMemberTable),
		trainingSessions: many(trainingSessionTable),
		waitlistEntries: many(waitlistEntryTable),
	}),
);

// Athlete Group Member relations
export const athleteGroupMemberRelations = relations(
	athleteGroupMemberTable,
	({ one }) => ({
		group: one(athleteGroupTable, {
			fields: [athleteGroupMemberTable.groupId],
			references: [athleteGroupTable.id],
		}),
		athlete: one(athleteTable, {
			fields: [athleteGroupMemberTable.athleteId],
			references: [athleteTable.id],
		}),
	}),
);

// Training Session relations
export const trainingSessionRelations = relations(
	trainingSessionTable,
	({ one, many }) => ({
		organization: one(organizationTable, {
			fields: [trainingSessionTable.organizationId],
			references: [organizationTable.id],
		}),
		location: one(locationTable, {
			fields: [trainingSessionTable.locationId],
			references: [locationTable.id],
		}),
		athleteGroup: one(athleteGroupTable, {
			fields: [trainingSessionTable.athleteGroupId],
			references: [athleteGroupTable.id],
		}),
		service: one(serviceTable, {
			fields: [trainingSessionTable.serviceId],
			references: [serviceTable.id],
		}),
		recurringSession: one(trainingSessionTable, {
			fields: [trainingSessionTable.recurringSessionId],
			references: [trainingSessionTable.id],
			relationName: "recurringInstances",
		}),
		instances: many(trainingSessionTable, {
			relationName: "recurringInstances",
		}),
		createdByUser: one(userTable, {
			fields: [trainingSessionTable.createdBy],
			references: [userTable.id],
		}),
		coaches: many(trainingSessionCoachTable),
		athletes: many(trainingSessionAthleteTable),
		attendances: many(attendanceTable),
		payments: many(trainingPaymentTable),
		// New: payments via junction table (for packages)
		paymentLinks: many(trainingPaymentSessionTable),
		evaluations: many(athleteEvaluationTable),
		exceptions: many(recurringSessionExceptionTable),
		feedback: many(athleteSessionFeedbackTable),
	}),
);

// Training Session Coach relations
export const trainingSessionCoachRelations = relations(
	trainingSessionCoachTable,
	({ one }) => ({
		session: one(trainingSessionTable, {
			fields: [trainingSessionCoachTable.sessionId],
			references: [trainingSessionTable.id],
		}),
		coach: one(coachTable, {
			fields: [trainingSessionCoachTable.coachId],
			references: [coachTable.id],
		}),
	}),
);

// Training Session Athlete relations
export const trainingSessionAthleteRelations = relations(
	trainingSessionAthleteTable,
	({ one }) => ({
		session: one(trainingSessionTable, {
			fields: [trainingSessionAthleteTable.sessionId],
			references: [trainingSessionTable.id],
		}),
		athlete: one(athleteTable, {
			fields: [trainingSessionAthleteTable.athleteId],
			references: [athleteTable.id],
		}),
	}),
);

// Recurring Session Exception relations
export const recurringSessionExceptionRelations = relations(
	recurringSessionExceptionTable,
	({ one }) => ({
		recurringSession: one(trainingSessionTable, {
			fields: [recurringSessionExceptionTable.recurringSessionId],
			references: [trainingSessionTable.id],
		}),
		replacementSession: one(trainingSessionTable, {
			fields: [recurringSessionExceptionTable.replacementSessionId],
			references: [trainingSessionTable.id],
		}),
	}),
);

// Attendance relations
export const attendanceRelations = relations(attendanceTable, ({ one }) => ({
	session: one(trainingSessionTable, {
		fields: [attendanceTable.sessionId],
		references: [trainingSessionTable.id],
	}),
	athlete: one(athleteTable, {
		fields: [attendanceTable.athleteId],
		references: [athleteTable.id],
	}),
	recordedByUser: one(userTable, {
		fields: [attendanceTable.recordedBy],
		references: [userTable.id],
	}),
}));

// Training Payment relations
export const trainingPaymentRelations = relations(
	trainingPaymentTable,
	({ one, many }) => ({
		organization: one(organizationTable, {
			fields: [trainingPaymentTable.organizationId],
			references: [organizationTable.id],
		}),
		// Legacy: single session link (for backwards compatibility)
		session: one(trainingSessionTable, {
			fields: [trainingPaymentTable.sessionId],
			references: [trainingSessionTable.id],
		}),
		// New: multiple sessions via junction table (for packages)
		sessions: many(trainingPaymentSessionTable),
		athlete: one(athleteTable, {
			fields: [trainingPaymentTable.athleteId],
			references: [athleteTable.id],
		}),
		service: one(serviceTable, {
			fields: [trainingPaymentTable.serviceId],
			references: [serviceTable.id],
		}),
		recordedByUser: one(userTable, {
			fields: [trainingPaymentTable.recordedBy],
			references: [userTable.id],
		}),
		// Event payment: link to event registration (type="event")
		registration: one(eventRegistrationTable, {
			fields: [trainingPaymentTable.registrationId],
			references: [eventRegistrationTable.id],
			relationName: "registrationPayments",
		}),
	}),
);

// Training Payment Session relations (junction table)
export const trainingPaymentSessionRelations = relations(
	trainingPaymentSessionTable,
	({ one }) => ({
		payment: one(trainingPaymentTable, {
			fields: [trainingPaymentSessionTable.paymentId],
			references: [trainingPaymentTable.id],
		}),
		session: one(trainingSessionTable, {
			fields: [trainingPaymentSessionTable.sessionId],
			references: [trainingSessionTable.id],
		}),
	}),
);

// Service relations
export const serviceRelations = relations(serviceTable, ({ one, many }) => ({
	organization: one(organizationTable, {
		fields: [serviceTable.organizationId],
		references: [organizationTable.id],
	}),
	createdByUser: one(userTable, {
		fields: [serviceTable.createdBy],
		references: [userTable.id],
	}),
	priceHistory: many(servicePriceHistoryTable),
	athleteGroups: many(athleteGroupTable),
	trainingSessions: many(trainingSessionTable),
	payments: many(trainingPaymentTable),
	sportsEvents: many(sportsEventTable),
}));

// Service Price History relations
export const servicePriceHistoryRelations = relations(
	servicePriceHistoryTable,
	({ one }) => ({
		service: one(serviceTable, {
			fields: [servicePriceHistoryTable.serviceId],
			references: [serviceTable.id],
		}),
		createdByUser: one(userTable, {
			fields: [servicePriceHistoryTable.createdBy],
			references: [userTable.id],
		}),
	}),
);

// Athlete Evaluation relations
export const athleteEvaluationRelations = relations(
	athleteEvaluationTable,
	({ one }) => ({
		session: one(trainingSessionTable, {
			fields: [athleteEvaluationTable.sessionId],
			references: [trainingSessionTable.id],
		}),
		athlete: one(athleteTable, {
			fields: [athleteEvaluationTable.athleteId],
			references: [athleteTable.id],
		}),
		evaluatedByUser: one(userTable, {
			fields: [athleteEvaluationTable.evaluatedBy],
			references: [userTable.id],
		}),
	}),
);

// ============================================================================
// ATHLETE SCOUTING PROFILE RELATIONS
// ============================================================================

// Athlete Physical Metrics relations
export const athletePhysicalMetricsRelations = relations(
	athletePhysicalMetricsTable,
	({ one }) => ({
		athlete: one(athleteTable, {
			fields: [athletePhysicalMetricsTable.athleteId],
			references: [athleteTable.id],
		}),
		recordedByUser: one(userTable, {
			fields: [athletePhysicalMetricsTable.recordedBy],
			references: [userTable.id],
		}),
	}),
);

// Athlete Fitness Test relations
export const athleteFitnessTestRelations = relations(
	athleteFitnessTestTable,
	({ one }) => ({
		athlete: one(athleteTable, {
			fields: [athleteFitnessTestTable.athleteId],
			references: [athleteTable.id],
		}),
		evaluatedByUser: one(userTable, {
			fields: [athleteFitnessTestTable.evaluatedBy],
			references: [userTable.id],
		}),
	}),
);

// Athlete Career History relations
export const athleteCareerHistoryRelations = relations(
	athleteCareerHistoryTable,
	({ one }) => ({
		athlete: one(athleteTable, {
			fields: [athleteCareerHistoryTable.athleteId],
			references: [athleteTable.id],
		}),
		club: one(clubTable, {
			fields: [athleteCareerHistoryTable.clubId],
			references: [clubTable.id],
		}),
		nationalTeam: one(nationalTeamTable, {
			fields: [athleteCareerHistoryTable.nationalTeamId],
			references: [nationalTeamTable.id],
		}),
	}),
);

// Athlete Language relations
export const athleteLanguageRelations = relations(
	athleteLanguageTable,
	({ one }) => ({
		athlete: one(athleteTable, {
			fields: [athleteLanguageTable.athleteId],
			references: [athleteTable.id],
		}),
	}),
);

// Athlete Education relations
export const athleteEducationRelations = relations(
	athleteEducationTable,
	({ one }) => ({
		athlete: one(athleteTable, {
			fields: [athleteEducationTable.athleteId],
			references: [athleteTable.id],
		}),
	}),
);

// Athlete Reference relations
export const athleteReferenceRelations = relations(
	athleteReferenceTable,
	({ one }) => ({
		athlete: one(athleteTable, {
			fields: [athleteReferenceTable.athleteId],
			references: [athleteTable.id],
		}),
	}),
);

// Athlete Sponsor relations
export const athleteSponsorRelations = relations(
	athleteSponsorTable,
	({ one }) => ({
		athlete: one(athleteTable, {
			fields: [athleteSponsorTable.athleteId],
			references: [athleteTable.id],
		}),
	}),
);

// Athlete Achievement relations
export const athleteAchievementRelations = relations(
	athleteAchievementTable,
	({ one }) => ({
		athlete: one(athleteTable, {
			fields: [athleteAchievementTable.athleteId],
			references: [athleteTable.id],
		}),
	}),
);

// Athlete Medical Document relations
export const athleteMedicalDocumentRelations = relations(
	athleteMedicalDocumentTable,
	({ one }) => ({
		athlete: one(athleteTable, {
			fields: [athleteMedicalDocumentTable.athleteId],
			references: [athleteTable.id],
		}),
		uploadedByUser: one(userTable, {
			fields: [athleteMedicalDocumentTable.uploadedBy],
			references: [userTable.id],
		}),
	}),
);

export const athleteWellnessSurveyRelations = relations(
	athleteWellnessSurveyTable,
	({ one }) => ({
		athlete: one(athleteTable, {
			fields: [athleteWellnessSurveyTable.athleteId],
			references: [athleteTable.id],
		}),
		organization: one(organizationTable, {
			fields: [athleteWellnessSurveyTable.organizationId],
			references: [organizationTable.id],
		}),
	}),
);

export const athleteSessionFeedbackRelations = relations(
	athleteSessionFeedbackTable,
	({ one }) => ({
		session: one(trainingSessionTable, {
			fields: [athleteSessionFeedbackTable.sessionId],
			references: [trainingSessionTable.id],
		}),
		athlete: one(athleteTable, {
			fields: [athleteSessionFeedbackTable.athleteId],
			references: [athleteTable.id],
		}),
	}),
);

// ============================================================================
// SPORTS EVENTS RELATIONS
// ============================================================================

// Age Category relations
export const ageCategoryRelations = relations(
	ageCategoryTable,
	({ one, many }) => ({
		organization: one(organizationTable, {
			fields: [ageCategoryTable.organizationId],
			references: [organizationTable.id],
		}),
		eventAgeCategories: many(eventAgeCategoryTable),
		eventPricingTiers: many(eventPricingTierTable),
		eventRegistrations: many(eventRegistrationTable),
	}),
);

// Sports Event relations
export const sportsEventRelations = relations(
	sportsEventTable,
	({ one, many }) => ({
		organization: one(organizationTable, {
			fields: [sportsEventTable.organizationId],
			references: [organizationTable.id],
		}),
		location: one(locationTable, {
			fields: [sportsEventTable.locationId],
			references: [locationTable.id],
		}),
		service: one(serviceTable, {
			fields: [sportsEventTable.serviceId],
			references: [serviceTable.id],
		}),
		createdByUser: one(userTable, {
			fields: [sportsEventTable.createdBy],
			references: [userTable.id],
		}),
		ageCategories: many(eventAgeCategoryTable),
		pricingTiers: many(eventPricingTierTable),
		discounts: many(eventDiscountTable),
		registrations: many(eventRegistrationTable),
		coaches: many(eventCoachTable),
		// Event organization features
		checklists: many(eventChecklistTable),
		tasks: many(eventTaskTable),
		staff: many(eventStaffTable),
		budgetLines: many(eventBudgetLineTable),
		sponsors: many(eventSponsorTable),
		sponsorAssignments: many(eventSponsorAssignmentTable),
		milestones: many(eventMilestoneTable),
		documents: many(eventDocumentTable),
		notes: many(eventNoteTable),
		inventory: many(eventInventoryTable),
		vendorAssignments: many(eventVendorAssignmentTable),
		zones: many(eventZoneTable),
		risks: many(eventRiskTable),
		expenses: many(expenseTable),
	}),
);

// Event Age Category relations (junction table)
export const eventAgeCategoryRelations = relations(
	eventAgeCategoryTable,
	({ one }) => ({
		event: one(sportsEventTable, {
			fields: [eventAgeCategoryTable.eventId],
			references: [sportsEventTable.id],
		}),
		ageCategory: one(ageCategoryTable, {
			fields: [eventAgeCategoryTable.ageCategoryId],
			references: [ageCategoryTable.id],
		}),
	}),
);

// Event Pricing Tier relations
export const eventPricingTierRelations = relations(
	eventPricingTierTable,
	({ one, many }) => ({
		event: one(sportsEventTable, {
			fields: [eventPricingTierTable.eventId],
			references: [sportsEventTable.id],
		}),
		ageCategory: one(ageCategoryTable, {
			fields: [eventPricingTierTable.ageCategoryId],
			references: [ageCategoryTable.id],
		}),
		registrations: many(eventRegistrationTable),
	}),
);

// Event Registration relations
export const eventRegistrationRelations = relations(
	eventRegistrationTable,
	({ one, many }) => ({
		event: one(sportsEventTable, {
			fields: [eventRegistrationTable.eventId],
			references: [sportsEventTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventRegistrationTable.organizationId],
			references: [organizationTable.id],
		}),
		athlete: one(athleteTable, {
			fields: [eventRegistrationTable.athleteId],
			references: [athleteTable.id],
		}),
		user: one(userTable, {
			fields: [eventRegistrationTable.userId],
			references: [userTable.id],
		}),
		ageCategory: one(ageCategoryTable, {
			fields: [eventRegistrationTable.ageCategoryId],
			references: [ageCategoryTable.id],
		}),
		appliedPricingTier: one(eventPricingTierTable, {
			fields: [eventRegistrationTable.appliedPricingTierId],
			references: [eventPricingTierTable.id],
		}),
		appliedDiscount: one(eventDiscountTable, {
			fields: [eventRegistrationTable.appliedDiscountId],
			references: [eventDiscountTable.id],
		}),
		payments: many(trainingPaymentTable, {
			relationName: "registrationPayments",
		}),
		discountUsages: many(eventDiscountUsageTable),
	}),
);

// Event Coach relations
export const eventCoachRelations = relations(eventCoachTable, ({ one }) => ({
	event: one(sportsEventTable, {
		fields: [eventCoachTable.eventId],
		references: [sportsEventTable.id],
	}),
	coach: one(coachTable, {
		fields: [eventCoachTable.coachId],
		references: [coachTable.id],
	}),
}));

// ============================================================================
// EVENT DISCOUNT RELATIONS
// ============================================================================

// Event Discount relations
export const eventDiscountRelations = relations(
	eventDiscountTable,
	({ one, many }) => ({
		event: one(sportsEventTable, {
			fields: [eventDiscountTable.eventId],
			references: [sportsEventTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventDiscountTable.organizationId],
			references: [organizationTable.id],
		}),
		usages: many(eventDiscountUsageTable),
		registrations: many(eventRegistrationTable),
	}),
);

// Event Discount Usage relations
export const eventDiscountUsageRelations = relations(
	eventDiscountUsageTable,
	({ one }) => ({
		discount: one(eventDiscountTable, {
			fields: [eventDiscountUsageTable.discountId],
			references: [eventDiscountTable.id],
		}),
		registration: one(eventRegistrationTable, {
			fields: [eventDiscountUsageTable.registrationId],
			references: [eventRegistrationTable.id],
		}),
	}),
);

// ============================================================================
// EXPENSE & CASH REGISTER RELATIONS
// ============================================================================

// Expense Category relations
export const expenseCategoryRelations = relations(
	expenseCategoryTable,
	({ one, many }) => ({
		organization: one(organizationTable, {
			fields: [expenseCategoryTable.organizationId],
			references: [organizationTable.id],
		}),
		expenses: many(expenseTable),
	}),
);

// Expense relations
export const expenseRelations = relations(expenseTable, ({ one }) => ({
	organization: one(organizationTable, {
		fields: [expenseTable.organizationId],
		references: [organizationTable.id],
	}),
	categoryRef: one(expenseCategoryTable, {
		fields: [expenseTable.categoryId],
		references: [expenseCategoryTable.id],
	}),
	recordedByUser: one(userTable, {
		fields: [expenseTable.recordedBy],
		references: [userTable.id],
	}),
	event: one(sportsEventTable, {
		fields: [expenseTable.eventId],
		references: [sportsEventTable.id],
	}),
}));

// Cash Register relations
export const cashRegisterRelations = relations(
	cashRegisterTable,
	({ one, many }) => ({
		organization: one(organizationTable, {
			fields: [cashRegisterTable.organizationId],
			references: [organizationTable.id],
		}),
		openedByUser: one(userTable, {
			fields: [cashRegisterTable.openedBy],
			references: [userTable.id],
			relationName: "openedByUser",
		}),
		closedByUser: one(userTable, {
			fields: [cashRegisterTable.closedBy],
			references: [userTable.id],
			relationName: "closedByUser",
		}),
		movements: many(cashMovementTable),
	}),
);

// Cash Movement relations
export const cashMovementRelations = relations(
	cashMovementTable,
	({ one }) => ({
		cashRegister: one(cashRegisterTable, {
			fields: [cashMovementTable.cashRegisterId],
			references: [cashRegisterTable.id],
		}),
		organization: one(organizationTable, {
			fields: [cashMovementTable.organizationId],
			references: [organizationTable.id],
		}),
		recordedByUser: one(userTable, {
			fields: [cashMovementTable.recordedBy],
			references: [userTable.id],
		}),
	}),
);

// ============================================================================
// WAITLIST RELATIONS
// ============================================================================

// Waitlist Entry relations
export const waitlistEntryRelations = relations(
	waitlistEntryTable,
	({ one }) => ({
		organization: one(organizationTable, {
			fields: [waitlistEntryTable.organizationId],
			references: [organizationTable.id],
		}),
		athlete: one(athleteTable, {
			fields: [waitlistEntryTable.athleteId],
			references: [athleteTable.id],
		}),
		athleteGroup: one(athleteGroupTable, {
			fields: [waitlistEntryTable.athleteGroupId],
			references: [athleteGroupTable.id],
		}),
		createdByUser: one(userTable, {
			fields: [waitlistEntryTable.createdBy],
			references: [userTable.id],
			relationName: "waitlistCreatedBy",
		}),
		assignedByUser: one(userTable, {
			fields: [waitlistEntryTable.assignedBy],
			references: [userTable.id],
			relationName: "waitlistAssignedBy",
		}),
	}),
);

// ============================================================================
// EVENT ORGANIZATION RELATIONS
// ============================================================================

// Vendor relations (organization-level, shared across events)
export const eventVendorRelations = relations(
	eventVendorTable,
	({ one, many }) => ({
		organization: one(organizationTable, {
			fields: [eventVendorTable.organizationId],
			references: [organizationTable.id],
		}),
		createdByUser: one(userTable, {
			fields: [eventVendorTable.createdBy],
			references: [userTable.id],
		}),
		eventAssignments: many(eventVendorAssignmentTable),
		budgetLines: many(eventBudgetLineTable),
		inventoryItems: many(eventInventoryTable),
	}),
);

// Sponsor relations (organization-level, shared across events)
export const sponsorRelations = relations(sponsorTable, ({ one, many }) => ({
	organization: one(organizationTable, {
		fields: [sponsorTable.organizationId],
		references: [organizationTable.id],
	}),
	createdByUser: one(userTable, {
		fields: [sponsorTable.createdBy],
		references: [userTable.id],
	}),
	eventAssignments: many(eventSponsorAssignmentTable),
}));

// Event sponsor assignment relations
export const eventSponsorAssignmentRelations = relations(
	eventSponsorAssignmentTable,
	({ one }) => ({
		event: one(sportsEventTable, {
			fields: [eventSponsorAssignmentTable.eventId],
			references: [sportsEventTable.id],
		}),
		sponsor: one(sponsorTable, {
			fields: [eventSponsorAssignmentTable.sponsorId],
			references: [sponsorTable.id],
		}),
	}),
);

// Zone relations
export const eventZoneRelations = relations(
	eventZoneTable,
	({ one, many }) => ({
		event: one(sportsEventTable, {
			fields: [eventZoneTable.eventId],
			references: [sportsEventTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventZoneTable.organizationId],
			references: [organizationTable.id],
		}),
		createdByUser: one(userTable, {
			fields: [eventZoneTable.createdBy],
			references: [userTable.id],
		}),
		staffShifts: many(eventStaffShiftTable),
		inventoryItems: many(eventInventoryTable),
		staff: many(eventZoneStaffTable),
	}),
);

// Zone staff relations
export const eventZoneStaffRelations = relations(
	eventZoneStaffTable,
	({ one }) => ({
		zone: one(eventZoneTable, {
			fields: [eventZoneStaffTable.zoneId],
			references: [eventZoneTable.id],
		}),
		staff: one(eventStaffTable, {
			fields: [eventZoneStaffTable.staffId],
			references: [eventStaffTable.id],
		}),
	}),
);

// Checklist relations
export const eventChecklistRelations = relations(
	eventChecklistTable,
	({ one }) => ({
		event: one(sportsEventTable, {
			fields: [eventChecklistTable.eventId],
			references: [sportsEventTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventChecklistTable.organizationId],
			references: [organizationTable.id],
		}),
		completedByUser: one(userTable, {
			fields: [eventChecklistTable.completedBy],
			references: [userTable.id],
			relationName: "checklistCompletedBy",
		}),
		createdByUser: one(userTable, {
			fields: [eventChecklistTable.createdBy],
			references: [userTable.id],
			relationName: "checklistCreatedBy",
		}),
	}),
);

// Task relations
export const eventTaskRelations = relations(eventTaskTable, ({ one }) => ({
	event: one(sportsEventTable, {
		fields: [eventTaskTable.eventId],
		references: [sportsEventTable.id],
	}),
	organization: one(organizationTable, {
		fields: [eventTaskTable.organizationId],
		references: [organizationTable.id],
	}),
	assignee: one(userTable, {
		fields: [eventTaskTable.assigneeId],
		references: [userTable.id],
		relationName: "taskAssignee",
	}),
	createdByUser: one(userTable, {
		fields: [eventTaskTable.createdBy],
		references: [userTable.id],
		relationName: "taskCreatedBy",
	}),
}));

// Staff relations
export const eventStaffRelations = relations(
	eventStaffTable,
	({ one, many }) => ({
		event: one(sportsEventTable, {
			fields: [eventStaffTable.eventId],
			references: [sportsEventTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventStaffTable.organizationId],
			references: [organizationTable.id],
		}),
		user: one(userTable, {
			fields: [eventStaffTable.userId],
			references: [userTable.id],
		}),
		createdByUser: one(userTable, {
			fields: [eventStaffTable.createdBy],
			references: [userTable.id],
			relationName: "staffCreatedBy",
		}),
		shifts: many(eventStaffShiftTable),
	}),
);

// Staff shift relations
export const eventStaffShiftRelations = relations(
	eventStaffShiftTable,
	({ one }) => ({
		staff: one(eventStaffTable, {
			fields: [eventStaffShiftTable.staffId],
			references: [eventStaffTable.id],
		}),
		event: one(sportsEventTable, {
			fields: [eventStaffShiftTable.eventId],
			references: [sportsEventTable.id],
		}),
		zone: one(eventZoneTable, {
			fields: [eventStaffShiftTable.zoneId],
			references: [eventZoneTable.id],
		}),
	}),
);

// Budget line relations
export const eventBudgetLineRelations = relations(
	eventBudgetLineTable,
	({ one }) => ({
		event: one(sportsEventTable, {
			fields: [eventBudgetLineTable.eventId],
			references: [sportsEventTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventBudgetLineTable.organizationId],
			references: [organizationTable.id],
		}),
		category: one(expenseCategoryTable, {
			fields: [eventBudgetLineTable.categoryId],
			references: [expenseCategoryTable.id],
		}),
		expense: one(expenseTable, {
			fields: [eventBudgetLineTable.expenseId],
			references: [expenseTable.id],
		}),
		vendor: one(eventVendorTable, {
			fields: [eventBudgetLineTable.vendorId],
			references: [eventVendorTable.id],
		}),
		approvedByUser: one(userTable, {
			fields: [eventBudgetLineTable.approvedBy],
			references: [userTable.id],
			relationName: "budgetApprovedBy",
		}),
		createdByUser: one(userTable, {
			fields: [eventBudgetLineTable.createdBy],
			references: [userTable.id],
			relationName: "budgetCreatedBy",
		}),
	}),
);

// Sponsor relations
export const eventSponsorRelations = relations(
	eventSponsorTable,
	({ one, many }) => ({
		event: one(sportsEventTable, {
			fields: [eventSponsorTable.eventId],
			references: [sportsEventTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventSponsorTable.organizationId],
			references: [organizationTable.id],
		}),
		createdByUser: one(userTable, {
			fields: [eventSponsorTable.createdBy],
			references: [userTable.id],
		}),
		benefits: many(eventSponsorBenefitTable),
	}),
);

// Sponsor benefit relations
export const eventSponsorBenefitRelations = relations(
	eventSponsorBenefitTable,
	({ one }) => ({
		sponsor: one(eventSponsorTable, {
			fields: [eventSponsorBenefitTable.sponsorId],
			references: [eventSponsorTable.id],
		}),
	}),
);

// Milestone relations
export const eventMilestoneRelations = relations(
	eventMilestoneTable,
	({ one }) => ({
		event: one(sportsEventTable, {
			fields: [eventMilestoneTable.eventId],
			references: [sportsEventTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventMilestoneTable.organizationId],
			references: [organizationTable.id],
		}),
		responsible: one(userTable, {
			fields: [eventMilestoneTable.responsibleId],
			references: [userTable.id],
			relationName: "milestoneResponsible",
		}),
		createdByUser: one(userTable, {
			fields: [eventMilestoneTable.createdBy],
			references: [userTable.id],
			relationName: "milestoneCreatedBy",
		}),
	}),
);

// Document relations
export const eventDocumentRelations = relations(
	eventDocumentTable,
	({ one }) => ({
		event: one(sportsEventTable, {
			fields: [eventDocumentTable.eventId],
			references: [sportsEventTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventDocumentTable.organizationId],
			references: [organizationTable.id],
		}),
		uploadedByUser: one(userTable, {
			fields: [eventDocumentTable.uploadedBy],
			references: [userTable.id],
		}),
	}),
);

// Note relations
export const eventNoteRelations = relations(
	eventNoteTable,
	({ one, many }) => ({
		event: one(sportsEventTable, {
			fields: [eventNoteTable.eventId],
			references: [sportsEventTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventNoteTable.organizationId],
			references: [organizationTable.id],
		}),
		author: one(userTable, {
			fields: [eventNoteTable.authorId],
			references: [userTable.id],
		}),
		parentNote: one(eventNoteTable, {
			fields: [eventNoteTable.parentNoteId],
			references: [eventNoteTable.id],
			relationName: "noteReplies",
		}),
		replies: many(eventNoteTable, {
			relationName: "noteReplies",
		}),
		pinnedByUser: one(userTable, {
			fields: [eventNoteTable.pinnedBy],
			references: [userTable.id],
			relationName: "notePinnedBy",
		}),
	}),
);

// Inventory relations
export const eventInventoryRelations = relations(
	eventInventoryTable,
	({ one }) => ({
		event: one(sportsEventTable, {
			fields: [eventInventoryTable.eventId],
			references: [sportsEventTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventInventoryTable.organizationId],
			references: [organizationTable.id],
		}),
		vendor: one(eventVendorTable, {
			fields: [eventInventoryTable.vendorId],
			references: [eventVendorTable.id],
		}),
		zone: one(eventZoneTable, {
			fields: [eventInventoryTable.zoneId],
			references: [eventZoneTable.id],
		}),
		responsible: one(userTable, {
			fields: [eventInventoryTable.responsibleId],
			references: [userTable.id],
			relationName: "inventoryResponsible",
		}),
		createdByUser: one(userTable, {
			fields: [eventInventoryTable.createdBy],
			references: [userTable.id],
			relationName: "inventoryCreatedBy",
		}),
	}),
);

// Vendor assignment relations
export const eventVendorAssignmentRelations = relations(
	eventVendorAssignmentTable,
	({ one }) => ({
		event: one(sportsEventTable, {
			fields: [eventVendorAssignmentTable.eventId],
			references: [sportsEventTable.id],
		}),
		vendor: one(eventVendorTable, {
			fields: [eventVendorAssignmentTable.vendorId],
			references: [eventVendorTable.id],
		}),
	}),
);

// Risk relations
export const eventRiskRelations = relations(
	eventRiskTable,
	({ one, many }) => ({
		event: one(sportsEventTable, {
			fields: [eventRiskTable.eventId],
			references: [sportsEventTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventRiskTable.organizationId],
			references: [organizationTable.id],
		}),
		owner: one(userTable, {
			fields: [eventRiskTable.ownerId],
			references: [userTable.id],
			relationName: "riskOwner",
		}),
		createdByUser: one(userTable, {
			fields: [eventRiskTable.createdBy],
			references: [userTable.id],
			relationName: "riskCreatedBy",
		}),
		logs: many(eventRiskLogTable),
	}),
);

// Risk log relations
export const eventRiskLogRelations = relations(
	eventRiskLogTable,
	({ one }) => ({
		risk: one(eventRiskTable, {
			fields: [eventRiskLogTable.riskId],
			references: [eventRiskTable.id],
		}),
		user: one(userTable, {
			fields: [eventRiskLogTable.userId],
			references: [userTable.id],
		}),
	}),
);

// ============================================================================
// STOCK & PRODUCT RELATIONS
// ============================================================================

// Product relations
export const productRelations = relations(productTable, ({ one, many }) => ({
	organization: one(organizationTable, {
		fields: [productTable.organizationId],
		references: [organizationTable.id],
	}),
	createdByUser: one(userTable, {
		fields: [productTable.createdBy],
		references: [userTable.id],
		relationName: "productCreatedBy",
	}),
	stockTransactions: many(stockTransactionTable),
	saleItems: many(saleItemTable),
}));

// Stock transaction relations
export const stockTransactionRelations = relations(
	stockTransactionTable,
	({ one }) => ({
		organization: one(organizationTable, {
			fields: [stockTransactionTable.organizationId],
			references: [organizationTable.id],
		}),
		product: one(productTable, {
			fields: [stockTransactionTable.productId],
			references: [productTable.id],
		}),
		recordedByUser: one(userTable, {
			fields: [stockTransactionTable.recordedBy],
			references: [userTable.id],
			relationName: "stockTransactionRecordedBy",
		}),
	}),
);

// Sale relations
export const saleRelations = relations(saleTable, ({ one, many }) => ({
	organization: one(organizationTable, {
		fields: [saleTable.organizationId],
		references: [organizationTable.id],
	}),
	athlete: one(athleteTable, {
		fields: [saleTable.athleteId],
		references: [athleteTable.id],
	}),
	cashMovement: one(cashMovementTable, {
		fields: [saleTable.cashMovementId],
		references: [cashMovementTable.id],
	}),
	soldByUser: one(userTable, {
		fields: [saleTable.soldBy],
		references: [userTable.id],
		relationName: "saleSoldBy",
	}),
	items: many(saleItemTable),
}));

// Sale item relations
export const saleItemRelations = relations(saleItemTable, ({ one }) => ({
	sale: one(saleTable, {
		fields: [saleItemTable.saleId],
		references: [saleTable.id],
	}),
	product: one(productTable, {
		fields: [saleItemTable.productId],
		references: [productTable.id],
	}),
}));

// ============================================================================
// TRAINING EQUIPMENT RELATIONS
// ============================================================================

// Training equipment relations
export const trainingEquipmentRelations = relations(
	trainingEquipmentTable,
	({ one, many }) => ({
		organization: one(organizationTable, {
			fields: [trainingEquipmentTable.organizationId],
			references: [organizationTable.id],
		}),
		location: one(locationTable, {
			fields: [trainingEquipmentTable.locationId],
			references: [locationTable.id],
		}),
		createdByUser: one(userTable, {
			fields: [trainingEquipmentTable.createdBy],
			references: [userTable.id],
			relationName: "equipmentCreatedBy",
		}),
		assignments: many(equipmentAssignmentTable),
		maintenanceRecords: many(equipmentMaintenanceTable),
		inventoryCounts: many(equipmentInventoryCountTable),
	}),
);

// Equipment assignment relations
export const equipmentAssignmentRelations = relations(
	equipmentAssignmentTable,
	({ one }) => ({
		organization: one(organizationTable, {
			fields: [equipmentAssignmentTable.organizationId],
			references: [organizationTable.id],
		}),
		equipment: one(trainingEquipmentTable, {
			fields: [equipmentAssignmentTable.equipmentId],
			references: [trainingEquipmentTable.id],
		}),
		athleteGroup: one(athleteGroupTable, {
			fields: [equipmentAssignmentTable.athleteGroupId],
			references: [athleteGroupTable.id],
		}),
		trainingSession: one(trainingSessionTable, {
			fields: [equipmentAssignmentTable.trainingSessionId],
			references: [trainingSessionTable.id],
		}),
		coach: one(coachTable, {
			fields: [equipmentAssignmentTable.coachId],
			references: [coachTable.id],
		}),
		assignedByUser: one(userTable, {
			fields: [equipmentAssignmentTable.assignedBy],
			references: [userTable.id],
			relationName: "equipmentAssignedBy",
		}),
	}),
);

// Equipment maintenance relations
export const equipmentMaintenanceRelations = relations(
	equipmentMaintenanceTable,
	({ one }) => ({
		equipment: one(trainingEquipmentTable, {
			fields: [equipmentMaintenanceTable.equipmentId],
			references: [trainingEquipmentTable.id],
		}),
		performedByUser: one(userTable, {
			fields: [equipmentMaintenanceTable.performedBy],
			references: [userTable.id],
			relationName: "maintenancePerformedBy",
		}),
	}),
);

// ============================================================================
// EQUIPMENT INVENTORY AUDIT RELATIONS
// ============================================================================

// Inventory audit relations
export const equipmentInventoryAuditRelations = relations(
	equipmentInventoryAuditTable,
	({ one, many }) => ({
		organization: one(organizationTable, {
			fields: [equipmentInventoryAuditTable.organizationId],
			references: [organizationTable.id],
		}),
		location: one(locationTable, {
			fields: [equipmentInventoryAuditTable.locationId],
			references: [locationTable.id],
		}),
		createdByUser: one(userTable, {
			fields: [equipmentInventoryAuditTable.createdBy],
			references: [userTable.id],
			relationName: "auditCreatedBy",
		}),
		performedByUser: one(userTable, {
			fields: [equipmentInventoryAuditTable.performedBy],
			references: [userTable.id],
			relationName: "auditPerformedBy",
		}),
		approvedByUser: one(userTable, {
			fields: [equipmentInventoryAuditTable.approvedBy],
			references: [userTable.id],
			relationName: "auditApprovedBy",
		}),
		counts: many(equipmentInventoryCountTable),
	}),
);

// Inventory count item relations
export const equipmentInventoryCountRelations = relations(
	equipmentInventoryCountTable,
	({ one }) => ({
		audit: one(equipmentInventoryAuditTable, {
			fields: [equipmentInventoryCountTable.auditId],
			references: [equipmentInventoryAuditTable.id],
		}),
		equipment: one(trainingEquipmentTable, {
			fields: [equipmentInventoryCountTable.equipmentId],
			references: [trainingEquipmentTable.id],
		}),
		countedByUser: one(userTable, {
			fields: [equipmentInventoryCountTable.countedBy],
			references: [userTable.id],
			relationName: "countCountedBy",
		}),
		adjustedByUser: one(userTable, {
			fields: [equipmentInventoryCountTable.adjustedBy],
			references: [userTable.id],
			relationName: "countAdjustedBy",
		}),
	}),
);

// ============================================================================
// STAFF PAYROLL RELATIONS
// ============================================================================

// Staff payroll relations
export const staffPayrollRelations = relations(
	staffPayrollTable,
	({ one }) => ({
		organization: one(organizationTable, {
			fields: [staffPayrollTable.organizationId],
			references: [organizationTable.id],
		}),
		coach: one(coachTable, {
			fields: [staffPayrollTable.coachId],
			references: [coachTable.id],
		}),
		user: one(userTable, {
			fields: [staffPayrollTable.userId],
			references: [userTable.id],
			relationName: "payrollRecipient",
		}),
		expense: one(expenseTable, {
			fields: [staffPayrollTable.expenseId],
			references: [expenseTable.id],
		}),
		createdByUser: one(userTable, {
			fields: [staffPayrollTable.createdBy],
			references: [userTable.id],
			relationName: "payrollCreatedBy",
		}),
		approvedByUser: one(userTable, {
			fields: [staffPayrollTable.approvedBy],
			references: [userTable.id],
			relationName: "payrollApprovedBy",
		}),
		paidByUser: one(userTable, {
			fields: [staffPayrollTable.paidBy],
			references: [userTable.id],
			relationName: "payrollPaidBy",
		}),
	}),
);

// ============================================================================
// EVENT TEMPLATE RELATIONS
// ============================================================================

// Event template relations
export const eventTemplateRelations = relations(
	eventTemplateTable,
	({ one }) => ({
		organization: one(organizationTable, {
			fields: [eventTemplateTable.organizationId],
			references: [organizationTable.id],
		}),
		sourceEvent: one(sportsEventTable, {
			fields: [eventTemplateTable.sourceEventId],
			references: [sportsEventTable.id],
		}),
		createdByUser: one(userTable, {
			fields: [eventTemplateTable.createdBy],
			references: [userTable.id],
		}),
	}),
);

// ============================================================================
// EVENT ROTATION SCHEDULE RELATIONS
// ============================================================================

// Event group relations
export const eventGroupRelations = relations(
	eventGroupTable,
	({ one, many }) => ({
		event: one(sportsEventTable, {
			fields: [eventGroupTable.eventId],
			references: [sportsEventTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventGroupTable.organizationId],
			references: [organizationTable.id],
		}),
		leader: one(eventStaffTable, {
			fields: [eventGroupTable.leaderId],
			references: [eventStaffTable.id],
		}),
		members: many(eventGroupMemberTable),
		rotationAssignments: many(eventRotationAssignmentTable),
		createdByUser: one(userTable, {
			fields: [eventGroupTable.createdBy],
			references: [userTable.id],
		}),
	}),
);

// Event group member relations
export const eventGroupMemberRelations = relations(
	eventGroupMemberTable,
	({ one }) => ({
		group: one(eventGroupTable, {
			fields: [eventGroupMemberTable.groupId],
			references: [eventGroupTable.id],
		}),
		registration: one(eventRegistrationTable, {
			fields: [eventGroupMemberTable.registrationId],
			references: [eventRegistrationTable.id],
		}),
		assignedByUser: one(userTable, {
			fields: [eventGroupMemberTable.assignedBy],
			references: [userTable.id],
		}),
	}),
);

// Event station relations
export const eventStationRelations = relations(
	eventStationTable,
	({ one, many }) => ({
		event: one(sportsEventTable, {
			fields: [eventStationTable.eventId],
			references: [sportsEventTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventStationTable.organizationId],
			references: [organizationTable.id],
		}),
		zone: one(eventZoneTable, {
			fields: [eventStationTable.zoneId],
			references: [eventZoneTable.id],
		}),
		staff: many(eventStationStaffTable),
		rotationAssignments: many(eventRotationAssignmentTable),
		createdByUser: one(userTable, {
			fields: [eventStationTable.createdBy],
			references: [userTable.id],
		}),
	}),
);

// Event station staff relations
export const eventStationStaffRelations = relations(
	eventStationStaffTable,
	({ one }) => ({
		station: one(eventStationTable, {
			fields: [eventStationStaffTable.stationId],
			references: [eventStationTable.id],
		}),
		staff: one(eventStaffTable, {
			fields: [eventStationStaffTable.staffId],
			references: [eventStaffTable.id],
		}),
	}),
);

// Event rotation schedule relations
export const eventRotationScheduleRelations = relations(
	eventRotationScheduleTable,
	({ one, many }) => ({
		event: one(sportsEventTable, {
			fields: [eventRotationScheduleTable.eventId],
			references: [sportsEventTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventRotationScheduleTable.organizationId],
			references: [organizationTable.id],
		}),
		timeBlocks: many(eventTimeBlockTable),
		createdByUser: one(userTable, {
			fields: [eventRotationScheduleTable.createdBy],
			references: [userTable.id],
		}),
	}),
);

// Event time block relations
export const eventTimeBlockRelations = relations(
	eventTimeBlockTable,
	({ one, many }) => ({
		schedule: one(eventRotationScheduleTable, {
			fields: [eventTimeBlockTable.scheduleId],
			references: [eventRotationScheduleTable.id],
		}),
		zone: one(eventZoneTable, {
			fields: [eventTimeBlockTable.zoneId],
			references: [eventZoneTable.id],
		}),
		assignments: many(eventRotationAssignmentTable),
	}),
);

// Event rotation assignment relations
export const eventRotationAssignmentRelations = relations(
	eventRotationAssignmentTable,
	({ one }) => ({
		timeBlock: one(eventTimeBlockTable, {
			fields: [eventRotationAssignmentTable.timeBlockId],
			references: [eventTimeBlockTable.id],
		}),
		group: one(eventGroupTable, {
			fields: [eventRotationAssignmentTable.groupId],
			references: [eventGroupTable.id],
		}),
		station: one(eventStationTable, {
			fields: [eventRotationAssignmentTable.stationId],
			references: [eventStationTable.id],
		}),
	}),
);

// ============================================================================
// TEAM / SQUAD MANAGEMENT RELATIONS
// ============================================================================

// Season relations
export const seasonRelations = relations(seasonTable, ({ one, many }) => ({
	organization: one(organizationTable, {
		fields: [seasonTable.organizationId],
		references: [organizationTable.id],
	}),
	createdByUser: one(userTable, {
		fields: [seasonTable.createdBy],
		references: [userTable.id],
	}),
	teams: many(teamTable),
	competitions: many(competitionTable),
}));

// Team relations
export const teamRelations = relations(teamTable, ({ one, many }) => ({
	organization: one(organizationTable, {
		fields: [teamTable.organizationId],
		references: [organizationTable.id],
	}),
	season: one(seasonTable, {
		fields: [teamTable.seasonId],
		references: [seasonTable.id],
	}),
	ageCategory: one(ageCategoryTable, {
		fields: [teamTable.ageCategoryId],
		references: [ageCategoryTable.id],
	}),
	createdByUser: one(userTable, {
		fields: [teamTable.createdBy],
		references: [userTable.id],
	}),
	members: many(teamMemberTable),
	staff: many(teamStaffTable),
	competitions: many(teamCompetitionTable),
	homeMatches: many(matchTable, { relationName: "homeTeam" }),
	awayMatches: many(matchTable, { relationName: "awayTeam" }),
}));

// Team member relations
export const teamMemberRelations = relations(teamMemberTable, ({ one }) => ({
	team: one(teamTable, {
		fields: [teamMemberTable.teamId],
		references: [teamTable.id],
	}),
	athlete: one(athleteTable, {
		fields: [teamMemberTable.athleteId],
		references: [athleteTable.id],
	}),
}));

// Team staff relations
export const teamStaffRelations = relations(teamStaffTable, ({ one }) => ({
	team: one(teamTable, {
		fields: [teamStaffTable.teamId],
		references: [teamTable.id],
	}),
	coach: one(coachTable, {
		fields: [teamStaffTable.coachId],
		references: [coachTable.id],
	}),
	user: one(userTable, {
		fields: [teamStaffTable.userId],
		references: [userTable.id],
	}),
}));

// Competition relations
export const competitionRelations = relations(
	competitionTable,
	({ one, many }) => ({
		organization: one(organizationTable, {
			fields: [competitionTable.organizationId],
			references: [organizationTable.id],
		}),
		season: one(seasonTable, {
			fields: [competitionTable.seasonId],
			references: [seasonTable.id],
		}),
		createdByUser: one(userTable, {
			fields: [competitionTable.createdBy],
			references: [userTable.id],
		}),
		teams: many(teamCompetitionTable),
		matches: many(matchTable),
	}),
);

// Team competition relations
export const teamCompetitionRelations = relations(
	teamCompetitionTable,
	({ one }) => ({
		team: one(teamTable, {
			fields: [teamCompetitionTable.teamId],
			references: [teamTable.id],
		}),
		competition: one(competitionTable, {
			fields: [teamCompetitionTable.competitionId],
			references: [competitionTable.id],
		}),
	}),
);

// Match relations
export const matchRelations = relations(matchTable, ({ one }) => ({
	organization: one(organizationTable, {
		fields: [matchTable.organizationId],
		references: [organizationTable.id],
	}),
	competition: one(competitionTable, {
		fields: [matchTable.competitionId],
		references: [competitionTable.id],
	}),
	homeTeam: one(teamTable, {
		fields: [matchTable.homeTeamId],
		references: [teamTable.id],
		relationName: "homeTeam",
	}),
	awayTeam: one(teamTable, {
		fields: [matchTable.awayTeamId],
		references: [teamTable.id],
		relationName: "awayTeam",
	}),
	location: one(locationTable, {
		fields: [matchTable.locationId],
		references: [locationTable.id],
	}),
	createdByUser: one(userTable, {
		fields: [matchTable.createdBy],
		references: [userTable.id],
	}),
}));

// Session confirmation history relations
export const sessionConfirmationHistoryRelations = relations(
	sessionConfirmationHistoryTable,
	({ one }) => ({
		organization: one(organizationTable, {
			fields: [sessionConfirmationHistoryTable.organizationId],
			references: [organizationTable.id],
		}),
		session: one(trainingSessionTable, {
			fields: [sessionConfirmationHistoryTable.sessionId],
			references: [trainingSessionTable.id],
		}),
		athlete: one(athleteTable, {
			fields: [sessionConfirmationHistoryTable.athleteId],
			references: [athleteTable.id],
		}),
		initiator: one(userTable, {
			fields: [sessionConfirmationHistoryTable.initiatedBy],
			references: [userTable.id],
		}),
	}),
);

// User notification settings relations
export const userNotificationSettingsRelations = relations(
	userNotificationSettingsTable,
	({ one }) => ({
		user: one(userTable, {
			fields: [userNotificationSettingsTable.userId],
			references: [userTable.id],
		}),
		organization: one(organizationTable, {
			fields: [userNotificationSettingsTable.organizationId],
			references: [organizationTable.id],
		}),
	}),
);

// Audit log relations
export const auditLogRelations = relations(auditLogTable, ({ one }) => ({
	organization: one(organizationTable, {
		fields: [auditLogTable.organizationId],
		references: [organizationTable.id],
	}),
	user: one(userTable, {
		fields: [auditLogTable.userId],
		references: [userTable.id],
	}),
	session: one(sessionTable, {
		fields: [auditLogTable.sessionId],
		references: [sessionTable.id],
	}),
}));
