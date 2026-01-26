"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	Coffee,
	Loader2,
	MapPin,
	MoreHorizontal,
	Plus,
	Trash2,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod/v4";
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
import { EventTimeBlockType } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

interface EventBreaksManagerProps {
	eventId: string;
}

const addBreakSchema = z.object({
	name: z.string().min(1, "Nombre requerido").max(200),
	description: z.string().max(2000).optional(),
	startTime: z.string().min(1, "Hora de inicio requerida"),
	durationMinutes: z.number().int().min(5).max(180),
	zoneId: z.string().uuid().optional(),
});

export function EventBreaksManager({
	eventId,
}: EventBreaksManagerProps): React.JSX.Element {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);

	const utils = trpc.useUtils();

	const { data: overview, isPending } =
		trpc.organization.eventRotation.getOverview.useQuery({ eventId });

	const { data: zones } =
		trpc.organization.eventOrganization.listZones.useQuery({ eventId });

	const createTimeBlock =
		trpc.organization.eventRotation.createTimeBlock.useMutation({
			onSuccess: () => {
				toast.success("Break agregado");
				utils.organization.eventRotation.getOverview.invalidate({ eventId });
				utils.organization.eventRotation.getSchedule.invalidate({ eventId });
				setIsDialogOpen(false);
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message || "Error al agregar break");
			},
		});

	const deleteTimeBlock =
		trpc.organization.eventRotation.deleteTimeBlock.useMutation({
			onSuccess: () => {
				toast.success("Break eliminado");
				utils.organization.eventRotation.getOverview.invalidate({ eventId });
				utils.organization.eventRotation.getSchedule.invalidate({ eventId });
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar break");
			},
		});

	const form = useZodForm({
		schema: addBreakSchema,
		defaultValues: {
			name: "",
			description: "",
			startTime: "10:30",
			durationMinutes: 15,
			zoneId: undefined,
		},
	});

	const schedule = overview?.schedule;
	const timeBlocks = schedule?.timeBlocks || [];

	// Get breaks and activities only
	const breaks = timeBlocks.filter(
		(b) =>
			b.blockType === EventTimeBlockType.break ||
			b.blockType === EventTimeBlockType.generalActivity,
	);

	// Get next block order
	const getNextBlockOrder = () => {
		if (timeBlocks.length === 0) return 0;
		return Math.max(...timeBlocks.map((b) => b.blockOrder)) + 1;
	};

	const onSubmit = form.handleSubmit((data) => {
		if (!schedule) {
			toast.error("Primero genera un cronograma");
			return;
		}

		// Parse start time
		const [hours, minutes] = data.startTime.split(":").map(Number);
		const scheduleDate = new Date(schedule.scheduleDate);
		const startTime = new Date(scheduleDate);
		startTime.setHours(hours ?? 10, minutes ?? 30, 0, 0);

		const endTime = new Date(startTime);
		endTime.setMinutes(endTime.getMinutes() + data.durationMinutes);

		createTimeBlock.mutate({
			scheduleId: schedule.id,
			blockType: EventTimeBlockType.break,
			name: data.name,
			description: data.description || undefined,
			startTime,
			endTime,
			durationMinutes: data.durationMinutes,
			blockOrder: getNextBlockOrder(),
			zoneId: data.zoneId || undefined,
			color: "#9ca3af", // Gray for breaks
		});
	});

	if (isPending) {
		return <Skeleton className="h-64 w-full" />;
	}

	if (!schedule) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12 text-center">
					<Coffee className="mb-4 size-12 text-muted-foreground" />
					<h3 className="text-lg font-medium">No hay cronograma</h3>
					<p className="text-sm text-muted-foreground">
						Genera un cronograma primero para poder agregar breaks
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Coffee className="size-5" />
							Breaks y Pausas
						</CardTitle>
						<CardDescription>
							{breaks.length} break{breaks.length !== 1 ? "s" : ""} configurado
							{breaks.length !== 1 ? "s" : ""}
						</CardDescription>
					</div>
					<Button onClick={() => setIsDialogOpen(true)}>
						<Plus className="size-4 mr-1" />
						Agregar Break
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{breaks.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<Coffee className="size-12 mx-auto mb-2 opacity-50" />
						<p>No hay breaks configurados</p>
						<p className="text-xs mt-1">
							Los breaks aparecen como pausas para todos los grupos
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{breaks
							.sort(
								(a, b) =>
									new Date(a.startTime).getTime() -
									new Date(b.startTime).getTime(),
							)
							.map((block) => (
								<div
									key={block.id}
									className="flex items-center justify-between rounded-lg border p-4"
								>
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<span className="font-medium">
												{block.name || "Break"}
											</span>
											<Badge variant="secondary" className="text-xs">
												{block.durationMinutes} min
											</Badge>
											{block.zone && (
												<Badge variant="outline" className="text-xs gap-1">
													<MapPin className="size-3" />
													{block.zone.name}
												</Badge>
											)}
										</div>
										<p className="text-sm text-muted-foreground">
											{format(new Date(block.startTime), "HH:mm")} -{" "}
											{format(new Date(block.endTime), "HH:mm")}
										</p>
										{block.description && (
											<p className="text-xs text-muted-foreground">
												{block.description}
											</p>
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
												onClick={() => deleteTimeBlock.mutate({ id: block.id })}
												variant="destructive"
											>
												<Trash2 className="size-4" />
												Eliminar
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							))}
					</div>
				)}
			</CardContent>

			{/* Add Break Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Agregar Break</DialogTitle>
						<DialogDescription>
							Define una pausa o descanso en el cronograma
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
												placeholder="Ej: Descanso hidratacion"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="startTime"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Hora de Inicio</FormLabel>
											<FormControl>
												<Input type="time" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="durationMinutes"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Duracion (min)</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={5}
													max={180}
													value={field.value}
													onChange={(e) =>
														field.onChange(parseInt(e.target.value, 10) || 15)
													}
													onBlur={field.onBlur}
													name={field.name}
													ref={field.ref}
												/>
											</FormControl>
											<FormDescription>Entre 5 y 180 minutos</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="zoneId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Zona (opcional)</FormLabel>
										<Select
											onValueChange={(value) =>
												field.onChange(value === "_none" ? undefined : value)
											}
											value={field.value || "_none"}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar zona del break" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="_none">
													Sin zona especifica
												</SelectItem>
												{zones?.map((zone) => (
													<SelectItem key={zone.id} value={zone.id}>
														{zone.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>
											Donde se realizara el break (ej: zona de hidratacion)
										</FormDescription>
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
												placeholder="Instrucciones o notas sobre el break..."
												className="resize-none"
												rows={2}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
								>
									Cancelar
								</Button>
								<Button type="submit" disabled={createTimeBlock.isPending}>
									{createTimeBlock.isPending && (
										<Loader2 className="mr-2 size-4 animate-spin" />
									)}
									Agregar
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
