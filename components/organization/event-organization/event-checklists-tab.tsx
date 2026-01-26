"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	CalendarIcon,
	CheckCircle2,
	Circle,
	Loader2,
	MoreHorizontal,
	Plus,
	Trash2,
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
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { createChecklistItemSchema } from "@/schemas/organization-event-organization-schemas";
import { trpc } from "@/trpc/client";

interface EventChecklistsTabProps {
	eventId: string;
}

const categories = [
	{ value: "logistics", label: "Logística" },
	{ value: "marketing", label: "Marketing" },
	{ value: "registration", label: "Inscripciones" },
	{ value: "venue", label: "Lugar" },
	{ value: "safety", label: "Seguridad" },
	{ value: "catering", label: "Catering" },
	{ value: "equipment", label: "Equipamiento" },
	{ value: "other", label: "Otro" },
];

export function EventChecklistsTab({
	eventId,
}: EventChecklistsTabProps): React.JSX.Element {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);
	const [filterCategory, setFilterCategory] = React.useState<string | null>(
		null,
	);

	const utils = trpc.useUtils();

	const { data, isPending } =
		trpc.organization.eventOrganization.listChecklists.useQuery({
			eventId,
			category: filterCategory ?? undefined,
		});

	const createMutation =
		trpc.organization.eventOrganization.createChecklistItem.useMutation({
			onSuccess: () => {
				toast.success("Item agregado");
				utils.organization.eventOrganization.listChecklists.invalidate();
				setIsDialogOpen(false);
			},
			onError: (err: { message?: string }) => {
				toast.error(err.message || "Error al crear item");
			},
		});

	const updateMutation =
		trpc.organization.eventOrganization.updateChecklistItem.useMutation({
			onSuccess: () => {
				utils.organization.eventOrganization.listChecklists.invalidate();
			},
			onError: (err: { message?: string }) => {
				toast.error(err.message || "Error al actualizar item");
			},
		});

	const deleteMutation =
		trpc.organization.eventOrganization.deleteChecklistItem.useMutation({
			onSuccess: () => {
				toast.success("Item eliminado");
				utils.organization.eventOrganization.listChecklists.invalidate();
			},
			onError: (err: { message?: string }) => {
				toast.error(err.message || "Error al eliminar item");
			},
		});

	const form = useZodForm({
		schema: createChecklistItemSchema,
		defaultValues: {
			eventId,
			title: "",
			category: undefined,
			dueDate: undefined,
			sortOrder: 0,
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		createMutation.mutate(data);
	});

	const handleToggleStatus = (
		id: string,
		currentStatus: "pending" | "completed",
	) => {
		updateMutation.mutate({
			id,
			status: currentStatus === "pending" ? "completed" : "pending",
		});
	};

	const completedCount =
		data?.filter((item) => item.status === "completed").length ?? 0;
	const totalCount = data?.length ?? 0;
	const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Checklists</CardTitle>
						<CardDescription>
							{completedCount} de {totalCount} completados (
							{Math.round(progress)}
							%)
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Select
							value={filterCategory ?? "all"}
							onValueChange={(v) => setFilterCategory(v === "all" ? null : v)}
						>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Categoría" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todas</SelectItem>
								{categories.map((cat) => (
									<SelectItem key={cat.value} value={cat.value}>
										{cat.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button onClick={() => setIsDialogOpen(true)}>
							<Plus className="size-4 mr-1" />
							Agregar
						</Button>
					</div>
				</div>
				{totalCount > 0 && (
					<div className="w-full bg-secondary rounded-full h-2 mt-2">
						<div
							className="bg-primary h-2 rounded-full transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
				)}
			</CardHeader>
			<CardContent>
				{isPending ? (
					<div className="space-y-2">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-12 w-full" />
						))}
					</div>
				) : data?.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						No hay items en el checklist
					</div>
				) : (
					<div className="space-y-2">
						{data?.map((item) => (
							<div
								key={item.id}
								className={cn(
									"flex items-center gap-3 p-3 rounded-lg border",
									item.status === "completed" && "bg-muted/50",
								)}
							>
								<button
									type="button"
									onClick={() =>
										handleToggleStatus(
											item.id,
											item.status as "pending" | "completed",
										)
									}
									className="flex-shrink-0"
								>
									{item.status === "completed" ? (
										<CheckCircle2 className="size-5 text-primary" />
									) : (
										<Circle className="size-5 text-muted-foreground" />
									)}
								</button>
								<div className="flex-1 min-w-0">
									<p
										className={cn(
											"font-medium truncate",
											item.status === "completed" &&
												"line-through text-muted-foreground",
										)}
									>
										{item.title}
									</p>
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										{item.category && (
											<Badge variant="secondary" className="text-xs">
												{categories.find((c) => c.value === item.category)
													?.label ?? item.category}
											</Badge>
										)}
										{item.dueDate && (
											<span>
												Vence:{" "}
												{format(new Date(item.dueDate), "dd MMM", {
													locale: es,
												})}
											</span>
										)}
									</div>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon" className="size-8">
											<MoreHorizontal className="size-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() => deleteMutation.mutate({ id: item.id })}
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

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Agregar Item</DialogTitle>
						<DialogDescription>
							Agrega un nuevo item al checklist del evento
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
											<Input placeholder="Ej: Confirmar catering" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Categoría (opcional)</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value ?? ""}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar categoría" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{categories.map((cat) => (
													<SelectItem key={cat.value} value={cat.value}>
														{cat.label}
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
