"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { CheckIcon, PackageIcon, PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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
	SheetFooter,
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
		const t = useTranslations("finance.products");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!product;

		const createProductMutation =
			trpc.organization.stock.createProduct.useMutation({
				onSuccess: () => {
					toast.success(t("success.created"));
					utils.organization.stock.listProducts.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.createFailed"));
				},
			});

		const updateProductMutation =
			trpc.organization.stock.updateProduct.useMutation({
				onSuccess: () => {
					toast.success(t("success.updated"));
					utils.organization.stock.listProducts.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.updateFailed"));
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
					className="sm:max-w-lg overflow-hidden"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
					hideDefaultHeader
				>
					<SheetTitle className="sr-only">
						{isEditing ? t("modal.editTitle") : t("modal.createTitle")}
					</SheetTitle>
					{/* Custom Header with accent stripe */}
					<div className="relative shrink-0">
						{/* Accent stripe */}
						<div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-500" />

						{/* Header content */}
						<div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
							<div className="flex items-start gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-sm">
									<PackageIcon className="size-5" />
								</div>
								<div>
									<h2 className="font-semibold text-lg tracking-tight">
										{isEditing ? t("modal.editTitle") : t("modal.createTitle")}
									</h2>
									<p className="mt-0.5 text-muted-foreground text-sm">
										{isEditing
											? t("modal.editSubtitle")
											: t("modal.createSubtitle")}
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={modal.handleClose}
								disabled={isPending}
								className="flex size-8 items-center justify-center rounded-lg transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
							>
								<XIcon className="size-4" />
								<span className="sr-only">{t("modal.cancel")}</span>
							</button>
						</div>

						{/* Separator */}
						<div className="h-px bg-border" />
					</div>

					<Form {...form}>
						<form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
							<ScrollArea className="min-h-0 flex-1">
								<div className="space-y-4 px-6 py-4">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("form.name")}</FormLabel>
													<FormControl>
														<Input
															placeholder={t("form.namePlaceholder")}
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
													<FormLabel>{t("form.description")}</FormLabel>
													<FormControl>
														<Textarea
															placeholder={t("form.descriptionPlaceholder")}
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
														<FormLabel>{t("form.category")}</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{ProductCategories.map((cat) => (
																	<SelectItem key={cat} value={cat}>
																		{t(`categories.${cat}`)}
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
														<FormLabel>{t("form.status")}</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{ProductStatuses.map((status) => (
																	<SelectItem key={status} value={status}>
																		{t(`status.${status}`)}
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
														<FormLabel>{t("form.sku")}</FormLabel>
														<FormControl>
															<Input
																placeholder={t("form.skuPlaceholder")}
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
														<FormLabel>{t("form.barcode")}</FormLabel>
														<FormControl>
															<Input
																placeholder={t("form.barcodePlaceholder")}
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
														<FormLabel>{t("form.costPrice")}</FormLabel>
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
														<FormLabel>{t("form.sellingPrice")}</FormLabel>
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
																<FormLabel>{t("form.trackStock")}</FormLabel>
																<p className="text-muted-foreground text-xs">
																	{t("form.trackStockDescription")}
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
															<FormLabel>{t("form.initialStock")}</FormLabel>
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
														<FormLabel>{t("form.lowStockThreshold")}</FormLabel>
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
														<FormLabel>{t("form.taxRate")}</FormLabel>
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
													<FormLabel>{t("form.notes")}</FormLabel>
													<FormControl>
														<Textarea
															placeholder={t("form.notesPlaceholder")}
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

							<SheetFooter className="shrink-0 flex-row justify-end gap-3 border-t bg-muted/30 px-6 py-4 pb-6">
								<Button
									type="button"
									variant="ghost"
									onClick={modal.handleClose}
									disabled={isPending}
									className="min-w-[100px]"
								>
									<XIcon className="size-4" />
									{t("modal.cancel")}
								</Button>
								<Button
									type="submit"
									disabled={isPending}
									loading={isPending}
									className="min-w-[100px]"
								>
									{isEditing ? (
										<CheckIcon className="size-4" />
									) : (
										<PlusIcon className="size-4" />
									)}
									{isEditing ? t("modal.update") : t("modal.create")}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
