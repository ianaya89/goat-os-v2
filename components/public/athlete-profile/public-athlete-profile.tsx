"use client";

import { differenceInYears, format } from "date-fns";
import { es } from "date-fns/locale";
import {
	BadgeCheckIcon,
	BriefcaseIcon,
	CalendarIcon,
	ExternalLinkIcon,
	GlobeIcon,
	GraduationCapIcon,
	HeartHandshakeIcon,
	LanguagesIcon,
	LinkedinIcon,
	MapPinIcon,
	MedalIcon,
	PlayIcon,
	QuoteIcon,
	RulerIcon,
	ShareIcon,
	SparklesIcon,
	StarIcon,
	TargetIcon,
	TrophyIcon,
	UserIcon,
	WeightIcon,
} from "lucide-react";
import type * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user/user-avatar";
import type {
	AchievementScope,
	AchievementType,
	AthleteOpportunityType,
	LanguageProficiencyLevel,
} from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";

// Social media icons
const InstagramIcon = ({ className }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24" fill="currentColor">
		<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
	</svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24" fill="currentColor">
		<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
	</svg>
);

const TiktokIcon = ({ className }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24" fill="currentColor">
		<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
	</svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24" fill="currentColor">
		<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
	</svg>
);

interface AthleteData {
	athlete: {
		id: string;
		sport: string;
		birthDate: Date | null;
		level: string;
		status: string;
		height: number | null;
		weight: number | null;
		dominantFoot: string | null;
		dominantHand: string | null;
		nationality: string | null;
		position: string | null;
		secondaryPosition: string | null;
		jerseyNumber: number | null;
		bio: string | null;
		yearsOfExperience: number | null;
		currentClub: string | null;
		category: string | null;
		residenceCity: string | null;
		residenceCountry: string | null;
		youtubeVideos: string[] | null;
		educationInstitution: string | null;
		educationYear: string | null;
		gpa: string | null;
		socialInstagram: string | null;
		socialTwitter: string | null;
		socialTiktok: string | null;
		socialLinkedin: string | null;
		socialFacebook: string | null;
		coverPhotoUrl: string | null;
		isPublicProfile: boolean;
		opportunityTypes: AthleteOpportunityType[] | null;
		user: {
			id: string;
			name: string | null;
			image: string | null;
		} | null;
	};
	careerHistory: Array<{
		id: string;
		clubName: string;
		startDate: Date | null;
		endDate: Date | null;
		position: string | null;
		achievements: string | null;
		wasNationalTeam: boolean;
		nationalTeamLevel: string | null;
	}>;
	languages: Array<{
		id: string;
		language: string;
		level: LanguageProficiencyLevel;
	}>;
	references: Array<{
		id: string;
		name: string;
		relationship: string;
		organization: string | null;
		position: string | null;
		testimonial: string | null;
		skillsHighlighted: string[] | null;
		isVerified: boolean;
	}>;
	sponsors: Array<{
		id: string;
		name: string;
		logoKey: string | null;
		logoUrl: string | null;
		website: string | null;
		description: string | null;
		partnershipType: string | null;
		startDate: Date | null;
		endDate: Date | null;
	}>;
	achievements: Array<{
		id: string;
		title: string;
		type: AchievementType;
		scope: AchievementScope;
		year: number;
		organization: string | null;
		team: string | null;
		competition: string | null;
		position: string | null;
		description: string | null;
	}>;
}

const opportunityLabels: Record<AthleteOpportunityType, string> = {
	professional_team: "Equipo Profesional",
	university_scholarship: "Beca Universitaria",
	tryouts: "Pruebas",
	sponsorship: "Sponsor",
	coaching: "Coaching",
};

const opportunityIcons: Record<AthleteOpportunityType, React.ReactNode> = {
	professional_team: <TargetIcon className="size-3" />,
	university_scholarship: <GraduationCapIcon className="size-3" />,
	tryouts: <MedalIcon className="size-3" />,
	sponsorship: <HeartHandshakeIcon className="size-3" />,
	coaching: <UserIcon className="size-3" />,
};

const languageNames: Record<string, string> = {
	es: "Español",
	en: "Inglés",
	pt: "Portugués",
	fr: "Francés",
	de: "Alemán",
	it: "Italiano",
	zh: "Chino",
	ja: "Japonés",
	ko: "Coreano",
	ar: "Árabe",
};

const levelLabels: Record<LanguageProficiencyLevel, string> = {
	native: "Nativo",
	fluent: "Fluido",
	advanced: "Avanzado",
	intermediate: "Intermedio",
	basic: "Básico",
};

const achievementTypeLabels: Record<AchievementType, string> = {
	championship: "Campeonato",
	award: "Premio",
	selection: "Selección",
	record: "Record",
	recognition: "Reconocimiento",
	mvp: "MVP",
	top_scorer: "Goleador",
	best_player: "Mejor Jugador",
	all_star: "All-Star",
	scholarship: "Beca",
	other: "Otro",
};

const achievementTypeColors: Record<AchievementType, string> = {
	championship:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
	award:
		"bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
	selection: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
	record: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
	recognition:
		"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
	mvp: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
	top_scorer:
		"bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
	best_player:
		"bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
	all_star: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
	scholarship:
		"bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
	other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export function PublicAthleteProfile({ data }: { data: AthleteData }) {
	const {
		athlete,
		careerHistory,
		languages,
		references,
		sponsors,
		achievements,
	} = data;

	const age = athlete.birthDate
		? differenceInYears(new Date(), new Date(athlete.birthDate))
		: null;

	const handleShare = async () => {
		const url = window.location.href;
		if (navigator.share) {
			await navigator.share({
				title: `${athlete.user?.name} - Perfil Deportivo`,
				url,
			});
		} else {
			await navigator.clipboard.writeText(url);
			toast.success("Enlace copiado al portapapeles");
		}
	};

	const hasOpportunities =
		athlete.opportunityTypes && athlete.opportunityTypes.length > 0;
	const hasSocialMedia =
		athlete.socialInstagram ||
		athlete.socialTwitter ||
		athlete.socialTiktok ||
		athlete.socialLinkedin ||
		athlete.socialFacebook;

	return (
		<div className="min-h-screen bg-background">
			{/* Header with Cover Photo */}
			<header className="relative border-b bg-card">
				{/* Cover Photo with Blue Overlay */}
				{athlete.coverPhotoUrl && (
					<div className="absolute inset-0 overflow-hidden">
						<img
							src={athlete.coverPhotoUrl}
							alt=""
							className="size-full object-cover opacity-20"
						/>
						{/* Blue gradient overlay */}
						<div className="absolute inset-0 bg-gradient-to-b from-blue-600/30 via-blue-500/20 to-background" />
					</div>
				)}
				<div className="container relative mx-auto px-4 py-6 sm:py-8">
					<div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
						{/* Avatar & Basic Info */}
						<div className="flex items-start gap-4 sm:gap-6">
							<div className="relative">
								<UserAvatar
									className="size-20 border-2 border-border shadow-sm sm:size-28"
									name={athlete.user?.name ?? ""}
									src={athlete.user?.image ?? undefined}
								/>
								{athlete.jerseyNumber && (
									<div className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs shadow-sm sm:size-8 sm:text-sm">
										{athlete.jerseyNumber}
									</div>
								)}
							</div>

							<div className="flex-1 space-y-2">
								<div>
									<h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
										{athlete.user?.name ?? "Atleta"}
									</h1>
									<div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
										{athlete.position && (
											<span className="font-medium text-foreground">
												{athlete.position}
											</span>
										)}
										{athlete.position && athlete.currentClub && <span>•</span>}
										{athlete.currentClub && <span>{athlete.currentClub}</span>}
									</div>
								</div>

								{/* Badges */}
								<div className="flex flex-wrap items-center gap-1.5">
									<Badge variant="secondary" className="text-xs">
										{capitalize(athlete.sport)}
									</Badge>
									<Badge variant="outline" className="text-xs">
										<StarIcon className="mr-1 size-3" />
										{capitalize(athlete.level)}
									</Badge>
									{athlete.nationality && (
										<Badge variant="outline" className="text-xs">
											{athlete.nationality}
										</Badge>
									)}
								</div>
							</div>
						</div>

						{/* Right side - Actions & Open to Work */}
						<div className="flex flex-col items-start gap-3 sm:ml-auto sm:items-end">
							{hasOpportunities && (
								<div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 dark:border-green-900 dark:bg-green-950">
									<span className="relative flex size-2">
										<span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
										<span className="relative inline-flex size-2 rounded-full bg-green-500" />
									</span>
									<span className="font-medium text-green-700 text-xs dark:text-green-300">
										Abierto a Oportunidades
									</span>
								</div>
							)}
							<Button variant="outline" size="sm" onClick={handleShare}>
								<ShareIcon className="mr-1.5 size-3.5" />
								Compartir
							</Button>
						</div>
					</div>

					{/* Opportunity Tags */}
					{hasOpportunities && (
						<div className="mt-4 flex flex-wrap gap-1.5">
							{athlete.opportunityTypes?.map((type) => (
								<Badge
									key={type}
									variant="secondary"
									className="gap-1 bg-green-100 text-green-800 text-xs dark:bg-green-900/30 dark:text-green-300"
								>
									{opportunityIcons[type]}
									{opportunityLabels[type]}
								</Badge>
							))}
						</div>
					)}

					{/* Social Media */}
					{hasSocialMedia && (
						<div className="mt-4 flex items-center gap-2">
							{athlete.socialInstagram && (
								<a
									href={`https://instagram.com/${athlete.socialInstagram}`}
									target="_blank"
									rel="noopener noreferrer"
									className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<InstagramIcon className="size-4" />
								</a>
							)}
							{athlete.socialTwitter && (
								<a
									href={`https://x.com/${athlete.socialTwitter}`}
									target="_blank"
									rel="noopener noreferrer"
									className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<TwitterIcon className="size-4" />
								</a>
							)}
							{athlete.socialTiktok && (
								<a
									href={`https://tiktok.com/@${athlete.socialTiktok}`}
									target="_blank"
									rel="noopener noreferrer"
									className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<TiktokIcon className="size-4" />
								</a>
							)}
							{athlete.socialLinkedin && (
								<a
									href={
										athlete.socialLinkedin.startsWith("http")
											? athlete.socialLinkedin
											: `https://linkedin.com/in/${athlete.socialLinkedin}`
									}
									target="_blank"
									rel="noopener noreferrer"
									className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<LinkedinIcon className="size-4" />
								</a>
							)}
							{athlete.socialFacebook && (
								<a
									href={
										athlete.socialFacebook.startsWith("http")
											? athlete.socialFacebook
											: `https://facebook.com/${athlete.socialFacebook}`
									}
									target="_blank"
									rel="noopener noreferrer"
									className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<FacebookIcon className="size-4" />
								</a>
							)}
						</div>
					)}
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-8">
				<div className="grid gap-8 lg:grid-cols-3">
					{/* Left Column - Main Info */}
					<div className="space-y-6 lg:col-span-2">
						{/* Bio */}
						{athlete.bio && (
							<Section title="Sobre mí">
								<p className="text-muted-foreground text-sm leading-relaxed">
									{athlete.bio}
								</p>
							</Section>
						)}

						{/* Career History */}
						{careerHistory.length > 0 && (
							<Section title="Trayectoria">
								<div className="space-y-3">
									{careerHistory.map((entry, index) => (
										<div
											key={entry.id}
											className={cn(
												"relative flex gap-4 pb-3",
												index !== careerHistory.length - 1 && "border-b",
											)}
										>
											{/* Timeline indicator */}
											<div className="flex flex-col items-center pt-1">
												<div
													className={cn(
														"size-2.5 rounded-full",
														!entry.endDate
															? "bg-green-500"
															: entry.wasNationalTeam
																? "bg-amber-500"
																: "bg-muted-foreground/40",
													)}
												/>
											</div>

											<div className="flex-1 min-w-0">
												<div className="flex items-start justify-between gap-2">
													<div>
														<h4 className="font-medium text-sm">
															{entry.clubName}
															{entry.wasNationalTeam && (
																<Badge
																	variant="secondary"
																	className="ml-2 bg-amber-100 text-amber-800 text-[10px] dark:bg-amber-900/30 dark:text-amber-300"
																>
																	<TrophyIcon className="mr-1 size-2.5" />
																	{entry.nationalTeamLevel || "Selección"}
																</Badge>
															)}
														</h4>
														{entry.position && (
															<p className="text-muted-foreground text-xs">
																{entry.position}
															</p>
														)}
													</div>
													<span className="text-muted-foreground text-xs whitespace-nowrap">
														{entry.startDate
															? format(new Date(entry.startDate), "MMM yyyy", {
																	locale: es,
																})
															: ""}
														{" - "}
														{entry.endDate
															? format(new Date(entry.endDate), "MMM yyyy", {
																	locale: es,
																})
															: "Presente"}
													</span>
												</div>

												{entry.achievements && (
													<p className="mt-1 text-muted-foreground text-xs">
														{entry.achievements}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							</Section>
						)}

						{/* Achievements */}
						{achievements && achievements.length > 0 && (
							<Section title="Palmarés">
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
									{achievements.map((achievement) => (
										<Card
											key={achievement.id}
											className="relative overflow-hidden p-4"
										>
											{/* Year badge */}
											<div className="absolute right-2 top-2">
												<Badge variant="outline" className="text-[10px]">
													{achievement.year}
												</Badge>
											</div>

											{/* Icon */}
											<div className="mb-3 flex items-center justify-center">
												<div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
													<TrophyIcon className="size-5 text-amber-600 dark:text-amber-400" />
												</div>
											</div>

											{/* Title */}
											<h4 className="text-center font-semibold text-sm line-clamp-2">
												{achievement.title}
											</h4>

											{/* Type badge */}
											<div className="mt-2 flex justify-center">
												<Badge
													variant="secondary"
													className={cn(
														"text-[10px]",
														achievementTypeColors[achievement.type],
													)}
												>
													{achievementTypeLabels[achievement.type]}
												</Badge>
											</div>

											{/* Position */}
											{achievement.position && (
												<p className="mt-2 text-center font-medium text-amber-600 text-xs dark:text-amber-400">
													{achievement.position}
												</p>
											)}

											{/* Competition */}
											{achievement.competition && (
												<p className="mt-1 text-center text-muted-foreground text-[11px] line-clamp-1">
													{achievement.competition}
												</p>
											)}

											{/* Team (for collective achievements) */}
											{achievement.team && (
												<p className="mt-1 text-center text-muted-foreground text-[11px]">
													con {achievement.team}
												</p>
											)}
										</Card>
									))}
								</div>
							</Section>
						)}

						{/* Videos */}
						{athlete.youtubeVideos && athlete.youtubeVideos.length > 0 && (
							<Section title="Videos">
								<div className="grid gap-3 sm:grid-cols-2">
									{athlete.youtubeVideos.map((url, index) => {
										const videoId = extractYouTubeId(url);
										if (!videoId) return null;

										return (
											<a
												key={index}
												href={url}
												target="_blank"
												rel="noopener noreferrer"
												className="group relative aspect-video overflow-hidden rounded-lg bg-muted"
											>
												<img
													src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
													alt={`Video ${index + 1}`}
													className="size-full object-cover transition-transform group-hover:scale-105"
												/>
												<div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
													<div className="flex size-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
														<PlayIcon className="size-5 text-gray-900" />
													</div>
												</div>
											</a>
										);
									})}
								</div>
							</Section>
						)}

						{/* References */}
						{references.length > 0 && (
							<Section title="Referencias">
								<div className="space-y-4">
									{references.map((ref) => (
										<Card key={ref.id} className="p-4">
											<div className="flex items-start gap-3">
												<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
													<QuoteIcon className="size-4 text-muted-foreground" />
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2">
														<span className="font-medium text-sm">
															{ref.name}
														</span>
														{ref.isVerified && (
															<BadgeCheckIcon className="size-4 text-blue-500" />
														)}
													</div>
													<p className="text-muted-foreground text-xs">
														{ref.relationship}
														{ref.organization && ` • ${ref.organization}`}
													</p>
													{ref.testimonial && (
														<p className="mt-2 text-muted-foreground text-sm italic">
															"{ref.testimonial}"
														</p>
													)}
													{ref.skillsHighlighted &&
														ref.skillsHighlighted.length > 0 && (
															<div className="mt-2 flex flex-wrap gap-1">
																{ref.skillsHighlighted.map((skill, i) => (
																	<Badge
																		key={i}
																		variant="secondary"
																		className="text-[10px]"
																	>
																		{skill}
																	</Badge>
																))}
															</div>
														)}
												</div>
											</div>
										</Card>
									))}
								</div>
							</Section>
						)}
					</div>

					{/* Right Column - Sidebar */}
					<div className="space-y-6">
						{/* Quick Stats */}
						<Card className="p-4">
							<h3 className="mb-3 font-semibold text-sm">Información</h3>
							<div className="space-y-2.5">
								{age && (
									<InfoRow
										icon={<CalendarIcon className="size-3.5" />}
										label="Edad"
										value={`${age} años`}
									/>
								)}
								{athlete.height && (
									<InfoRow
										icon={<RulerIcon className="size-3.5" />}
										label="Altura"
										value={`${athlete.height} cm`}
									/>
								)}
								{athlete.weight && (
									<InfoRow
										icon={<WeightIcon className="size-3.5" />}
										label="Peso"
										value={`${athlete.weight} kg`}
									/>
								)}
								{athlete.yearsOfExperience && (
									<InfoRow
										icon={<BriefcaseIcon className="size-3.5" />}
										label="Experiencia"
										value={`${athlete.yearsOfExperience} años`}
									/>
								)}
								{(athlete.residenceCity || athlete.residenceCountry) && (
									<InfoRow
										icon={<MapPinIcon className="size-3.5" />}
										label="Ubicación"
										value={[athlete.residenceCity, athlete.residenceCountry]
											.filter(Boolean)
											.join(", ")}
									/>
								)}
								{athlete.dominantFoot && (
									<InfoRow
										icon={<GlobeIcon className="size-3.5" />}
										label="Pie hábil"
										value={capitalize(athlete.dominantFoot)}
									/>
								)}
								{athlete.dominantHand && (
									<InfoRow
										icon={<GlobeIcon className="size-3.5" />}
										label="Mano hábil"
										value={capitalize(athlete.dominantHand)}
									/>
								)}
							</div>
						</Card>

						{/* Education */}
						{athlete.educationInstitution && (
							<Card className="p-4">
								<h3 className="mb-3 font-semibold text-sm">
									<GraduationCapIcon className="mr-1.5 inline-block size-4" />
									Educación
								</h3>
								<div className="space-y-1">
									<p className="font-medium text-sm">
										{athlete.educationInstitution}
									</p>
									{athlete.educationYear && (
										<p className="text-muted-foreground text-xs">
											{athlete.educationYear}
										</p>
									)}
									{athlete.gpa && (
										<p className="text-muted-foreground text-xs">
											GPA: {athlete.gpa}
										</p>
									)}
								</div>
							</Card>
						)}

						{/* Languages */}
						{languages.length > 0 && (
							<Card className="p-4">
								<h3 className="mb-3 font-semibold text-sm">
									<LanguagesIcon className="mr-1.5 inline-block size-4" />
									Idiomas
								</h3>
								<div className="space-y-2">
									{languages.map((lang) => (
										<div
											key={lang.id}
											className="flex items-center justify-between"
										>
											<span className="text-sm">
												{languageNames[lang.language] || lang.language}
											</span>
											<Badge variant="secondary" className="text-xs">
												{levelLabels[lang.level] || lang.level}
											</Badge>
										</div>
									))}
								</div>
							</Card>
						)}

						{/* Sponsors */}
						{sponsors && sponsors.length > 0 && (
							<Card className="p-4">
								<h3 className="mb-3 font-semibold text-sm">
									<SparklesIcon className="mr-1.5 inline-block size-4" />
									Sponsors
								</h3>
								<div className="grid grid-cols-2 gap-3">
									{sponsors.map((sponsor) => (
										<a
											key={sponsor.id}
											href={sponsor.website ?? undefined}
											target="_blank"
											rel="noopener noreferrer"
											className={cn(
												"group flex flex-col items-center justify-center rounded-lg border bg-background p-3 transition-colors",
												sponsor.website &&
													"hover:border-primary hover:bg-muted",
											)}
										>
											<div className="relative mb-2 size-14 overflow-hidden rounded-md bg-muted">
												{sponsor.logoUrl ? (
													<img
														src={sponsor.logoUrl}
														alt={sponsor.name}
														className="size-full object-cover"
													/>
												) : (
													<div className="flex size-full items-center justify-center">
														<SparklesIcon className="size-6 text-muted-foreground" />
													</div>
												)}
											</div>
											<span className="text-center text-xs font-medium line-clamp-1">
												{sponsor.name}
											</span>
											{sponsor.website && (
												<ExternalLinkIcon className="mt-1 size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
											)}
										</a>
									))}
								</div>
							</Card>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}

// Helper Components
function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section>
			<h2 className="mb-4 font-semibold text-base">{title}</h2>
			{children}
		</section>
	);
}

function InfoRow({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-2 text-muted-foreground">
				{icon}
				<span className="text-xs">{label}</span>
			</div>
			<span className="text-sm">{value}</span>
		</div>
	);
}

function extractYouTubeId(url: string): string | null {
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
		/^([a-zA-Z0-9_-]{11})$/,
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match?.[1]) return match[1];
	}

	return null;
}
