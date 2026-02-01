import { lazy } from "@trpc/server";
import { createTRPCRouter } from "@/trpc/init";

export const appRouter = createTRPCRouter({
	admin: lazy(() => import("./admin")),
	athlete: lazy(() => import("./athlete")),
	coach: lazy(() => import("./coach")),
	organization: lazy(() => import("./organization")),
	public: lazy(() => import("./public")),
	storage: lazy(() => import("./storage")),
	user: lazy(() => import("./user")),
});

// export type definition of API
export type AppRouter = typeof appRouter;
