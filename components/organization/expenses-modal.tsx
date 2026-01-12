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
	type TrainingPaymentMethod,
	TrainingPaymentMethods,
} from "@/lib/db/schema/enums";
import {
	createExpenseSchema,
	updateExpenseSchema,
} from "@/schemas/organization-expense-schemas";
import { trpc } from "@/trpc/client";

const methodLabels: Record<string, string> = {
	cash: "Efectivo",
	bank_transfer: "Transferencia Bancaria",
	mercado_pago: "Mercado Pago",
	card: "Tarjeta",
	other: "Otro",
};

export type ExpensesModalProps = NiceModalHocProps & {
	expense?: {
		id: string;
		categoryId?: string | null;
		amount: number;
		currency: string;
		description: string;
		expenseDate: Date;
		paymentMethod?: string | null;
		receiptNumber?: string | null;
		vendor?: string | null;
		notes?: string | null;
	};
};

export const ExpensesModal = NiceModal.create<ExpensesModalProps>(
	({ expense }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!expense;

		// Fetch categories for dropdown
		const { data: categoriesData } =
			trpc.organization.expense.listCategories.useQuery({
				includeInactive: false,
			});
		const categories = categoriesData ?? [];

		const createExpenseMutation = trpc.organization.expense.create.useMutation({
			onSuccess: () => {
				toast.success("Gasto creado exitosamente");
				utils.organization.expense.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al crear el gasto");
			},
		});

		const updateExpenseMutation = trpc.organization.expense.update.useMutation({
			onSuccess: () => {
				toast.success("Gasto actualizado exitosamente");
				utils.organization.expense.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar el gasto");
			},
		});

		const form = useZodForm({
			schema: isEditing ? updateExpenseSchema : createExpenseSchema,
			defaultValues: isEditing
				? {
						id: expense.id,
						categoryId: expense.categoryId ?? undefined,
						amount: expense.amount,
						description: expense.description,
						expenseDate: expense.expenseDate,
						paymentMethod:
							(expense.paymentMethod as TrainingPaymentMethod) ?? undefined,
						receiptNumber: expense.receiptNumber ?? "",
						vendor: expense.vendor ?? "",
						notes: expense.notes ?? "",
					}
				: {
						categoryId: undefined,
						amount: 0,
						currency: "ARS",
						description: "",
						expenseDate: new Date(),
						paymentMethod: undefined,
						receiptNumber: "",
						vendor: "",
						notes: "",
					},
		});

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing) {
				updateExpenseMutation.mutate(
					data as Parameters<typeof updateExpenseMutation.mutate>[0],
				);
			} else {
				createExpenseMutation.mutate(
					data as Parameters<typeof createExpenseMutation.mutate>[0],
				);
			}
		});

		const isPending =
			createExpenseMutation.isPending || updateExpenseMutation.isPending;

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
							{isEditing ? "Editar Gasto" : "Crear Gasto"}
						</SheetTitle>
						<SheetDescription className="sr-only">
							{isEditing
								? "Actualiza la informacion del gasto."
								: "Completa los detalles para crear un nuevo gasto."}
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
										name="description"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Descripcion</FormLabel>
													<FormControl>
														<Input
															placeholder="ej. Compra de equipamiento"
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
										name="categoryId"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Categoria</FormLabel>
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
																<SelectValue placeholder="Seleccionar categoria" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="none">
																Sin categoria
															</SelectItem>
															{categories.map((category) => (
																<SelectItem
																	key={category.id}
																	value={category.id}
																>
																	{category.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="amount"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Monto (centavos)</FormLabel>
														<FormControl>
															<Input
																type="number"
																placeholder="10000"
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

										<FormField
											control={form.control}
											name="expenseDate"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Fecha</FormLabel>
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

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="paymentMethod"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Metodo de Pago</FormLabel>
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
																	<SelectValue placeholder="Seleccionar metodo" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="none">
																	No especificado
																</SelectItem>
																{TrainingPaymentMethods.map((method) => (
																	<SelectItem key={method} value={method}>
																		{methodLabels[method] ?? method}
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
											name="vendor"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Proveedor</FormLabel>
														<FormControl>
															<Input
																placeholder="Nombre del proveedor"
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

									<FormField
										control={form.control}
										name="receiptNumber"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Numero de Comprobante</FormLabel>
													<FormControl>
														<Input
															placeholder="Factura/Recibo #"
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
									{isEditing ? "Actualizar Gasto" : "Crear Gasto"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
