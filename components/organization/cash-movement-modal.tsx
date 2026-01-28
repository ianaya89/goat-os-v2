"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import {
	ArrowDownUpIcon,
	Minus,
	Plus,
	ShoppingCart,
	Trash2,
	X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	ProfileEditGrid,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { CashMovementType, CashMovementTypes } from "@/lib/db/schema/enums";
import { addManualMovementSchema } from "@/schemas/organization-cash-register-schemas";
import { trpc } from "@/trpc/client";

type SelectedProduct = {
	productId: string;
	name: string;
	quantity: number;
	sellingPrice: number;
	currentStock: number;
	trackStock: boolean;
};

export type CashMovementModalProps = NiceModalHocProps & {
	cashRegisterId: string;
};

export const CashMovementModal = NiceModal.create<CashMovementModalProps>(
	({ cashRegisterId: _cashRegisterId }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const t = useTranslations("finance.cashRegister");
		const locale = useLocale();

		const [selectedProducts, setSelectedProducts] = React.useState<
			SelectedProduct[]
		>([]);
		const [searchQuery, setSearchQuery] = React.useState("");

		const { data: productsData } =
			trpc.organization.stock.listProducts.useQuery({
				search: searchQuery || undefined,
			});

		const addMovementMutation =
			trpc.organization.cashRegister.addManualMovement.useMutation({
				onSuccess: () => {
					toast.success(t("success.created"));
					utils.organization.cashRegister.getCurrent.invalidate();
					utils.organization.cashRegister.getDailySummary.invalidate();
					utils.organization.cashRegister.getMovements.invalidate();
					utils.organization.stock.listProducts.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.createFailed"));
				},
			});

		const form = useZodForm({
			schema: addManualMovementSchema,
			defaultValues: {
				type: CashMovementType.income,
				amount: 0,
				description: "",
				products: [],
			},
		});

		const productsTotal = React.useMemo(() => {
			return selectedProducts.reduce(
				(sum, p) => sum + p.sellingPrice * p.quantity,
				0,
			);
		}, [selectedProducts]);

		React.useEffect(() => {
			if (selectedProducts.length > 0) {
				form.setValue("amount", productsTotal);
				const productNames = selectedProducts
					.map((p) => `${p.name} x${p.quantity}`)
					.join(", ");
				form.setValue(
					"description",
					`${t("modal.salePrefix")} ${productNames}`,
				);
			}
		}, [productsTotal, selectedProducts, form, t]);

		const addProduct = (product: NonNullable<typeof productsData>[number]) => {
			const existing = selectedProducts.find((p) => p.productId === product.id);
			if (existing) {
				setSelectedProducts((prev) =>
					prev.map((p) =>
						p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p,
					),
				);
			} else {
				setSelectedProducts((prev) => [
					...prev,
					{
						productId: product.id,
						name: product.name,
						quantity: 1,
						sellingPrice: product.sellingPrice,
						currentStock: product.currentStock,
						trackStock: product.trackStock,
					},
				]);
			}
		};

		const updateQuantity = (productId: string, delta: number) => {
			setSelectedProducts(
				(prev) =>
					prev
						.map((p) => {
							if (p.productId === productId) {
								const newQty = p.quantity + delta;
								if (newQty <= 0) return null;
								return { ...p, quantity: newQty };
							}
							return p;
						})
						.filter(Boolean) as SelectedProduct[],
			);
		};

		const removeProduct = (productId: string) => {
			setSelectedProducts((prev) =>
				prev.filter((p) => p.productId !== productId),
			);
		};

		const clearProducts = () => {
			setSelectedProducts([]);
			form.setValue("amount", 0);
			form.setValue("description", "");
		};

		const onSubmit = form.handleSubmit((data) => {
			const products =
				selectedProducts.length > 0
					? selectedProducts.map((p) => ({
							productId: p.productId,
							quantity: p.quantity,
						}))
					: undefined;

			addMovementMutation.mutate({
				...data,
				products,
			});
		});

		const formatCurrency = (amount: number) => {
			return new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", {
				style: "currency",
				currency: "ARS",
			}).format(amount / 100);
		};

		const availableProducts = React.useMemo(() => {
			if (!productsData) return [];
			return productsData.filter((product) => {
				const selected = selectedProducts.find(
					(sp) => sp.productId === product.id,
				);
				if (!selected) return true;
				if (!product.trackStock) return true;
				return selected.quantity < product.currentStock;
			});
		}, [productsData, selectedProducts]);

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("modal.movementTitle")}
				subtitle={t("modal.movementDescription")}
				icon={<ArrowDownUpIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={addMovementMutation.isPending}
				submitLabel={t("modal.add")}
				cancelLabel={t("modal.cancel")}
				maxWidth="lg"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection>
						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("modal.movementType")}</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder={t("modal.selectType")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{CashMovementTypes.map((type) => (
													<SelectItem key={type} value={type}>
														{t.has(`types.${type}`)
															? t(`types.${type}` as "types.income")
															: type}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("modal.amountCents")}</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="1000"
													{...field}
													onChange={(e) =>
														field.onChange(Number(e.target.value))
													}
													disabled={selectedProducts.length > 0}
												/>
											</FormControl>
											{selectedProducts.length > 0 && (
												<p className="text-xs text-muted-foreground">
													{t("modal.amountAutoCalculated")}
												</p>
											)}
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
											<FormLabel>{t("modal.descriptionField")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t("modal.descriptionPlaceholder")}
													autoComplete="off"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>
					</ProfileEditSection>

					{/* Products Section */}
					<ProfileEditSection>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<FormLabel className="flex items-center gap-2">
									<ShoppingCart className="h-4 w-4" />
									{t("modal.products")}
								</FormLabel>
								{selectedProducts.length > 0 && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={clearProducts}
										className="h-7 text-xs"
									>
										<X className="mr-1 h-3 w-3" />
										{t("modal.clearProducts")}
									</Button>
								)}
							</div>

							<Input
								type="search"
								placeholder={t("modal.searchProduct")}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="h-9"
							/>

							{availableProducts.length > 0 && (
								<div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2">
									{availableProducts.slice(0, 5).map((product) => (
										<button
											key={product.id}
											type="button"
											onClick={() => addProduct(product)}
											className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
										>
											<span className="flex-1 truncate">{product.name}</span>
											<span className="ml-2 flex items-center gap-2">
												{product.trackStock && (
													<Badge variant="outline" className="text-xs">
														Stock: {product.currentStock}
													</Badge>
												)}
												<span className="text-muted-foreground">
													{formatCurrency(product.sellingPrice)}
												</span>
												<Plus className="h-4 w-4 text-green-600" />
											</span>
										</button>
									))}
								</div>
							)}

							{selectedProducts.length > 0 && (
								<div className="space-y-2 rounded-md border bg-muted/50 p-3">
									<span className="text-xs font-medium text-muted-foreground">
										{t("modal.selectedProducts")}
									</span>
									{selectedProducts.map((product) => (
										<div
											key={product.productId}
											className="flex items-center justify-between gap-2 rounded bg-background p-2 text-sm"
										>
											<span className="flex-1 truncate font-medium">
												{product.name}
											</span>
											<div className="flex items-center gap-1">
												<Button
													type="button"
													variant="outline"
													size="icon"
													className="h-6 w-6"
													onClick={() => updateQuantity(product.productId, -1)}
												>
													<Minus className="h-3 w-3" />
												</Button>
												<span className="w-8 text-center font-medium">
													{product.quantity}
												</span>
												<Button
													type="button"
													variant="outline"
													size="icon"
													className="h-6 w-6"
													onClick={() => updateQuantity(product.productId, 1)}
													disabled={
														product.trackStock &&
														product.quantity >= product.currentStock
													}
												>
													<Plus className="h-3 w-3" />
												</Button>
												<span className="ml-2 w-20 text-right text-muted-foreground">
													{formatCurrency(
														product.sellingPrice * product.quantity,
													)}
												</span>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="h-6 w-6 text-destructive"
													onClick={() => removeProduct(product.productId)}
												>
													<Trash2 className="h-3 w-3" />
												</Button>
											</div>
										</div>
									))}
									<div className="flex justify-end border-t pt-2">
										<span className="font-semibold">
											{t("modal.total")} {formatCurrency(productsTotal)}
										</span>
									</div>
								</div>
							)}
						</div>
					</ProfileEditSection>
				</div>
			</ProfileEditSheet>
		);
	},
);
