"use client";

import {
	Loader2,
	MapPin,
	MoreHorizontal,
	Plus,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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
import { createZoneSchema } from "@/schemas/organization-event-organization-schemas";
import { trpc } from "@/trpc/client";
import { StaffAssignmentModal } from "./event-staff-assignment-modal";

interface EventZonesTabProps {
	eventId: string;
}

const zoneTypes = [
	{ value: "entrance", label: "Entrada", color: "bg-blue-100 text-blue-700" },
	{
		value: "competition",
		label: "Competencia",
		color: "bg-green-100 text-green-700",
	},
	{
		value: "warmup",
		label: "Calentamiento",
		color: "bg-yellow-100 text-yellow-700",
	},
	{
		value: "registration",
		label: "Acreditación",
		color: "bg-purple-100 text-purple-700",
	},
	{ value: "medical", label: "Médico", color: "bg-red-100 text-red-700" },
	{
		value: "catering",
		label: "Catering",
		color: "bg-orange-100 text-orange-700",
	},
	{ value: "vip", label: "VIP", color: "bg-amber-100 text-amber-700" },
	{ value: "press", label: "Prensa", color: "bg-indigo-100 text-indigo-700" },
	{
		value: "parking",
		label: "Estacionamiento",
		color: "bg-slate-100 text-slate-700",
	},
	{ value: "storage", label: "Almacén", color: "bg-gray-100 text-gray-700" },
	{ value: "other", label: "Otro", color: "bg-neutral-100 text-neutral-700" },
];

export function EventZonesTab({
	eventId,
}: EventZonesTabProps): React.JSX.Element {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);
	const [staffAssignZone, setStaffAssignZone] = React.useState<{
		id: string;
		name: string;
		staffIds: string[];
	} | null>(null);

	const utils = trpc.useUtils();

	const { data, isPending } =
		trpc.organization.eventOrganization.listZones.useQuery({ eventId });

	const createMutation =
		trpc.organization.eventOrganization.createZone.useMutation({
			onSuccess: () => {
				toast.success("Zona creada");
				utils.organization.eventOrganization.listZones.invalidate();
				setIsDialogOpen(false);
				form.reset();
			},
			onError: (err: { message?: string }) => {
				toast.error(err.message || "Error al crear zona");
			},
		});

	const deleteMutation =
		trpc.organization.eventOrganization.deleteZone.useMutation({
			onSuccess: () => {
				toast.success("Zona eliminada");
				utils.organization.eventOrganization.listZones.invalidate();
			},
			onError: (err: { message?: string }) => {
				toast.error(err.message || "Error al eliminar zona");
			},
		});

	const form = useZodForm({
		schema: createZoneSchema,
		defaultValues: {
			eventId,
			name: "",
			zoneType: "other",
			description: "",
			capacity: undefined,
			locationDescription: "",
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		createMutation.mutate(data);
	});

	const getZoneTypeBadge = (type: string | null) => {
		if (!type) return null;
		const zt = zoneTypes.find((z) => z.value === type);
		return zt ? (
			<Badge variant="outline" className={cn("text-xs", zt.color)}>
				{zt.label}
			</Badge>
		) : (
			<Badge variant="outline" className="text-xs">
				{type}
			</Badge>
		);
	};

	const totalCapacity =
		data?.reduce((sum, z) => sum + (z.capacity ?? 0), 0) ?? 0;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Zonas del Evento</CardTitle>
						<CardDescription>
							{data?.length ?? 0} zonas configuradas
							{totalCapacity > 0 && ` - Capacidad total: ${totalCapacity}`}
						</CardDescription>
					</div>
					<Button onClick={() => setIsDialogOpen(true)}>
						<Plus className="size-4 mr-1" />
						Nueva Zona
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{isPending ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-32 w-full" />
						))}
					</div>
				) : data?.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						No hay zonas configuradas para este evento
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{data?.map((zone) => (
							<div
								key={zone.id}
								className="border rounded-lg p-4 hover:shadow-md transition-shadow"
							>
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2">
										<MapPin className="size-4 text-muted-foreground" />
										<h3 className="font-medium">{zone.name}</h3>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="size-8">
												<MoreHorizontal className="size-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() =>
													setStaffAssignZone({
														id: zone.id,
														name: zone.name,
														staffIds: zone.staff?.map((s) => s.staffId) || [],
													})
												}
											>
												<UserPlus className="size-4" />
												Asignar Staff
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => deleteMutation.mutate({ id: zone.id })}
												variant="destructive"
											>
												<Trash2 className="size-4" />
												Eliminar
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								<div className="mt-2 space-y-2">
									{getZoneTypeBadge(zone.zoneType)}
									{zone.description && (
										<p className="text-sm text-muted-foreground line-clamp-2">
											{zone.description}
										</p>
									)}
									<div className="flex items-center gap-4 text-sm text-muted-foreground">
										{zone.capacity && (
											<span className="flex items-center gap-1">
												<Users className="size-3" />
												{zone.capacity} personas
											</span>
										)}
										{zone.locationDescription && (
											<span className="flex items-center gap-1">
												<MapPin className="size-3" />
												{zone.locationDescription}
											</span>
										)}
									</div>
									{/* Staff display */}
									<div className="pt-2 border-t">
										{zone.staff && zone.staff.length > 0 ? (
											<button
												type="button"
												className="flex items-center gap-2 hover:opacity-80"
												onClick={() =>
													setStaffAssignZone({
														id: zone.id,
														name: zone.name,
														staffIds: zone.staff?.map((s) => s.staffId) || [],
													})
												}
											>
												<div className="flex -space-x-2">
													{zone.staff.slice(0, 3).map((assignment) => {
														const staffMember = assignment.staff;
														const name =
															staffMember?.staffType === "system_user"
																? staffMember.user?.name ||
																	staffMember.user?.email
																: staffMember?.externalName || "Staff";
														const initials = name
															?.split(" ")
															.map((n: string) => n[0])
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
													{zone.staff.length > 3 && (
														<div className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
															+{zone.staff.length - 3}
														</div>
													)}
												</div>
												<span className="text-xs text-muted-foreground">
													{zone.staff.length} staff
												</span>
											</button>
										) : (
											<button
												type="button"
												className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
												onClick={() =>
													setStaffAssignZone({
														id: zone.id,
														name: zone.name,
														staffIds: [],
													})
												}
											>
												<UserPlus className="size-3" />
												<span className="text-xs">Asignar Staff</span>
											</button>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Nueva Zona</DialogTitle>
						<DialogDescription>
							Define una nueva zona para el evento
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={onSubmit} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nombre</FormLabel>
										<FormControl>
											<Input
												placeholder="Ej: Zona de competencia A"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="zoneType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tipo de Zona</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value ?? ""}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar tipo" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{zoneTypes.map((zt) => (
													<SelectItem key={zt.value} value={zt.value}>
														{zt.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Descripción (opcional)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Descripción de la zona..."
												className="resize-none"
												rows={2}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
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
													placeholder="Ej: 100"
													{...field}
													value={field.value ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Number.parseInt(e.target.value, 10)
																: undefined,
														)
													}
												/>
											</FormControl>
											<FormDescription>Personas máximas</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="locationDescription"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Ubicación (opcional)</FormLabel>
											<FormControl>
												<Input
													placeholder="Ej: Sector Norte"
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
								>
									Cancelar
								</Button>
								<Button type="submit" disabled={createMutation.isPending}>
									{createMutation.isPending && (
										<Loader2 className="mr-2 size-4 animate-spin" />
									)}
									Crear
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Staff Assignment Modal */}
			{staffAssignZone && (
				<StaffAssignmentModal
					eventId={eventId}
					entityId={staffAssignZone.id}
					entityType="zone"
					entityName={staffAssignZone.name}
					open={!!staffAssignZone}
					onOpenChange={(open) => !open && setStaffAssignZone(null)}
					currentStaffIds={staffAssignZone.staffIds}
				/>
			)}
		</Card>
	);
}
