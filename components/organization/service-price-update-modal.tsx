"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { CheckIcon, DollarSignIcon, XIcon } from "lucide-react";
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
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetTitle,
} from "@/components/ui/sheet";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { updateServicePriceSchema } from "@/schemas/organization-service-schemas";
import { trpc } from "@/trpc/client";

export type ServicePriceUpdateModalProps = NiceModalHocProps & {
	service: {
		id: string;
		name: string;
		currentPrice: number;
		currency: string;
	};
};

export const ServicePriceUpdateModal =
	NiceModal.create<ServicePriceUpdateModalProps>(({ service }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const t = useTranslations("finance.services");

		const formatPrice = (price: number) => {
			return new Intl.NumberFormat("es-AR", {
				style: "currency",
				currency: service.currency,
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
			}).format(price / 100);
		};

		const updatePriceMutation =
			trpc.organization.service.updatePrice.useMutation({
				onSuccess: () => {
					toast.success(t("success.priceUpdated"));
					utils.organization.service.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.priceUpdateFailed"));
				},
			});

		const form = useZodForm({
			schema: updateServicePriceSchema,
			defaultValues: {
				id: service.id,
				price: service.currentPrice,
				effectiveFrom: new Date(),
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			updatePriceMutation.mutate(data);
		});

		const isPending = updatePriceMutation.isPending;

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<SheetContent
					className="sm:max-w-md"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
					hideDefaultHeader
				>
					<SheetTitle className="sr-only">{t("priceUpdate.title")}</SheetTitle>
					{/* Custom Header with accent stripe */}
					<div className="relative shrink-0">
						{/* Accent stripe */}
						<div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-500" />

						{/* Header content */}
						<div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
							<div className="flex items-start gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-sm">
									<DollarSignIcon className="size-5" />
								</div>
								<div>
									<h2 className="font-semibold text-lg tracking-tight">
										{t("priceUpdate.title")}
									</h2>
									<p className="mt-0.5 text-muted-foreground text-sm">
										{t("priceUpdate.subtitle")}
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
								<span className="sr-only">Cerrar</span>
							</button>
						</div>

						{/* Separator */}
						<div className="h-px bg-border" />
					</div>

					<Form {...form}>
						<form
							onSubmit={onSubmit}
							className="flex flex-1 flex-col overflow-hidden"
						>
							<div className="flex-1 space-y-4 px-6 py-4">
								<div className="rounded-md border bg-muted/50 p-3">
									<p className="text-sm text-muted-foreground">
										{t("priceUpdate.currentPrice")}
									</p>
									<p className="text-lg font-semibold">
										{formatPrice(service.currentPrice)}
									</p>
								</div>

								<FormField
									control={form.control}
									name="price"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>{t("priceUpdate.newPrice")}</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={0}
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
									name="effectiveFrom"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>{t("priceUpdate.effectiveFrom")}</FormLabel>
												<FormControl>
													<Input
														type="date"
														value={
															field.value
																? new Date(
																		field.value as string | number | Date,
																	)
																		.toISOString()
																		.split("T")[0]
																: ""
														}
														onChange={(e) =>
															field.onChange(new Date(e.target.value))
														}
													/>
												</FormControl>
												<FormMessage />
											</Field>
										</FormItem>
									)}
								/>
							</div>

							<SheetFooter className="flex-row justify-end gap-3 border-t bg-muted/30 px-6 py-4">
								<Button
									type="button"
									variant="ghost"
									onClick={modal.handleClose}
									disabled={isPending}
									className="min-w-[100px]"
								>
									<XIcon className="size-4" />
									{t("priceUpdate.cancel")}
								</Button>
								<Button
									type="submit"
									disabled={isPending}
									loading={isPending}
									className="min-w-[100px]"
								>
									<CheckIcon className="size-4" />
									{t("priceUpdate.update")}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	});
