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
	UserIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { TeamMemberModal } from "@/components/organization/team-member-modal";
import { TeamStaffModal } from "@/components/organization/team-staff-modal";
import { TeamsModal } from "@/components/organization/teams-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getInitials } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const statusColors: Record<string, string> = {
	active: "bg-green-100 dark:bg-green-900",
	inactive: "bg-gray-100 dark:bg-gray-800",
	archived: "bg-amber-100 dark:bg-amber-900",
};

const statusLabels: Record<string, string> = {
	active: "Activo",
	inactive: "Inactivo",
	archived: "Archivado",
};

const memberRoleLabels: Record<string, string> = {
	captain: "Capitán",
	vice_captain: "Vice-capitán",
	player: "Jugador",
};

const staffRoleLabels: Record<string, string> = {
	head_coach: "Director técnico",
	assistant_coach: "Asistente técnico",
	fitness_coach: "Preparador físico",
	goalkeeper_coach: "Entrenador de arqueros",
	analyst: "Analista",
	medic: "Médico",
	physiotherapist: "Fisioterapeuta",
	manager: "Manager",
	kit_manager: "Utilero",
	other: "Otro",
};

interface TeamProfileProps {
	teamId: string;
}

export function TeamProfile({ teamId }: TeamProfileProps): React.JSX.Element {
	const router = useRouter();
	const utils = trpc.useUtils();

	const { data: team, isPending } = trpc.organization.team.get.useQuery({
		id: teamId,
	});

	const deleteMutation = trpc.organization.team.delete.useMutation({
		onSuccess: () => {
			toast.success("Equipo eliminado");
			router.push("/dashboard/organization/teams");
		},
		onError: (error) => {
			toast.error(error.message || "Error al eliminar equipo");
		},
	});

	const removeMemberMutation = trpc.organization.team.removeMembers.useMutation(
		{
			onSuccess: () => {
				toast.success("Miembro eliminado del equipo");
				utils.organization.team.get.invalidate({ id: teamId });
			},
			onError: (error: { message?: string }) => {
				toast.error(error.message || "Error al eliminar miembro");
			},
		},
	);

	const removeStaffMutation = trpc.organization.team.removeStaff.useMutation({
		onSuccess: () => {
			toast.success("Staff eliminado del equipo");
			utils.organization.team.get.invalidate({ id: teamId });
		},
		onError: (error: { message?: string }) => {
			toast.error(error.message || "Error al eliminar staff");
		},
	});

	const handleDelete = (): void => {
		if (!team) return;
		NiceModal.show(ConfirmationModal, {
			title: "Eliminar equipo",
			description: `¿Estás seguro de eliminar "${team.name}"? Esta acción no se puede deshacer.`,
			confirmText: "Eliminar",
			variant: "destructive",
			onConfirm: () => deleteMutation.mutate({ id: teamId }),
		});
	};

	const handleRemoveMember = (athleteId: string, name: string): void => {
		NiceModal.show(ConfirmationModal, {
			title: "Eliminar miembro",
			description: `¿Estás seguro de eliminar a "${name}" del equipo?`,
			confirmText: "Eliminar",
			variant: "destructive",
			onConfirm: () =>
				removeMemberMutation.mutate({ teamId, athleteIds: [athleteId] }),
		});
	};

	const handleRemoveStaff = (staffId: string, name: string): void => {
		NiceModal.show(ConfirmationModal, {
			title: "Eliminar staff",
			description: `¿Estás seguro de eliminar a "${name}" del staff?`,
			confirmText: "Eliminar",
			variant: "destructive",
			onConfirm: () => removeStaffMutation.mutate({ id: staffId }),
		});
	};

	if (isPending) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-20 w-20 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!team) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">Equipo no encontrado</p>
				<Button asChild className="mt-4">
					<Link href="/dashboard/organization/teams">Volver a equipos</Link>
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
						<Link href="/dashboard/organization/teams">
							<ArrowLeftIcon className="h-4 w-4" />
						</Link>
					</Button>
					<div
						className="flex h-16 w-16 items-center justify-center rounded-full"
						style={{
							backgroundColor: team.primaryColor ?? "#3B82F6",
						}}
					>
						<ShieldIcon className="h-8 w-8 text-white" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold">{team.name}</h1>
							<Badge
								variant="outline"
								className={cn(statusColors[team.status])}
							>
								{statusLabels[team.status]}
							</Badge>
						</div>
						<div className="flex items-center gap-4 text-sm text-muted-foreground">
							{team.season && (
								<span className="flex items-center gap-1">
									<CalendarIcon className="h-4 w-4" />
									{team.season.name}
								</span>
							)}
							{team.ageCategory && (
								<span>Categoría: {team.ageCategory.name}</span>
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
							onClick={() => NiceModal.show(TeamsModal, { team })}
						>
							<PencilIcon className="mr-2 h-4 w-4" />
							Editar equipo
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleDelete}
							className="text-destructive"
						>
							<Trash2Icon className="mr-2 h-4 w-4" />
							Eliminar equipo
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Description */}
			{team.description && (
				<Card>
					<CardContent className="pt-6">
						<p className="text-muted-foreground">{team.description}</p>
					</CardContent>
				</Card>
			)}

			{/* Tabs */}
			<Tabs defaultValue="members">
				<TabsList>
					<TabsTrigger value="members" className="gap-2">
						<UsersIcon className="h-4 w-4" />
						Jugadores ({team.members?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="staff" className="gap-2">
						<UserIcon className="h-4 w-4" />
						Staff ({team.staff?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="competitions" className="gap-2">
						<TrophyIcon className="h-4 w-4" />
						Competencias
					</TabsTrigger>
				</TabsList>

				{/* Members Tab */}
				<TabsContent value="members" className="mt-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Jugadores del equipo</CardTitle>
								<CardDescription>
									Atletas que forman parte del equipo
								</CardDescription>
							</div>
							<Button
								onClick={() =>
									NiceModal.show(TeamMemberModal, { teamId: team.id })
								}
							>
								<PlusIcon className="mr-2 h-4 w-4" />
								Agregar jugador
							</Button>
						</CardHeader>
						<CardContent>
							{team.members && team.members.length > 0 ? (
								<div className="space-y-4">
									{team.members.map((member) => (
										<div
											key={member.id}
											className="flex items-center justify-between rounded-lg border p-4"
										>
											<div className="flex items-center gap-3">
												<Avatar>
													<AvatarImage
														src={member.athlete.user?.image ?? undefined}
													/>
													<AvatarFallback>
														{getInitials(member.athlete.user?.name ?? "")}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className="flex items-center gap-2">
														{member.jerseyNumber && (
															<span className="font-bold text-primary">
																#{member.jerseyNumber}
															</span>
														)}
														<span className="font-medium">
															{member.athlete.user?.name ?? "Sin nombre"}
														</span>
													</div>
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<Badge variant="outline" className="text-xs">
															{memberRoleLabels[member.role] ?? member.role}
														</Badge>
														{member.position && <span>{member.position}</span>}
													</div>
												</div>
											</div>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm">
														<MoreHorizontalIcon className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() =>
															NiceModal.show(TeamMemberModal, {
																teamId: team.id,
																member,
															})
														}
													>
														<PencilIcon className="mr-2 h-4 w-4" />
														Editar
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() =>
															handleRemoveMember(
																member.athlete.id,
																member.athlete.user?.name ?? "jugador",
															)
														}
														className="text-destructive"
													>
														<Trash2Icon className="mr-2 h-4 w-4" />
														Eliminar del equipo
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									))}
								</div>
							) : (
								<p className="text-center py-8 text-muted-foreground">
									No hay jugadores asignados al equipo
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Staff Tab */}
				<TabsContent value="staff" className="mt-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Staff técnico</CardTitle>
								<CardDescription>Personal técnico del equipo</CardDescription>
							</div>
							<Button
								onClick={() =>
									NiceModal.show(TeamStaffModal, { teamId: team.id })
								}
							>
								<PlusIcon className="mr-2 h-4 w-4" />
								Agregar staff
							</Button>
						</CardHeader>
						<CardContent>
							{team.staff && team.staff.length > 0 ? (
								<div className="space-y-4">
									{team.staff.map((staffMember) => (
										<div
											key={staffMember.id}
											className="flex items-center justify-between rounded-lg border p-4"
										>
											<div className="flex items-center gap-3">
												<Avatar>
													<AvatarImage
														src={
															staffMember.coach?.user?.image ??
															staffMember.user?.image ??
															undefined
														}
													/>
													<AvatarFallback>
														{getInitials(
															staffMember.coach?.user?.name ??
																staffMember.user?.name ??
																"",
														)}
													</AvatarFallback>
												</Avatar>
												<div>
													<span className="font-medium">
														{staffMember.coach?.user?.name ??
															staffMember.user?.name ??
															"Sin nombre"}
													</span>
													<div className="text-sm text-muted-foreground">
														<Badge variant="outline" className="text-xs">
															{staffRoleLabels[staffMember.role] ??
																staffMember.role}
														</Badge>
													</div>
												</div>
											</div>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm">
														<MoreHorizontalIcon className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() =>
															NiceModal.show(TeamStaffModal, {
																teamId: team.id,
																staff: staffMember,
															})
														}
													>
														<PencilIcon className="mr-2 h-4 w-4" />
														Editar
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() =>
															handleRemoveStaff(
																staffMember.id,
																staffMember.coach?.user?.name ??
																	staffMember.user?.name ??
																	"staff",
															)
														}
														className="text-destructive"
													>
														<Trash2Icon className="mr-2 h-4 w-4" />
														Eliminar del staff
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									))}
								</div>
							) : (
								<p className="text-center py-8 text-muted-foreground">
									No hay staff asignado al equipo
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Competitions Tab */}
				<TabsContent value="competitions" className="mt-6">
					<Card>
						<CardHeader>
							<CardTitle>Competencias</CardTitle>
							<CardDescription>
								Torneos y ligas en los que participa el equipo
							</CardDescription>
						</CardHeader>
						<CardContent>
							{team.competitions && team.competitions.length > 0 ? (
								<div className="space-y-4">
									{team.competitions.map((tc) => (
										<Link
											key={tc.id}
											href={`/dashboard/organization/competitions/${tc.competition.id}`}
											className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
										>
											<div className="flex items-center gap-3">
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
													<TrophyIcon className="h-5 w-5 text-primary" />
												</div>
												<div>
													<span className="font-medium">
														{tc.competition.name}
													</span>
													{tc.division && (
														<div className="text-sm text-muted-foreground">
															División: {tc.division}
														</div>
													)}
												</div>
											</div>
											{tc.finalPosition && (
												<Badge variant="outline">
													Posición: {tc.finalPosition}
												</Badge>
											)}
										</Link>
									))}
								</div>
							) : (
								<p className="text-center py-8 text-muted-foreground">
									El equipo no está inscrito en ninguna competencia
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
