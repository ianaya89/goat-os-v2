"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Play, RefreshCw, Settings } from "lucide-react";
import type * as React from "react";
import { toast } from "sonner";
import type { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { generateScheduleSchema } from "@/schemas/organization-event-rotation-schemas";
import { trpc } from "@/trpc/client";

interface EventScheduleConfigProps {
	eventId: string;
}

export function EventScheduleConfig({
	eventId,
}: EventScheduleConfigProps): React.JSX.Element {
	const utils = trpc.useUtils();

	const { data: overview, isPending } =
		trpc.organization.eventRotation.getOverview.useQuery({ eventId });

	const generateSchedule =
		trpc.organization.eventRotation.generateSchedule.useMutation({
			onSuccess: (data) => {
				utils.organization.eventRotation.getOverview.invalidate({ eventId });
				utils.organization.eventRotation.getSchedule.invalidate({ eventId });
				toast.success(
					`Cronograma generado con ${data.totalRotations} rotaciones`,
				);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const form = useZodForm({
		schema: generateScheduleSchema,
		defaultValues: {
			eventId,
			scheduleDate: new Date(),
			startTime: new Date(new Date().setHours(9, 0, 0, 0)),
			endTime: new Date(new Date().setHours(13, 0, 0, 0)),
			rotationDuration: 30,
			rotationStrategy: "sequential",
		},
	});

	if (isPending) {
		return <Skeleton className="h-96 w-full" />;
	}

	const { groups = [], stations = [], schedule } = overview || {};
	const canGenerate = groups.length > 0 && stations.length > 0;

	return (
		<div className="space-y-6">
			{/* Status Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="size-5" />
						Estado del Cronograma
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-3">
						<div className="space-y-1">
							<p className="text-sm font-medium">Grupos</p>
							<p className="text-2xl font-bold">{groups.length}</p>
							{groups.length === 0 && (
								<p className="text-xs text-destructive">
									Crea al menos 1 grupo
								</p>
							)}
						</div>
						<div className="space-y-1">
							<p className="text-sm font-medium">Estaciones</p>
							<p className="text-2xl font-bold">{stations.length}</p>
							{stations.length === 0 && (
								<p className="text-xs text-destructive">
									Crea al menos 1 estacion
								</p>
							)}
						</div>
						<div className="space-y-1">
							<p className="text-sm font-medium">Balance</p>
							{groups.length === stations.length ? (
								<p className="text-sm text-green-600">
									Grupos y estaciones coinciden
								</p>
							) : (
								<p className="text-sm text-amber-600">
									{Math.abs(groups.length - stations.length)} diferencia
								</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Existing Schedule Info */}
			{schedule && (
				<Card>
					<CardHeader>
						<CardTitle>Cronograma Actual</CardTitle>
						<CardDescription>
							Configurado para el{" "}
							{format(new Date(schedule.scheduleDate), "PPP", { locale: es })}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-4">
							<div>
								<p className="text-sm text-muted-foreground">Inicio</p>
								<p className="font-medium">
									{format(new Date(schedule.startTime), "HH:mm")}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Fin</p>
								<p className="font-medium">
									{format(new Date(schedule.endTime), "HH:mm")}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">
									Duracion por Rotacion
								</p>
								<p className="font-medium">
									{schedule.defaultRotationDuration} min
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Rotaciones</p>
								<p className="font-medium">{schedule.totalRotations}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Generate Form */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Play className="size-5" />
						{schedule ? "Regenerar Cronograma" : "Generar Cronograma"}
					</CardTitle>
					<CardDescription>
						Configura los parametros y genera automaticamente las rotaciones
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit((data) =>
								generateSchedule.mutate(data),
							)}
							className="space-y-6"
						>
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="scheduleDate"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>Fecha del Evento</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant="outline"
															className={cn(
																"w-full pl-3 text-left font-normal",
																!field.value && "text-muted-foreground",
															)}
														>
															{field.value ? (
																format(field.value as Date, "PPP", {
																	locale: es,
																})
															) : (
																<span>Selecciona fecha</span>
															)}
															<CalendarIcon className="ml-auto size-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={field.value as Date | undefined}
														onSelect={field.onChange}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="rotationDuration"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Duracion por Rotacion (min)</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={5}
													max={180}
													{...field}
													onChange={(e) =>
														field.onChange(parseInt(e.target.value, 10))
													}
												/>
											</FormControl>
											<FormDescription>Entre 5 y 180 minutos</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="startTime"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Hora de Inicio</FormLabel>
											<FormControl>
												<Input
													type="time"
													value={
														field.value
															? format(field.value as Date, "HH:mm")
															: "09:00"
													}
													onChange={(e) => {
														const [hours, minutes] = e.target.value
															.split(":")
															.map(Number);
														const scheduleDate = form.getValues("scheduleDate");
														const date = new Date(scheduleDate as Date);
														date.setHours(hours ?? 9, minutes ?? 0, 0, 0);
														field.onChange(date);
													}}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="endTime"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Hora de Fin</FormLabel>
											<FormControl>
												<Input
													type="time"
													value={
														field.value
															? format(field.value as Date, "HH:mm")
															: "13:00"
													}
													onChange={(e) => {
														const [hours, minutes] = e.target.value
															.split(":")
															.map(Number);
														const scheduleDate = form.getValues("scheduleDate");
														const date = new Date(scheduleDate as Date);
														date.setHours(hours ?? 13, minutes ?? 0, 0, 0);
														field.onChange(date);
													}}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{!canGenerate && (
								<div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
									<p className="font-medium">Requisitos no cumplidos</p>
									<ul className="mt-1 list-inside list-disc">
										{groups.length === 0 && (
											<li>Crea al menos un grupo de atletas</li>
										)}
										{stations.length === 0 && (
											<li>Crea al menos una estacion</li>
										)}
										{groups.length > 0 &&
											stations.length > 0 &&
											groups.length !== stations.length && (
												<li>
													El numero de grupos ({groups.length}) debe coincidir
													con el numero de estaciones ({stations.length})
												</li>
											)}
									</ul>
								</div>
							)}

							<Button
								type="submit"
								disabled={
									!canGenerate ||
									groups.length !== stations.length ||
									generateSchedule.isPending
								}
								className="w-full md:w-auto"
							>
								{generateSchedule.isPending ? (
									<>
										<RefreshCw className="mr-2 size-4 animate-spin" />
										Generando...
									</>
								) : (
									<>
										<Play className="mr-2 size-4" />
										{schedule ? "Regenerar Cronograma" : "Generar Cronograma"}
									</>
								)}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
