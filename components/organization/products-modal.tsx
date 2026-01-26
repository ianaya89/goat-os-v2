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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	ProductCategories,
	type ProductCategory,
	type ProductStatus,
	ProductStatuses,
} from "@/lib/db/schema/enums";
import {
	createProductSchema,
	updateProductSchema,
} from "@/schemas/organization-stock-schemas";
import { trpc } from "@/trpc/client";

const categoryLabels: Record<ProductCategory, string> = {
	beverage: "Bebida",
	food: "Comida",
	apparel: "Ropa",
	equipment: "Equipamiento",
	merchandise: "Mercaderia",
	supplement: "Suplemento",
	other: "Otro",
};

const statusLabels: Record<ProductStatus, string> = {
	active: "Activo",
	inactive: "Inactivo",
	discontinued: "Descontinuado",
};

export type ProductsModalProps = NiceModalHocProps & {
	product?: {
		id: string;
		name: string;
		description?: string | null;
		sku?: string | null;
		barcode?: string | null;
		category: ProductCategory;
		costPrice: number;
		sellingPrice: number;
		currency: string;
		trackStock: boolean;
		lowStockThreshold?: number | null;
		currentStock: number;
		status: ProductStatus;
		imageUrl?: string | null;
		taxRate?: number | null;
		notes?: string | null;
	};
};

export const ProductsModal = NiceModal.create<ProductsModalProps>(
	({ product }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!product;

		const createProductMutation =
			trpc.organization.stock.createProduct.useMutation({
				onSuccess: () => {
					toast.success("Producto creado exitosamente");
					utils.organization.stock.listProducts.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Error al crear el producto");
				},
			});

		const updateProductMutation =
			trpc.organization.stock.updateProduct.useMutation({
				onSuccess: () => {
					toast.success("Producto actualizado exitosamente");
					utils.organization.stock.listProducts.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Error al actualizar el producto");
				},
			});

		const form = useZodForm({
			schema: isEditing ? updateProductSchema : createProductSchema,
			defaultValues: isEditing
				? {
						id: product.id,
						name: product.name,
						description: product.description ?? "",
						sku: product.sku ?? "",
						barcode: product.barcode ?? "",
						category: product.category,
						costPrice: product.costPrice,
						sellingPrice: product.sellingPrice,
						currency: product.currency,
						trackStock: product.trackStock,
						lowStockThreshold: product.lowStockThreshold ?? undefined,
						status: product.status,
						imageUrl: product.imageUrl ?? "",
						taxRate: product.taxRate ?? undefined,
						notes: product.notes ?? "",
					}
				: {
						name: "",
						description: "",
						sku: "",
						barcode: "",
						category: "other" as ProductCategory,
						costPrice: 0,
						sellingPrice: 0,
						currency: "ARS",
						trackStock: true,
						lowStockThreshold: 5,
						currentStock: 0,
						status: "active" as ProductStatus,
						imageUrl: "",
						taxRate: 0,
						notes: "",
					},
		});

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing) {
				updateProductMutation.mutate(
					data as Parameters<typeof updateProductMutation.mutate>[0],
				);
			} else {
				createProductMutation.mutate(
					data as Parameters<typeof createProductMutation.mutate>[0],
				);
			}
		});

		const isPending =
			createProductMutation.isPending || updateProductMutation.isPending;

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
							{isEditing ? "Editar Producto" : "Crear Producto"}
						</SheetTitle>
						<SheetDescription className="sr-only">
							{isEditing
								? "Actualiza la informacion del producto."
								: "Completa los detalles para crear un nuevo producto."}
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
															placeholder="ej. Gatorade 500ml"
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
															placeholder="Descripcion del producto..."
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
																{ProductCategories.map((cat) => (
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
																{ProductStatuses.map((status) => (
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
									</div>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="sku"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>SKU</FormLabel>
														<FormControl>
															<Input
																placeholder="SKU-001"
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
											name="barcode"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Codigo de Barras</FormLabel>
														<FormControl>
															<Input
																placeholder="7790001234567"
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
											name="costPrice"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Precio de Costo (centavos)</FormLabel>
														<FormControl>
															<Input
																type="number"
																placeholder="5000"
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
											name="sellingPrice"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Precio de Venta (centavos)</FormLabel>
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
									</div>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="trackStock"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<div className="flex items-center justify-between rounded-lg border p-3">
															<div className="space-y-0.5">
																<FormLabel>Control de Stock</FormLabel>
																<p className="text-muted-foreground text-xs">
																	Llevar control de inventario
																</p>
															</div>
															<FormControl>
																<Switch
																	checked={field.value}
																	onCheckedChange={field.onChange}
																/>
															</FormControl>
														</div>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>

										{!isEditing && (
											<FormField
												control={form.control}
												name="currentStock"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Stock Inicial</FormLabel>
															<FormControl>
																<Input
																	type="number"
																	placeholder="0"
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
										)}
									</div>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="lowStockThreshold"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Alerta Stock Bajo</FormLabel>
														<FormControl>
															<Input
																type="number"
																placeholder="5"
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
											name="taxRate"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>IVA (%)</FormLabel>
														<FormControl>
															<Input
																type="number"
																placeholder="21"
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
									{isEditing ? "Actualizar Producto" : "Crear Producto"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
