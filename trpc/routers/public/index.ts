import { createTRPCRouter } from "@/trpc/init";
import { publicEventRouter } from "./public-event-router";

export const publicRouter = createTRPCRouter({
	event: publicEventRouter,
});
