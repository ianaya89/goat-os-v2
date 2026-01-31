"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { CheckIcon, PlusIcon, TicketIcon, XIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { type ServiceStatus, ServiceStatuses } from "@/lib/db/schema/enums";
import {
	createServiceSchema,
	updateServiceSchema,
} from "@/schemas/organization-service-schemas";
import { trpc } from "@/trpc/client";

export type ServiceModalProps = NiceModalHocProps & {
	service?: {
		id: string;
		name: string;
		description: string | null;
		currentPrice: number;
		currency: string;
		status: ServiceStatus;
		sortOrder: number;
	};
};

export const ServiceModal = NiceModal.create<ServiceModalProps>(
	({ service }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const t = useTranslations("finance.services");
		const isEditing = !!service;

		const createMutation = trpc.organization.service.create.useMutation({
			onSuccess: () => {
				toast.success(t("success.created"));
				utils.organization.service.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.createFailed"));
			},
		});

		const updateMutation = trpc.organization.service.update.useMutation({
			onSuccess: () => {
				toast.success(t("success.updated"));
				utils.organization.service.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.updateFailed"));
			},
		});

		const form = useZodForm({
			schema: isEditing ? updateServiceSchema : createServiceSchema,
			defaultValues: isEditing
				? {
						id: service.id,
						name: service.name,
						description: service.description ?? undefined,
						status: service.status,
						sortOrder: service.sortOrder,
					}
				: {
						name: "",
						description: "",
						currentPrice: 0,
						currency: "ARS",
						status: "active" as ServiceStatus,
						sortOrder: 0,
					},
		});

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing) {
				updateMutation.mutate(data as typeof data & { id: string });
			} else {
				createMutation.mutate(
					data as Parameters<typeof createMutation.mutate>[0],
				);
			}
		});

		const isPending = createMutation.isPending || updateMutation.isPending;

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<SheetContent
					className="sm:max-w-lg"
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
									<TicketIcon className="size-5" />
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
							<ScrollArea className="flex-1">
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

									{!isEditing && (
										<div className="grid grid-cols-2 gap-4">
											<FormField
												control={form.control}
												name="currentPrice"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>{t("form.currentPrice")}</FormLabel>
															<FormControl>
																<Input
																	type="number"
																	min={0}
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

											<FormField
												control={form.control}
												name="currency"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>{t("form.currency")}</FormLabel>
															<Select
																value={field.value}
																onValueChange={field.onChange}
															>
																<FormControl>
																	<SelectTrigger className="w-full">
																		<SelectValue
																			placeholder={t("form.selectCurrency")}
																		/>
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	<SelectItem value="ARS">
																		ARS - Peso Argentino
																	</SelectItem>
																	<SelectItem value="USD">
																		USD - Dólar
																	</SelectItem>
																	<SelectItem value="EUR">
																		EUR - Euro
																	</SelectItem>
																	<SelectItem value="BRL">
																		BRL - Real
																	</SelectItem>
																</SelectContent>
															</Select>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</div>
									)}

									<FormField
										control={form.control}
										name="status"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("form.status")}</FormLabel>
													<Select
														value={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue
																	placeholder={t("form.selectStatus")}
																/>
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{ServiceStatuses.map((status) => (
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

									<FormField
										control={form.control}
										name="sortOrder"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("form.sortOrder")}</FormLabel>
													<FormControl>
														<Input
															type="number"
															min={0}
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
								</div>
							</ScrollArea>

							<SheetFooter className="flex-row justify-end gap-3 border-t bg-muted/30 px-6 py-4">
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
