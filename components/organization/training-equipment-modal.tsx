"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
	type EquipmentCondition,
	EquipmentConditions,
	TrainingEquipmentCategories,
	type TrainingEquipmentCategory,
	type TrainingEquipmentStatus,
	TrainingEquipmentStatuses,
} from "@/lib/db/schema/enums";
import {
	createEquipmentSchema,
	updateEquipmentSchema,
} from "@/schemas/organization-equipment-schemas";
import { trpc } from "@/trpc/client";

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

const statusLabels: Record<TrainingEquipmentStatus, string> = {
	available: "Disponible",
	in_use: "En Uso",
	maintenance: "En Mantenimiento",
	damaged: "Danado",
	retired: "Retirado",
};

const conditionLabels: Record<EquipmentCondition, string> = {
	new: "Nuevo",
	excellent: "Excelente",
	good: "Bueno",
	fair: "Regular",
	poor: "Malo",
};

export type TrainingEquipmentModalProps = NiceModalHocProps & {
	equipment?: {
		id: string;
		name: string;
		description?: string | null;
		brand?: string | null;
		model?: string | null;
		serialNumber?: string | null;
		category: TrainingEquipmentCategory;
		totalQuantity: number;
		availableQuantity: number;
		status: TrainingEquipmentStatus;
		condition: EquipmentCondition;
		purchasePrice?: number | null;
		purchaseDate?: Date | null;
		currency: string;
		locationId?: string | null;
		storageLocation?: string | null;
		lastMaintenanceDate?: Date | null;
		nextMaintenanceDate?: Date | null;
		imageUrl?: string | null;
		notes?: string | null;
	};
};

export const TrainingEquipmentModal =
	NiceModal.create<TrainingEquipmentModalProps>(({ equipment }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!equipment;

		// Fetch locations for dropdown
		const { data: locationsData } = trpc.organization.location.list.useQuery(
			{},
		);
		const locations = locationsData?.locations ?? [];

		const createEquipmentMutation =
			trpc.organization.equipment.create.useMutation({
				onSuccess: () => {
					toast.success("Equipamiento creado exitosamente");
					utils.organization.equipment.list.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Error al crear el equipamiento");
				},
			});

		const updateEquipmentMutation =
			trpc.organization.equipment.update.useMutation({
				onSuccess: () => {
					toast.success("Equipamiento actualizado exitosamente");
					utils.organization.equipment.list.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Error al actualizar el equipamiento");
				},
			});

		const form = useZodForm({
			schema: isEditing ? updateEquipmentSchema : createEquipmentSchema,
			defaultValues: isEditing
				? {
						id: equipment.id,
						name: equipment.name,
						description: equipment.description ?? "",
						brand: equipment.brand ?? "",
						model: equipment.model ?? "",
						serialNumber: equipment.serialNumber ?? "",
						category: equipment.category,
						totalQuantity: equipment.totalQuantity,
						availableQuantity: equipment.availableQuantity,
						status: equipment.status,
						condition: equipment.condition,
						purchasePrice: equipment.purchasePrice ?? undefined,
						purchaseDate: equipment.purchaseDate ?? undefined,
						currency: equipment.currency,
						locationId: equipment.locationId ?? undefined,
						storageLocation: equipment.storageLocation ?? "",
						lastMaintenanceDate: equipment.lastMaintenanceDate ?? undefined,
						nextMaintenanceDate: equipment.nextMaintenanceDate ?? undefined,
						imageUrl: equipment.imageUrl ?? "",
						notes: equipment.notes ?? "",
					}
				: {
						name: "",
						description: "",
						brand: "",
						model: "",
						serialNumber: "",
						category: "other" as TrainingEquipmentCategory,
						totalQuantity: 1,
						status: "available" as TrainingEquipmentStatus,
						condition: "good" as EquipmentCondition,
						currency: "ARS",
						storageLocation: "",
						imageUrl: "",
						notes: "",
					},
		});

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing) {
				updateEquipmentMutation.mutate(
					data as Parameters<typeof updateEquipmentMutation.mutate>[0],
				);
			} else {
				createEquipmentMutation.mutate(
					data as Parameters<typeof createEquipmentMutation.mutate>[0],
				);
			}
		});

		const isPending =
			createEquipmentMutation.isPending || updateEquipmentMutation.isPending;

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<SheetContent
					className="sm:max-w-lg"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
				>
					<SheetHeader>
						<SheetTitle>
							{isEditing ? "Editar Equipamiento" : "Crear Equipamiento"}
						</SheetTitle>
						<SheetDescription className="sr-only">
							{isEditing
								? "Actualiza la informacion del equipamiento."
								: "Completa los detalles para crear un nuevo equipamiento."}
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form
							onSubmit={onSubmit}
							className="flex flex-1 flex-col overflow-hidden"
						>
							<ScrollArea className="flex-1">
								<div className="space-y-4 px-6 py-4">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Nombre</FormLabel>
													<FormControl>
														<Input
															placeholder="ej. Pelotas Nike Flight"
															autoComplete="off"
															{...field}
															value={field.value ?? ""}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="description"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Descripcion</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Descripcion del equipamiento..."
															className="resize-none"
															rows={2}
															{...field}
															value={field.value ?? ""}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="brand"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Marca</FormLabel>
														<FormControl>
															<Input
																placeholder="Nike, Adidas..."
																autoComplete="off"
																{...field}
																value={field.value ?? ""}
															/>
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="model"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Modelo</FormLabel>
														<FormControl>
															<Input
																placeholder="Flight 2024..."
																autoComplete="off"
																{...field}
																value={field.value ?? ""}
															/>
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="category"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Categoria</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Seleccionar" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{TrainingEquipmentCategories.map((cat) => (
																	<SelectItem key={cat} value={cat}>
																		{categoryLabels[cat]}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="totalQuantity"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Cantidad Total</FormLabel>
														<FormControl>
															<Input
																type="number"
																placeholder="1"
																min={1}
																{...field}
																onChange={(e) =>
																	field.onChange(Number(e.target.value))
																}
															/>
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="status"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Estado</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Seleccionar" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{TrainingEquipmentStatuses.map((status) => (
																	<SelectItem key={status} value={status}>
																		{statusLabels[status]}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="condition"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Condicion</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Seleccionar" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{EquipmentConditions.map((cond) => (
																	<SelectItem key={cond} value={cond}>
																		{conditionLabels[cond]}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control}
										name="locationId"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Ubicacion</FormLabel>
													<Select
														onValueChange={(value) =>
															field.onChange(
																value === "none" ? undefined : value,
															)
														}
														value={field.value ?? "none"}
													>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Seleccionar ubicacion" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="none">
																Sin ubicacion
															</SelectItem>
															{locations.map((loc) => (
																<SelectItem key={loc.id} value={loc.id}>
																	{loc.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="storageLocation"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Lugar de Almacenamiento</FormLabel>
													<FormControl>
														<Input
															placeholder="ej. Deposito A, Estante 3"
															autoComplete="off"
															{...field}
															value={field.value ?? ""}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="purchasePrice"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Precio de Compra (centavos)</FormLabel>
														<FormControl>
															<Input
																type="number"
																placeholder="50000"
																{...field}
																value={field.value ?? ""}
																onChange={(e) =>
																	field.onChange(
																		e.target.value
																			? Number(e.target.value)
																			: undefined,
																	)
																}
															/>
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="purchaseDate"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Fecha de Compra</FormLabel>
														<FormControl>
															<Input
																type="date"
																{...field}
																value={
																	field.value
																		? format(
																				new Date(
																					field.value as string | number | Date,
																				),
																				"yyyy-MM-dd",
																			)
																		: ""
																}
																onChange={(e) =>
																	field.onChange(
																		e.target.value
																			? new Date(e.target.value)
																			: undefined,
																	)
																}
															/>
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control}
										name="serialNumber"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Numero de Serie</FormLabel>
													<FormControl>
														<Input
															placeholder="SN-12345678"
															autoComplete="off"
															{...field}
															value={field.value ?? ""}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="notes"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Notas</FormLabel>
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
												</Field>
											</FormItem>
										)}
									/>
								</div>
							</ScrollArea>

							<SheetFooter className="flex-row justify-end gap-2 border-t">
								<Button
									type="button"
									variant="outline"
									onClick={modal.handleClose}
									disabled={isPending}
								>
									Cancelar
								</Button>
								<Button type="submit" disabled={isPending} loading={isPending}>
									{isEditing ? "Actualizar Equipamiento" : "Crear Equipamiento"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	});
