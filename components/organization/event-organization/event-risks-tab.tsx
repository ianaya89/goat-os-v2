"use client";

import {
	AlertTriangle,
	Loader2,
	MoreHorizontal,
	Plus,
	Shield,
	Trash2,
	User,
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
import type { EventRiskStatus } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { createRiskSchema } from "@/schemas/organization-event-organization-schemas";
import { trpc } from "@/trpc/client";

interface EventRisksTabProps {
	eventId: string;
}

const riskSeverities = [
	{ value: "low", label: "Baja", color: "bg-green-100 text-green-700" },
	{ value: "medium", label: "Media", color: "bg-yellow-100 text-yellow-700" },
	{ value: "high", label: "Alta", color: "bg-orange-100 text-orange-700" },
	{ value: "critical", label: "Crítica", color: "bg-red-100 text-red-700" },
];

const riskProbabilities = [
	{ value: "unlikely", label: "Improbable", score: 1 },
	{ value: "possible", label: "Posible", score: 2 },
	{ value: "likely", label: "Probable", score: 3 },
	{ value: "almost_certain", label: "Casi Seguro", score: 4 },
];

const riskStatuses = [
	{
		value: "identified",
		label: "Identificado",
		color: "bg-slate-100 text-slate-700",
	},
	{
		value: "mitigating",
		label: "Mitigando",
		color: "bg-blue-100 text-blue-700",
	},
	{
		value: "mitigated",
		label: "Mitigado",
		color: "bg-green-100 text-green-700",
	},
	{ value: "occurred", label: "Ocurrido", color: "bg-red-100 text-red-700" },
	{ value: "closed", label: "Cerrado", color: "bg-gray-100 text-gray-700" },
];

export function EventRisksTab({
	eventId,
}: EventRisksTabProps): React.JSX.Element {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);
	const [filterStatus, setFilterStatus] = React.useState<string | null>(null);

	const utils = trpc.useUtils();

	const { data, isPending } =
		trpc.organization.eventOrganization.listRisks.useQuery({
			eventId,
			status: (filterStatus as EventRiskStatus) ?? undefined,
		});

	const createMutation =
		trpc.organization.eventOrganization.createRisk.useMutation({
			onSuccess: () => {
				toast.success("Riesgo agregado");
				utils.organization.eventOrganization.listRisks.invalidate();
				setIsDialogOpen(false);
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message || "Error al agregar riesgo");
			},
		});

	const updateMutation =
		trpc.organization.eventOrganization.updateRisk.useMutation({
			onSuccess: () => {
				utils.organization.eventOrganization.listRisks.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar riesgo");
			},
		});

	const deleteMutation =
		trpc.organization.eventOrganization.deleteRisk.useMutation({
			onSuccess: () => {
				toast.success("Riesgo eliminado");
				utils.organization.eventOrganization.listRisks.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar riesgo");
			},
		});

	const form = useZodForm({
		schema: createRiskSchema,
		defaultValues: {
			eventId,
			title: "",
			description: "",
			severity: "medium",
			probability: "possible",
			status: "identified",
			mitigationPlan: "",
			contingencyPlan: "",
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		createMutation.mutate(data);
	});

	const getSeverityBadge = (severity: string) => {
		const s = riskSeverities.find((s) => s.value === severity);
		return s ? (
			<Badge variant="outline" className={cn("text-xs", s.color)}>
				{s.label}
			</Badge>
		) : null;
	};

	const getStatusBadge = (status: string) => {
		const s = riskStatuses.find((s) => s.value === status);
		return s ? (
			<Badge variant="outline" className={cn("text-xs", s.color)}>
				{s.label}
			</Badge>
		) : null;
	};

	const getProbabilityLabel = (probability: string) => {
		return (
			riskProbabilities.find((p) => p.value === probability)?.label ??
			probability
		);
	};

	const getRiskScoreColor = (score: number) => {
		if (score <= 4) return "bg-green-500";
		if (score <= 8) return "bg-yellow-500";
		if (score <= 12) return "bg-orange-500";
		return "bg-red-500";
	};

	const highRiskCount = data?.filter((r) => (r.riskScore ?? 0) > 8).length ?? 0;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Gestión de Riesgos</CardTitle>
						<CardDescription>
							{data?.length ?? 0} riesgos identificados
							{highRiskCount > 0 && (
								<span className="text-red-600 ml-2">
									({highRiskCount} de alto riesgo)
								</span>
							)}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Select
							value={filterStatus ?? "all"}
							onValueChange={(v) => setFilterStatus(v === "all" ? null : v)}
						>
							<SelectTrigger className="w-[140px]">
								<SelectValue placeholder="Estado" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								{riskStatuses.map((status) => (
									<SelectItem key={status.value} value={status.value}>
										{status.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button onClick={() => setIsDialogOpen(true)}>
							<Plus className="size-4 mr-1" />
							Agregar Riesgo
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{isPending ? (
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-32 w-full" />
						))}
					</div>
				) : data?.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<Shield className="size-12 mx-auto mb-2 opacity-50" />
						<p>No hay riesgos identificados</p>
					</div>
				) : (
					<div className="space-y-4">
						{data?.map((risk) => (
							<div
								key={risk.id}
								className="border rounded-lg p-4 hover:shadow-md transition-shadow"
							>
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-3">
										<div
											className={cn(
												"size-10 rounded-lg flex items-center justify-center",
												getRiskScoreColor(risk.riskScore ?? 0),
											)}
										>
											<AlertTriangle className="size-5 text-white" />
										</div>
										<div>
											<h3 className="font-medium">{risk.title}</h3>
											{risk.description && (
												<p className="text-sm text-muted-foreground mt-1">
													{risk.description}
												</p>
											)}
											<div className="flex items-center gap-2 mt-2 flex-wrap">
												{getSeverityBadge(risk.severity)}
												{getStatusBadge(risk.status)}
												<Badge variant="outline" className="text-xs">
													{getProbabilityLabel(risk.probability)}
												</Badge>
												<Badge variant="secondary" className="text-xs">
													Score: {risk.riskScore}
												</Badge>
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2">
										{risk.owner && (
											<span className="text-xs text-muted-foreground flex items-center gap-1">
												<User className="size-3" />
												{risk.owner.name}
											</span>
										)}
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="size-8">
													<MoreHorizontal className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												{risk.status === "identified" && (
													<DropdownMenuItem
														onClick={() =>
															updateMutation.mutate({
																id: risk.id,
																status: "mitigating",
															})
														}
													>
														<Shield className="size-4" />
														Iniciar Mitigación
													</DropdownMenuItem>
												)}
												{risk.status === "mitigating" && (
													<DropdownMenuItem
														onClick={() =>
															updateMutation.mutate({
																id: risk.id,
																status: "mitigated",
															})
														}
													>
														<Shield className="size-4" />
														Marcar Mitigado
													</DropdownMenuItem>
												)}
												<DropdownMenuItem
													onClick={() => deleteMutation.mutate({ id: risk.id })}
													variant="destructive"
												>
													<Trash2 className="size-4" />
													Eliminar
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>

								{(risk.mitigationPlan || risk.contingencyPlan) && (
									<div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
										{risk.mitigationPlan && (
											<div>
												<p className="text-xs font-medium text-muted-foreground mb-1">
													Plan de Mitigación
												</p>
												<p className="text-sm">{risk.mitigationPlan}</p>
											</div>
										)}
										{risk.contingencyPlan && (
											<div>
												<p className="text-xs font-medium text-muted-foreground mb-1">
													Plan de Contingencia
												</p>
												<p className="text-sm">{risk.contingencyPlan}</p>
											</div>
										)}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</CardContent>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Agregar Riesgo</DialogTitle>
						<DialogDescription>
							Identifica y documenta un nuevo riesgo para el evento
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
												placeholder="Ej: Condiciones climáticas adversas"
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
												placeholder="Descripción detallada del riesgo..."
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

							<div className="grid grid-cols-3 gap-4">
								<FormField
									control={form.control}
									name="severity"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Severidad</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{riskSeverities.map((s) => (
														<SelectItem key={s.value} value={s.value}>
															{s.label}
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
									name="probability"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Probabilidad</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{riskProbabilities.map((p) => (
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
														<SelectValue placeholder="Seleccionar" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{riskStatuses.map((s) => (
														<SelectItem key={s.value} value={s.value}>
															{s.label}
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
								name="mitigationPlan"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Plan de Mitigación (opcional)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Acciones para reducir la probabilidad o impacto..."
												className="resize-none"
												rows={2}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormDescription>
											Acciones preventivas para evitar o reducir el riesgo
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="contingencyPlan"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Plan de Contingencia (opcional)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Acciones si el riesgo se materializa..."
												className="resize-none"
												rows={2}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormDescription>
											Plan B si el riesgo ocurre
										</FormDescription>
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
