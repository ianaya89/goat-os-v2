"use client";

import { MedalIcon, UserIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { AthleteMyProfile } from "@/components/athlete/athlete-my-profile";
import { CoachMyProfile } from "@/components/coach/coach-my-profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProfileSelectorProps {
	isAthlete: boolean;
	isCoach: boolean;
}

export function ProfileSelector({ isAthlete, isCoach }: ProfileSelectorProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const viewParam = searchParams.get("view");

	// Determine default tab based on URL param or fallback to athlete
	const defaultTab = viewParam === "coach" ? "coach" : "athlete";

	// If only one profile type, show that directly
	if (isAthlete && !isCoach) {
		return <AthleteMyProfile />;
	}

	if (isCoach && !isAthlete) {
		return <CoachMyProfile />;
	}

	const handleTabChange = (value: string) => {
		router.push(`/dashboard/my-profile?view=${value}`);
	};

	// Both profiles exist - show selector
	return (
		<Tabs
			defaultValue={defaultTab}
			value={defaultTab}
			onValueChange={handleTabChange}
			className="space-y-6"
		>
			<div className="flex items-center justify-between">
				<TabsList>
					<TabsTrigger value="athlete" className="gap-2">
						<MedalIcon className="size-4" />
						Mi Perfil de Atleta
					</TabsTrigger>
					<TabsTrigger value="coach" className="gap-2">
						<UserIcon className="size-4" />
						Mi Perfil de Entrenador
					</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent value="athlete" className="mt-0">
				<AthleteMyProfile />
			</TabsContent>

			<TabsContent value="coach" className="mt-0">
				<CoachMyProfile />
			</TabsContent>
		</Tabs>
	);
}
