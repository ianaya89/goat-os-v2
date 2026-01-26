"use client";

import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	Building2Icon,
	CalendarDaysIcon,
	CheckCircleIcon,
	ChevronRightIcon,
	MedalIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { OrganizationSwitcher } from "@/components/organization/organization-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageHeader,
	PagePrimaryBar,
	PageTitle,
} from "@/components/ui/custom/page";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgressRouter } from "@/hooks/use-progress-router";
import { authClient } from "@/lib/auth/client";
import { trpc } from "@/trpc/client";
import { clearOrganizationScopedQueries } from "@/trpc/query-client";

interface AthleteHomeDashboardProps {
	isAthlete: boolean;
	isCoach: boolean;
}

export function AthleteHomeDashboard({
	isAthlete,
	isCoach,
}: AthleteHomeDashboardProps) {
	const router = useProgressRouter();
	const queryClient = useQueryClient();

	// Get organizations the user belongs to
	const { data: organizations, isLoading: isLoadingOrgs } =
		trpc.athlete.getMyOrganizations.useQuery();

	// Get athlete profile summary (if athlete)
	const { data: athleteProfile, isLoading: isLoadingProfile } =
		trpc.athlete.getMyProfile.useQuery(undefined, {
			enabled: isAthlete,
		});

	const handleSelectOrganization = async (organizationId: string) => {
		try {
			await authClient.organization.setActive({ organizationId });
			clearOrganizationScopedQueries(queryClient);
			router.push("/dashboard/organization");
		} catch (error) {
			console.error("Failed to select organization:", error);
		}
	};

	const profileTitle = isCoach && !isAthlete ? "Coach" : "Atleta";

	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{
								label: <OrganizationSwitcher variant="breadcrumb" />,
								isCustom: true,
							},
							{ label: "Inicio" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 pb-24 sm:px-6 sm:pt-6">
					<div className="mx-auto w-full max-w-5xl space-y-6">
						<div>
							<PageTitle>Bienvenido</PageTitle>
							<p className="mt-1 text-muted-foreground">
								Tu panel personal como {profileTitle.toLowerCase()}
							</p>
						</div>

						{/* Quick Actions */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{/* Profile Card */}
							<Card className="transition-shadow hover:shadow-md">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">
										Mi Perfil Deportivo
									</CardTitle>
									<MedalIcon className="size-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									{isLoadingProfile ? (
										<Skeleton className="h-8 w-24" />
									) : athleteProfile?.athlete ? (
										<div className="space-y-2">
											<p className="font-semibold text-lg">
												{athleteProfile.athlete.user?.name ?? "Sin nombre"}
											</p>
											<div className="flex flex-wrap gap-2">
												{athleteProfile.athlete.sport && (
													<Badge variant="secondary">
														{athleteProfile.athlete.sport}
													</Badge>
												)}
												{athleteProfile.athlete.position && (
													<Badge variant="outline">
														{athleteProfile.athlete.position}
													</Badge>
												)}
											</div>
										</div>
									) : (
										<p className="text-muted-foreground text-sm">
											{isCoach
												? "Perfil de coach"
												: "Configura tu perfil deportivo"}
										</p>
									)}
									<Button asChild variant="outline" className="mt-4 w-full">
										<Link href="/dashboard/my-profile">
											<UserIcon className="mr-2 size-4" />
											Ver Perfil
										</Link>
									</Button>
								</CardContent>
							</Card>

							{/* Organizations Count */}
							<Card className="transition-shadow hover:shadow-md">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">
										Mis Organizaciones
									</CardTitle>
									<Building2Icon className="size-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									{isLoadingOrgs ? (
										<Skeleton className="h-8 w-16" />
									) : (
										<>
											<div className="font-bold text-2xl">
												{organizations?.length ?? 0}
											</div>
											<p className="text-muted-foreground text-xs">
												{organizations?.length === 1
													? "organizacion"
													: "organizaciones"}
											</p>
										</>
									)}
								</CardContent>
							</Card>

							{/* Quick Access */}
							<Card className="transition-shadow hover:shadow-md">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">
										Acceso Rapido
									</CardTitle>
									<CalendarDaysIcon className="size-4 text-muted-foreground" />
								</CardHeader>
								<CardContent className="space-y-2">
									<Button
										asChild
										variant="outline"
										className="w-full justify-start"
									>
										<Link href="/dashboard/my-profile">
											<MedalIcon className="mr-2 size-4" />
											Perfil Deportivo
										</Link>
									</Button>
									{isAthlete && athleteProfile?.athlete?.isPublicProfile && (
										<Button
											asChild
											variant="outline"
											className="w-full justify-start"
										>
											<Link
												href={`/athlete/${athleteProfile.athlete.id}`}
												target="_blank"
											>
												<UserIcon className="mr-2 size-4" />
												Ver Perfil Publico
											</Link>
										</Button>
									)}
								</CardContent>
							</Card>
						</div>

						{/* Organizations List */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Building2Icon className="size-5" />
									Mis Organizaciones
								</CardTitle>
								<CardDescription>
									Selecciona una organizacion para acceder a su dashboard
								</CardDescription>
							</CardHeader>
							<CardContent>
								{isLoadingOrgs ? (
									<div className="space-y-3">
										{[1, 2].map((i) => (
											<Skeleton key={i} className="h-16" />
										))}
									</div>
								) : !organizations || organizations.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-8 text-center">
										<Building2Icon className="size-10 text-muted-foreground/50" />
										<p className="mt-2 text-muted-foreground text-sm">
											Aun no perteneces a ninguna organizacion.
										</p>
										<p className="text-muted-foreground text-xs">
											Contacta con tu club o academia para que te agreguen.
										</p>
									</div>
								) : (
									<div className="space-y-2">
										{organizations.map((org) => (
											<button
												key={org.id}
												type="button"
												onClick={() => handleSelectOrganization(org.id)}
												className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
											>
												<div className="flex items-center gap-3">
													<div className="flex size-10 items-center justify-center rounded-md bg-primary/10 font-semibold text-primary">
														{org.name.charAt(0).toUpperCase()}
													</div>
													<div>
														<p className="font-medium">{org.name}</p>
														<div className="flex items-center gap-2">
															<Badge variant="secondary" className="text-xs">
																{org.role === "owner"
																	? "Propietario"
																	: org.role === "admin"
																		? "Admin"
																		: org.role === "staff"
																			? "Staff"
																			: "Miembro"}
															</Badge>
															{org.joinedAt && (
																<span className="text-muted-foreground text-xs">
																	Desde{" "}
																	{format(new Date(org.joinedAt), "MMM yyyy", {
																		locale: es,
																	})}
																</span>
															)}
														</div>
													</div>
												</div>
												<ChevronRightIcon className="size-5 text-muted-foreground" />
											</button>
										))}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Profile Completion Tips (for athletes) */}
						{isAthlete && athleteProfile?.athlete && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<CheckCircleIcon className="size-5" />
										Completa tu Perfil
									</CardTitle>
									<CardDescription>
										Un perfil completo te ayuda a destacar ante clubes y
										academias
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{!athleteProfile.athlete.bio && (
											<div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
												<div className="size-2 rounded-full bg-yellow-500" />
												<span className="text-sm">
													Agrega una biografia sobre ti
												</span>
											</div>
										)}
										{!athleteProfile.athlete.position && (
											<div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
												<div className="size-2 rounded-full bg-yellow-500" />
												<span className="text-sm">
													Indica tu posicion de juego
												</span>
											</div>
										)}
										{(!athleteProfile.careerHistory ||
											athleteProfile.careerHistory.length === 0) && (
											<div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
												<div className="size-2 rounded-full bg-yellow-500" />
												<span className="text-sm">
													Agrega tu historial deportivo
												</span>
											</div>
										)}
										{!athleteProfile.athlete.isPublicProfile && (
											<div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
												<div className="size-2 rounded-full bg-blue-500" />
												<span className="text-sm">
													Habilita tu perfil publico para que los clubes te
													encuentren
												</span>
											</div>
										)}
										{athleteProfile.athlete.bio &&
											athleteProfile.athlete.position &&
											athleteProfile.careerHistory &&
											athleteProfile.careerHistory.length > 0 &&
											athleteProfile.athlete.isPublicProfile && (
												<div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
													<CheckCircleIcon className="size-5 text-green-600" />
													<span className="font-medium text-green-700 text-sm dark:text-green-400">
														Tu perfil esta completo
													</span>
												</div>
											)}
									</div>
									<Button asChild variant="outline" className="mt-4 w-full">
										<Link href="/dashboard/my-profile">Completar Perfil</Link>
									</Button>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</PageBody>
		</Page>
	);
}
