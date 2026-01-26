import { TeamProfile } from "@/components/organization/team-profile";

interface TeamDetailPageProps {
	params: Promise<{ teamId: string }>;
}

export const metadata = {
	title: "Detalle de equipo",
	description: "Información detallada del equipo",
};

export default async function TeamDetailPage({
	params,
}: TeamDetailPageProps): Promise<React.JSX.Element> {
	const { teamId } = await params;

	return <TeamProfile teamId={teamId} />;
}
