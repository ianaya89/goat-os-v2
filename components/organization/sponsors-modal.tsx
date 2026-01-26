"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
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
	EventSponsorTier,
	EventSponsorTiers,
	SponsorStatus,
	SponsorStatuses,
} from "@/lib/db/schema/enums";
import {
	createSponsorOrgSchema,
	updateSponsorOrgSchema,
} from "@/schemas/organization-sponsor-schemas";
import { trpc } from "@/trpc/client";

const tierLabels: Record<string, string> = {
	platinum: "Platino",
	gold: "Oro",
	silver: "Plata",
	bronze: "Bronce",
	partner: "Partner",
	supporter: "Supporter",
};

const statusLabels: Record<string, string> = {
	active: "Activo",
	inactive: "Inactivo",
	pending: "Pendiente",
};

export type SponsorsModalProps = NiceModalHocProps & {
	sponsor?: {
		id: string;
		name: string;
		description?: string | null;
		logoUrl?: string | null;
		websiteUrl?: string | null;
		contactName?: string | null;
		contactEmail?: string | null;
		contactPhone?: string | null;
		tier: EventSponsorTier;
		contractStartDate?: Date | null;
		contractEndDate?: Date | null;
		contractValue?: number | null;
		currency: string;
		contractNotes?: string | null;
		status: SponsorStatus;
		notes?: string | null;
		isActive: boolean;
	};
};

export const SponsorsModal = NiceModal.create<SponsorsModalProps>(
	({ sponsor }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!sponsor;

		const createSponsorMutation = trpc.organization.sponsor.create.useMutation({
			onSuccess: () => {
				toast.success("Sponsor creado exitosamente");
				utils.organization.sponsor.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al crear el sponsor");
			},
		});

		const updateSponsorMutation = trpc.organization.sponsor.update.useMutation({
			onSuccess: () => {
				toast.success("Sponsor actualizado exitosamente");
				utils.organization.sponsor.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar el sponsor");
			},
		});

		const form = useZodForm({
			schema: isEditing ? updateSponsorOrgSchema : createSponsorOrgSchema,
			defaultValues: isEditing
				? {
						id: sponsor.id,
						name: sponsor.name,
						description: sponsor.description ?? "",
						logoUrl: sponsor.logoUrl ?? "",
						websiteUrl: sponsor.websiteUrl ?? "",
						contactName: sponsor.contactName ?? "",
						contactEmail: sponsor.contactEmail ?? "",
						contactPhone: sponsor.contactPhone ?? "",
						tier: sponsor.tier,
						contractStartDate: sponsor.contractStartDate ?? undefined,
						contractEndDate: sponsor.contractEndDate ?? undefined,
						contractValue: sponsor.contractValue ?? undefined,
						currency: sponsor.currency,
						contractNotes: sponsor.contractNotes ?? "",
						status: sponsor.status,
						notes: sponsor.notes ?? "",
						isActive: sponsor.isActive,
					}
				: {
						name: "",
						description: "",
						contactName: "",
						contactEmail: "",
						contactPhone: "",
						tier: EventSponsorTier.partner,
						status: SponsorStatus.pending,
						currency: "ARS",
					},
		});

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing) {
				updateSponsorMutation.mutate(
					data as Parameters<typeof updateSponsorMutation.mutate>[0],
				);
			} else {
				createSponsorMutation.mutate(
					data as Parameters<typeof createSponsorMutation.mutate>[0],
				);
			}
		});

		const isPending =
			createSponsorMutation.isPending || updateSponsorMutation.isPending;

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
							{isEditing ? "Editar Sponsor" : "Agregar Sponsor"}
						</SheetTitle>
						<SheetDescription className="sr-only">
							{isEditing
								? "Actualiza la informacion del sponsor."
								: "Completa los detalles del nuevo sponsor."}
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
													<FormLabel>Nombre *</FormLabel>
													<FormControl>
														<Input
															placeholder="ej. Nike Argentina"
															autoComplete="off"
															{...field}
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
											name="tier"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Nivel</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Seleccionar nivel" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{EventSponsorTiers.map((tier) => (
																	<SelectItem key={tier} value={tier}>
																		{tierLabels[tier] ?? tier}
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
																	<SelectValue placeholder="Seleccionar estado" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{SponsorStatuses.map((status) => (
																	<SelectItem key={status} value={status}>
																		{statusLabels[status] ?? status}
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
										name="contactName"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Nombre de Contacto</FormLabel>
													<FormControl>
														<Input
															placeholder="ej. Juan Perez"
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
											name="contactEmail"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Email</FormLabel>
														<FormControl>
															<Input
																type="email"
																placeholder="contacto@sponsor.com"
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
											name="contactPhone"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Telefono</FormLabel>
														<FormControl>
															<Input
																placeholder="+54 11 1234-5678"
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

									<div className="border-t pt-4">
										<h4 className="text-sm font-medium mb-3">
											Informacion del Contrato
										</h4>

										<div className="space-y-4">
											<div className="grid grid-cols-2 gap-4">
												<FormField
													control={form.control}
													name="contractStartDate"
													render={({ field }) => (
														<FormItem asChild>
															<Field>
																<FormLabel>Fecha Inicio</FormLabel>
																<FormControl>
																	<Input
																		type="date"
																		{...field}
																		value={
																			field.value instanceof Date
																				? field.value
																						.toISOString()
																						.split("T")[0]
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

												<FormField
													control={form.control}
													name="contractEndDate"
													render={({ field }) => (
														<FormItem asChild>
															<Field>
																<FormLabel>Fecha Fin</FormLabel>
																<FormControl>
																	<Input
																		type="date"
																		{...field}
																		value={
																			field.value instanceof Date
																				? field.value
																						.toISOString()
																						.split("T")[0]
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
												name="contractValue"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Valor del Contrato</FormLabel>
															<FormControl>
																<Input
																	type="number"
																	placeholder="0"
																	{...field}
																	value={field.value ?? ""}
																	onChange={(e) =>
																		field.onChange(
																			e.target.value
																				? parseInt(e.target.value, 10)
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
												name="contractNotes"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Notas del Contrato</FormLabel>
															<FormControl>
																<Textarea
																	placeholder="Detalles del contrato, prestaciones acordadas..."
																	className="resize-none"
																	rows={3}
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
									</div>

									<FormField
										control={form.control}
										name="description"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Descripcion</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Descripcion del sponsor..."
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
									{isEditing ? "Actualizar" : "Crear"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
