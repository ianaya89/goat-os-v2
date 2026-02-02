"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	CalendarCheckIcon,
	CalendarDaysIcon,
	ChevronRightIcon,
	ClockIcon,
	TrendingUpIcon,
	UserCheckIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { WelcomeSection } from "@/components/organization/dashboard/welcome-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

export function CoachDashboard() {
	// Get coach's athlete IDs
	const { data: coachAthleteData, isLoading: isLoadingAthleteIds } =
		trpc.organization.trainingSession.getMyAthleteIdsAsCoach.useQuery();

	// Get actual athlete data if we have IDs
	const athleteIds = coachAthleteData?.athleteIds ?? [];
	const { data: athletesData, isLoading: isLoadingAthletesList } =
		trpc.organization.athlete.list.useQuery(
			{ athleteIds, limit: 10 },
			{ enabled: athleteIds.length > 0 },
		);

	const isLoadingAthletes = isLoadingAthleteIds || isLoadingAthletesList;

	// Get coach's sessions
	const { data: sessionsData, isLoading: isLoadingSessions } =
		trpc.organization.trainingSession.listMySessionsAsCoach.useQuery({});

	const athletes = athletesData?.athletes ?? [];
	const sessions = sessionsData?.sessions ?? [];

	// Get upcoming sessions (next 7 days)
	const now = new Date();
	const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
	const upcomingSessions = sessions
		.filter((s) => {
			const sessionDate = new Date(s.startTime);
			return sessionDate >= now && sessionDate <= nextWeek;
		})
		.sort(
			(a, b) =>
				new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
		)
		.slice(0, 5);

	// Get today's sessions
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const todaysSessions = sessions.filter((s) => {
		const sessionDate = new Date(s.startTime);
		return sessionDate >= today && sessionDate < tomorrow;
	});

	// Calculate session stats
	const totalSessionsThisMonth = sessions.filter((s) => {
		const sessionDate = new Date(s.startTime);
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		return sessionDate >= startOfMonth;
	}).length;

	return (
		<div className="fade-in flex animate-in flex-col space-y-4 duration-500">
			{/* Welcome Section */}
			<WelcomeSection variant="coach" />

			{/* Stats Row */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{/* Today's Sessions */}
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
									Hoy
								</p>
								{isLoadingSessions ? (
									<Skeleton className="mt-1 h-8 w-12" />
								) : (
									<p className="font-bold text-2xl">{todaysSessions.length}</p>
								)}
								<p className="text-muted-foreground text-xs">sesiones</p>
							</div>
							<div className="rounded-full bg-muted p-2">
								<CalendarCheckIcon className="size-5 text-muted-foreground" />
							</div>
						</div>
					</CardContent>
				</Card>

				{/* This Week */}
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
									Esta semana
								</p>
								{isLoadingSessions ? (
									<Skeleton className="mt-1 h-8 w-12" />
								) : (
									<p className="font-bold text-2xl">
										{upcomingSessions.length}
									</p>
								)}
								<p className="text-muted-foreground text-xs">sesiones</p>
							</div>
							<div className="rounded-full bg-muted p-2">
								<ClockIcon className="size-5 text-muted-foreground" />
							</div>
						</div>
					</CardContent>
				</Card>

				{/* My Athletes */}
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
									Atletas
								</p>
								{isLoadingAthleteIds ? (
									<Skeleton className="mt-1 h-8 w-12" />
								) : (
									<p className="font-bold text-2xl">{athleteIds.length}</p>
								)}
								<p className="text-muted-foreground text-xs">asignados</p>
							</div>
							<div className="rounded-full bg-muted p-2">
								<UsersIcon className="size-5 text-muted-foreground" />
							</div>
						</div>
					</CardContent>
				</Card>

				{/* This Month */}
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
									Este mes
								</p>
								{isLoadingSessions ? (
									<Skeleton className="mt-1 h-8 w-12" />
								) : (
									<p className="font-bold text-2xl">{totalSessionsThisMonth}</p>
								)}
								<p className="text-muted-foreground text-xs">sesiones</p>
							</div>
							<div className="rounded-full bg-muted p-2">
								<TrendingUpIcon className="size-5 text-muted-foreground" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{/* Upcoming Sessions */}
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="flex items-center gap-2 text-lg">
									<CalendarDaysIcon className="size-5 text-muted-foreground" />
									Proximas Sesiones
								</CardTitle>
								<CardDescription>
									Tus entrenamientos esta semana
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/dashboard/organization/my-sessions/coach">
									Ver todas
									<ChevronRightIcon className="ml-1 size-4" />
								</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{isLoadingSessions ? (
							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<Skeleton key={i} className="h-16 w-full rounded-lg" />
								))}
							</div>
						) : upcomingSessions.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<div className="mb-3 rounded-full bg-muted p-3">
									<CalendarDaysIcon className="size-6 text-muted-foreground" />
								</div>
								<p className="font-medium">Sin sesiones programadas</p>
								<p className="mt-1 text-muted-foreground text-sm">
									No tienes sesiones esta semana
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{upcomingSessions.map((session) => {
									const sessionDate = new Date(session.startTime);
									const isToday =
										sessionDate >= today && sessionDate < tomorrow;

									return (
										<div
											key={session.id}
											className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
										>
											<div className="flex flex-col items-center rounded-lg bg-muted px-3 py-2 text-center">
												<span className="font-bold text-lg leading-none">
													{format(sessionDate, "d")}
												</span>
												<span className="text-muted-foreground text-xs uppercase">
													{format(sessionDate, "MMM", { locale: es })}
												</span>
											</div>
											<div className="min-w-0 flex-1">
												<p className="truncate font-medium">{session.title}</p>
												<div className="mt-1 flex items-center gap-2 text-muted-foreground text-sm">
													<ClockIcon className="size-3" />
													{format(sessionDate, "HH:mm")}
													{session.location && (
														<>
															<span>•</span>
															<span className="truncate">
																{session.location.name}
															</span>
														</>
													)}
												</div>
											</div>
											{isToday && <Badge variant="secondary">Hoy</Badge>}
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>

				{/* My Athletes */}
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="flex items-center gap-2 text-lg">
									<UsersIcon className="size-5 text-muted-foreground" />
									Atletas
								</CardTitle>
								<CardDescription>Atletas asignados a ti</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/dashboard/organization/my-athletes">
									Ver todos
									<ChevronRightIcon className="ml-1 size-4" />
								</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{isLoadingAthletes ? (
							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<Skeleton key={i} className="h-14 w-full rounded-lg" />
								))}
							</div>
						) : athleteIds.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<div className="mb-3 rounded-full bg-muted p-3">
									<UsersIcon className="size-6 text-muted-foreground" />
								</div>
								<p className="font-medium">Sin atletas asignados</p>
								<p className="mt-1 text-muted-foreground text-sm">
									Aun no tienes atletas a cargo
								</p>
							</div>
						) : (
							<div className="space-y-2">
								{athletes.slice(0, 6).map((athlete) => (
									<Link
										key={athlete.id}
										href={`/dashboard/organization/athletes/${athlete.id}`}
										className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
									>
										<Avatar className="size-10">
											<AvatarImage src={athlete.user?.image ?? undefined} />
											<AvatarFallback className="bg-primary/10 text-sm">
												{athlete.user?.name?.charAt(0) ?? "A"}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium">
												{athlete.user?.name ?? "Sin nombre"}
											</p>
											<div className="flex items-center gap-2">
												{athlete.position && (
													<span className="text-muted-foreground text-xs">
														{athlete.position}
													</span>
												)}
											</div>
										</div>
										<ChevronRightIcon className="size-4 text-muted-foreground" />
									</Link>
								))}
								{athleteIds.length > 6 && (
									<Button
										variant="outline"
										className="mt-2 w-full"
										size="sm"
										asChild
									>
										<Link href="/dashboard/organization/my-athletes">
											Ver los {athleteIds.length} atletas
										</Link>
									</Button>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Today's Sessions Detail (if any) */}
			{todaysSessions.length > 0 && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-lg">
							<CalendarCheckIcon className="size-5 text-muted-foreground" />
							Sesiones de Hoy
						</CardTitle>
						<CardDescription>
							Tienes {todaysSessions.length}{" "}
							{todaysSessions.length === 1 ? "sesion" : "sesiones"} programadas
							para hoy
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{todaysSessions.map((session) => {
								const sessionDate = new Date(session.startTime);
								const endDate = session.endTime
									? new Date(session.endTime)
									: null;

								return (
									<div
										key={session.id}
										className="rounded-lg border bg-card p-4"
									>
										<div className="mb-2 flex items-start justify-between">
											<h4 className="font-medium">{session.title}</h4>
											{session.athleteGroup && (
												<Badge variant="secondary" className="text-xs">
													{session.athleteGroup.name}
												</Badge>
											)}
										</div>
										<div className="space-y-1 text-muted-foreground text-sm">
											<div className="flex items-center gap-2">
												<ClockIcon className="size-3" />
												{format(sessionDate, "HH:mm")}
												{endDate && ` - ${format(endDate, "HH:mm")}`}
											</div>
											{session.location && (
												<div className="flex items-center gap-2">
													<span className="size-3" />
													{session.location.name}
												</div>
											)}
										</div>
										<Button
											asChild
											className="mt-3 w-full"
											size="sm"
											variant="outline"
										>
											<Link
												href={`/dashboard/organization/training-sessions/${session.id}`}
											>
												<UserCheckIcon className="mr-2 size-4" />
												Tomar asistencia
											</Link>
										</Button>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
