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
} from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

const opportunityLabels: Record<AthleteOpportunityType, string> = {
	professional_team: "Buscando equipo/club profesional",
	university_scholarship: "Buscando universidad/becas deportivas",
	tryouts: "Abierto a pruebas/tryouts",
	sponsorship: "Buscando sponsorship",
	coaching: "Abierto a coaching",
};

const opportunityDescriptions: Record<AthleteOpportunityType, string> = {
	professional_team: "Indica que estas buscando unirte a un equipo profesional",
	university_scholarship:
		"Para atletas buscando becas deportivas en universidades",
	tryouts: "Disponible para hacer pruebas con equipos u organizaciones",
	sponsorship: "Buscando patrocinadores o marcas deportivas",
	coaching: "Abierto a recibir ofertas de coaching o entrenamiento",
};

interface PublicProfileSettingsProps {
	athleteId: string;
	initialIsPublic: boolean;
	initialOpportunities: AthleteOpportunityType[];
}

export function PublicProfileSettings({
	athleteId,
	initialIsPublic,
	initialOpportunities,
}: PublicProfileSettingsProps) {
	const [isPublic, setIsPublic] = useState(initialIsPublic);
	const [selectedOpportunities, setSelectedOpportunities] =
		useState<AthleteOpportunityType[]>(initialOpportunities);

	// Sync state when initial props change (e.g., after refetch)
	useEffect(() => {
		setIsPublic(initialIsPublic);
	}, [initialIsPublic]);

	useEffect(() => {
		setSelectedOpportunities(initialOpportunities);
	}, [initialOpportunities]);

	const utils = trpc.useUtils();

	const updateMutation = trpc.athlete.updateMyProfile.useMutation({
		onSuccess: () => {
			utils.athlete.getMyProfile.invalidate();
		},
		onError: (error) => {
			toast.error(error.message);
			// Revert on error
			setIsPublic(initialIsPublic);
			setSelectedOpportunities(initialOpportunities);
		},
	});

	const handleTogglePublic = async (checked: boolean) => {
		setIsPublic(checked);
		await updateMutation.mutateAsync({
			isPublicProfile: checked,
		});
		toast.success(
			checked ? "Tu perfil ahora es publico" : "Tu perfil ahora es privado",
		);
	};

	const handleOpportunityToggle = async (
		opportunity: AthleteOpportunityType,
		checked: boolean,
	) => {
		const newOpportunities = checked
			? [...selectedOpportunities, opportunity]
			: selectedOpportunities.filter((o) => o !== opportunity);

		setSelectedOpportunities(newOpportunities);
		await updateMutation.mutateAsync({
			opportunityTypes: newOpportunities,
		});
		toast.success("Oportunidades actualizadas");
	};

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
							Permite que scouts, equipos y organizaciones vean tu perfil
						</p>
					</div>
					<Switch
						id="public-profile"
						checked={isPublic}
						onCheckedChange={handleTogglePublic}
						disabled={updateMutation.isPending}
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
								href={`/athlete/${athleteId}`}
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
						{AthleteOpportunityTypes.map((opportunity) => (
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
									disabled={updateMutation.isPending}
									className="mt-0.5"
								/>
								<div className="flex-1 space-y-1">
									<Label
										htmlFor={opportunity}
										className="cursor-pointer font-medium"
									>
										{opportunityLabels[opportunity]}
									</Label>
									<p className="text-muted-foreground text-sm">
										{opportunityDescriptions[opportunity]}
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
									{opportunityLabels[opportunity]}
								</Badge>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
