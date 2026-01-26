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
	createVendorSchema,
	updateVendorSchema,
} from "@/schemas/organization-event-organization-schemas";
import { trpc } from "@/trpc/client";

export type VendorsModalProps = NiceModalHocProps & {
	vendor?: {
		id: string;
		name: string;
		description?: string | null;
		contactName?: string | null;
		email?: string | null;
		phone?: string | null;
		address?: string | null;
		city?: string | null;
		websiteUrl?: string | null;
		rating?: number | null;
		taxId?: string | null;
		paymentTerms?: string | null;
		notes?: string | null;
		isActive: boolean;
	};
};

export const VendorsModal = NiceModal.create<VendorsModalProps>(
	({ vendor }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!vendor;

		const createVendorMutation =
			trpc.organization.eventOrganization.createVendor.useMutation({
				onSuccess: () => {
					toast.success("Proveedor creado exitosamente");
					utils.organization.eventOrganization.listVendors.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Error al crear el proveedor");
				},
			});

		const updateVendorMutation =
			trpc.organization.eventOrganization.updateVendor.useMutation({
				onSuccess: () => {
					toast.success("Proveedor actualizado exitosamente");
					utils.organization.eventOrganization.listVendors.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Error al actualizar el proveedor");
				},
			});

		const form = useZodForm({
			schema: isEditing ? updateVendorSchema : createVendorSchema,
			defaultValues: isEditing
				? {
						id: vendor.id,
						name: vendor.name,
						description: vendor.description ?? "",
						contactName: vendor.contactName ?? "",
						email: vendor.email ?? "",
						phone: vendor.phone ?? "",
						address: vendor.address ?? "",
						city: vendor.city ?? "",
						websiteUrl: vendor.websiteUrl ?? "",
						rating: vendor.rating ?? undefined,
						taxId: vendor.taxId ?? "",
						paymentTerms: vendor.paymentTerms ?? "",
						notes: vendor.notes ?? "",
						isActive: vendor.isActive,
					}
				: {
						name: "",
						description: "",
						contactName: "",
						email: "",
						phone: "",
					},
		});

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing) {
				updateVendorMutation.mutate(
					data as Parameters<typeof updateVendorMutation.mutate>[0],
				);
			} else {
				createVendorMutation.mutate(
					data as Parameters<typeof createVendorMutation.mutate>[0],
				);
			}
		});

		const isPending =
			createVendorMutation.isPending || updateVendorMutation.isPending;

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
							{isEditing ? "Editar Proveedor" : "Agregar Proveedor"}
						</SheetTitle>
						<SheetDescription className="sr-only">
							{isEditing
								? "Actualiza la informacion del proveedor."
								: "Completa los detalles del nuevo proveedor."}
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
															placeholder="ej. Catering Express"
															autoComplete="off"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

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

									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Email</FormLabel>
													<FormControl>
														<Input
															type="email"
															placeholder="contacto@proveedor.com"
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
										name="phone"
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

									<FormField
										control={form.control}
										name="rating"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Calificacion (1-5)</FormLabel>
													<Select
														onValueChange={(v) =>
															field.onChange(v ? parseInt(v, 10) : undefined)
														}
														value={field.value?.toString() ?? ""}
													>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Seleccionar calificacion" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{[1, 2, 3, 4, 5].map((n) => (
																<SelectItem key={n} value={n.toString()}>
																	{n} estrella{n > 1 ? "s" : ""}
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
										name="description"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Descripcion</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Descripcion del proveedor..."
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
