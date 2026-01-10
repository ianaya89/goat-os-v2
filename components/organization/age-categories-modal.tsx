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
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	createAgeCategorySchema,
	updateAgeCategorySchema,
} from "@/schemas/organization-sports-event-schemas";
import { trpc } from "@/trpc/client";

export type AgeCategoriesModalProps = NiceModalHocProps & {
	ageCategory?: {
		id: string;
		name: string;
		displayName: string;
		minAge: number | null;
		maxAge: number | null;
		sortOrder: number;
		isActive: boolean;
	};
};

export const AgeCategoriesModal = NiceModal.create<AgeCategoriesModalProps>(
	({ ageCategory }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!ageCategory;

		const createAgeCategoryMutation =
			trpc.organization.sportsEvent.createAgeCategory.useMutation({
				onSuccess: () => {
					toast.success("Categoría de edad creada");
					utils.organization.sportsEvent.listAgeCategories.invalidate();
					modal.handleClose();
				},
				onError: (error: { message?: string }) => {
					toast.error(error.message || "Error al crear la categoría");
				},
			});

		const updateAgeCategoryMutation =
			trpc.organization.sportsEvent.updateAgeCategory.useMutation({
				onSuccess: () => {
					toast.success("Categoría de edad actualizada");
					utils.organization.sportsEvent.listAgeCategories.invalidate();
					modal.handleClose();
				},
				onError: (error: { message?: string }) => {
					toast.error(error.message || "Error al actualizar la categoría");
				},
			});

		const form = useZodForm({
			schema: isEditing ? updateAgeCategorySchema : createAgeCategorySchema,
			defaultValues: isEditing
				? {
						id: ageCategory.id,
						name: ageCategory.name,
						displayName: ageCategory.displayName,
						minAge: ageCategory.minAge ?? undefined,
						maxAge: ageCategory.maxAge ?? undefined,
						sortOrder: ageCategory.sortOrder,
						isActive: ageCategory.isActive,
					}
				: {
						name: "",
						displayName: "",
						minAge: undefined,
						maxAge: undefined,
						sortOrder: 0,
						isActive: true,
					},
		});

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing) {
				updateAgeCategoryMutation.mutate(
					data as Parameters<typeof updateAgeCategoryMutation.mutate>[0],
				);
			} else {
				createAgeCategoryMutation.mutate(
					data as Parameters<typeof createAgeCategoryMutation.mutate>[0],
				);
			}
		});

		const isPending =
			createAgeCategoryMutation.isPending ||
			updateAgeCategoryMutation.isPending;

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
							{isEditing ? "Editar Categoría" : "Nueva Categoría de Edad"}
						</SheetTitle>
						<SheetDescription className="sr-only">
							{isEditing
								? "Actualiza los datos de la categoría de edad."
								: "Completa los datos para crear una nueva categoría de edad."}
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
										name="displayName"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Nombre para mostrar</FormLabel>
													<FormControl>
														<Input
															placeholder="Ej: Sub-12"
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
										name="name"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Código interno</FormLabel>
													<FormControl>
														<Input
															placeholder="Ej: sub-12"
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
											name="minAge"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Edad mínima</FormLabel>
														<FormControl>
															<Input
																type="number"
																placeholder="0"
																min={0}
																max={100}
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
											name="maxAge"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Edad máxima</FormLabel>
														<FormControl>
															<Input
																type="number"
																placeholder="99"
																min={0}
																max={100}
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
									</div>

									<FormField
										control={form.control}
										name="sortOrder"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Orden de visualización</FormLabel>
													<FormControl>
														<Input
															type="number"
															placeholder="0"
															{...field}
															onChange={(e) =>
																field.onChange(Number(e.target.value) || 0)
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
										name="isActive"
										render={({ field }) => (
											<FormItem>
												<div className="flex items-center justify-between rounded-lg border p-4">
													<div className="space-y-0.5">
														<FormLabel className="text-base">Activo</FormLabel>
														<p className="text-muted-foreground text-sm">
															Las categorías inactivas no se mostrarán en nuevos
															eventos
														</p>
													</div>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
												</div>
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
									{isEditing ? "Actualizar" : "Crear Categoría"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
