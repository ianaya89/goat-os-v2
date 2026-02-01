"use client";

import NiceModal from "@ebay/nice-modal-react";
import { differenceInYears, format } from "date-fns";
import { es } from "date-fns/locale";
import {
	AlertCircleIcon,
	BriefcaseIcon,
	CalendarIcon,
	GraduationCapIcon,
	MailIcon,
	MedalIcon,
	PencilIcon,
	PhoneIcon,
	PlusIcon,
	TrashIcon,
	TrophyIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { CoachBioEditModal } from "@/components/coach/coach-bio-edit-modal";
import { CoachContactEditModal } from "@/components/coach/coach-contact-edit-modal";
import { CoachProfessionalEditModal } from "@/components/coach/coach-professional-edit-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user/user-avatar";
import { AthleteSport, CoachStatus } from "@/lib/db/schema/enums";
import { capitalize } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const statusColors: Record<string, string> = {
	active: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
};

const sportLabels: Record<AthleteSport, string> = {
	[AthleteSport.soccer]: "Futbol",
	[AthleteSport.basketball]: "Basquetbol",
	[AthleteSport.volleyball]: "Voleibol",
	[AthleteSport.tennis]: "Tenis",
	[AthleteSport.swimming]: "Natacion",
	[AthleteSport.athletics]: "Atletismo",
	[AthleteSport.rugby]: "Rugby",
	[AthleteSport.hockey]: "Hockey",
	[AthleteSport.baseball]: "Beisbol",
	[AthleteSport.handball]: "Handball",
	[AthleteSport.padel]: "Padel",
	[AthleteSport.golf]: "Golf",
	[AthleteSport.boxing]: "Boxeo",
	[AthleteSport.martialArts]: "Artes Marciales",
	[AthleteSport.gymnastics]: "Gimnasia",
	[AthleteSport.cycling]: "Ciclismo",
	[AthleteSport.running]: "Running",
	[AthleteSport.fitness]: "Fitness",
	[AthleteSport.crossfit]: "CrossFit",
	[AthleteSport.other]: "Otro",
};

export function CoachMyProfile() {
	const { data, isLoading, error } = trpc.coach.getMyProfile.useQuery();

	if (isLoading) {
		return <CoachMyProfileSkeleton />;
	}

	if (error) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<AlertCircleIcon className="mx-auto size-12 text-destructive" />
					<p className="mt-4 text-muted-foreground">
						Error al cargar el perfil: {error.message}
					</p>
				</CardContent>
			</Card>
		);
	}

	if (!data) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<UserIcon className="mx-auto size-12 text-muted-foreground" />
					<h3 className="mt-4 font-semibold text-lg">
						No tienes un perfil de entrenador
					</h3>
					<p className="mt-2 text-muted-foreground">
						Tu cuenta no tiene un perfil de entrenador asociado. Si eres
						entrenador, contacta con tu organizacion para que te agreguen.
					</p>
					<Button asChild className="mt-4" variant="outline">
						<Link href="/dashboard">Volver al inicio</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	const { coach, sportsExperience, achievements, education, organizations } =
		data;

	if (!coach) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<UserIcon className="mx-auto size-12 text-muted-foreground" />
					<h3 className="mt-4 font-semibold text-lg">
						No tienes un perfil de entrenador
					</h3>
					<p className="mt-2 text-muted-foreground">
						Tu cuenta no tiene un perfil de entrenador asociado.
					</p>
					<Button asChild className="mt-4" variant="outline">
						<Link href="/dashboard">Volver al inicio</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	const age = coach.birthDate
		? differenceInYears(new Date(), new Date(coach.birthDate))
		: null;

	const specialties = coach.specialty
		? coach.specialty.split(",").map((s) => s.trim())
		: [];

	return (
		<div className="space-y-6">
			{/* Profile Header */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="flex items-start gap-4">
							<UserAvatar
								name={coach.user?.name ?? ""}
								src={coach.user?.image}
								className="size-20"
							/>
							<div>
								<div className="flex items-center gap-3">
									<h1 className="font-bold text-2xl">
										{coach.user?.name ?? "Sin nombre"}
									</h1>
									<Badge
										className={`border-none ${statusColors[coach.status]}`}
									>
										{coach.status === CoachStatus.active
											? "Activo"
											: "Inactivo"}
									</Badge>
								</div>
								<div className="mt-1 flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
									{coach.sport && (
										<div className="flex items-center gap-1">
											<MedalIcon className="size-4" />
											<span>{sportLabels[coach.sport] ?? coach.sport}</span>
										</div>
									)}
									{age && (
										<div className="flex items-center gap-1">
											<CalendarIcon className="size-4" />
											<span>{age} anos</span>
										</div>
									)}
									{coach.user?.email && (
										<div className="flex items-center gap-1">
											<MailIcon className="size-4" />
											<span>{coach.user.email}</span>
										</div>
									)}
								</div>
								{specialties.length > 0 && (
									<div className="mt-2 flex flex-wrap gap-2">
										{specialties.map((specialty, index) => (
											<Badge key={index} variant="secondary">
												{specialty}
											</Badge>
										))}
									</div>
								)}
							</div>
						</div>
						<Button
							onClick={() =>
								NiceModal.show(CoachBioEditModal, {
									bio: coach.bio,
								})
							}
						>
							<PencilIcon className="mr-2 size-4" />
							Editar
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Organizations */}
			{organizations.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<BriefcaseIcon className="size-4" />
							Mis Organizaciones
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{organizations.map((org) => (
								<Badge key={org.id} variant="secondary" className="py-1.5">
									{org.name}
									<span className="ml-1 text-muted-foreground text-xs">
										({capitalize(org.role)})
									</span>
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Tabs */}
			<Tabs defaultValue="info" className="space-y-4">
				<TabsList>
					<TabsTrigger value="info">
						<UserIcon className="mr-1 size-3.5" />
						Informacion
					</TabsTrigger>
					<TabsTrigger value="experience">
						<BriefcaseIcon className="mr-1 size-3.5" />
						Experiencia ({sportsExperience?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="achievements">
						<TrophyIcon className="mr-1 size-3.5" />
						Logros ({achievements?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="education">
						<GraduationCapIcon className="mr-1 size-3.5" />
						Educacion ({education?.length ?? 0})
					</TabsTrigger>
				</TabsList>

				{/* Info Tab */}
				<TabsContent value="info">
					<div className="grid gap-4 md:grid-cols-2">
						{/* Contact Information */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0">
								<CardTitle className="flex items-center gap-2 text-base">
									<PhoneIcon className="size-4" />
									Contacto
								</CardTitle>
								<Button
									size="sm"
									onClick={() =>
										NiceModal.show(CoachContactEditModal, {
											phone: coach.phone,
											birthDate: coach.birthDate,
										})
									}
								>
									<PencilIcon className="mr-2 size-4" />
									Editar
								</Button>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-3">
									<PhoneIcon className="size-4 text-muted-foreground" />
									<span>{coach.phone || "Sin telefono"}</span>
								</div>
								<div className="flex items-center gap-3">
									<CalendarIcon className="size-4 text-muted-foreground" />
									<span>
										{coach.birthDate
											? format(new Date(coach.birthDate), "dd MMM yyyy", {
													locale: es,
												})
											: "Sin fecha de nacimiento"}
									</span>
								</div>
							</CardContent>
						</Card>

						{/* Professional Information */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0">
								<CardTitle className="flex items-center gap-2 text-base">
									<BriefcaseIcon className="size-4" />
									Profesional
								</CardTitle>
								<Button
									size="sm"
									onClick={() =>
										NiceModal.show(CoachProfessionalEditModal, {
											sport: coach.sport,
											specialty: coach.specialty,
										})
									}
								>
									<PencilIcon className="mr-2 size-4" />
									Editar
								</Button>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-3">
									<MedalIcon className="size-4 text-muted-foreground" />
									<span>
										{coach.sport
											? (sportLabels[coach.sport] ?? coach.sport)
											: "Sin deporte"}
									</span>
								</div>
								<div>
									<p className="mb-2 text-muted-foreground text-sm">
										Especialidades:
									</p>
									<div className="flex flex-wrap gap-1">
										{specialties.length > 0 ? (
											specialties.map((specialty, index) => (
												<Badge key={index} variant="outline">
													{specialty}
												</Badge>
											))
										) : (
											<span className="text-muted-foreground text-sm">
												Sin especialidades
											</span>
										)}
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Bio */}
						<Card className="md:col-span-2">
							<CardHeader className="flex flex-row items-center justify-between space-y-0">
								<CardTitle className="flex items-center gap-2 text-base">
									<UserIcon className="size-4" />
									Biografia
								</CardTitle>
								<Button
									size="sm"
									onClick={() =>
										NiceModal.show(CoachBioEditModal, {
											bio: coach.bio,
										})
									}
								>
									<PencilIcon className="mr-2 size-4" />
									Editar
								</Button>
							</CardHeader>
							<CardContent>
								{coach.bio ? (
									<p className="whitespace-pre-wrap text-sm">{coach.bio}</p>
								) : (
									<p className="text-muted-foreground text-sm">
										No has agregado una biografia aun. Cuenta tu experiencia
										como entrenador.
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Experience Tab */}
				<TabsContent value="experience">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0">
							<CardTitle className="flex items-center gap-2 text-base">
								<BriefcaseIcon className="size-4" />
								Experiencia Deportiva
							</CardTitle>
							{/* TODO: Add experience modal */}
						</CardHeader>
						<CardContent>
							{sportsExperience && sportsExperience.length > 0 ? (
								<div className="space-y-4">
									{sportsExperience.map((exp) => (
										<div
											key={exp.id}
											className="rounded-lg border p-4 space-y-2"
										>
											<div className="flex items-start justify-between">
												<div>
													<h4 className="font-medium">{exp.role}</h4>
													{exp.sport && (
														<p className="text-muted-foreground text-sm">
															{sportLabels[exp.sport] ?? exp.sport}
														</p>
													)}
												</div>
												{exp.level && (
													<Badge variant="secondary">{exp.level}</Badge>
												)}
											</div>
											{(exp.startDate || exp.endDate) && (
												<p className="text-muted-foreground text-sm">
													{exp.startDate
														? format(new Date(exp.startDate), "MMM yyyy", {
																locale: es,
															})
														: "?"}{" "}
													-{" "}
													{exp.endDate
														? format(new Date(exp.endDate), "MMM yyyy", {
																locale: es,
															})
														: "Presente"}
												</p>
											)}
											{exp.achievements && (
												<p className="text-sm">{exp.achievements}</p>
											)}
											{exp.description && (
												<p className="text-muted-foreground text-sm">
													{exp.description}
												</p>
											)}
										</div>
									))}
								</div>
							) : (
								<div className="py-8 text-center">
									<BriefcaseIcon className="mx-auto size-10 text-muted-foreground/50" />
									<p className="mt-2 text-muted-foreground text-sm">
										No has agregado experiencia deportiva aun.
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Achievements Tab */}
				<TabsContent value="achievements">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0">
							<CardTitle className="flex items-center gap-2 text-base">
								<TrophyIcon className="size-4" />
								Logros y Reconocimientos
							</CardTitle>
							{/* TODO: Add achievement modal */}
						</CardHeader>
						<CardContent>
							{achievements && achievements.length > 0 ? (
								<div className="space-y-4">
									{achievements.map((achievement) => (
										<div
											key={achievement.id}
											className="rounded-lg border p-4 space-y-2"
										>
											<div className="flex items-start justify-between">
												<div>
													<h4 className="font-medium">{achievement.title}</h4>
													<p className="text-muted-foreground text-sm">
														{achievement.year}
														{achievement.competition &&
															` - ${achievement.competition}`}
													</p>
												</div>
												<Badge variant="secondary">{achievement.type}</Badge>
											</div>
											{achievement.organization && (
												<p className="text-sm">{achievement.organization}</p>
											)}
											{achievement.position && (
												<Badge variant="outline">{achievement.position}</Badge>
											)}
											{achievement.description && (
												<p className="text-muted-foreground text-sm">
													{achievement.description}
												</p>
											)}
										</div>
									))}
								</div>
							) : (
								<div className="py-8 text-center">
									<TrophyIcon className="mx-auto size-10 text-muted-foreground/50" />
									<p className="mt-2 text-muted-foreground text-sm">
										No has agregado logros aun.
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Education Tab */}
				<TabsContent value="education">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0">
							<CardTitle className="flex items-center gap-2 text-base">
								<GraduationCapIcon className="size-4" />
								Formacion Academica
							</CardTitle>
							{/* TODO: Add education modal */}
						</CardHeader>
						<CardContent>
							{education && education.length > 0 ? (
								<div className="space-y-4">
									{education.map((edu) => (
										<div
											key={edu.id}
											className="rounded-lg border p-4 space-y-2"
										>
											<div className="flex items-start justify-between">
												<div>
													<h4 className="font-medium">{edu.institution}</h4>
													{edu.degree && (
														<p className="text-muted-foreground text-sm">
															{edu.degree}
															{edu.fieldOfStudy && ` en ${edu.fieldOfStudy}`}
														</p>
													)}
												</div>
												{edu.isCurrent && (
													<Badge variant="secondary">En curso</Badge>
												)}
											</div>
											{(edu.startDate || edu.endDate) && (
												<p className="text-muted-foreground text-sm">
													{edu.startDate
														? format(new Date(edu.startDate), "MMM yyyy", {
																locale: es,
															})
														: "?"}{" "}
													-{" "}
													{edu.endDate
														? format(new Date(edu.endDate), "MMM yyyy", {
																locale: es,
															})
														: edu.isCurrent
															? "Presente"
															: "?"}
												</p>
											)}
											{edu.gpa && (
												<p className="text-sm">Promedio: {edu.gpa}</p>
											)}
											{edu.notes && (
												<p className="text-muted-foreground text-sm">
													{edu.notes}
												</p>
											)}
										</div>
									))}
								</div>
							) : (
								<div className="py-8 text-center">
									<GraduationCapIcon className="mx-auto size-10 text-muted-foreground/50" />
									<p className="mt-2 text-muted-foreground text-sm">
										No has agregado formacion academica aun.
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function CoachMyProfileSkeleton() {
	return (
		<div className="space-y-6">
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-start gap-4">
						<Skeleton className="size-20 rounded-full" />
						<div className="space-y-2">
							<Skeleton className="h-8 w-48" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-64" />
						</div>
					</div>
				</CardContent>
			</Card>
			<Skeleton className="h-10 w-full" />
			<div className="grid gap-4 md:grid-cols-2">
				<Skeleton className="h-48" />
				<Skeleton className="h-48" />
			</div>
		</div>
	);
}
