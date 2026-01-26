"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	ArrowLeftIcon,
	CalendarIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	ShieldIcon,
	Trash2Icon,
	TrophyIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { CompetitionsModal } from "@/components/organization/competitions-modal";
import { MatchesModal } from "@/components/organization/matches-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const typeLabels: Record<string, string> = {
	league: "Liga",
	tournament: "Torneo",
	cup: "Copa",
	friendly: "Amistoso",
	championship: "Campeonato",
	playoff: "Playoff",
	other: "Otro",
};

const statusColors: Record<string, string> = {
	upcoming: "bg-blue-100 dark:bg-blue-900",
	in_progress: "bg-green-100 dark:bg-green-900",
	completed: "bg-gray-100 dark:bg-gray-800",
	cancelled: "bg-red-100 dark:bg-red-900",
};

const statusLabels: Record<string, string> = {
	upcoming: "Próximo",
	in_progress: "En curso",
	completed: "Completado",
	cancelled: "Cancelado",
};

export default function CompetitionDetailPage(): React.JSX.Element {
	const router = useRouter();
	const params = useParams();
	const competitionId = params.competitionId as string;

	const { data: competition, isPending } =
		trpc.organization.competition.get.useQuery({
			id: competitionId,
		});

	const { data: standings } =
		trpc.organization.competition.getStandings.useQuery(
			{ competitionId },
			{ enabled: !!competitionId },
		);

	const deleteMutation = trpc.organization.competition.delete.useMutation({
		onSuccess: () => {
			toast.success("Competencia eliminada");
			router.push("/dashboard/organization/competitions");
		},
		onError: (error) => {
			toast.error(error.message || "Error al eliminar competencia");
		},
	});

	const handleDelete = (): void => {
		if (!competition) return;
		NiceModal.show(ConfirmationModal, {
			title: "Eliminar competencia",
			description: `¿Estás seguro de eliminar "${competition.name}"? Esta acción no se puede deshacer.`,
			confirmText: "Eliminar",
			variant: "destructive",
			onConfirm: () => deleteMutation.mutate({ id: competitionId }),
		});
	};

	if (isPending) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-16 w-16 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!competition) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">Competencia no encontrada</p>
				<Button asChild className="mt-4">
					<Link href="/dashboard/organization/competitions">
						Volver a competencias
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/dashboard/organization/competitions">
							<ArrowLeftIcon className="h-4 w-4" />
						</Link>
					</Button>
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
						<TrophyIcon className="h-8 w-8 text-primary" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold">{competition.name}</h1>
							<Badge variant="outline">
								{typeLabels[competition.type] ?? competition.type}
							</Badge>
							<Badge
								variant="outline"
								className={cn(statusColors[competition.status])}
							>
								{statusLabels[competition.status]}
							</Badge>
						</div>
						<div className="flex items-center gap-4 text-sm text-muted-foreground">
							{competition.season && (
								<span className="flex items-center gap-1">
									<CalendarIcon className="h-4 w-4" />
									{competition.season.name}
								</span>
							)}
							{competition.startDate && (
								<span>
									{format(new Date(competition.startDate), "dd/MM/yyyy")}
									{competition.endDate &&
										` - ${format(new Date(competition.endDate), "dd/MM/yyyy")}`}
								</span>
							)}
						</div>
					</div>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline">
							<MoreHorizontalIcon className="mr-2 h-4 w-4" />
							Acciones
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={() => NiceModal.show(CompetitionsModal, { competition })}
						>
							<PencilIcon className="mr-2 h-4 w-4" />
							Editar competencia
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								NiceModal.show(MatchesModal, {
									defaultCompetitionId: competitionId,
								})
							}
						>
							<PlusIcon className="mr-2 h-4 w-4" />
							Agregar partido
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleDelete}
							className="text-destructive"
						>
							<Trash2Icon className="mr-2 h-4 w-4" />
							Eliminar competencia
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Description */}
			{competition.description && (
				<Card>
					<CardContent className="pt-6">
						<p className="text-muted-foreground">{competition.description}</p>
					</CardContent>
				</Card>
			)}

			{/* Tabs */}
			<Tabs defaultValue="standings">
				<TabsList>
					<TabsTrigger value="standings" className="gap-2">
						<TrophyIcon className="h-4 w-4" />
						Tabla de posiciones
					</TabsTrigger>
					<TabsTrigger value="teams" className="gap-2">
						<ShieldIcon className="h-4 w-4" />
						Equipos inscritos
					</TabsTrigger>
				</TabsList>

				{/* Standings Tab */}
				<TabsContent value="standings" className="mt-6">
					<Card>
						<CardHeader>
							<CardTitle>Tabla de posiciones</CardTitle>
							<CardDescription>
								Clasificación actual de los equipos
							</CardDescription>
						</CardHeader>
						<CardContent>
							{standings && standings.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-12">#</TableHead>
											<TableHead>Equipo</TableHead>
											<TableHead className="text-center">PJ</TableHead>
											<TableHead className="text-center">G</TableHead>
											<TableHead className="text-center">E</TableHead>
											<TableHead className="text-center">P</TableHead>
											<TableHead className="text-center">GF</TableHead>
											<TableHead className="text-center">GC</TableHead>
											<TableHead className="text-center">DIF</TableHead>
											<TableHead className="text-center font-bold">
												PTS
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{standings.map((row, index) => (
											<TableRow key={row.id}>
												<TableCell className="font-medium">
													{index + 1}
												</TableCell>
												<TableCell>
													<Link
														href={`/dashboard/organization/teams/${row.team.id}`}
														className="flex items-center gap-2 hover:underline"
													>
														<ShieldIcon className="h-4 w-4 text-muted-foreground" />
														{row.team.name}
													</Link>
												</TableCell>
												<TableCell className="text-center">
													{(row.wins ?? 0) +
														(row.draws ?? 0) +
														(row.losses ?? 0)}
												</TableCell>
												<TableCell className="text-center">
													{row.wins ?? 0}
												</TableCell>
												<TableCell className="text-center">
													{row.draws ?? 0}
												</TableCell>
												<TableCell className="text-center">
													{row.losses ?? 0}
												</TableCell>
												<TableCell className="text-center">
													{row.goalsFor ?? 0}
												</TableCell>
												<TableCell className="text-center">
													{row.goalsAgainst ?? 0}
												</TableCell>
												<TableCell className="text-center">
													{(row.goalsFor ?? 0) - (row.goalsAgainst ?? 0)}
												</TableCell>
												<TableCell className="text-center font-bold">
													{row.points}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : (
								<p className="text-center py-8 text-muted-foreground">
									No hay datos de clasificación disponibles
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Teams Tab */}
				<TabsContent value="teams" className="mt-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Equipos inscritos</CardTitle>
								<CardDescription>
									Equipos que participan en esta competencia
								</CardDescription>
							</div>
						</CardHeader>
						<CardContent>
							{competition.teams && competition.teams.length > 0 ? (
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
									{competition.teams.map((tc) => (
										<Link
											key={tc.id}
											href={`/dashboard/organization/teams/${tc.team.id}`}
											className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
										>
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
												<ShieldIcon className="h-5 w-5 text-primary" />
											</div>
											<div>
												<span className="font-medium">{tc.team.name}</span>
												{tc.division && (
													<div className="text-sm text-muted-foreground">
														{tc.division}
													</div>
												)}
											</div>
										</Link>
									))}
								</div>
							) : (
								<p className="text-center py-8 text-muted-foreground">
									No hay equipos inscritos en esta competencia
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
