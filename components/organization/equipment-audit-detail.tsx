"use client";

import NiceModal from "@ebay/nice-modal-react";
import {
	AlertCircleIcon,
	CheckCircle2Icon,
	CheckCircleIcon,
	ClipboardCheckIcon,
	MinusCircleIcon,
	PlusCircleIcon,
	XCircleIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { PageTitle } from "@/components/ui/custom/page";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type EquipmentAuditStatus,
	type EquipmentCondition,
	EquipmentConditions,
	type EquipmentCountStatus,
} from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface Props {
	auditId: string;
}

const statusLabels: Record<EquipmentAuditStatus, string> = {
	scheduled: "Programada",
	in_progress: "En Curso",
	completed: "Completada",
	cancelled: "Cancelada",
};

const statusColors: Record<EquipmentAuditStatus, string> = {
	scheduled: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
	in_progress:
		"bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
	completed:
		"bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
	cancelled: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
};

const countStatusLabels: Record<EquipmentCountStatus, string> = {
	pending: "Pendiente",
	counted: "Contado",
	verified: "Verificado",
	adjusted: "Ajustado",
	skipped: "Omitido",
};

const countStatusColors: Record<EquipmentCountStatus, string> = {
	pending: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
	counted: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
	verified:
		"bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
	adjusted: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
	skipped:
		"bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
};

const conditionLabels: Record<EquipmentCondition, string> = {
	new: "Nuevo",
	excellent: "Excelente",
	good: "Bueno",
	fair: "Regular",
	poor: "Malo",
};

export function EquipmentAuditDetail({ auditId }: Props): React.JSX.Element {
	const utils = trpc.useUtils();

	const { data: audit, isLoading: auditLoading } =
		trpc.organization.equipmentAudit.get.useQuery({ id: auditId });

	const { data: summary } =
		trpc.organization.equipmentAudit.getSummary.useQuery({ id: auditId });

	const { data: counts = [], isLoading: countsLoading } =
		trpc.organization.equipmentAudit.listCounts.useQuery({ auditId });

	const recordCountMutation =
		trpc.organization.equipmentAudit.recordCount.useMutation({
			onSuccess: () => {
				toast.success("Conteo registrado");
				utils.organization.equipmentAudit.listCounts.invalidate({ auditId });
				utils.organization.equipmentAudit.getSummary.invalidate({
					id: auditId,
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const skipCountMutation =
		trpc.organization.equipmentAudit.skipCount.useMutation({
			onSuccess: () => {
				toast.success("Item omitido");
				utils.organization.equipmentAudit.listCounts.invalidate({ auditId });
				utils.organization.equipmentAudit.getSummary.invalidate({
					id: auditId,
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const approveAdjustmentMutation =
		trpc.organization.equipmentAudit.approveAdjustment.useMutation({
			onSuccess: () => {
				toast.success("Ajuste aprobado y aplicado al inventario");
				utils.organization.equipmentAudit.listCounts.invalidate({ auditId });
				utils.organization.equipmentAudit.getSummary.invalidate({
					id: auditId,
				});
				utils.organization.equipment.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const completeMutation =
		trpc.organization.equipmentAudit.complete.useMutation({
			onSuccess: () => {
				toast.success("Auditoria completada");
				utils.organization.equipmentAudit.get.invalidate({ id: auditId });
				utils.organization.equipmentAudit.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const [countInputs, setCountInputs] = React.useState<
		Record<string, { quantity: string; condition?: EquipmentCondition }>
	>({});

	const handleCountChange = (id: string, quantity: string) => {
		setCountInputs((prev) => ({
			...prev,
			[id]: { quantity, condition: prev[id]?.condition },
		}));
	};

	const handleConditionChange = (id: string, condition: EquipmentCondition) => {
		setCountInputs((prev) => ({
			...prev,
			[id]: { quantity: prev[id]?.quantity ?? "", condition },
		}));
	};

	const handleRecordCount = (countId: string, expectedQuantity: number) => {
		const input = countInputs[countId];
		const quantity = input?.quantity
			? Number.parseInt(input.quantity, 10)
			: expectedQuantity;

		if (Number.isNaN(quantity) || quantity < 0) {
			toast.error("Cantidad invalida");
			return;
		}

		recordCountMutation.mutate({
			id: countId,
			countedQuantity: quantity,
			observedCondition: input?.condition,
		});
	};

	const handleSkipCount = (countId: string) => {
		skipCountMutation.mutate({ id: countId });
	};

	const handleApproveAdjustment = (countId: string) => {
		NiceModal.show(ConfirmationModal, {
			title: "Aprobar Ajuste",
			description:
				"¿Estas seguro de aplicar este ajuste al inventario? La cantidad del sistema se actualizara al valor contado.",
			confirmText: "Aprobar y Aplicar",
			cancelText: "Cancelar",
			onConfirm: () =>
				approveAdjustmentMutation.mutate({
					id: countId,
					reason: "Ajuste aprobado durante auditoria de inventario",
				}),
		});
	};

	const handleCompleteAudit = () => {
		NiceModal.show(ConfirmationModal, {
			title: "Completar Auditoria",
			description:
				"¿Estas seguro de completar esta auditoria? Asegurate de haber revisado todas las discrepancias.",
			confirmText: "Completar",
			cancelText: "Cancelar",
			onConfirm: () => completeMutation.mutate({ id: auditId }),
		});
	};

	if (auditLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (!audit) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<AlertCircleIcon className="text-muted-foreground mb-4 h-12 w-12" />
				<p className="text-muted-foreground">Auditoria no encontrada</p>
			</div>
		);
	}

	const pendingCounts = counts.filter((c) => c.status === "pending");
	const countedCounts = counts.filter(
		(c) => c.status === "counted" || c.status === "verified",
	);
	const discrepancyCounts = counts.filter(
		(c) =>
			c.discrepancy !== null && c.discrepancy !== 0 && !c.adjustmentApproved,
	);
	const adjustedCounts = counts.filter((c) => c.status === "adjusted");

	return (
		<div className="mx-auto w-full space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<PageTitle>{audit.title || "Auditoria de Inventario"}</PageTitle>
					<div className="mt-1 flex items-center gap-2">
						<Badge className={cn("text-xs", statusColors[audit.status])}>
							{statusLabels[audit.status]}
						</Badge>
						<span className="text-muted-foreground text-sm">
							Programada:{" "}
							{new Date(audit.scheduledDate).toLocaleDateString("es-AR")}
						</span>
						{audit.location && (
							<span className="text-muted-foreground text-sm">
								| Ubicacion: {audit.location.name}
							</span>
						)}
					</div>
				</div>
				{audit.status === "in_progress" && pendingCounts.length === 0 && (
					<Button onClick={handleCompleteAudit}>
						<CheckCircleIcon className="mr-2 h-4 w-4" />
						Completar Auditoria
					</Button>
				)}
			</div>

			{/* Summary Cards */}
			{summary && (
				<div className="grid gap-4 md:grid-cols-4">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Progreso</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-2">
								<span className="text-2xl font-bold">{summary.progress}%</span>
								<Progress value={summary.progress} className="h-2" />
								<span className="text-muted-foreground text-xs">
									{summary.totalItems - summary.byStatus.pending} de{" "}
									{summary.totalItems} items
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Cantidades</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-1">
								<div className="flex justify-between">
									<span className="text-muted-foreground text-sm">
										Esperado:
									</span>
									<span className="font-medium">
										{summary.quantities.expected}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground text-sm">
										Contado:
									</span>
									<span className="font-medium">
										{summary.quantities.counted}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground text-sm">
										Diferencia:
									</span>
									<span
										className={cn(
											"font-medium",
											summary.quantities.difference > 0 && "text-green-600",
											summary.quantities.difference < 0 && "text-red-600",
										)}
									>
										{summary.quantities.difference > 0 && "+"}
										{summary.quantities.difference}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								Discrepancias
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<PlusCircleIcon className="h-4 w-4 text-green-600" />
									<span className="text-sm">
										{summary.discrepancies.positive} sobrantes
									</span>
								</div>
								<div className="flex items-center gap-2">
									<MinusCircleIcon className="h-4 w-4 text-red-600" />
									<span className="text-sm">
										{summary.discrepancies.negative} faltantes
									</span>
								</div>
								<div className="flex items-center gap-2">
									<AlertCircleIcon className="h-4 w-4 text-orange-600" />
									<span className="text-sm">
										{summary.discrepancies.pendingAdjustment} por aprobar
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								Estado Items
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-1 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Pendientes:</span>
									<span>{summary.byStatus.pending}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Contados:</span>
									<span>{summary.byStatus.counted}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Ajustados:</span>
									<span>{summary.byStatus.adjusted}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Omitidos:</span>
									<span>{summary.byStatus.skipped}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Counts Table with Tabs */}
			<Tabs defaultValue="pending" className="w-full">
				<TabsList>
					<TabsTrigger value="pending">
						Pendientes ({pendingCounts.length})
					</TabsTrigger>
					<TabsTrigger value="counted">
						Contados ({countedCounts.length})
					</TabsTrigger>
					<TabsTrigger value="discrepancies">
						Discrepancias ({discrepancyCounts.length})
					</TabsTrigger>
					<TabsTrigger value="adjusted">
						Ajustados ({adjustedCounts.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="pending" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Items Pendientes de Contar</CardTitle>
							<CardDescription>
								Ingresa la cantidad contada fisicamente para cada item
							</CardDescription>
						</CardHeader>
						<CardContent>
							{countsLoading ? (
								<Skeleton className="h-48 w-full" />
							) : pendingCounts.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-8">
									<CheckCircle2Icon className="text-muted-foreground mb-2 h-8 w-8" />
									<p className="text-muted-foreground">
										No hay items pendientes
									</p>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Equipo</TableHead>
											<TableHead>Ubicacion</TableHead>
											<TableHead className="text-center">
												Cant. Sistema
											</TableHead>
											<TableHead className="text-center">
												Cant. Contada
											</TableHead>
											<TableHead>Condicion</TableHead>
											<TableHead className="text-right">Acciones</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{pendingCounts.map((count) => (
											<TableRow key={count.id}>
												<TableCell>
													<div className="flex flex-col">
														<span className="font-medium">
															{count.equipment.name}
														</span>
														<span className="text-muted-foreground text-xs">
															{count.equipment.brand} {count.equipment.model}
														</span>
													</div>
												</TableCell>
												<TableCell>
													<span className="text-sm">
														{count.equipment.location?.name || "-"}
													</span>
													{count.equipment.storageLocation && (
														<span className="text-muted-foreground block text-xs">
															{count.equipment.storageLocation}
														</span>
													)}
												</TableCell>
												<TableCell className="text-center">
													<span className="font-medium">
														{count.expectedQuantity}
													</span>
												</TableCell>
												<TableCell className="text-center">
													<Input
														type="number"
														min={0}
														className="mx-auto w-20 text-center"
														placeholder={String(count.expectedQuantity)}
														value={countInputs[count.id]?.quantity ?? ""}
														onChange={(e) =>
															handleCountChange(count.id, e.target.value)
														}
													/>
												</TableCell>
												<TableCell>
													<Select
														value={countInputs[count.id]?.condition ?? ""}
														onValueChange={(value) =>
															handleConditionChange(
																count.id,
																value as EquipmentCondition,
															)
														}
													>
														<SelectTrigger className="w-28">
															<SelectValue placeholder="Igual" />
														</SelectTrigger>
														<SelectContent>
															{EquipmentConditions.map((condition) => (
																<SelectItem key={condition} value={condition}>
																	{conditionLabels[condition]}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														<Button
															size="sm"
															onClick={() =>
																handleRecordCount(
																	count.id,
																	count.expectedQuantity,
																)
															}
															disabled={recordCountMutation.isPending}
														>
															<ClipboardCheckIcon className="mr-1 h-4 w-4" />
															Registrar
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleSkipCount(count.id)}
															disabled={skipCountMutation.isPending}
														>
															<XCircleIcon className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="counted" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Items Contados</CardTitle>
							<CardDescription>
								Items que ya han sido contados en esta auditoria
							</CardDescription>
						</CardHeader>
						<CardContent>
							{countedCounts.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-8">
									<ClipboardCheckIcon className="text-muted-foreground mb-2 h-8 w-8" />
									<p className="text-muted-foreground">
										No hay items contados aun
									</p>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Equipo</TableHead>
											<TableHead className="text-center">Esperado</TableHead>
											<TableHead className="text-center">Contado</TableHead>
											<TableHead className="text-center">Diferencia</TableHead>
											<TableHead>Estado</TableHead>
											<TableHead>Contado por</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{countedCounts.map((count) => (
											<TableRow key={count.id}>
												<TableCell>
													<span className="font-medium">
														{count.equipment.name}
													</span>
												</TableCell>
												<TableCell className="text-center">
													{count.expectedQuantity}
												</TableCell>
												<TableCell className="text-center">
													{count.countedQuantity}
												</TableCell>
												<TableCell className="text-center">
													<span
														className={cn(
															"font-medium",
															count.discrepancy === 0 && "text-green-600",
															count.discrepancy !== 0 &&
																count.discrepancy! > 0 &&
																"text-blue-600",
															count.discrepancy !== 0 &&
																count.discrepancy! < 0 &&
																"text-red-600",
														)}
													>
														{count.discrepancy === 0
															? "OK"
															: `${count.discrepancy! > 0 ? "+" : ""}${count.discrepancy}`}
													</span>
												</TableCell>
												<TableCell>
													<Badge
														className={cn(
															"text-xs",
															countStatusColors[count.status],
														)}
													>
														{countStatusLabels[count.status]}
													</Badge>
												</TableCell>
												<TableCell>
													<span className="text-muted-foreground text-sm">
														{count.countedByUser?.name || "-"}
													</span>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="discrepancies" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Discrepancias Pendientes</CardTitle>
							<CardDescription>
								Items con diferencias entre el sistema y el conteo fisico que
								requieren aprobacion
							</CardDescription>
						</CardHeader>
						<CardContent>
							{discrepancyCounts.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-8">
									<CheckCircle2Icon className="mb-2 h-8 w-8 text-green-600" />
									<p className="text-muted-foreground">
										No hay discrepancias pendientes
									</p>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Equipo</TableHead>
											<TableHead className="text-center">Esperado</TableHead>
											<TableHead className="text-center">Contado</TableHead>
											<TableHead className="text-center">Diferencia</TableHead>
											<TableHead>Condicion Observada</TableHead>
											<TableHead className="text-right">Acciones</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{discrepancyCounts.map((count) => (
											<TableRow key={count.id}>
												<TableCell>
													<div className="flex flex-col">
														<span className="font-medium">
															{count.equipment.name}
														</span>
														<span className="text-muted-foreground text-xs">
															Condicion actual:{" "}
															{conditionLabels[count.equipment.condition]}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-center">
													{count.expectedQuantity}
												</TableCell>
												<TableCell className="text-center">
													{count.countedQuantity}
												</TableCell>
												<TableCell className="text-center">
													<span
														className={cn(
															"font-bold",
															count.discrepancy! > 0
																? "text-blue-600"
																: "text-red-600",
														)}
													>
														{count.discrepancy! > 0 ? "+" : ""}
														{count.discrepancy}
													</span>
												</TableCell>
												<TableCell>
													{count.observedCondition ? (
														<Badge variant="outline">
															{conditionLabels[count.observedCondition]}
														</Badge>
													) : (
														<span className="text-muted-foreground">-</span>
													)}
												</TableCell>
												<TableCell className="text-right">
													<Button
														size="sm"
														onClick={() => handleApproveAdjustment(count.id)}
														disabled={approveAdjustmentMutation.isPending}
													>
														<CheckCircleIcon className="mr-1 h-4 w-4" />
														Aprobar Ajuste
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="adjusted" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Items Ajustados</CardTitle>
							<CardDescription>
								Items cuya cantidad en el sistema fue actualizada
							</CardDescription>
						</CardHeader>
						<CardContent>
							{adjustedCounts.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-8">
									<ClipboardCheckIcon className="text-muted-foreground mb-2 h-8 w-8" />
									<p className="text-muted-foreground">
										No hay items ajustados aun
									</p>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Equipo</TableHead>
											<TableHead className="text-center">
												Cant. Anterior
											</TableHead>
											<TableHead className="text-center">Cant. Nueva</TableHead>
											<TableHead className="text-center">Ajuste</TableHead>
											<TableHead>Razon</TableHead>
											<TableHead>Ajustado por</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{adjustedCounts.map((count) => (
											<TableRow key={count.id}>
												<TableCell>
													<span className="font-medium">
														{count.equipment.name}
													</span>
												</TableCell>
												<TableCell className="text-center">
													{count.expectedQuantity}
												</TableCell>
												<TableCell className="text-center">
													{count.countedQuantity}
												</TableCell>
												<TableCell className="text-center">
													<span
														className={cn(
															"font-medium",
															count.discrepancy! > 0
																? "text-green-600"
																: "text-red-600",
														)}
													>
														{count.discrepancy! > 0 ? "+" : ""}
														{count.discrepancy}
													</span>
												</TableCell>
												<TableCell>
													<span className="text-muted-foreground text-sm">
														{count.adjustmentReason || "-"}
													</span>
												</TableCell>
												<TableCell>
													<span className="text-muted-foreground text-sm">
														{count.adjustedByUser?.name || "-"}
													</span>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
