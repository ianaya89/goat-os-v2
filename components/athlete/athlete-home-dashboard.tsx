"use client";

import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	Building2Icon,
	CheckCircle2Icon,
	ChevronRightIcon,
	CircleIcon,
	MedalIcon,
	PencilIcon,
	SparklesIcon,
	TrophyIcon,
} from "lucide-react";
import Link from "next/link";
import { OrganizationLogo } from "@/components/organization/organization-logo";
import { OrganizationSwitcher } from "@/components/organization/organization-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageHeader,
	PagePrimaryBar,
} from "@/components/ui/custom/page";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgressRouter } from "@/hooks/use-progress-router";
import { useSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
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
	const { user } = useSession();

	// Get organizations the user belongs to
	const { data: organizations, isLoading: isLoadingOrgs } =
		trpc.athlete.getMyOrganizations.useQuery();

	// Get athlete profile summary (if athlete)
	const { data: athleteProfile, isLoading: isLoadingAthleteProfile } =
		trpc.athlete.getMyProfile.useQuery(undefined, {
			enabled: isAthlete,
		});

	// Get coach profile summary (if coach)
	const { data: coachProfile, isLoading: isLoadingCoachProfile } =
		trpc.coach.getMyProfile.useQuery(undefined, {
			enabled: isCoach,
		});

	// Get profile photo URLs (with S3 signed URLs if available)
	const { data: athletePhotoData } = trpc.athlete.getProfilePhotoUrl.useQuery(
		undefined,
		{ enabled: isAthlete },
	);
	const { data: coachPhotoData } = trpc.coach.getProfilePhotoUrl.useQuery(
		undefined,
		{ enabled: isCoach },
	);

	const isLoadingProfile = isLoadingAthleteProfile || isLoadingCoachProfile;

	const handleSelectOrganization = async (organizationId: string) => {
		try {
			await authClient.organization.setActive({ organizationId });
			clearOrganizationScopedQueries(queryClient);
			router.push("/dashboard/organization");
		} catch (error) {
			console.error("Failed to select organization:", error);
		}
	};

	const firstName = user?.name?.split(" ")[0] ?? "";
	const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

	// Calculate profile completion
	const getProfileCompletion = () => {
		if (isAthlete && athleteProfile?.athlete) {
			const checks = [
				!!athleteProfile.athlete.bio,
				!!athleteProfile.athlete.position,
				!!athleteProfile.athlete.sport,
				(athleteProfile.careerHistory?.length ?? 0) > 0,
				!!athleteProfile.athlete.isPublicProfile,
			];
			return Math.round((checks.filter(Boolean).length / checks.length) * 100);
		}
		if (isCoach && coachProfile?.coach) {
			const checks = [
				!!coachProfile.coach.bio,
				!!coachProfile.coach.sport,
				(coachProfile.sportsExperience?.length ?? 0) > 0,
				(coachProfile.achievements?.length ?? 0) > 0,
			];
			return Math.round((checks.filter(Boolean).length / checks.length) * 100);
		}
		return 0;
	};

	const profileCompletion = getProfileCompletion();
	const profileType = isCoach && !isAthlete ? "coach" : "athlete";
	const profileData = profileType === "coach" ? coachProfile : athleteProfile;

	// Get the appropriate image URL (prefer S3 signed URL, fallback to OAuth)
	const getProfileImage = () => {
		if (profileType === "coach") {
			return (
				coachPhotoData?.signedUrl ||
				coachProfile?.coach?.user?.image ||
				user?.image
			);
		}
		return (
			athletePhotoData?.signedUrl ||
			athleteProfile?.athlete?.user?.image ||
			user?.image
		);
	};

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
					<div className="mx-auto w-full max-w-4xl space-y-8">
						{/* Hero Section */}
						<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
							<div className="absolute top-0 right-0 -mt-8 -mr-8 size-32 rounded-full bg-primary/10 blur-3xl" />
							<div className="absolute bottom-0 left-0 -mb-8 -ml-8 size-32 rounded-full bg-primary/10 blur-3xl" />

							<div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex items-center gap-4">
									<Avatar className="size-16 border-4 border-background shadow-xl sm:size-20">
										<AvatarImage src={getProfileImage() ?? undefined} />
										<AvatarFallback className="bg-primary text-lg text-primary-foreground sm:text-xl">
											{firstName.charAt(0) || "U"}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="text-muted-foreground text-sm capitalize">
											{today}
										</p>
										<h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
											Hola, {firstName}!
										</h1>
										<div className="mt-1 flex items-center gap-2">
											{isAthlete && (
												<Badge
													variant="secondary"
													className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
												>
													<MedalIcon className="size-3" />
													Atleta
												</Badge>
											)}
											{isCoach && (
												<Badge
													variant="secondary"
													className="gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
												>
													<TrophyIcon className="size-3" />
													Entrenador
												</Badge>
											)}
										</div>
									</div>
								</div>

								{/* Profile Completion */}
								{!isLoadingProfile && profileCompletion < 100 && (
									<div className="flex items-center gap-4 rounded-xl bg-background/80 p-4 backdrop-blur-sm sm:min-w-[200px]">
										<div className="flex-1 space-y-2">
											<div className="flex items-center justify-between">
												<span className="font-medium text-sm">
													Perfil completo
												</span>
												<span className="font-bold text-primary text-sm">
													{profileCompletion}%
												</span>
											</div>
											<Progress value={profileCompletion} className="h-2" />
										</div>
									</div>
								)}
								{!isLoadingProfile && profileCompletion === 100 && (
									<div className="flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 dark:bg-emerald-900/30">
										<CheckCircle2Icon className="size-5 text-emerald-600 dark:text-emerald-400" />
										<span className="font-medium text-emerald-700 text-sm dark:text-emerald-400">
											Perfil completo
										</span>
									</div>
								)}
							</div>
						</div>

						{/* Organizations Section */}
						<div>
							<div className="mb-4 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Building2Icon className="size-5 text-muted-foreground" />
									<h2 className="font-semibold text-lg">Mis Organizaciones</h2>
								</div>
								{organizations && organizations.length > 0 && (
									<Badge variant="secondary" className="font-normal">
										{organizations.length}{" "}
										{organizations.length === 1
											? "organizacion"
											: "organizaciones"}
									</Badge>
								)}
							</div>

							{isLoadingOrgs ? (
								<div className="space-y-3">
									{[1, 2].map((i) => (
										<Skeleton key={i} className="h-20 w-full rounded-xl" />
									))}
								</div>
							) : !organizations || organizations.length === 0 ? (
								<div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-12 text-center">
									<div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
										<Building2Icon className="size-8 text-muted-foreground" />
									</div>
									<h3 className="font-medium text-lg">
										Sin organizaciones todavia
									</h3>
									<p className="mt-1 max-w-sm text-muted-foreground text-sm">
										Contacta con tu club o academia para que te agreguen como
										miembro.
									</p>
								</div>
							) : (
								<div className="space-y-3">
									{organizations.map((org) => (
										<button
											key={org.id}
											type="button"
											onClick={() => handleSelectOrganization(org.id)}
											className="group flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-md"
										>
											<OrganizationLogo
												className="size-12 rounded-lg"
												name={org.name}
												src={org.logo}
											/>
											<div className="min-w-0 flex-1">
												<p className="truncate font-medium text-base">
													{org.name}
												</p>
												<div className="mt-1 flex flex-wrap items-center gap-2">
													<Badge
														variant="secondary"
														className="font-normal text-xs"
													>
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
											<ChevronRightIcon className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
										</button>
									))}
								</div>
							)}
						</div>

						{/* Profile Tips (only if not complete) */}
						{isAthlete &&
							athleteProfile?.athlete &&
							profileCompletion < 100 && (
								<div className="rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:from-amber-950/20 dark:to-orange-950/20">
									<div className="mb-4 flex items-center gap-2">
										<div className="flex size-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
											<SparklesIcon className="size-4 text-amber-600 dark:text-amber-400" />
										</div>
										<h3 className="font-semibold">Completa tu perfil</h3>
									</div>
									<p className="mb-4 text-muted-foreground text-sm">
										Un perfil completo te ayuda a destacar ante clubes y
										academias
									</p>
									<div className="space-y-2">
										{!athleteProfile.athlete.bio && (
											<ProfileTip
												label="Agrega una biografia sobre ti"
												done={false}
											/>
										)}
										{!athleteProfile.athlete.position && (
											<ProfileTip
												label="Indica tu posicion de juego"
												done={false}
											/>
										)}
										{(!athleteProfile.careerHistory ||
											athleteProfile.careerHistory.length === 0) && (
											<ProfileTip
												label="Agrega tu historial deportivo"
												done={false}
											/>
										)}
										{!athleteProfile.athlete.isPublicProfile && (
											<ProfileTip
												label="Habilita tu perfil publico"
												done={false}
											/>
										)}
									</div>
									<Button asChild className="mt-4 w-full" size="sm">
										<Link href="/dashboard/my-profile?view=athlete">
											<PencilIcon className="mr-2 size-4" />
											Completar Perfil
										</Link>
									</Button>
								</div>
							)}

						{/* Coach Tips (only if not complete) */}
						{isCoach && coachProfile?.coach && profileCompletion < 100 && (
							<div className="rounded-2xl border bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:from-blue-950/20 dark:to-indigo-950/20">
								<div className="mb-4 flex items-center gap-2">
									<div className="flex size-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
										<SparklesIcon className="size-4 text-blue-600 dark:text-blue-400" />
									</div>
									<h3 className="font-semibold">Completa tu perfil</h3>
								</div>
								<p className="mb-4 text-muted-foreground text-sm">
									Un perfil completo genera mas confianza en atletas y clubes
								</p>
								<div className="space-y-2">
									{!coachProfile.coach.bio && (
										<ProfileTip
											label="Agrega una biografia profesional"
											done={false}
										/>
									)}
									{!coachProfile.coach.sport && (
										<ProfileTip
											label="Indica tu deporte principal"
											done={false}
										/>
									)}
									{(!coachProfile.sportsExperience ||
										coachProfile.sportsExperience.length === 0) && (
										<ProfileTip
											label="Agrega tu experiencia deportiva"
											done={false}
										/>
									)}
									{(!coachProfile.achievements ||
										coachProfile.achievements.length === 0) && (
										<ProfileTip label="Agrega tus logros" done={false} />
									)}
								</div>
								<Button asChild className="mt-4 w-full" size="sm">
									<Link href="/dashboard/my-profile?view=coach">
										<PencilIcon className="mr-2 size-4" />
										Completar Perfil
									</Link>
								</Button>
							</div>
						)}
					</div>
				</div>
			</PageBody>
		</Page>
	);
}

function ProfileTip({ label, done }: { label: string; done: boolean }) {
	return (
		<div className="flex items-center gap-3 rounded-lg bg-background/60 px-3 py-2">
			{done ? (
				<CheckCircle2Icon className="size-4 text-emerald-500" />
			) : (
				<CircleIcon className="size-4 text-muted-foreground" />
			)}
			<span
				className={cn("text-sm", done && "text-muted-foreground line-through")}
			>
				{label}
			</span>
		</div>
	);
}
