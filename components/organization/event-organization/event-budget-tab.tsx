"use client";

import {
	Loader2,
	MoreHorizontal,
	Plus,
	Trash2,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
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
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { createBudgetLineSchema } from "@/schemas/organization-event-organization-schemas";
import { trpc } from "@/trpc/client";

interface EventBudgetTabProps {
	eventId: string;
}

const budgetStatuses = [
	{
		value: "planned",
		label: "Planificado",
		color: "bg-blue-100 text-blue-700",
	},
	{
		value: "approved",
		label: "Aprobado",
		color: "bg-green-100 text-green-700",
	},
	{ value: "spent", label: "Gastado", color: "bg-orange-100 text-orange-700" },
	{ value: "cancelled", label: "Cancelado", color: "bg-red-100 text-red-700" },
];

export function EventBudgetTab({
	eventId,
}: EventBudgetTabProps): React.JSX.Element {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);

	const utils = trpc.useUtils();

	const { data, isPending } =
		trpc.organization.eventOrganization.listBudgetLines.useQuery({ eventId });

	const { data: categories } =
		trpc.organization.expense.listCategories.useQuery({});

	const createMutation =
		trpc.organization.eventOrganization.createBudgetLine.useMutation({
			onSuccess: () => {
				toast.success("Línea de presupuesto agregada");
				utils.organization.eventOrganization.listBudgetLines.invalidate();
				utils.organization.eventOrganization.getProjection.invalidate();
				setIsDialogOpen(false);
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message || "Error al crear línea de presupuesto");
			},
		});

	const deleteMutation =
		trpc.organization.eventOrganization.deleteBudgetLine.useMutation({
			onSuccess: () => {
				toast.success("Línea eliminada");
				utils.organization.eventOrganization.listBudgetLines.invalidate();
				utils.organization.eventOrganization.getProjection.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar línea");
			},
		});

	const form = useZodForm({
		schema: createBudgetLineSchema,
		defaultValues: {
			eventId,
			name: "",
			description: "",
			categoryId: undefined,
			plannedAmount: 0,
			actualAmount: 0,
			status: "planned",
			notes: "",
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		createMutation.mutate(data);
	});

	const getStatusBadge = (status: string) => {
		const s = budgetStatuses.find((s) => s.value === status);
		return s ? (
			<Badge variant="outline" className={cn("text-xs", s.color)}>
				{s.label}
			</Badge>
		) : null;
	};

	const totals = React.useMemo(() => {
		if (!data) return { planned: 0, actual: 0, variance: 0 };
		const planned = data.reduce(
			(sum, line) => sum + (line.plannedAmount ?? 0),
			0,
		);
		const actual = data.reduce(
			(sum, line) => sum + (line.actualAmount ?? 0),
			0,
		);
		return {
			planned,
			actual,
			variance: planned - actual,
		};
	}, [data]);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
		}).format(amount);
	};

	const executionPercentage =
		totals.planned > 0 ? (totals.actual / totals.planned) * 100 : 0;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Presupuesto</CardTitle>
						<CardDescription>
							Control de gastos planificados y reales
						</CardDescription>
					</div>
					<Button onClick={() => setIsDialogOpen(true)}>
						<Plus className="size-4 mr-1" />
						Nueva Línea
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="border rounded-lg p-4">
						<p className="text-sm text-muted-foreground">Planificado</p>
						<p className="text-2xl font-bold">
							{formatCurrency(totals.planned)}
						</p>
					</div>
					<div className="border rounded-lg p-4">
						<p className="text-sm text-muted-foreground">Real</p>
						<p className="text-2xl font-bold">
							{formatCurrency(totals.actual)}
						</p>
						<Progress
							value={Math.min(executionPercentage, 100)}
							className="h-2 mt-2"
						/>
						<p className="text-xs text-muted-foreground mt-1">
							{Math.round(executionPercentage)}% ejecutado
						</p>
					</div>
					<div className="border rounded-lg p-4">
						<p className="text-sm text-muted-foreground">Variación</p>
						<div className="flex items-center gap-2">
							<p
								className={cn(
									"text-2xl font-bold",
									totals.variance >= 0 ? "text-green-600" : "text-red-600",
								)}
							>
								{formatCurrency(Math.abs(totals.variance))}
							</p>
							{totals.variance >= 0 ? (
								<TrendingDown className="size-5 text-green-600" />
							) : (
								<TrendingUp className="size-5 text-red-600" />
							)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							{totals.variance >= 0 ? "Por debajo" : "Por encima"} del
							presupuesto
						</p>
					</div>
				</div>

				{/* Budget Lines Table */}
				{isPending ? (
					<Skeleton className="h-64 w-full" />
				) : data?.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						No hay líneas de presupuesto
					</div>
				) : (
					<div className="border rounded-lg">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Descripción</TableHead>
									<TableHead>Categoría</TableHead>
									<TableHead className="text-right">Planificado</TableHead>
									<TableHead className="text-right">Real</TableHead>
									<TableHead className="text-right">Variación</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead className="w-[50px]" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.map((line) => {
									const variance =
										(line.plannedAmount ?? 0) - (line.actualAmount ?? 0);
									return (
										<TableRow key={line.id}>
											<TableCell className="font-medium">
												{line.name}
												{line.description && (
													<p className="text-xs text-muted-foreground">
														{line.description}
													</p>
												)}
											</TableCell>
											<TableCell>{line.category?.name ?? "-"}</TableCell>
											<TableCell className="text-right">
												{formatCurrency(line.plannedAmount ?? 0)}
											</TableCell>
											<TableCell className="text-right">
												{formatCurrency(line.actualAmount ?? 0)}
											</TableCell>
											<TableCell
												className={cn(
													"text-right",
													variance >= 0 ? "text-green-600" : "text-red-600",
												)}
											>
												{variance >= 0 ? "-" : "+"}
												{formatCurrency(Math.abs(variance))}
											</TableCell>
											<TableCell>{getStatusBadge(line.status)}</TableCell>
											<TableCell>
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
														<DropdownMenuItem
															onClick={() =>
																deleteMutation.mutate({ id: line.id })
															}
															variant="destructive"
														>
															<Trash2 className="size-4" />
															Eliminar
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Nueva Línea de Presupuesto</DialogTitle>
						<DialogDescription>
							Agrega una línea al presupuesto del evento
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
											<Input placeholder="Ej: Alquiler de sonido" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="categoryId"
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
												{categories?.map((cat) => (
													<SelectItem key={cat.id} value={cat.id}>
														{cat.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="plannedAmount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Monto Planificado</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={0}
													{...field}
													onChange={(e) =>
														field.onChange(
															Number.parseFloat(e.target.value) || 0,
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
									name="actualAmount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Monto Real (opcional)</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={0}
													{...field}
													value={field.value ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Number.parseFloat(e.target.value)
																: 0,
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

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
												{budgetStatuses.map((status) => (
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

							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notas (opcional)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Notas adicionales..."
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
