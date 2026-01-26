import { CompetitionsTable } from "@/components/organization/competitions-table";

export const metadata = {
	title: "Competencias",
	description: "Gestión de torneos, ligas y competencias",
};

export default function CompetitionsPage(): React.JSX.Element {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Competencias</h1>
				<p className="text-muted-foreground">
					Gestiona torneos, ligas, copas y otras competencias
				</p>
			</div>
			<CompetitionsTable />
		</div>
	);
}
