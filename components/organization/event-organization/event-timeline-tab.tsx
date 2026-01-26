"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	CalendarIcon,
	CheckCircle2,
	Circle,
	Clock,
	Loader2,
	MoreHorizontal,
	Plus,
	Trash2,
	User,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { createMilestoneSchema } from "@/schemas/organization-event-organization-schemas";
import { trpc } from "@/trpc/client";

interface EventTimelineTabProps {
	eventId: string;
}

const milestoneStatuses = [
	{
		value: "pending",
		label: "Pendiente",
		color: "bg-slate-100 text-slate-700",
		icon: Circle,
	},
	{
		value: "in_progress",
		label: "En Progreso",
		color: "bg-blue-100 text-blue-700",
		icon: Clock,
	},
	{
		value: "completed",
		label: "Completado",
		color: "bg-green-100 text-green-700",
		icon: CheckCircle2,
	},
	{
		value: "delayed",
		label: "Atrasado",
		color: "bg-orange-100 text-orange-700",
		icon: Clock,
	},
	{
		value: "cancelled",
		label: "Cancelado",
		color: "bg-red-100 text-red-700",
		icon: Circle,
	},
];

export function EventTimelineTab({
	eventId,
}: EventTimelineTabProps): React.JSX.Element {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);

	const utils = trpc.useUtils();

	const { data, isPending } =
		trpc.organization.eventOrganization.listMilestones.useQuery({ eventId });

	const createMutation =
		trpc.organization.eventOrganization.createMilestone.useMutation({
			onSuccess: () => {
				toast.success("Hito agregado");
				utils.organization.eventOrganization.listMilestones.invalidate();
				setIsDialogOpen(false);
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message || "Error al crear hito");
			},
		});

	const updateMutation =
		trpc.organization.eventOrganization.updateMilestone.useMutation({
			onSuccess: () => {
				utils.organization.eventOrganization.listMilestones.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar hito");
			},
		});

	const deleteMutation =
		trpc.organization.eventOrganization.deleteMilestone.useMutation({
			onSuccess: () => {
				toast.success("Hito eliminado");
				utils.organization.eventOrganization.listMilestones.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar hito");
			},
		});

	const form = useZodForm({
		schema: createMilestoneSchema,
		defaultValues: {
			eventId,
			title: "",
			description: "",
			targetDate: new Date(),
			status: "pending",
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		createMutation.mutate(data);
	});

	const getStatusInfo = (status: string) => {
		return milestoneStatuses.find((s) => s.value === status);
	};

	const completedCount =
		data?.filter((m) => m.status === "completed").length ?? 0;
	const totalCount = data?.length ?? 0;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Timeline</CardTitle>
						<CardDescription>
							{completedCount} de {totalCount} hitos completados
						</CardDescription>
					</div>
					<Button onClick={() => setIsDialogOpen(true)}>
						<Plus className="size-4 mr-1" />
						Nuevo Hito
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{isPending ? (
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-20 w-full" />
						))}
					</div>
				) : data?.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						No hay hitos en el timeline
					</div>
				) : (
					<div className="relative">
						{/* Timeline line */}
						<div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

						<div className="space-y-6">
							{data?.map((milestone, _index) => {
								const statusInfo = getStatusInfo(milestone.status);
								const StatusIcon = statusInfo?.icon ?? Circle;
								const isOverdue =
									milestone.status !== "completed" &&
									milestone.status !== "cancelled" &&
									new Date(milestone.targetDate) < new Date();

								return (
									<div key={milestone.id} className="relative pl-10">
										{/* Timeline dot */}
										<div
											className={cn(
												"absolute left-2 size-5 rounded-full border-2 bg-background flex items-center justify-center",
												milestone.status === "completed"
													? "border-green-500"
													: isOverdue
														? "border-red-500"
														: "border-muted-foreground",
											)}
										>
											<StatusIcon
												className={cn(
													"size-3",
													milestone.status === "completed"
														? "text-green-500"
														: isOverdue
															? "text-red-500"
															: "text-muted-foreground",
												)}
											/>
										</div>

										<div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
											<div className="flex items-start justify-between">
												<div>
													<h3 className="font-medium">{milestone.title}</h3>
													{milestone.description && (
														<p className="text-sm text-muted-foreground mt-1">
															{milestone.description}
														</p>
													)}
												</div>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="size-8"
														>
															<MoreHorizontal className="size-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														{milestone.status !== "completed" && (
															<DropdownMenuItem
																onClick={() =>
																	updateMutation.mutate({
																		id: milestone.id,
																		status: "completed",
																	})
																}
															>
																<CheckCircle2 className="size-4" />
																Marcar completado
															</DropdownMenuItem>
														)}
														<DropdownMenuItem
															onClick={() =>
																deleteMutation.mutate({ id: milestone.id })
															}
															variant="destructive"
														>
															<Trash2 className="size-4" />
															Eliminar
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>

											<div className="flex items-center gap-3 mt-3 text-sm">
												<Badge
													variant="outline"
													className={cn("text-xs", statusInfo?.color)}
												>
													{statusInfo?.label}
												</Badge>
												<span
													className={cn(
														"flex items-center gap-1",
														isOverdue
															? "text-red-600"
															: "text-muted-foreground",
													)}
												>
													<CalendarIcon className="size-3" />
													{format(
														new Date(milestone.targetDate),
														"dd MMM yyyy",
														{
															locale: es,
														},
													)}
													{isOverdue && " (Atrasado)"}
												</span>
												{milestone.responsible && (
													<span className="flex items-center gap-1 text-muted-foreground">
														<User className="size-3" />
														{milestone.responsible.name}
													</span>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</CardContent>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Nuevo Hito</DialogTitle>
						<DialogDescription>
							Agrega un hito al timeline del evento
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={onSubmit} className="space-y-4">
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Título</FormLabel>
										<FormControl>
											<Input
												placeholder="Ej: Cierre de inscripciones"
												{...field}
											/>
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
										<FormLabel>Descripción (opcional)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Detalles del hito..."
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

							<FormField
								control={form.control}
								name="targetDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Fecha</FormLabel>
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
														{field.value instanceof Date ? (
															format(field.value, "PPP", { locale: es })
														) : (
															<span>Seleccionar fecha</span>
														)}
														<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={
														field.value instanceof Date
															? field.value
															: undefined
													}
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
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Estado</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar estado" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{milestoneStatuses.map((status) => (
													<SelectItem key={status.value} value={status.value}>
														{status.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
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
								<Button type="submit" disabled={createMutation.isPending}>
									{createMutation.isPending && (
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
