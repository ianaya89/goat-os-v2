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
	ExpenseCategoryType,
	ExpenseCategoryTypes,
} from "@/lib/db/schema/enums";
import {
	createExpenseCategorySchema,
	updateExpenseCategorySchema,
} from "@/schemas/organization-expense-schemas";
import { trpc } from "@/trpc/client";

const categoryTypeLabels: Record<string, string> = {
	operational: "Operativo",
	personnel: "Personal",
	other: "Otro",
};

export type ExpenseCategoriesModalProps = NiceModalHocProps & {
	category?: {
		id: string;
		name: string;
		description?: string | null;
		type: string;
		isActive: boolean;
	};
};

export const ExpenseCategoriesModal =
	NiceModal.create<ExpenseCategoriesModalProps>(({ category }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!category;

		const createCategoryMutation =
			trpc.organization.expense.createCategory.useMutation({
				onSuccess: () => {
					toast.success("Categoria creada exitosamente");
					utils.organization.expense.listCategories.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Error al crear la categoria");
				},
			});

		const updateCategoryMutation =
			trpc.organization.expense.updateCategory.useMutation({
				onSuccess: () => {
					toast.success("Categoria actualizada exitosamente");
					utils.organization.expense.listCategories.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Error al actualizar la categoria");
				},
			});

		const form = useZodForm({
			schema: isEditing
				? updateExpenseCategorySchema
				: createExpenseCategorySchema,
			defaultValues: isEditing
				? {
						id: category.id,
						name: category.name,
						description: category.description ?? "",
						type: category.type as ExpenseCategoryType,
						isActive: category.isActive,
					}
				: {
						name: "",
						description: "",
						type: ExpenseCategoryType.operational,
					},
		});

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing) {
				updateCategoryMutation.mutate(
					data as Parameters<typeof updateCategoryMutation.mutate>[0],
				);
			} else {
				createCategoryMutation.mutate(
					data as Parameters<typeof createCategoryMutation.mutate>[0],
				);
			}
		});

		const isPending =
			createCategoryMutation.isPending || updateCategoryMutation.isPending;

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<SheetContent
					className="sm:max-w-md"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
				>
					<SheetHeader>
						<SheetTitle>
							{isEditing ? "Editar Categoria" : "Crear Categoria"}
						</SheetTitle>
						<SheetDescription className="sr-only">
							{isEditing
								? "Actualiza la informacion de la categoria."
								: "Completa los detalles para crear una nueva categoria."}
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
															placeholder="ej. Alquiler"
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
										name="type"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Tipo</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Seleccionar tipo" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{ExpenseCategoryTypes.map((type) => (
																<SelectItem key={type} value={type}>
																	{categoryTypeLabels[type] ?? type}
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
															placeholder="Descripcion de la categoria..."
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
	});
