"use client";

import NiceModal from "@ebay/nice-modal-react";
import { differenceInYears, format } from "date-fns";
import {
	AlertCircleIcon,
	BriefcaseIcon,
	CalendarIcon,
	ExternalLinkIcon,
	FacebookIcon,
	FileTextIcon,
	FlagIcon,
	GlobeIcon,
	GraduationCapIcon,
	HeartPulseIcon,
	HomeIcon,
	InstagramIcon,
	LinkedinIcon,
	MapPinIcon,
	MedalIcon,
	PencilIcon,
	PhoneIcon,
	PlusIcon,
	RulerIcon,
	Share2Icon,
	SparklesIcon,
	TrendingUpIcon,
	TrophyIcon,
	UserCheckIcon,
	UserIcon,
	UsersIcon,
	VideoIcon,
	WeightIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { AthleteAchievementsTab } from "@/components/athlete/athlete-achievements-tab";
import { AthleteBioEditModal } from "@/components/athlete/athlete-bio-edit-modal";
import { AthleteCareerEditModal } from "@/components/athlete/athlete-career-edit-modal";
import { AthleteContactEditModal } from "@/components/athlete/athlete-contact-edit-modal";
import { AthleteCoverPhotoUpload } from "@/components/athlete/athlete-cover-photo-upload";
import { AthleteEducationEditModal } from "@/components/athlete/athlete-education-edit-modal";
import { AthleteHealthEditModal } from "@/components/athlete/athlete-health-edit-modal";
import { AthleteLanguagesModal } from "@/components/athlete/athlete-languages-modal";
import { AthleteMyMedicalTab } from "@/components/athlete/athlete-my-medical-tab";
import { AthletePhysicalEditModal } from "@/components/athlete/athlete-physical-edit-modal";
import { AthleteProfilePhotoUpload } from "@/components/athlete/athlete-profile-photo-upload";
import { AthleteReferencesTab } from "@/components/athlete/athlete-references-tab";
import { AthleteResidenceEditModal } from "@/components/athlete/athlete-residence-edit-modal";
import { AthleteSocialEditModal } from "@/components/athlete/athlete-social-edit-modal";
import { AthleteSponsorsTab } from "@/components/athlete/athlete-sponsors-tab";
import { AthleteVideosEditModal } from "@/components/athlete/athlete-videos-edit-modal";
import { PublicProfileSettings } from "@/components/athlete/public-profile-settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user/user-avatar";
import {
	type AthleteOpportunityType,
	LanguageProficiencyLevel,
} from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const statusColors: Record<string, string> = {
	active: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
	injured: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
	suspended:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
};

const levelColors: Record<string, string> = {
	beginner: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
	intermediate:
		"bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100",
	advanced:
		"bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100",
	elite:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
};

export function AthleteMyProfile() {
	const { data, isLoading, error } = trpc.athlete.getMyProfile.useQuery();
	const coverPhotoQuery = trpc.athlete.getCoverPhotoUrl.useQuery();

	if (isLoading) {
		return <AthleteMyProfileSkeleton />;
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
						No tienes un perfil de atleta
					</h3>
					<p className="mt-2 text-muted-foreground">
						Tu cuenta no tiene un perfil de atleta asociado. Si eres atleta,
						contacta con tu organizacion para que te agreguen.
					</p>
					<Button asChild className="mt-4" variant="outline">
						<Link href="/dashboard">Volver al inicio</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	const { athlete, careerHistory, languages, organizations } = data;

	// Safety check - athlete should exist at this point but TS needs reassurance
	if (!athlete) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<UserIcon className="mx-auto size-12 text-muted-foreground" />
					<h3 className="mt-4 font-semibold text-lg">
						No tienes un perfil de atleta
					</h3>
					<p className="mt-2 text-muted-foreground">
						Tu cuenta no tiene un perfil de atleta asociado.
					</p>
					<Button asChild className="mt-4" variant="outline">
						<Link href="/dashboard">Volver al inicio</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	const age = athlete.birthDate
		? differenceInYears(new Date(), new Date(athlete.birthDate))
		: null;

	return (
		<div className="space-y-6">
			{/* Cover Photo */}
			<Card className="overflow-hidden p-0">
				<AthleteCoverPhotoUpload
					coverPhotoUrl={coverPhotoQuery.data?.signedUrl}
					editable={true}
				/>

				{/* Profile info overlaying cover photo */}
				<div className="-mt-12 px-6 pb-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div className="flex items-end gap-4">
							<div className="rounded-full border-4 border-background bg-background">
								<AthleteProfilePhotoUpload
									userName={athlete.user?.name ?? ""}
									currentImageUrl={athlete.user?.image}
									size="lg"
								/>
							</div>
							<div className="mb-2">
								<div className="flex items-center gap-3">
									<h1 className="font-bold text-2xl">
										{athlete.user?.name ?? "Sin nombre"}
									</h1>
									<Badge
										className={cn("border-none", statusColors[athlete.status])}
									>
										{capitalize(athlete.status)}
									</Badge>
									<Badge
										className={cn("border-none", levelColors[athlete.level])}
									>
										{capitalize(athlete.level)}
									</Badge>
								</div>
								<div className="mt-1 flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
									<div className="flex items-center gap-1">
										<MedalIcon className="size-4" />
										<span>{capitalize(athlete.sport.replace("_", " "))}</span>
									</div>
									{age && (
										<div className="flex items-center gap-1">
											<UserIcon className="size-4" />
											<span>{age} anos</span>
										</div>
									)}
									{athlete.user?.email && (
										<span className="text-muted-foreground">
											{athlete.user.email}
										</span>
									)}
								</div>
								{athlete.position && (
									<div className="mt-2 flex items-center gap-2 text-sm">
										<Badge variant="outline">{athlete.position}</Badge>
										{athlete.secondaryPosition && (
											<Badge variant="outline">
												{athlete.secondaryPosition}
											</Badge>
										)}
										{athlete.jerseyNumber && (
											<Badge variant="secondary">#{athlete.jerseyNumber}</Badge>
										)}
									</div>
								)}
							</div>
						</div>
						<div className="mb-2 flex gap-2">
							<Button variant="outline" asChild>
								<Link
									href={`/athlete/${athlete.id}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									<ExternalLinkIcon className="mr-2 size-4" />
									Ver Perfil Público
								</Link>
							</Button>
							<Button
								size="sm"
								onClick={() =>
									NiceModal.show(AthleteBioEditModal, {
										bio: athlete.bio,
									})
								}
							>
								<PencilIcon className="mr-2 size-4" />
								Editar
							</Button>
						</div>
					</div>
				</div>
			</Card>

			{/* Organizations */}
			{organizations.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<UsersIcon className="size-4" />
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
				<TabsList className="flex-wrap">
					<TabsTrigger value="info">
						<UserIcon className="mr-1 size-3.5" />
						Informacion
					</TabsTrigger>
					<TabsTrigger value="physical">
						<RulerIcon className="mr-1 size-3.5" />
						Fisico
					</TabsTrigger>
					<TabsTrigger value="career">
						<BriefcaseIcon className="mr-1 size-3.5" />
						Carrera ({careerHistory?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="education">
						<GraduationCapIcon className="mr-1 size-3.5" />
						Educacion
					</TabsTrigger>
					<TabsTrigger value="languages">
						<GlobeIcon className="mr-1 size-3.5" />
						Idiomas ({languages?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="social">
						<Share2Icon className="mr-1 size-3.5" />
						Redes
					</TabsTrigger>
					<TabsTrigger value="medical">
						<FileTextIcon className="mr-1 size-3.5" />
						Medico
					</TabsTrigger>
					<TabsTrigger value="videos">
						<VideoIcon className="mr-1 size-3.5" />
						Videos ({athlete.youtubeVideos?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="references">
						<UserCheckIcon className="mr-1 size-3.5" />
						Referencias
					</TabsTrigger>
					<TabsTrigger value="sponsors">
						<SparklesIcon className="mr-1 size-3.5" />
						Sponsors
					</TabsTrigger>
					<TabsTrigger value="achievements">
						<TrophyIcon className="mr-1 size-3.5" />
						Palmares
					</TabsTrigger>
					<TabsTrigger value="public">
						<GlobeIcon className="mr-1 size-3.5" />
						Perfil Publico
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
										NiceModal.show(AthleteContactEditModal, {
											phone: athlete.phone,
											parentName: athlete.parentName,
											parentRelationship: athlete.parentRelationship,
											parentPhone: athlete.parentPhone,
											parentEmail: athlete.parentEmail,
										})
									}
								>
									<PencilIcon className="mr-2 size-4" />
									Editar
								</Button>
							</CardHeader>
							<CardContent className="space-y-3">
								{athlete.phone && (
									<div>
										<p className="text-muted-foreground text-xs">Telefono</p>
										<p className="font-medium">{athlete.phone}</p>
									</div>
								)}
								{athlete.user?.email && (
									<div>
										<p className="text-muted-foreground text-xs">Email</p>
										<p className="font-medium">{athlete.user.email}</p>
									</div>
								)}
								{!athlete.phone && !athlete.user?.email && (
									<p className="text-muted-foreground text-sm">
										No hay informacion de contacto
									</p>
								)}
							</CardContent>
						</Card>

						{/* Residence */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0">
								<CardTitle className="flex items-center gap-2 text-base">
									<HomeIcon className="size-4" />
									Residencia
								</CardTitle>
								<Button
									size="sm"
									onClick={() =>
										NiceModal.show(AthleteResidenceEditModal, {
											residenceCity: athlete.residenceCity,
											residenceCountry: athlete.residenceCountry,
											nationality: athlete.nationality,
										})
									}
								>
									<PencilIcon className="mr-2 size-4" />
									Editar
								</Button>
							</CardHeader>
							<CardContent className="space-y-3">
								{(athlete.residenceCity || athlete.residenceCountry) && (
									<div>
										<p className="text-muted-foreground text-xs">Ubicacion</p>
										<p className="font-medium">
											{[athlete.residenceCity, athlete.residenceCountry]
												.filter(Boolean)
												.join(", ")}
										</p>
									</div>
								)}
								{athlete.nationality && (
									<div>
										<p className="text-muted-foreground text-xs">
											Nacionalidad
										</p>
										<p className="font-medium">{athlete.nationality}</p>
									</div>
								)}
								{!athlete.residenceCity &&
									!athlete.residenceCountry &&
									!athlete.nationality && (
										<p className="text-muted-foreground text-sm">
											No hay informacion de residencia
										</p>
									)}
							</CardContent>
						</Card>

						{/* Parent/Guardian */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0">
								<CardTitle className="flex items-center gap-2 text-base">
									<UsersIcon className="size-4" />
									Contacto de Padre/Tutor
								</CardTitle>
								<Button
									size="sm"
									onClick={() =>
										NiceModal.show(AthleteContactEditModal, {
											phone: athlete.phone,
											parentName: athlete.parentName,
											parentRelationship: athlete.parentRelationship,
											parentPhone: athlete.parentPhone,
											parentEmail: athlete.parentEmail,
										})
									}
								>
									<PencilIcon className="mr-2 size-4" />
									Editar
								</Button>
							</CardHeader>
							<CardContent className="space-y-3">
								{athlete.parentName ? (
									<>
										<div>
											<p className="text-muted-foreground text-xs">Nombre</p>
											<p className="font-medium">{athlete.parentName}</p>
										</div>
										{athlete.parentRelationship && (
											<div>
												<p className="text-muted-foreground text-xs">
													Relacion
												</p>
												<p className="font-medium capitalize">
													{athlete.parentRelationship}
												</p>
											</div>
										)}
										{athlete.parentPhone && (
											<div>
												<p className="text-muted-foreground text-xs">
													Telefono
												</p>
												<p className="font-medium">{athlete.parentPhone}</p>
											</div>
										)}
										{athlete.parentEmail && (
											<div>
												<p className="text-muted-foreground text-xs">Email</p>
												<p className="font-medium">{athlete.parentEmail}</p>
											</div>
										)}
									</>
								) : (
									<p className="text-muted-foreground text-sm">
										No hay informacion de padre/tutor
									</p>
								)}
							</CardContent>
						</Card>

						{/* Health */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0">
								<CardTitle className="flex items-center gap-2 text-base">
									<HeartPulseIcon className="size-4" />
									Salud y Alimentacion
								</CardTitle>
								<Button
									size="sm"
									onClick={() =>
										NiceModal.show(AthleteHealthEditModal, {
											dietaryRestrictions: athlete.dietaryRestrictions,
											allergies: athlete.allergies,
										})
									}
								>
									<PencilIcon className="mr-2 size-4" />
									Editar
								</Button>
							</CardHeader>
							<CardContent className="space-y-3">
								{athlete.dietaryRestrictions && (
									<div>
										<p className="text-muted-foreground text-xs">
											Restricciones Alimenticias
										</p>
										<p className="font-medium">{athlete.dietaryRestrictions}</p>
									</div>
								)}
								{athlete.allergies && (
									<div>
										<p className="text-muted-foreground text-xs">Alergias</p>
										<p className="font-medium text-red-600">
											{athlete.allergies}
										</p>
									</div>
								)}
								{!athlete.dietaryRestrictions && !athlete.allergies && (
									<p className="text-muted-foreground text-sm">
										No hay restricciones ni alergias registradas
									</p>
								)}
							</CardContent>
						</Card>

						{/* Bio */}
						{athlete.bio && (
							<Card className="md:col-span-2">
								<CardHeader className="flex flex-row items-center justify-between space-y-0">
									<CardTitle className="flex items-center gap-2 text-base">
										<UserIcon className="size-4" />
										Biografia
									</CardTitle>
									<Button
										size="sm"
										onClick={() =>
											NiceModal.show(AthleteBioEditModal, {
												bio: athlete.bio,
											})
										}
									>
										<PencilIcon className="mr-2 size-4" />
										Editar
									</Button>
								</CardHeader>
								<CardContent>
									<p className="whitespace-pre-wrap">{athlete.bio}</p>
								</CardContent>
							</Card>
						)}
					</div>
				</TabsContent>

				{/* Physical Tab */}
				<TabsContent value="physical">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Atributos Fisicos</CardTitle>
							<Button
								size="sm"
								onClick={() =>
									NiceModal.show(AthletePhysicalEditModal, {
										height: athlete.height,
										weight: athlete.weight,
										dominantFoot: athlete.dominantFoot,
										dominantHand: athlete.dominantHand,
										yearsOfExperience: athlete.yearsOfExperience,
									})
								}
							>
								<PencilIcon className="mr-2 size-4" />
								Editar
							</Button>
						</CardHeader>
						<CardContent>
							<div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
								<div className="flex items-center gap-3">
									<div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
										<RulerIcon className="size-6 text-primary" />
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Altura</p>
										<p className="font-semibold text-lg">
											{athlete.height ? `${athlete.height} cm` : "-"}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
										<WeightIcon className="size-6 text-primary" />
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Peso</p>
										<p className="font-semibold text-lg">
											{athlete.weight
												? `${(athlete.weight / 1000).toFixed(1)} kg`
												: "-"}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
										<span className="text-xl">🦶</span>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">
											Pie Dominante
										</p>
										<p className="font-semibold text-lg">
											{athlete.dominantFoot
												? capitalize(athlete.dominantFoot)
												: "-"}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
										<span className="text-xl">✋</span>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">
											Mano Dominante
										</p>
										<p className="font-semibold text-lg">
											{athlete.dominantHand
												? capitalize(athlete.dominantHand)
												: "-"}
										</p>
									</div>
								</div>
							</div>
							{athlete.yearsOfExperience && (
								<div className="mt-6 flex items-center gap-3">
									<div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
										<CalendarIcon className="size-6 text-primary" />
									</div>
									<div>
										<p className="text-muted-foreground text-xs">
											Anos de Experiencia
										</p>
										<p className="font-semibold text-lg">
											{athlete.yearsOfExperience} anos
										</p>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Career Tab */}
				<TabsContent value="career">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Historial de Carrera</CardTitle>
							<Button
								size="sm"
								onClick={() => {
									NiceModal.show(AthleteCareerEditModal, {
										athleteId: athlete.id,
									});
								}}
							>
								<PlusIcon className="mr-2 size-4" />
								Agregar
							</Button>
						</CardHeader>
						<CardContent>
							{!careerHistory || careerHistory.length === 0 ? (
								<div className="py-10 text-center">
									<BriefcaseIcon className="mx-auto size-12 text-muted-foreground/50" />
									<p className="mt-3 text-muted-foreground">
										No hay historial de carrera registrado
									</p>
								</div>
							) : (
								<div className="space-y-8">
									{/* Clubs Section */}
									{(() => {
										const clubs = careerHistory.filter(
											(e) => !e.nationalTeamId,
										);
										if (clubs.length === 0) return null;
										return (
											<div>
												<div className="mb-4 flex items-center gap-2">
													<div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
														<BriefcaseIcon className="size-4 text-primary" />
													</div>
													<h3 className="font-semibold">Clubes y Equipos</h3>
													<Badge variant="secondary" className="ml-auto">
														{clubs.length}
													</Badge>
												</div>
												<div className="relative ml-4 space-y-0 border-l-2 border-primary/20 pl-6">
													{clubs.map((entry) => (
														<CareerEntryCard
															key={entry.id}
															entry={entry}
															athleteId={athlete.id}
														/>
													))}
												</div>
											</div>
										);
									})()}

									{/* National Teams Section */}
									{(() => {
										const nationalTeams = careerHistory.filter(
											(e) => e.nationalTeamId,
										);
										if (nationalTeams.length === 0) return null;
										return (
											<div>
												<div className="mb-4 flex items-center gap-2">
													<div className="flex size-8 items-center justify-center rounded-full bg-yellow-500/10">
														<FlagIcon className="size-4 text-yellow-600" />
													</div>
													<h3 className="font-semibold">
														Selecciones Nacionales
													</h3>
													<Badge
														variant="secondary"
														className="ml-auto bg-yellow-100 text-yellow-700"
													>
														{nationalTeams.length}
													</Badge>
												</div>
												<div className="relative ml-4 space-y-0 border-l-2 border-yellow-500/30 pl-6">
													{nationalTeams.map((entry) => (
														<CareerEntryCard
															key={entry.id}
															entry={entry}
															athleteId={athlete.id}
															isNationalTeam
														/>
													))}
												</div>
											</div>
										);
									})()}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Education Tab */}
				<TabsContent value="education">
					<EducationTabContent />
				</TabsContent>

				{/* Languages Tab */}
				<TabsContent value="languages">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2">
									<GlobeIcon className="size-5" />
									Idiomas
								</CardTitle>
								<Button
									size="sm"
									onClick={() =>
										NiceModal.show(AthleteLanguagesModal, {
											languages: languages ?? [],
										})
									}
								>
									<PencilIcon className="mr-2 size-4" />
									Editar
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{languages && languages.length > 0 ? (
								<div className="flex flex-wrap gap-3">
									{languages.map((lang) => (
										<div
											key={lang.id}
											className="flex items-center gap-2 rounded-lg border px-4 py-2"
										>
											<span className="font-medium">{lang.language}</span>
											<Badge
												variant="secondary"
												className={cn(
													lang.level === LanguageProficiencyLevel.native &&
														"bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
													lang.level === LanguageProficiencyLevel.fluent &&
														"bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
													lang.level === LanguageProficiencyLevel.advanced &&
														"bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100",
													lang.level ===
														LanguageProficiencyLevel.intermediate &&
														"bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
													lang.level === LanguageProficiencyLevel.basic &&
														"bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
												)}
											>
												{lang.level === LanguageProficiencyLevel.native &&
													"Nativo"}
												{lang.level === LanguageProficiencyLevel.fluent &&
													"Fluido"}
												{lang.level === LanguageProficiencyLevel.advanced &&
													"Avanzado"}
												{lang.level === LanguageProficiencyLevel.intermediate &&
													"Intermedio"}
												{lang.level === LanguageProficiencyLevel.basic &&
													"Básico"}
											</Badge>
										</div>
									))}
								</div>
							) : (
								<div className="py-10 text-center">
									<GlobeIcon className="mx-auto size-12 text-muted-foreground/50" />
									<p className="mt-3 text-muted-foreground">
										No has agregado ningún idioma
									</p>
									<Button
										size="sm"
										className="mt-4"
										onClick={() =>
											NiceModal.show(AthleteLanguagesModal, {
												languages: [],
											})
										}
									>
										<PencilIcon className="mr-2 size-4" />
										Editar
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Social Media Tab */}
				<TabsContent value="social">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2">
									<Share2Icon className="size-5" />
									Redes Sociales
								</CardTitle>
								<Button
									size="sm"
									onClick={() =>
										NiceModal.show(AthleteSocialEditModal, {
											socialInstagram: athlete.socialInstagram,
											socialTwitter: athlete.socialTwitter,
											socialTiktok: athlete.socialTiktok,
											socialLinkedin: athlete.socialLinkedin,
											socialFacebook: athlete.socialFacebook,
										})
									}
								>
									<PencilIcon className="mr-2 size-4" />
									Editar
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{athlete.socialInstagram ||
							athlete.socialTwitter ||
							athlete.socialTiktok ||
							athlete.socialLinkedin ||
							athlete.socialFacebook ? (
								<div className="flex flex-wrap gap-3">
									{athlete.socialInstagram && (
										<a
											href={`https://instagram.com/${athlete.socialInstagram}`}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors hover:bg-muted"
										>
											<InstagramIcon className="size-5 text-pink-600" />
											<span>@{athlete.socialInstagram}</span>
										</a>
									)}
									{athlete.socialTwitter && (
										<a
											href={`https://x.com/${athlete.socialTwitter}`}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors hover:bg-muted"
										>
											<svg
												className="size-5"
												viewBox="0 0 24 24"
												fill="currentColor"
											>
												<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
											</svg>
											<span>@{athlete.socialTwitter}</span>
										</a>
									)}
									{athlete.socialTiktok && (
										<a
											href={`https://tiktok.com/@${athlete.socialTiktok}`}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors hover:bg-muted"
										>
											<svg
												className="size-5"
												viewBox="0 0 24 24"
												fill="currentColor"
											>
												<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
											</svg>
											<span>@{athlete.socialTiktok}</span>
										</a>
									)}
									{athlete.socialLinkedin && (
										<a
											href={athlete.socialLinkedin}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors hover:bg-muted"
										>
											<LinkedinIcon className="size-5 text-blue-700" />
											<span>LinkedIn</span>
										</a>
									)}
									{athlete.socialFacebook && (
										<a
											href={athlete.socialFacebook}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors hover:bg-muted"
										>
											<FacebookIcon className="size-5 text-blue-600" />
											<span>Facebook</span>
										</a>
									)}
								</div>
							) : (
								<div className="py-10 text-center">
									<Share2Icon className="mx-auto size-12 text-muted-foreground/50" />
									<p className="mt-3 text-muted-foreground">
										No has agregado tus redes sociales
									</p>
									<Button
										size="sm"
										className="mt-4"
										onClick={() =>
											NiceModal.show(AthleteSocialEditModal, {
												socialInstagram: null,
												socialTwitter: null,
												socialTiktok: null,
												socialLinkedin: null,
												socialFacebook: null,
											})
										}
									>
										<PencilIcon className="mr-2 size-4" />
										Editar
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Medical Tab */}
				<TabsContent value="medical">
					<AthleteMyMedicalTab
						hasMedicalCertificate={!!athlete.medicalCertificateKey}
						medicalCertificateUploadedAt={athlete.medicalCertificateUploadedAt}
						medicalCertificateExpiresAt={athlete.medicalCertificateExpiresAt}
					/>
				</TabsContent>

				{/* Videos Tab */}
				<TabsContent value="videos">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2">
									<VideoIcon className="size-5" />
									Videos Destacados
								</CardTitle>
								<Button
									size="sm"
									onClick={() =>
										NiceModal.show(AthleteVideosEditModal, {
											videos: athlete.youtubeVideos ?? [],
										})
									}
								>
									<PencilIcon className="mr-2 size-4" />
									Editar
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{athlete.youtubeVideos && athlete.youtubeVideos.length > 0 ? (
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{athlete.youtubeVideos.map((url, index) => {
										const videoId = getYoutubeVideoId(url);
										return (
											<a
												key={`video-${index}`}
												href={url}
												target="_blank"
												rel="noopener noreferrer"
												className="group relative overflow-hidden rounded-lg border"
											>
												{videoId ? (
													<img
														src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
														alt={`Video ${index + 1}`}
														className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
													/>
												) : (
													<div className="flex aspect-video w-full items-center justify-center bg-muted">
														<TrendingUpIcon className="size-8 text-muted-foreground" />
													</div>
												)}
												<div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
													<div className="flex size-12 items-center justify-center rounded-full bg-red-600 text-white">
														&#9658;
													</div>
												</div>
											</a>
										);
									})}
								</div>
							) : (
								<div className="py-10 text-center">
									<VideoIcon className="mx-auto size-12 text-muted-foreground/50" />
									<p className="mt-3 text-muted-foreground">
										No hay videos destacados
									</p>
									<Button
										size="sm"
										className="mt-4"
										onClick={() =>
											NiceModal.show(AthleteVideosEditModal, {
												videos: [],
											})
										}
									>
										<PencilIcon className="mr-2 size-4" />
										Editar
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* References Tab */}
				<TabsContent value="references">
					<AthleteReferencesTab />
				</TabsContent>

				{/* Sponsors Tab */}
				<TabsContent value="sponsors">
					<AthleteSponsorsTab />
				</TabsContent>

				{/* Achievements Tab */}
				<TabsContent value="achievements">
					<AthleteAchievementsTab />
				</TabsContent>

				{/* Public Profile Tab */}
				<TabsContent value="public">
					<PublicProfileSettings
						athleteId={athlete.id}
						initialIsPublic={athlete.isPublicProfile ?? false}
						initialOpportunities={
							(athlete.opportunityTypes as AthleteOpportunityType[]) ?? []
						}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}

// Helper function to extract YouTube video ID
function getYoutubeVideoId(url: string): string | null {
	const match = url.match(
		/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/,
	);
	return match?.[1] ?? null;
}

// Career Entry Card component
interface CareerEntry {
	id: string;
	clubId: string | null;
	nationalTeamId: string | null;
	club?: { id: string; name: string } | null;
	nationalTeam?: { id: string; name: string; category: string | null } | null;
	startDate: Date | null;
	endDate: Date | null;
	position: string | null;
	achievements: string | null;
	notes: string | null;
}

function CareerEntryCard({
	entry,
	athleteId,
	isNationalTeam = false,
}: {
	entry: CareerEntry;
	athleteId: string;
	isNationalTeam?: boolean;
}) {
	return (
		<div className="relative pb-6 last:pb-0">
			<div
				className={cn(
					"absolute -left-[31px] top-1 flex size-4 items-center justify-center rounded-full",
					isNationalTeam ? "bg-yellow-500" : "bg-primary",
				)}
			/>

			<div className="group rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
				<div className="flex flex-wrap items-start justify-between gap-2">
					<div className="space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<h4 className="font-semibold">
								{entry.club?.name || entry.nationalTeam?.name || "-"}
							</h4>
							{isNationalTeam && entry.nationalTeam?.category && (
								<Badge
									variant="outline"
									className="border-yellow-500/50 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
								>
									{entry.nationalTeam.category}
								</Badge>
							)}
						</div>
						{entry.position && (
							<p className="text-muted-foreground text-sm">{entry.position}</p>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="secondary" className="font-normal">
							{entry.startDate
								? format(new Date(entry.startDate), "MMM yyyy")
								: "?"}
							{" — "}
							{entry.endDate
								? format(new Date(entry.endDate), "MMM yyyy")
								: "Presente"}
						</Badge>
						<Button
							variant="ghost"
							size="icon"
							className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
							onClick={() =>
								NiceModal.show(AthleteCareerEditModal, {
									athleteId,
									entry: {
										id: entry.id,
										clubId: entry.clubId,
										nationalTeamId: entry.nationalTeamId,
										startDate: entry.startDate,
										endDate: entry.endDate,
										position: entry.position,
										achievements: entry.achievements,
										notes: entry.notes,
									},
								})
							}
						>
							<PencilIcon className="size-4" />
						</Button>
					</div>
				</div>

				{entry.achievements && (
					<div className="mt-3 flex items-start gap-2 rounded-md bg-muted/50 p-2">
						<TrophyIcon className="mt-0.5 size-4 shrink-0 text-yellow-600" />
						<p className="text-sm">{entry.achievements}</p>
					</div>
				)}

				{entry.notes && (
					<p className="mt-2 text-muted-foreground text-sm italic">
						{entry.notes}
					</p>
				)}
			</div>
		</div>
	);
}

// Education Tab Content with list of entries
function EducationTabContent() {
	const { data: educationList, isLoading } =
		trpc.athlete.listMyEducation.useQuery();

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="flex items-center gap-2">
					<GraduationCapIcon className="size-5" />
					Historial Educativo
				</CardTitle>
				<Button
					size="sm"
					onClick={() => {
						NiceModal.show(AthleteEducationEditModal, {});
					}}
				>
					<PlusIcon className="mr-2 size-4" />
					Agregar
				</Button>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-4">
						<Skeleton className="h-24" />
						<Skeleton className="h-24" />
					</div>
				) : !educationList || educationList.length === 0 ? (
					<div className="py-10 text-center">
						<GraduationCapIcon className="mx-auto size-12 text-muted-foreground/50" />
						<p className="mt-3 text-muted-foreground">
							No hay historial educativo registrado
						</p>
						<Button
							size="sm"
							className="mt-4"
							onClick={() => NiceModal.show(AthleteEducationEditModal, {})}
						>
							<PlusIcon className="mr-2 size-4" />
							Agregar
						</Button>
					</div>
				) : (
					<div className="space-y-4">
						{educationList.map((entry) => (
							<EducationEntryCard key={entry.id} entry={entry} />
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// Individual Education Entry Card
interface EducationEntryProps {
	entry: {
		id: string;
		institution: string;
		degree: string | null;
		fieldOfStudy: string | null;
		academicYear: string | null;
		startDate: Date | null;
		endDate: Date | null;
		expectedGraduationDate: Date | null;
		gpa: string | null;
		isCurrent: boolean;
		notes: string | null;
	};
}

function EducationEntryCard({ entry }: EducationEntryProps) {
	return (
		<div className="group rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
			<div className="flex flex-wrap items-start justify-between gap-2">
				<div className="space-y-1">
					<div className="flex flex-wrap items-center gap-2">
						<h4 className="font-semibold">{entry.institution}</h4>
						{entry.isCurrent && (
							<Badge
								variant="outline"
								className="border-violet-500/50 bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400"
							>
								Actual
							</Badge>
						)}
					</div>
					{(entry.degree || entry.fieldOfStudy) && (
						<p className="text-muted-foreground text-sm">
							{[entry.degree, entry.fieldOfStudy].filter(Boolean).join(" - ")}
						</p>
					)}
					{entry.academicYear && (
						<p className="text-muted-foreground text-xs">
							Ano academico: {entry.academicYear}
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Badge variant="secondary" className="font-normal">
						{entry.startDate
							? format(new Date(entry.startDate), "MMM yyyy")
							: "?"}
						{" — "}
						{entry.isCurrent
							? "Presente"
							: entry.endDate
								? format(new Date(entry.endDate), "MMM yyyy")
								: "?"}
					</Badge>
					<Button
						variant="ghost"
						size="icon"
						className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
						onClick={() =>
							NiceModal.show(AthleteEducationEditModal, {
								entry: {
									id: entry.id,
									institution: entry.institution,
									degree: entry.degree,
									fieldOfStudy: entry.fieldOfStudy,
									academicYear: entry.academicYear,
									startDate: entry.startDate,
									endDate: entry.endDate,
									expectedGraduationDate: entry.expectedGraduationDate,
									gpa: entry.gpa,
									isCurrent: entry.isCurrent,
									notes: entry.notes,
								},
							})
						}
					>
						<PencilIcon className="size-4" />
					</Button>
				</div>
			</div>

			{entry.gpa && (
				<div className="mt-3 flex items-center gap-2 text-sm">
					<span className="text-muted-foreground">GPA:</span>
					<span className="font-medium">{entry.gpa}</span>
				</div>
			)}

			{entry.expectedGraduationDate && entry.isCurrent && (
				<div className="mt-2 flex items-center gap-2 text-sm">
					<CalendarIcon className="size-4 text-muted-foreground" />
					<span className="text-muted-foreground">
						Graduacion estimada:{" "}
						{format(new Date(entry.expectedGraduationDate), "MMMM yyyy")}
					</span>
				</div>
			)}

			{entry.notes && (
				<p className="mt-2 text-muted-foreground text-sm italic">
					{entry.notes}
				</p>
			)}
		</div>
	);
}

function AthleteMyProfileSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-start gap-4">
				<Skeleton className="size-16 rounded-full" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
			</div>
			<Skeleton className="h-24" />
			<Skeleton className="h-96" />
		</div>
	);
}
