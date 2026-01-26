import { TeamsTable } from "@/components/organization/teams-table";

export const metadata = {
	title: "Equipos",
	description: "Gestión de equipos competitivos de la organización",
};

export default function TeamsPage(): React.JSX.Element {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Equipos</h1>
				<p className="text-muted-foreground">
					Gestiona los equipos competitivos para torneos y ligas
				</p>
			</div>
			<TeamsTable />
		</div>
	);
}
