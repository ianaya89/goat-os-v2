import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type * as React from "react";
import { PublicAthleteProfile } from "@/components/public/athlete-profile/public-athlete-profile";
import { trpc } from "@/trpc/server";

type Props = {
	params: Promise<{ athleteId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { athleteId } = await params;

	try {
		const data = await trpc.public.athlete.getProfile({ athleteId });

		const athleteName = data.athlete.user?.name ?? "Atleta";
		const sport = data.athlete.sport.replace("_", " ");
		const position = data.athlete.position ?? "";

		return {
			title: `${athleteName} - ${sport}${position ? ` | ${position}` : ""}`,
			description:
				data.athlete.bio?.substring(0, 160) ??
				`Perfil deportivo de ${athleteName}. ${sport}${position ? `, ${position}` : ""}.`,
			openGraph: {
				title: `${athleteName} - Perfil Deportivo`,
				description:
					data.athlete.bio?.substring(0, 160) ??
					`Perfil deportivo de ${athleteName}`,
				type: "profile",
				images: data.athlete.user?.image
					? [{ url: data.athlete.user.image }]
					: [],
			},
			twitter: {
				card: "summary_large_image",
				title: `${athleteName} - Perfil Deportivo`,
				description:
					data.athlete.bio?.substring(0, 160) ??
					`Perfil deportivo de ${athleteName}`,
			},
		};
	} catch {
		return {
			title: "Perfil de Atleta",
			description: "Perfil deportivo de atleta",
		};
	}
}

export default async function PublicAthleteProfilePage({
	params,
}: Props): Promise<React.JSX.Element> {
	const { athleteId } = await params;

	try {
		const data = await trpc.public.athlete.getProfile({ athleteId });

		return <PublicAthleteProfile data={data} />;
	} catch {
		notFound();
	}
}
