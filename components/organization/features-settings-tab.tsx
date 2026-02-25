"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	OrganizationFeature,
	OrganizationFeatures,
} from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

// Group features by category for display
const FEATURE_CATEGORIES = {
	sports: {
		labelKey: "features.categories.sports",
		features: [
			OrganizationFeature.athletes,
			OrganizationFeature.athleteGroups,
			OrganizationFeature.coaches,
			OrganizationFeature.trainingSessions,
			OrganizationFeature.events,
			OrganizationFeature.eventTemplates,
			OrganizationFeature.ageCategories,
			OrganizationFeature.waitlist,
			OrganizationFeature.equipment,
			OrganizationFeature.equipmentAudit,
		],
	},
	competitions: {
		labelKey: "features.categories.competitions",
		features: [
			OrganizationFeature.teams,
			OrganizationFeature.competitions,
			OrganizationFeature.matches,
		],
	},
	finance: {
		labelKey: "features.categories.finance",
		features: [
			OrganizationFeature.payments,
			OrganizationFeature.expenses,
			OrganizationFeature.cashRegister,
			OrganizationFeature.products,
			OrganizationFeature.payroll,
		],
	},
	reports: {
		labelKey: "features.categories.reports",
		features: [
			OrganizationFeature.financialReports,
			OrganizationFeature.sportsReports,
			OrganizationFeature.pendingReports,
			OrganizationFeature.demographicReports,
		],
	},
	general: {
		labelKey: "features.categories.general",
		features: [
			OrganizationFeature.locations,
			OrganizationFeature.vendors,
			OrganizationFeature.sponsors,
			OrganizationFeature.chatbot,
		],
	},
} as const;

type FeaturesSettingsTabProps = {
	isAdmin: boolean;
};

export function FeaturesSettingsTab({
	isAdmin,
}: FeaturesSettingsTabProps): React.JSX.Element {
	const t = useTranslations("organization.settings");
	const utils = trpc.useUtils();

	// Fetch current feature states
	const { data: featureStates, isLoading } =
		trpc.organization.features.list.useQuery();

	// Mutation to update a feature
	const updateFeature = trpc.organization.features.update.useMutation({
		onSuccess: () => {
			utils.organization.features.list.invalidate();
			toast.success(t("features.updateSuccess"));
		},
		onError: (error: { message: string }) => {
			toast.error(error.message);
		},
	});

	// Create a map of feature to enabled state
	const featureMap = React.useMemo(() => {
		const map = new Map<OrganizationFeature, boolean>();
		if (featureStates) {
			for (const { feature, enabled } of featureStates) {
				map.set(feature, enabled);
			}
		}
		// Default all features to enabled if no data
		for (const feature of OrganizationFeatures) {
			if (!map.has(feature as OrganizationFeature)) {
				map.set(feature as OrganizationFeature, true);
			}
		}
		return map;
	}, [featureStates]);

	const handleToggle = (feature: OrganizationFeature, enabled: boolean) => {
		if (!isAdmin) return;
		updateFeature.mutate({ feature, enabled });
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("features.title")}</CardTitle>
					<CardDescription>{t("features.description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[1, 2, 3, 4].map((i) => (
							<div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("features.title")}</CardTitle>
				<CardDescription>{t("features.description")}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-8">
					{Object.entries(FEATURE_CATEGORIES).map(([categoryKey, category]) => (
						<div key={categoryKey}>
							<h3 className="text-sm font-medium text-muted-foreground mb-4">
								{t(category.labelKey)}
							</h3>
							<div className="space-y-4">
								{category.features.map((feature) => {
									const enabled = featureMap.get(feature) ?? true;
									const isUpdating = updateFeature.isPending;

									return (
										<div
											key={feature}
											className="flex items-center justify-between py-2 border-b last:border-b-0"
										>
											<Label
												htmlFor={`feature-${feature}`}
												className="flex-1 cursor-pointer"
											>
												{t(`features.items.${feature}`)}
											</Label>
											<Switch
												id={`feature-${feature}`}
												checked={enabled}
												onCheckedChange={(checked) =>
													handleToggle(feature, checked)
												}
												disabled={!isAdmin || isUpdating}
											/>
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
