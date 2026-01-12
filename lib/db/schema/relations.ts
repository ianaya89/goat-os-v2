import { relations } from "drizzle-orm";
import {
	accountTable,
	ageCategoryTable,
	aiChatTable,
	athleteCareerHistoryTable,
	athleteEvaluationTable,
	athleteFitnessTestTable,
	athleteGroupMemberTable,
	athleteGroupTable,
	athletePhysicalMetricsTable,
	athleteSessionFeedbackTable,
	athleteTable,
	athleteWellnessSurveyTable,
	attendanceTable,
	billingEventTable,
	cashMovementTable,
	cashRegisterTable,
	coachTable,
	creditBalanceTable,
	creditDeductionFailureTable,
	creditTransactionTable,
	eventAgeCategoryTable,
	eventCoachTable,
	eventPaymentTable,
	eventPricingTierTable,
	eventRegistrationTable,
	expenseCategoryTable,
	expenseTable,
	invitationTable,
	locationTable,
	memberTable,
	orderItemTable,
	orderTable,
	organizationTable,
	recurringSessionExceptionTable,
	sessionTable,
	sportsEventTable,
	subscriptionItemTable,
	subscriptionTable,
	trainingPaymentTable,
	trainingSessionAthleteTable,
	trainingSessionCoachTable,
	trainingSessionTable,
	twoFactorTable,
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
		coaches: many(coachTable),
		athletes: many(athleteTable),
		creditBalance: one(creditBalanceTable),
		creditTransactions: many(creditTransactionTable),
		// Training-related relations
		locations: many(locationTable),
		athleteGroups: many(athleteGroupTable),
		trainingSessions: many(trainingSessionTable),
		trainingPayments: many(trainingPaymentTable),
		waitlistEntries: many(waitlistEntryTable),
		// Sports events relations
		ageCategories: many(ageCategoryTable),
		sportsEvents: many(sportsEventTable),
		eventRegistrations: many(eventRegistrationTable),
		eventPayments: many(eventPaymentTable),
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
}));

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
		evaluations: many(athleteEvaluationTable),
		exceptions: many(recurringSessionExceptionTable),
		feedback: many(athleteSessionFeedbackTable),
		waitlistEntries: many(waitlistEntryTable),
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
	({ one }) => ({
		organization: one(organizationTable, {
			fields: [trainingPaymentTable.organizationId],
			references: [organizationTable.id],
		}),
		session: one(trainingSessionTable, {
			fields: [trainingPaymentTable.sessionId],
			references: [trainingSessionTable.id],
		}),
		athlete: one(athleteTable, {
			fields: [trainingPaymentTable.athleteId],
			references: [athleteTable.id],
		}),
		recordedByUser: one(userTable, {
			fields: [trainingPaymentTable.recordedBy],
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
		createdByUser: one(userTable, {
			fields: [sportsEventTable.createdBy],
			references: [userTable.id],
		}),
		ageCategories: many(eventAgeCategoryTable),
		pricingTiers: many(eventPricingTierTable),
		registrations: many(eventRegistrationTable),
		coaches: many(eventCoachTable),
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
		payments: many(eventPaymentTable),
	}),
);

// Event Payment relations
export const eventPaymentRelations = relations(
	eventPaymentTable,
	({ one }) => ({
		registration: one(eventRegistrationTable, {
			fields: [eventPaymentTable.registrationId],
			references: [eventRegistrationTable.id],
		}),
		organization: one(organizationTable, {
			fields: [eventPaymentTable.organizationId],
			references: [organizationTable.id],
		}),
		processedByUser: one(userTable, {
			fields: [eventPaymentTable.processedBy],
			references: [userTable.id],
		}),
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
	category: one(expenseCategoryTable, {
		fields: [expenseTable.categoryId],
		references: [expenseCategoryTable.id],
	}),
	recordedByUser: one(userTable, {
		fields: [expenseTable.recordedBy],
		references: [userTable.id],
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
		trainingSession: one(trainingSessionTable, {
			fields: [waitlistEntryTable.trainingSessionId],
			references: [trainingSessionTable.id],
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
