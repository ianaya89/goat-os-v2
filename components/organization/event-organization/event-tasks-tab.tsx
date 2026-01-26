"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	CalendarIcon,
	Check,
	Circle,
	Clock,
	GripVertical,
	Loader2,
	MoreHorizontal,
	Plus,
	Trash2,
	User,
	UserPlus,
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
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
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
import { EventTaskPriority, EventTaskStatus } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { createTaskSchema } from "@/schemas/organization-event-organization-schemas";
import { trpc } from "@/trpc/client";

interface EventTasksTabProps {
	eventId: string;
}

type TaskStatus = "todo" | "in_progress" | "done";

const columns: { id: TaskStatus; title: string; color: string }[] = [
	{ id: "todo", title: "Por Hacer", color: "bg-slate-500" },
	{ id: "in_progress", title: "En Progreso", color: "bg-blue-500" },
	{ id: "done", title: "Completado", color: "bg-green-500" },
];

const priorities: { value: string; label: string; color: string }[] = [
	{ value: "low", label: "Baja", color: "bg-slate-100 text-slate-700" },
	{ value: "medium", label: "Media", color: "bg-yellow-100 text-yellow-700" },
	{ value: "high", label: "Alta", color: "bg-orange-100 text-orange-700" },
	{ value: "urgent", label: "Urgente", color: "bg-red-100 text-red-700" },
];

export function EventTasksTab({
	eventId,
}: EventTasksTabProps): React.JSX.Element {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);
	const [draggedTaskId, setDraggedTaskId] = React.useState<string | null>(null);

	const utils = trpc.useUtils();

	const { data, isPending } =
		trpc.organization.eventOrganization.listTasks.useQuery({ eventId });

	const { data: membersData } = trpc.organization.user.list.useQuery({
		limit: 100,
		offset: 0,
	});

	const createMutation =
		trpc.organization.eventOrganization.createTask.useMutation({
			onSuccess: () => {
				toast.success("Tarea creada");
				utils.organization.eventOrganization.listTasks.invalidate();
				setIsDialogOpen(false);
				form.reset();
			},
			onError: (err: { message?: string }) => {
				toast.error(err.message || "Error al crear tarea");
			},
		});

	const updateMutation =
		trpc.organization.eventOrganization.updateTask.useMutation({
			onSuccess: () => {
				toast.success("Tarea actualizada");
				utils.organization.eventOrganization.listTasks.invalidate();
			},
			onError: (err: { message?: string }) => {
				toast.error(err.message || "Error al actualizar tarea");
			},
		});

	const deleteMutation =
		trpc.organization.eventOrganization.deleteTask.useMutation({
			onSuccess: () => {
				toast.success("Tarea eliminada");
				utils.organization.eventOrganization.listTasks.invalidate();
			},
			onError: (err: { message?: string }) => {
				toast.error(err.message || "Error al eliminar tarea");
			},
		});

	const form = useZodForm({
		schema: createTaskSchema,
		defaultValues: {
			eventId,
			title: "",
			description: "",
			status: EventTaskStatus.todo,
			priority: EventTaskPriority.medium,
			dueDate: undefined,
			assigneeId: undefined,
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		createMutation.mutate(data);
	});

	const handleDragStart = (e: React.DragEvent, taskId: string) => {
		setDraggedTaskId(taskId);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
		e.preventDefault();
		if (draggedTaskId) {
			const task = data?.find((t) => t.id === draggedTaskId);
			if (task && task.status !== newStatus) {
				updateMutation.mutate({
					id: draggedTaskId,
					status: newStatus as "todo" | "in_progress" | "done",
				});
			}
		}
		setDraggedTaskId(null);
	};

	const tasksByStatus = React.useMemo(() => {
		const grouped: Record<TaskStatus, typeof data> = {
			todo: [],
			in_progress: [],
			done: [],
		};

		if (data) {
			for (const task of data) {
				const status = task.status as TaskStatus;
				if (grouped[status]) {
					grouped[status]?.push(task);
				}
			}
		}

		return grouped;
	}, [data]);

	const getPriorityBadge = (priority: string) => {
		const p = priorities.find((p) => p.value === priority);
		return p ? (
			<Badge variant="outline" className={cn("text-xs", p.color)}>
				{p.label}
			</Badge>
		) : null;
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Tareas</CardTitle>
						<CardDescription>
							Gestiona las tareas del evento con Kanban
						</CardDescription>
					</div>
					<Button onClick={() => setIsDialogOpen(true)}>
						<Plus className="size-4 mr-1" />
						Nueva Tarea
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{isPending ? (
					<div className="grid grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-24 w-full" />
								<Skeleton className="h-24 w-full" />
							</div>
						))}
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{columns.map((column) => (
							<div
								key={column.id}
								role="group"
								className="flex flex-col"
								onDragOver={handleDragOver}
								onDrop={(e) => handleDrop(e, column.id)}
							>
								<div className="flex items-center gap-2 mb-3">
									<div className={cn("size-3 rounded-full", column.color)} />
									<h3 className="font-medium text-sm">{column.title}</h3>
									<Badge variant="secondary" className="ml-auto text-xs">
										{tasksByStatus[column.id]?.length ?? 0}
									</Badge>
								</div>
								<div className="flex-1 min-h-[200px] bg-muted/30 rounded-lg p-2 space-y-2">
									{tasksByStatus[column.id]?.map((task) => (
										<div
											key={task.id}
											role="button"
											draggable
											onDragStart={(e) => handleDragStart(e, task.id)}
											className={cn(
												"bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing",
												"hover:shadow-md transition-shadow",
												draggedTaskId === task.id && "opacity-50",
											)}
										>
											<div className="flex items-start gap-2">
												<GripVertical className="size-4 text-muted-foreground flex-shrink-0 mt-0.5" />
												<div className="flex-1 min-w-0">
													<p className="font-medium text-sm truncate">
														{task.title}
													</p>
													{task.description && (
														<p className="text-xs text-muted-foreground line-clamp-2 mt-1">
															{task.description}
														</p>
													)}
													<div className="flex items-center gap-2 mt-2 flex-wrap">
														{getPriorityBadge(task.priority)}
														{task.dueDate && (
															<span className="text-xs text-muted-foreground flex items-center gap-1">
																<CalendarIcon className="size-3" />
																{format(new Date(task.dueDate), "dd MMM", {
																	locale: es,
																})}
															</span>
														)}
														{task.assignee && (
															<span className="text-xs text-muted-foreground flex items-center gap-1">
																<User className="size-3" />
																{task.assignee.name}
															</span>
														)}
													</div>
												</div>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="size-6"
														>
															<MoreHorizontal className="size-3" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuSub>
															<DropdownMenuSubTrigger>
																<Circle className="size-4" />
																Cambiar estado
															</DropdownMenuSubTrigger>
															<DropdownMenuPortal>
																<DropdownMenuSubContent>
																	{columns.map((col) => (
																		<DropdownMenuItem
																			key={col.id}
																			onClick={() =>
																				updateMutation.mutate({
																					id: task.id,
																					status: col.id,
																				})
																			}
																			disabled={task.status === col.id}
																		>
																			{col.id === "todo" && (
																				<Circle className="size-4" />
																			)}
																			{col.id === "in_progress" && (
																				<Clock className="size-4" />
																			)}
																			{col.id === "done" && (
																				<Check className="size-4" />
																			)}
																			{col.title}
																			{task.status === col.id && (
																				<Check className="size-3 ml-auto" />
																			)}
																		</DropdownMenuItem>
																	))}
																</DropdownMenuSubContent>
															</DropdownMenuPortal>
														</DropdownMenuSub>
														<DropdownMenuSub>
															<DropdownMenuSubTrigger>
																<UserPlus className="size-4" />
																Asignar a
															</DropdownMenuSubTrigger>
															<DropdownMenuPortal>
																<DropdownMenuSubContent>
																	<DropdownMenuItem
																		onClick={() =>
																			updateMutation.mutate({
																				id: task.id,
																				assigneeId: null,
																			})
																		}
																		disabled={!task.assignee}
																	>
																		<User className="size-4" />
																		Sin asignar
																		{!task.assignee && (
																			<Check className="size-3 ml-auto" />
																		)}
																	</DropdownMenuItem>
																	{membersData?.users.map((member) => (
																		<DropdownMenuItem
																			key={member.id}
																			onClick={() =>
																				updateMutation.mutate({
																					id: task.id,
																					assigneeId: member.id,
																				})
																			}
																			disabled={task.assignee?.id === member.id}
																		>
																			<User className="size-4" />
																			{member.name || member.email}
																			{task.assignee?.id === member.id && (
																				<Check className="size-3 ml-auto" />
																			)}
																		</DropdownMenuItem>
																	))}
																</DropdownMenuSubContent>
															</DropdownMenuPortal>
														</DropdownMenuSub>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() =>
																deleteMutation.mutate({ id: task.id })
															}
															variant="destructive"
														>
															<Trash2 className="size-4" />
															Eliminar
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>
									))}
									{(tasksByStatus[column.id]?.length ?? 0) === 0 && (
										<div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
											Arrastra tareas aquí
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Nueva Tarea</DialogTitle>
						<DialogDescription>
							Crea una nueva tarea para el evento
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
												placeholder="Ej: Coordinar con proveedores"
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
												placeholder="Detalles de la tarea..."
												className="resize-none"
												rows={3}
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
									name="status"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Estado</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar estado" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{columns.map((col) => (
														<SelectItem key={col.id} value={col.id}>
															{col.title}
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
									name="priority"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Prioridad</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar prioridad" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{priorities.map((p) => (
														<SelectItem key={p.value} value={p.value}>
															{p.label}
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
								name="dueDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Fecha límite (opcional)</FormLabel>
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
								name="assigneeId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Asignar a (opcional)</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value ?? ""}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar miembro" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{membersData?.users.map((member) => (
													<SelectItem key={member.id} value={member.id}>
														{member.name || member.email}
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
									Crear
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
