"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	type EquipmentAuditStatus,
	type EquipmentAuditType,
	EquipmentAuditTypes,
	TrainingEquipmentCategories,
	type TrainingEquipmentCategory,
} from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import {
	createAuditSchema,
	updateAuditSchema,
} from "@/schemas/organization-equipment-audit-schemas";
import { trpc } from "@/trpc/client";

const typeLabels: Record<EquipmentAuditType, string> = {
	full: "Completo",
	partial: "Parcial",
	spot: "Puntual",
};

const typeDescriptions: Record<EquipmentAuditType, string> = {
	full: "Auditar todo el equipamiento activo",
	partial: "Auditar por categoria o ubicacion",
	spot: "Auditar items especificos",
};

const categoryLabels: Record<TrainingEquipmentCategory, string> = {
	balls: "Pelotas",
	cones: "Conos",
	goals: "Arcos",
	nets: "Redes",
	hurdles: "Vallas",
	ladders: "Escaleras",
	markers: "Marcadores",
	bibs: "Pecheras",
	poles: "Postes",
	mats: "Colchonetas",
	weights: "Pesas",
	bands: "Bandas",
	medical: "Medico",
	electronics: "Electronica",
	storage: "Almacenamiento",
	other: "Otro",
};

export type EquipmentInventoryAuditModalProps = NiceModalHocProps & {
	audit?: {
		id: string;
		title: string | null;
		scheduledDate: Date;
		auditType: EquipmentAuditType;
		categoryFilter: TrainingEquipmentCategory | null;
		locationId: string | null;
		notes: string | null;
		status: EquipmentAuditStatus;
	};
};

export const EquipmentInventoryAuditModal =
	NiceModal.create<EquipmentInventoryAuditModalProps>(({ audit }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!audit;

		// Fetch locations for dropdown
		const { data: locationsData } = trpc.organization.location.list.useQuery(
			{},
		);
		const locations = locationsData?.locations ?? [];

		const createAuditMutation =
			trpc.organization.equipmentAudit.create.useMutation({
				onSuccess: () => {
					toast.success("Auditoria programada exitosamente");
					utils.organization.equipmentAudit.list.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Error al crear la auditoria");
				},
			});

		const updateAuditMutation =
			trpc.organization.equipmentAudit.update.useMutation({
				onSuccess: () => {
					toast.success("Auditoria actualizada exitosamente");
					utils.organization.equipmentAudit.list.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Error al actualizar la auditoria");
				},
			});

		const form = useZodForm({
			schema: isEditing ? updateAuditSchema : createAuditSchema,
			defaultValues: isEditing
				? {
						id: audit.id,
						title: audit.title ?? undefined,
						scheduledDate: new Date(audit.scheduledDate),
						auditType: audit.auditType,
						categoryFilter: audit.categoryFilter ?? undefined,
						locationId: audit.locationId ?? undefined,
						notes: audit.notes ?? undefined,
					}
				: {
						title: "",
						scheduledDate: new Date(),
						auditType: "full" as EquipmentAuditType,
						notes: "",
					},
		});

		const auditType = form.watch("auditType");

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing) {
				updateAuditMutation.mutate(
					data as {
						id: string;
						scheduledDate?: Date;
						title?: string;
						auditType?: EquipmentAuditType;
						categoryFilter?: TrainingEquipmentCategory | null;
						locationId?: string | null;
						notes?: string;
					},
				);
			} else {
				createAuditMutation.mutate(
					data as {
						scheduledDate: Date;
						title?: string;
						auditType?: EquipmentAuditType;
						categoryFilter?: TrainingEquipmentCategory;
						locationId?: string;
						notes?: string;
					},
				);
			}
		});

		const isPending =
			createAuditMutation.isPending || updateAuditMutation.isPending;

		return (
			<Sheet open={modal.visible} onOpenChange={modal.handleOpenChange}>
				<SheetContent className="flex h-full w-full flex-col p-0 sm:max-w-lg">
					<SheetHeader className="space-y-1 border-b px-6 py-4">
						<SheetTitle>
							{isEditing ? "Editar Auditoria" : "Nueva Auditoria de Inventario"}
						</SheetTitle>
						<SheetDescription>
							{isEditing
								? "Actualiza los datos de la auditoria"
								: "Programa una nueva auditoria de inventario"}
						</SheetDescription>
					</SheetHeader>

					<ScrollArea className="flex-1 px-6">
						<Form {...form}>
							<form
								onSubmit={onSubmit}
								className="space-y-4 py-4"
								id="audit-form"
							>
								<FormField
									control={form.control}
									name="title"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Titulo (opcional)</FormLabel>
											<FormControl>
												<Input
													placeholder="Ej: Auditoria mensual enero"
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
									name="scheduledDate"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>Fecha Programada</FormLabel>
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
																format(field.value, "PPP")
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
														selected={field.value}
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
									name="auditType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tipo de Auditoria</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar tipo" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{EquipmentAuditTypes.map((type) => (
														<SelectItem key={type} value={type}>
															<div className="flex flex-col">
																<span>{typeLabels[type]}</span>
																<span className="text-muted-foreground text-xs">
																	{typeDescriptions[type]}
																</span>
															</div>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								{auditType === "partial" && (
									<>
										<FormField
											control={form.control}
											name="categoryFilter"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Filtrar por Categoria</FormLabel>
													<Select
														onValueChange={(value) => {
															field.onChange(
																value === "__all__" ? undefined : value,
															);
														}}
														value={field.value ?? "__all__"}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Todas las categorias" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="__all__">
																Todas las categorias
															</SelectItem>
															{TrainingEquipmentCategories.map((category) => (
																<SelectItem key={category} value={category}>
																	{categoryLabels[category]}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormDescription>
														Opcional: Filtra la auditoria a una categoria
														especifica
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="locationId"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Filtrar por Ubicacion</FormLabel>
													<Select
														onValueChange={(value) => {
															field.onChange(
																value === "__all__" ? undefined : value,
															);
														}}
														value={field.value ?? "__all__"}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Todas las ubicaciones" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="__all__">
																Todas las ubicaciones
															</SelectItem>
															{locations.map((location) => (
																<SelectItem
																	key={location.id}
																	value={location.id}
																>
																	{location.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormDescription>
														Opcional: Filtra la auditoria a una ubicacion
														especifica
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									</>
								)}

								<FormField
									control={form.control}
									name="notes"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Notas</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Notas adicionales sobre esta auditoria..."
													className="resize-none"
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</form>
						</Form>
					</ScrollArea>

					<SheetFooter className="border-t px-6 py-4">
						<Button
							type="button"
							variant="outline"
							onClick={modal.handleClose}
							disabled={isPending}
						>
							Cancelar
						</Button>
						<Button type="submit" form="audit-form" disabled={isPending}>
							{isPending
								? "Guardando..."
								: isEditing
									? "Actualizar"
									: "Programar Auditoria"}
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		);
	});
