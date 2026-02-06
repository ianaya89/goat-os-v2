import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { athleteSignupLinkTable } from "@/lib/db/schema/tables";
import { validateAthleteSignupTokenSchema } from "@/schemas/organization-athlete-signup-link-schemas";
import { createTRPCRouter, publicProcedure } from "@/trpc/init";

export const publicAthleteSignupLinkRouter = createTRPCRouter({
	validate: publicProcedure
		.input(validateAthleteSignupTokenSchema)
		.query(async ({ input }) => {
			const link = await db.query.athleteSignupLinkTable.findFirst({
				where: and(
					eq(athleteSignupLinkTable.token, input.token),
					eq(athleteSignupLinkTable.isActive, true),
				),
				with: {
					organization: {
						columns: { id: true, name: true, logo: true },
					},
					athleteGroup: {
						columns: { id: true, name: true, sport: true },
					},
				},
			});

			if (!link) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Invalid or inactive signup link",
				});
			}

			return {
				organizationName: link.organization.name,
				organizationLogo: link.organization.logo,
				athleteGroupName: link.athleteGroup?.name ?? null,
				athleteGroupSport: link.athleteGroup?.sport ?? null,
			};
		}),
});
