"use client";

import {
	Edit,
	MoreHorizontal,
	Plus,
	Shuffle,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import type { z } from "zod/v4";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import {
	autoAssignGroupsSchema,
	createEventGroupSchema,
	updateEventGroupSchema,
} from "@/schemas/organization-event-rotation-schemas";
import { trpc } from "@/trpc/client";

interface EventGroupsPanelProps {
	eventId: string;
}

const groupColors = [
	{ value: "#6366f1", label: "Indigo" },
	{ value: "#10b981", label: "Emerald" },
	{ value: "#f59e0b", label: "Amber" },
	{ value: "#ef4444", label: "Red" },
	{ value: "#8b5cf6", label: "Violet" },
	{ value: "#06b6d4", label: "Cyan" },
	{ value: "#ec4899", label: "Pink" },
	{ value: "#84cc16", label: "Lime" },
];

export function EventGroupsPanel({
	eventId,
}: EventGroupsPanelProps): React.JSX.Element {
	const utils = trpc.useUtils();

	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [isAutoAssignOpen, setIsAutoAssignOpen] = React.useState(false);
	const [editingGroup, setEditingGroup] = React.useState<string | null>(null);

	const { data: groups, isPending } =
		trpc.organization.eventRotation.listGroups.useQuery({ eventId });

	const createGroup = trpc.organization.eventRotation.createGroup.useMutation({
		onSuccess: () => {
			utils.organization.eventRotation.listGroups.invalidate({ eventId });
			utils.organization.eventRotation.getOverview.invalidate({ eventId });
			setIsCreateOpen(false);
			toast.success("Grupo creado");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const updateGroup = trpc.organization.eventRotation.updateGroup.useMutation({
		onSuccess: () => {
			utils.organization.eventRotation.listGroups.invalidate({ eventId });
			utils.organization.eventRotation.getOverview.invalidate({ eventId });
			setEditingGroup(null);
			toast.success("Grupo actualizado");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const deleteGroup = trpc.organization.eventRotation.deleteGroup.useMutation({
		onSuccess: () => {
			utils.organization.eventRotation.listGroups.invalidate({ eventId });
			utils.organization.eventRotation.getOverview.invalidate({ eventId });
			toast.success("Grupo eliminado");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const autoAssign =
		trpc.organization.eventRotation.autoAssignGroups.useMutation({
			onSuccess: (data) => {
				utils.organization.eventRotation.listGroups.invalidate({ eventId });
				utils.organization.eventRotation.getOverview.invalidate({ eventId });
				setIsAutoAssignOpen(false);
				toast.success(
					`${data.groups.length} grupos con ${data.totalAssigned} atletas asignados`,
				);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	if (isPending) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-full" />
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-32 w-full" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Actions */}
			<div className="flex gap-2">
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 size-4" />
							Nuevo Grupo
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Crear Grupo</DialogTitle>
							<DialogDescription>
								Crea un nuevo grupo para organizar atletas en el evento
							</DialogDescription>
						</DialogHeader>
						<GroupForm
							eventId={eventId}
							onSubmit={(data) => createGroup.mutate(data)}
							isLoading={createGroup.isPending}
						/>
					</DialogContent>
				</Dialog>

				<Dialog open={isAutoAssignOpen} onOpenChange={setIsAutoAssignOpen}>
					<DialogTrigger asChild>
						<Button variant="outline">
							<Shuffle className="mr-2 size-4" />
							Auto-asignar
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Auto-asignar Grupos</DialogTitle>
							<DialogDescription>
								Crea grupos automaticamente y distribuye los atletas registrados
							</DialogDescription>
						</DialogHeader>
						<AutoAssignForm
							eventId={eventId}
							onSubmit={(data) => autoAssign.mutate(data)}
							isLoading={autoAssign.isPending}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{/* Groups Grid */}
			{groups && groups.length > 0 ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{groups.map((group) => (
						<Card key={group.id} className="relative overflow-hidden">
							<div
								className="absolute left-0 top-0 h-full w-1"
								style={{ backgroundColor: group.color }}
							/>
							<CardHeader className="pb-2">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2">
										<div
											className="size-3 rounded-full"
											style={{ backgroundColor: group.color }}
										/>
										<CardTitle className="text-base">{group.name}</CardTitle>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="size-8">
												<MoreHorizontal className="size-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => setEditingGroup(group.id)}
											>
												<Edit className="mr-2 size-4" />
												Editar
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												className="text-destructive"
												onClick={() => deleteGroup.mutate({ id: group.id })}
											>
												<Trash2 className="mr-2 size-4" />
												Eliminar
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								{group.description && (
									<CardDescription className="line-clamp-1">
										{group.description}
									</CardDescription>
								)}
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-4 text-sm text-muted-foreground">
									<div className="flex items-center gap-1">
										<Users className="size-4" />
										{group.members.length} atletas
									</div>
									{group.leader && (
										<Badge variant="outline" className="text-xs">
											{group.leader.externalName ||
												group.leader.roleTitle ||
												"Lider"}
										</Badge>
									)}
								</div>
								{group.members.length > 0 && (
									<div className="mt-2 flex flex-wrap gap-1">
										{group.members.slice(0, 3).map((member) => (
											<Badge
												key={member.id}
												variant="secondary"
												className="text-xs"
											>
												{member.registration.registrantName.split(" ")[0]}
											</Badge>
										))}
										{group.members.length > 3 && (
											<Badge variant="secondary" className="text-xs">
												+{group.members.length - 3}
											</Badge>
										)}
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<Users className="mb-4 size-12 text-muted-foreground" />
						<h3 className="text-lg font-medium">No hay grupos</h3>
						<p className="text-sm text-muted-foreground">
							Crea grupos para organizar a los atletas durante el evento
						</p>
					</CardContent>
				</Card>
			)}

			{/* Edit Dialog */}
			{editingGroup && (
				<Dialog
					open={!!editingGroup}
					onOpenChange={() => setEditingGroup(null)}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Editar Grupo</DialogTitle>
						</DialogHeader>
						<GroupForm
							eventId={eventId}
							groupId={editingGroup}
							defaultValues={groups?.find((g) => g.id === editingGroup)}
							onSubmit={(data) =>
								updateGroup.mutate({ id: editingGroup, ...data })
							}
							isLoading={updateGroup.isPending}
						/>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}

// Group Form Component
interface GroupFormProps {
	eventId: string;
	groupId?: string;
	defaultValues?: {
		name?: string;
		description?: string | null;
		color?: string;
	};
	onSubmit: (data: z.input<typeof createEventGroupSchema>) => void;
	isLoading: boolean;
}

function GroupForm({
	eventId,
	groupId,
	defaultValues,
	onSubmit,
	isLoading,
}: GroupFormProps) {
	const form = useZodForm({
		schema: createEventGroupSchema,
		defaultValues: {
			eventId,
			name: defaultValues?.name || "",
			description: defaultValues?.description || "",
			color: defaultValues?.color || "#6366f1",
			sortOrder: 0,
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre</FormLabel>
							<FormControl>
								<Input placeholder="Grupo A" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Descripcion (opcional)</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Descripcion del grupo..."
									{...field}
									value={field.value || ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="color"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Color</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona un color" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{groupColors.map((color) => (
										<SelectItem key={color.value} value={color.value}>
											<div className="flex items-center gap-2">
												<div
													className="size-4 rounded-full"
													style={{ backgroundColor: color.value }}
												/>
												{color.label}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<DialogFooter>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? "Guardando..." : groupId ? "Actualizar" : "Crear"}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}

// Auto Assign Form Component
interface AutoAssignFormProps {
	eventId: string;
	onSubmit: (data: z.input<typeof autoAssignGroupsSchema>) => void;
	isLoading: boolean;
}

function AutoAssignForm({ eventId, onSubmit, isLoading }: AutoAssignFormProps) {
	const form = useZodForm({
		schema: autoAssignGroupsSchema,
		defaultValues: {
			eventId,
			numberOfGroups: 4,
			strategy: "age_category",
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="numberOfGroups"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Numero de Grupos</FormLabel>
							<FormControl>
								<Input
									type="number"
									min={2}
									max={50}
									{...field}
									onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
								/>
							</FormControl>
							<FormDescription>
								Los atletas se distribuiran equitativamente
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="strategy"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Estrategia de Distribucion</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="random">Aleatorio</SelectItem>
									<SelectItem value="alphabetical">Alfabetico</SelectItem>
									<SelectItem value="age_category">Por categoria</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<DialogFooter>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? "Creando grupos..." : "Crear y Asignar"}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
