import { eq } from "drizzle-orm";
import {
	getActiveSessions,
	getSession,
	getUserAccounts,
} from "@/lib/auth/server";
import { db } from "@/lib/db";
import { athleteTable, coachTable } from "@/lib/db/schema/tables";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/trpc/init";

export const userRouter = createTRPCRouter({
	getSession: publicProcedure.query(async () => await getSession()),
	getActiveSessions: protectedProcedure.query(
		async () => await getActiveSessions(),
	),
	getAccounts: protectedProcedure.query(async () => await getUserAccounts()),

	/**
	 * Check if current user has a personal profile (athlete or coach)
	 */
	hasPersonalProfile: protectedProcedure.query(async ({ ctx }) => {
		const [athleteProfile, coachProfile] = await Promise.all([
			db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			}),
			db.query.coachTable.findFirst({
				where: eq(coachTable.userId, ctx.user.id),
				columns: { id: true },
			}),
		]);

		return !!athleteProfile || !!coachProfile;
	}),
});
