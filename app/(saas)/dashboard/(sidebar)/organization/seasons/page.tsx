import { SeasonsTable } from "@/components/organization/seasons-table";

export const metadata = {
	title: "Temporadas",
	description: "Gestión de temporadas de la organización",
};

export default function SeasonsPage(): React.JSX.Element {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Temporadas</h1>
				<p className="text-muted-foreground">
					Gestiona las temporadas para organizar equipos y competencias
				</p>
			</div>
			<SeasonsTable />
		</div>
	);
}
