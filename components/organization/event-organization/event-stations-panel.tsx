"use client";

import {
	Edit,
	ExternalLink,
	File,
	Link,
	MapPin,
	MoreHorizontal,
	Package,
	Plus,
	Trash2,
	UserPlus,
	Users,
	X,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import type { z } from "zod/v4";
import { StaffAssignmentModal } from "@/components/organization/event-organization/event-staff-assignment-modal";
import { StationAttachmentUpload } from "@/components/organization/event-organization/station-attachment-upload";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { createStationSchema } from "@/schemas/organization-event-rotation-schemas";
import { trpc } from "@/trpc/client";

interface EventStationsPanelProps {
	eventId: string;
}

const stationColors = [
	{ value: "#10b981", label: "Emerald" },
	{ value: "#6366f1", label: "Indigo" },
	{ value: "#f59e0b", label: "Amber" },
	{ value: "#ef4444", label: "Red" },
	{ value: "#8b5cf6", label: "Violet" },
	{ value: "#06b6d4", label: "Cyan" },
	{ value: "#ec4899", label: "Pink" },
	{ value: "#84cc16", label: "Lime" },
];

export function EventStationsPanel({
	eventId,
}: EventStationsPanelProps): React.JSX.Element {
	const utils = trpc.useUtils();

	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [editingStation, setEditingStation] = React.useState<string | null>(
		null,
	);
	const [staffAssignStation, setStaffAssignStation] = React.useState<{
		id: string;
		name: string;
		staffIds: string[];
	} | null>(null);

	const { data: stations, isPending } =
		trpc.organization.eventRotation.listStations.useQuery({
			eventId,
			includeInactive: true,
		});

	const createStation =
		trpc.organization.eventRotation.createStation.useMutation({
			onSuccess: () => {
				utils.organization.eventRotation.listStations.invalidate({ eventId });
				utils.organization.eventRotation.getOverview.invalidate({ eventId });
				setIsCreateOpen(false);
				toast.success("Estacion creada");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const updateStation =
		trpc.organization.eventRotation.updateStation.useMutation({
			onSuccess: () => {
				utils.organization.eventRotation.listStations.invalidate({ eventId });
				utils.organization.eventRotation.getOverview.invalidate({ eventId });
				setEditingStation(null);
				toast.success("Estacion actualizada");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const deleteStation =
		trpc.organization.eventRotation.deleteStation.useMutation({
			onSuccess: () => {
				utils.organization.eventRotation.listStations.invalidate({ eventId });
				utils.organization.eventRotation.getOverview.invalidate({ eventId });
				toast.success("Estacion eliminada");
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
							Nueva Estacion
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Crear Estacion</DialogTitle>
							<DialogDescription>
								Define una estacion de trabajo para las rotaciones del evento
							</DialogDescription>
						</DialogHeader>
						<StationForm
							eventId={eventId}
							onSubmit={(data) => createStation.mutate(data)}
							isLoading={createStation.isPending}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stations Grid */}
			{stations && stations.length > 0 ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{stations.map((station) => (
						<Card
							key={station.id}
							className={`relative overflow-hidden ${!station.isActive ? "opacity-60" : ""}`}
						>
							<div
								className="absolute left-0 top-0 h-full w-1"
								style={{ backgroundColor: station.color }}
							/>
							<CardHeader className="pb-2">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2">
										<div
											className="size-3 rounded-full"
											style={{ backgroundColor: station.color }}
										/>
										<CardTitle className="text-base">{station.name}</CardTitle>
										{!station.isActive && (
											<Badge variant="secondary" className="text-xs">
												Inactiva
											</Badge>
										)}
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="size-8">
												<MoreHorizontal className="size-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => setEditingStation(station.id)}
											>
												<Edit className="mr-2 size-4" />
												Editar
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() =>
													setStaffAssignStation({
														id: station.id,
														name: station.name,
														staffIds:
															station.staff?.map((s) => s.staffId) || [],
													})
												}
											>
												<UserPlus className="mr-2 size-4" />
												Asignar Staff
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() =>
													updateStation.mutate({
														id: station.id,
														isActive: !station.isActive,
													})
												}
											>
												{station.isActive ? "Desactivar" : "Activar"}
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												className="text-destructive"
												onClick={() => deleteStation.mutate({ id: station.id })}
											>
												<Trash2 className="mr-2 size-4" />
												Eliminar
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								{station.description && (
									<CardDescription className="line-clamp-2">
										{station.description}
									</CardDescription>
								)}
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
									{station.zone && (
										<div className="flex items-center gap-1">
											<MapPin className="size-3" />
											{station.zone.name}
										</div>
									)}
									{station.capacity && (
										<Badge variant="outline" className="text-xs">
											Cap. {station.capacity}
										</Badge>
									)}
									{station.staff && station.staff.length > 0 ? (
										<button
											type="button"
											className="flex items-center gap-1 hover:opacity-80"
											onClick={() =>
												setStaffAssignStation({
													id: station.id,
													name: station.name,
													staffIds: station.staff?.map((s) => s.staffId) || [],
												})
											}
										>
											<div className="flex -space-x-2">
												{station.staff.slice(0, 3).map((assignment) => {
													const staffMember = assignment.staff;
													const name =
														staffMember?.staffType === "system_user"
															? staffMember.user?.name ||
																staffMember.user?.email
															: staffMember?.externalName || "Staff";
													const initials = name
														?.split(" ")
														.map((n) => n[0])
														.join("")
														.toUpperCase()
														.slice(0, 2);
													return (
														<Avatar
															key={assignment.staffId}
															className="size-6 border-2 border-background"
														>
															<AvatarImage
																src={staffMember?.user?.image || undefined}
																alt={name || "Staff"}
															/>
															<AvatarFallback className="text-[10px]">
																{initials}
															</AvatarFallback>
														</Avatar>
													);
												})}
												{station.staff.length > 3 && (
													<div className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
														+{station.staff.length - 3}
													</div>
												)}
											</div>
										</button>
									) : (
										<button
											type="button"
											className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
											onClick={() =>
												setStaffAssignStation({
													id: station.id,
													name: station.name,
													staffIds: [],
												})
											}
										>
											<UserPlus className="size-3" />
											<span className="text-xs">Asignar</span>
										</button>
									)}
								</div>
								{(() => {
									const content = station.content as {
										instructions?: string;
										materials?: { name: string; quantity: number }[];
										attachments?: { name: string }[];
									} | null;
									return (
										<>
											{content?.instructions && (
												<p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
													{content.instructions}
												</p>
											)}
											{/* Materials and attachments indicators */}
											{(content?.materials?.length ||
												content?.attachments?.length) && (
												<div className="mt-2 flex items-center gap-2">
													{content?.materials &&
														content.materials.length > 0 && (
															<Badge
																variant="outline"
																className="text-xs gap-1"
															>
																<Package className="size-3" />
																{content.materials.length} materiales
															</Badge>
														)}
													{content?.attachments &&
														content.attachments.length > 0 && (
															<Badge
																variant="outline"
																className="text-xs gap-1"
															>
																<File className="size-3" />
																{content.attachments.length} archivos
															</Badge>
														)}
												</div>
											)}
										</>
									);
								})()}
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<MapPin className="mb-4 size-12 text-muted-foreground" />
						<h3 className="text-lg font-medium">No hay estaciones</h3>
						<p className="text-sm text-muted-foreground">
							Crea estaciones de trabajo para las rotaciones del evento
						</p>
					</CardContent>
				</Card>
			)}

			{/* Edit Dialog */}
			{editingStation && (
				<Dialog
					open={!!editingStation}
					onOpenChange={() => setEditingStation(null)}
				>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Editar Estacion</DialogTitle>
						</DialogHeader>
						<StationForm
							eventId={eventId}
							stationId={editingStation}
							defaultValues={stations?.find((s) => s.id === editingStation)}
							onSubmit={(data) =>
								updateStation.mutate({ id: editingStation, ...data })
							}
							isLoading={updateStation.isPending}
						/>
					</DialogContent>
				</Dialog>
			)}

			{/* Staff Assignment Modal */}
			{staffAssignStation && (
				<StaffAssignmentModal
					eventId={eventId}
					entityId={staffAssignStation.id}
					entityType="station"
					entityName={staffAssignStation.name}
					open={!!staffAssignStation}
					onOpenChange={(open) => !open && setStaffAssignStation(null)}
					currentStaffIds={staffAssignStation.staffIds}
				/>
			)}
		</div>
	);
}

// Types for materials and attachments
interface StationMaterial {
	name: string;
	quantity: number;
	checked: boolean;
}

interface StationAttachment {
	key: string;
	name: string;
	type: string;
}

// Station Form Component
interface StationFormProps {
	eventId: string;
	stationId?: string;
	defaultValues?: {
		name?: string;
		description?: string | null;
		color?: string;
		capacity?: number | null;
		locationNotes?: string | null;
		content?: unknown;
	};
	onSubmit: (data: z.input<typeof createStationSchema>) => void;
	isLoading: boolean;
}

function StationForm({
	eventId,
	stationId,
	defaultValues,
	onSubmit,
	isLoading,
}: StationFormProps) {
	const contentObj =
		defaultValues?.content && typeof defaultValues.content === "object"
			? (defaultValues.content as {
					instructions?: string;
					staffInstructions?: string;
					materials?: StationMaterial[];
					attachments?: StationAttachment[];
				})
			: {};

	// Local state for materials and attachments
	const [materials, setMaterials] = React.useState<StationMaterial[]>(
		contentObj.materials || [],
	);
	const [attachments, setAttachments] = React.useState<StationAttachment[]>(
		contentObj.attachments || [],
	);
	const [newMaterialName, setNewMaterialName] = React.useState("");
	const [newMaterialQty, setNewMaterialQty] = React.useState(1);
	const [newAttachmentName, setNewAttachmentName] = React.useState("");
	const [newAttachmentUrl, setNewAttachmentUrl] = React.useState("");

	const form = useZodForm({
		schema: createStationSchema,
		defaultValues: {
			eventId,
			name: defaultValues?.name || "",
			description: defaultValues?.description || "",
			color: defaultValues?.color || "#10b981",
			capacity: defaultValues?.capacity || undefined,
			locationNotes: defaultValues?.locationNotes || "",
			sortOrder: 0,
			content: {
				instructions: contentObj.instructions || "",
				staffInstructions: contentObj.staffInstructions || "",
				materials: contentObj.materials || [],
				attachments: contentObj.attachments || [],
			},
		},
	});

	// Update form content when materials/attachments change
	React.useEffect(() => {
		const currentContent = form.getValues("content") || {};
		form.setValue("content", {
			...currentContent,
			materials,
			attachments,
		});
	}, [materials, attachments, form]);

	const addMaterial = () => {
		if (newMaterialName.trim()) {
			setMaterials([
				...materials,
				{
					name: newMaterialName.trim(),
					quantity: newMaterialQty,
					checked: false,
				},
			]);
			setNewMaterialName("");
			setNewMaterialQty(1);
		}
	};

	const removeMaterial = (index: number) => {
		setMaterials(materials.filter((_, i) => i !== index));
	};

	const addAttachment = () => {
		if (newAttachmentName.trim() && newAttachmentUrl.trim()) {
			const type =
				newAttachmentUrl.match(
					/\.(pdf|doc|docx|xls|xlsx|png|jpg|jpeg|gif)$/i,
				)?.[1] || "link";
			setAttachments([
				...attachments,
				{ key: newAttachmentUrl.trim(), name: newAttachmentName.trim(), type },
			]);
			setNewAttachmentName("");
			setNewAttachmentUrl("");
		}
	};

	const removeAttachment = (index: number) => {
		setAttachments(attachments.filter((_, i) => i !== index));
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nombre</FormLabel>
								<FormControl>
									<Input placeholder="Estacion de Fuerza" {...field} />
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
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona un color" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{stationColors.map((color) => (
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
				</div>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Descripcion</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Breve descripcion de la estacion..."
									{...field}
									value={field.value || ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="capacity"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Capacidad (opcional)</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										placeholder="Ej: 15"
										{...field}
										value={field.value || ""}
										onChange={(e) =>
											field.onChange(
												e.target.value
													? parseInt(e.target.value, 10)
													: undefined,
											)
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="locationNotes"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Ubicacion</FormLabel>
								<FormControl>
									<Input
										placeholder="Ej: Sector norte del campo"
										{...field}
										value={field.value || ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="content.instructions"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Instrucciones para Atletas</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Instrucciones de la actividad..."
									rows={3}
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
					name="content.staffInstructions"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Instrucciones para Staff</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Notas para el staff encargado..."
									rows={3}
									{...field}
									value={field.value || ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Materials Section */}
				<div className="space-y-3">
					<FormLabel className="flex items-center gap-2">
						<Package className="size-4" />
						Materiales Necesarios
					</FormLabel>
					{materials.length > 0 && (
						<div className="space-y-2">
							{materials.map((material, index) => (
								<div
									key={index}
									className="flex items-center gap-2 rounded-md border p-2 text-sm"
								>
									<span className="flex-1">{material.name}</span>
									<Badge variant="secondary">{material.quantity}</Badge>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="size-6"
										onClick={() => removeMaterial(index)}
									>
										<X className="size-3" />
									</Button>
								</div>
							))}
						</div>
					)}
					<div className="flex gap-2">
						<Input
							placeholder="Nombre del material"
							value={newMaterialName}
							onChange={(e) => setNewMaterialName(e.target.value)}
							className="flex-1"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									addMaterial();
								}
							}}
						/>
						<Input
							type="number"
							min={1}
							placeholder="Cant."
							value={newMaterialQty}
							onChange={(e) =>
								setNewMaterialQty(parseInt(e.target.value, 10) || 1)
							}
							className="w-20"
						/>
						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={addMaterial}
						>
							<Plus className="size-4" />
						</Button>
					</div>
				</div>

				{/* Attachments Section */}
				<div className="space-y-3">
					<FormLabel className="flex items-center gap-2">
						<Link className="size-4" />
						Archivos Adjuntos
					</FormLabel>
					{stationId ? (
						/* Use file upload for existing stations */
						<StationAttachmentUpload
							stationId={stationId}
							attachments={attachments}
							onAttachmentsChange={setAttachments}
						/>
					) : (
						/* URL-based approach for new stations */
						<>
							{attachments.length > 0 && (
								<div className="space-y-2">
									{attachments.map((attachment, index) => (
										<div
											key={index}
											className="flex items-center gap-2 rounded-md border p-2 text-sm"
										>
											<File className="size-4 text-muted-foreground" />
											<span className="flex-1 truncate">{attachment.name}</span>
											<a
												href={attachment.key}
												target="_blank"
												rel="noopener noreferrer"
												className="text-muted-foreground hover:text-foreground"
											>
												<ExternalLink className="size-4" />
											</a>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="size-6"
												onClick={() => removeAttachment(index)}
											>
												<X className="size-3" />
											</Button>
										</div>
									))}
								</div>
							)}
							<div className="flex gap-2">
								<Input
									placeholder="Nombre del archivo"
									value={newAttachmentName}
									onChange={(e) => setNewAttachmentName(e.target.value)}
									className="flex-1"
								/>
								<Input
									placeholder="URL del archivo"
									value={newAttachmentUrl}
									onChange={(e) => setNewAttachmentUrl(e.target.value)}
									className="flex-1"
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											addAttachment();
										}
									}}
								/>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={addAttachment}
								>
									<Plus className="size-4" />
								</Button>
							</div>
							<p className="text-xs text-muted-foreground">
								Guarda la estación primero para subir archivos desde tu
								dispositivo.
							</p>
						</>
					)}
				</div>

				<DialogFooter>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? "Guardando..." : stationId ? "Actualizar" : "Crear"}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
