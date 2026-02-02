"use client";

import { ExternalLinkIcon, GlobeIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	type AthleteOpportunityType,
	AthleteOpportunityTypes,
	type CoachOpportunityType,
	CoachOpportunityTypes,
} from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

type ProfileVariant = "athlete" | "coach";

// Opportunity labels for athletes
const athleteOpportunityLabels: Record<AthleteOpportunityType, string> = {
	professional_team: "Buscando equipo/club profesional",
	university_scholarship: "Buscando universidad/becas deportivas",
	tryouts: "Abierto a pruebas/tryouts",
	sponsorship: "Buscando sponsorship",
	coaching: "Abierto a coaching",
};

const athleteOpportunityDescriptions: Record<AthleteOpportunityType, string> = {
	professional_team: "Indica que estas buscando unirte a un equipo profesional",
	university_scholarship:
		"Para atletas buscando becas deportivas en universidades",
	tryouts: "Disponible para hacer pruebas con equipos u organizaciones",
	sponsorship: "Buscando patrocinadores o marcas deportivas",
	coaching: "Abierto a recibir ofertas de coaching o entrenamiento",
};

// Opportunity labels for coaches
const coachOpportunityLabels: Record<CoachOpportunityType, string> = {
	head_coach: "Buscando posicion de entrenador principal",
	assistant_coach: "Buscando posicion de asistente",
	youth_coach: "Interesado en entrenar categorias juveniles",
	private_coaching: "Disponible para clases particulares",
	consultancy: "Disponible para consultorias",
};

const coachOpportunityDescriptions: Record<CoachOpportunityType, string> = {
	head_coach: "Indica que buscas una posicion como entrenador principal",
	assistant_coach: "Buscando oportunidades como asistente tecnico",
	youth_coach: "Interesado en trabajar con categorias formativas",
	private_coaching: "Disponible para sesiones de entrenamiento individual",
	consultancy: "Abierto a proyectos de consultoria deportiva",
};

interface PublicProfileSettingsProps {
	/**
	 * Which profile type this is for
	 */
	variant: ProfileVariant;
	/**
	 * Profile ID (athlete or coach)
	 */
	profileId: string;
	/**
	 * Initial value for public profile toggle
	 */
	initialIsPublic: boolean;
	/**
	 * Initial selected opportunities
	 */
	initialOpportunities: string[];
}

export function PublicProfileSettings({
	variant,
	profileId,
	initialIsPublic,
	initialOpportunities,
}: PublicProfileSettingsProps) {
	const [isPublic, setIsPublic] = useState(initialIsPublic);
	const [selectedOpportunities, setSelectedOpportunities] =
		useState<string[]>(initialOpportunities);

	// Sync state when initial props change (e.g., after refetch)
	useEffect(() => {
		setIsPublic(initialIsPublic);
	}, [initialIsPublic]);

	useEffect(() => {
		setSelectedOpportunities(initialOpportunities);
	}, [initialOpportunities]);

	const utils = trpc.useUtils();

	// Mutations based on variant
	const athleteUpdateMutation = trpc.athlete.updateMyProfile.useMutation({
		onSuccess: () => {
			utils.athlete.getMyProfile.invalidate();
		},
		onError: (error) => {
			toast.error(error.message);
			setIsPublic(initialIsPublic);
			setSelectedOpportunities(initialOpportunities);
		},
	});

	const coachUpdateMutation = trpc.coach.updateMyProfile.useMutation({
		onSuccess: () => {
			utils.coach.getMyProfile.invalidate();
		},
		onError: (error) => {
			toast.error(error.message);
			setIsPublic(initialIsPublic);
			setSelectedOpportunities(initialOpportunities);
		},
	});

	const isPending =
		athleteUpdateMutation.isPending || coachUpdateMutation.isPending;

	const handleTogglePublic = async (checked: boolean) => {
		setIsPublic(checked);
		if (variant === "athlete") {
			await athleteUpdateMutation.mutateAsync({
				isPublicProfile: checked,
			});
		} else {
			await coachUpdateMutation.mutateAsync({
				isPublicProfile: checked,
			});
		}
		toast.success(
			checked ? "Tu perfil ahora es publico" : "Tu perfil ahora es privado",
		);
	};

	const handleOpportunityToggle = async (
		opportunity: string,
		checked: boolean,
	) => {
		const newOpportunities = checked
			? [...selectedOpportunities, opportunity]
			: selectedOpportunities.filter((o) => o !== opportunity);

		setSelectedOpportunities(newOpportunities);
		if (variant === "athlete") {
			await athleteUpdateMutation.mutateAsync({
				opportunityTypes:
					newOpportunities as (typeof AthleteOpportunityTypes)[number][],
			});
		} else {
			await coachUpdateMutation.mutateAsync({
				opportunityTypes: newOpportunities,
			});
		}
		toast.success("Oportunidades actualizadas");
	};

	// Get labels and descriptions based on variant
	const opportunityLabels =
		variant === "athlete" ? athleteOpportunityLabels : coachOpportunityLabels;
	const opportunityDescriptions =
		variant === "athlete"
			? athleteOpportunityDescriptions
			: coachOpportunityDescriptions;
	const opportunityTypes =
		variant === "athlete" ? AthleteOpportunityTypes : CoachOpportunityTypes;
	const profilePath = variant === "athlete" ? "athlete" : "coach";

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<GlobeIcon className="size-5 text-primary" />
					<CardTitle>Perfil Publico</CardTitle>
				</div>
				<CardDescription>
					Controla la visibilidad de tu perfil y las oportunidades que buscas
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Public Profile Toggle */}
				<div className="flex items-center justify-between rounded-lg border p-4">
					<div className="space-y-0.5">
						<Label htmlFor="public-profile" className="font-medium text-base">
							Perfil Publico
						</Label>
						<p className="text-muted-foreground text-sm">
							{variant === "athlete"
								? "Permite que scouts, equipos y organizaciones vean tu perfil"
								: "Permite que clubes y organizaciones vean tu perfil"}
						</p>
					</div>
					<Switch
						id="public-profile"
						checked={isPublic}
						onCheckedChange={handleTogglePublic}
						disabled={isPending}
					/>
				</div>

				{/* Public Profile Link */}
				{isPublic && (
					<div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Badge
									variant="secondary"
									className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
								>
									<SparklesIcon className="mr-1 size-3" />
									Perfil Activo
								</Badge>
								<span className="text-muted-foreground text-sm">
									Tu perfil es visible publicamente
								</span>
							</div>
							<Link
								href={`/${profilePath}/${profileId}`}
								target="_blank"
								className="flex items-center gap-1 font-medium text-primary text-sm hover:underline"
							>
								Ver perfil
								<ExternalLinkIcon className="size-3" />
							</Link>
						</div>
					</div>
				)}

				{/* Opportunity Types */}
				<div className="space-y-4">
					<div>
						<h3 className="flex items-center gap-2 font-medium text-base">
							<SparklesIcon className="size-4 text-primary" />
							Oportunidades que buscas
						</h3>
						<p className="text-muted-foreground text-sm">
							Indica que tipo de oportunidades te interesan (estilo LinkedIn
							&quot;Open to Work&quot;)
						</p>
					</div>

					<div className="grid gap-3">
						{opportunityTypes.map((opportunity) => (
							<div
								key={opportunity}
								className="flex items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
							>
								<Checkbox
									id={opportunity}
									checked={selectedOpportunities.includes(opportunity)}
									onCheckedChange={(checked) =>
										handleOpportunityToggle(opportunity, checked === true)
									}
									disabled={isPending}
									className="mt-0.5"
								/>
								<div className="flex-1 space-y-1">
									<Label
										htmlFor={opportunity}
										className="cursor-pointer font-medium"
									>
										{
											opportunityLabels[
												opportunity as keyof typeof opportunityLabels
											]
										}
									</Label>
									<p className="text-muted-foreground text-sm">
										{
											opportunityDescriptions[
												opportunity as keyof typeof opportunityDescriptions
											]
										}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Active Opportunities Summary */}
				{selectedOpportunities.length > 0 && (
					<div className="rounded-lg border bg-muted/30 p-4">
						<p className="mb-2 text-muted-foreground text-sm">
							Oportunidades activas:
						</p>
						<div className="flex flex-wrap gap-2">
							{selectedOpportunities.map((opportunity) => (
								<Badge key={opportunity} variant="secondary">
									{
										opportunityLabels[
											opportunity as keyof typeof opportunityLabels
										]
									}
								</Badge>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
