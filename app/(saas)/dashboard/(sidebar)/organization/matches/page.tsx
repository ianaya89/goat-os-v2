import { MatchesTable } from "@/components/organization/matches-table";

export const metadata = {
	title: "Partidos",
	description: "Gestión de partidos y resultados",
};

export default function MatchesPage(): React.JSX.Element {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Partidos</h1>
				<p className="text-muted-foreground">
					Gestiona los partidos programados y registra resultados
				</p>
			</div>
			<MatchesTable />
		</div>
	);
}
