"use client";

import { useQueryClient } from "@tanstack/react-query";
import { MedalIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CenteredSpinner } from "@/components/ui/custom/centered-spinner";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { useProgressRouter } from "@/hooks/use-progress-router";
import { authClient } from "@/lib/auth/client";
import { trpc } from "@/trpc/client";
import { clearOrganizationScopedQueries } from "@/trpc/query-client";

interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
	createdAt: Date;
	metadata?: unknown;
}

interface HomeAutoRedirectProps {
	organizations: Organization[];
}

/**
 * Component that handles automatic organization selection and redirect.
 * - If user has organizations, auto-activates the first one and redirects
 * - If user has no organizations, shows empty state
 */
export function HomeAutoRedirect({ organizations }: HomeAutoRedirectProps) {
	const router = useProgressRouter();
	const queryClient = useQueryClient();
	const hasRedirectedRef = useRef(false);

	// Check if user is an athlete (for empty state messaging)
	const { data: isAthlete } = trpc.athlete.isAthlete.useQuery();

	useEffect(() => {
		// Only redirect once
		if (hasRedirectedRef.current) return;

		// If user has organizations, auto-activate the first one and redirect
		const firstOrg = organizations[0];
		if (firstOrg) {
			hasRedirectedRef.current = true;

			const activateAndRedirect = async () => {
				try {
					// Set the first organization as active
					await authClient.organization.setActive({
						organizationId: firstOrg.id,
					});
					// Clear organization-scoped queries
					clearOrganizationScopedQueries(queryClient);
					// Navigate to organization dashboard
					router.replace("/dashboard/organization");
				} catch (error) {
					// If activation fails, stay on page
					hasRedirectedRef.current = false;
					console.error("Failed to activate organization:", error);
				}
			};

			activateAndRedirect();
		}
	}, [organizations, queryClient, router]);

	// If user has organizations, show loading while redirecting
	if (organizations.length > 0) {
		return (
			<div className="flex h-[calc(100vh-200px)] items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<CenteredSpinner />
					<p className="text-muted-foreground text-sm">
						Cargando organizacion...
					</p>
				</div>
			</div>
		);
	}

	// Empty state for athletes
	if (isAthlete) {
		return (
			<div className="flex h-[calc(100vh-200px)] items-center justify-center p-4">
				<Empty className="h-60 max-w-md border">
					<EmptyHeader>
						<EmptyTitle>Sin Organizaciones</EmptyTitle>
						<EmptyDescription>
							Aun no perteneces a ninguna organizacion. Contacta con tu club o
							academia para que te agreguen como atleta.
						</EmptyDescription>
					</EmptyHeader>
					<Button asChild variant="outline">
						<Link href="/dashboard/my-profile">
							<MedalIcon className="mr-2 size-4" />
							Ver Mi Perfil Deportivo
						</Link>
					</Button>
				</Empty>
			</div>
		);
	}

	// Empty state for regular users
	return (
		<div className="flex h-[calc(100vh-200px)] items-center justify-center p-4">
			<Empty className="h-60 max-w-md border">
				<EmptyHeader>
					<EmptyTitle>Sin Organizaciones</EmptyTitle>
					<EmptyDescription>
						Aun no perteneces a ninguna organizacion. Contacta con un
						administrador para que te agregue.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	);
}
