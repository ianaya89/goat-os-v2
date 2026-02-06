import { createTRPCRouter } from "@/trpc/init";
import { publicAthleteRouter } from "./public-athlete-router";
import { publicAthleteSignupLinkRouter } from "./public-athlete-signup-link-router";
import { publicEventRouter } from "./public-event-router";

export const publicRouter = createTRPCRouter({
	athlete: publicAthleteRouter,
	athleteSignupLink: publicAthleteSignupLinkRouter,
	event: publicEventRouter,
});
