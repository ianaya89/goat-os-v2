import { createTRPCRouter } from "@/trpc/init";
import { publicAthleteRouter } from "./public-athlete-router";
import { publicEventRouter } from "./public-event-router";

export const publicRouter = createTRPCRouter({
	athlete: publicAthleteRouter,
	event: publicEventRouter,
});
