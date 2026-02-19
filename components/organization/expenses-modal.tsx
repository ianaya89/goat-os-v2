"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { FileTextIcon, ReceiptIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	ProfileEditGrid,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { ExpenseReceiptModal } from "@/components/organization/receipt-modal";
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
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	ExpenseCategories,
	type ExpenseCategory,
	type TrainingPaymentMethod,
	TrainingPaymentMethods,
} from "@/lib/db/schema/enums";
import {
	createExpenseSchema,
	updateExpenseSchema,
} from "@/schemas/organization-expense-schemas";
import { trpc } from "@/trpc/client";

const methodKeys: Record<string, string> = {
	cash: "cash",
	bank_transfer: "bankTransfer",
	mercado_pago: "mercadoPago",
	card: "card",
	other: "other",
};

export type ExpensesModalProps = NiceModalHocProps & {
	expense?: {
		id: string;
		categoryId?: string | null;
		category?: string | null;
		amount: number;
		currency: string;
		description: string;
		expenseDate: Date;
		paymentMethod?: string | null;
		receiptNumber?: string | null;
		vendor?: string | null;
		notes?: string | null;
		receiptImageKey?: string | null;
		eventId?: string | null;
		event?: { id: string; title: string } | null;
	};
	fixedEventId?: string;
};

export const ExpensesModal = NiceModal.create<ExpensesModalProps>(
	({ expense, fixedEventId }) => {
		const t = useTranslations("finance.expenses");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!expense;

		const createExpenseMutation = trpc.organization.expense.create.useMutation({
			onSuccess: (data) => {
				toast.success(t("success.created"));
				utils.organization.expense.invalidate();
				form.reset();
				modal.handleClose();
				if (data?.id) {
					NiceModal.show(ExpenseReceiptModal, {
						expenseId: data.id,
						hasReceipt: false,
					});
				}
			},
			onError: (error) => {
				toast.error(error.message || t("error.createFailed"));
			},
		});

		const updateExpenseMutation = trpc.organization.expense.update.useMutation({
			onSuccess: () => {
				toast.success(t("success.updated"));
				utils.organization.expense.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.updateFailed"));
			},
		});

		const effectiveEventId = fixedEventId ?? undefined;

		// Fetch events for the selector (only when not fixed and creating)
		const { data: eventsData } = trpc.organization.sportsEvent.list.useQuery(
			{ limit: 100, offset: 0 },
			{ enabled: !fixedEventId && !isEditing },
		);

		const form = useZodForm({
			schema: isEditing ? updateExpenseSchema : createExpenseSchema,
			defaultValues: isEditing
				? {
						id: expense.id,
						category: (expense.category as ExpenseCategory) ?? undefined,
						amount: expense.amount / 100,
						description: expense.description,
						expenseDate: expense.expenseDate,
						paymentMethod:
							(expense.paymentMethod as TrainingPaymentMethod) ?? undefined,
						receiptNumber: expense.receiptNumber ?? "",
						vendor: expense.vendor ?? "",
						notes: expense.notes ?? "",
						eventId: expense.eventId ?? undefined,
					}
				: {
						category: undefined,
						amount: 0,
						currency: "ARS",
						description: "",
						expenseDate: new Date(),
						paymentMethod: undefined,
						receiptNumber: "",
						vendor: "",
						notes: "",
						eventId: effectiveEventId,
					},
		});

		const onSubmit = form.handleSubmit((data) => {
			const transformedData = {
				...data,
				amount: Math.round((data.amount ?? 0) * 100),
			};
			if (isEditing) {
				updateExpenseMutation.mutate(
					transformedData as Parameters<typeof updateExpenseMutation.mutate>[0],
				);
			} else {
				createExpenseMutation.mutate(
					transformedData as Parameters<typeof createExpenseMutation.mutate>[0],
				);
			}
		});

		const isPending =
			createExpenseMutation.isPending || updateExpenseMutation.isPending;

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={isEditing ? t("modal.editTitle") : t("modal.createTitle")}
				subtitle={
					isEditing ? t("modal.editSubtitle") : t("modal.createSubtitle")
				}
				icon={<ReceiptIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={isPending}
				submitLabel={isEditing ? t("modal.update") : t("modal.create")}
				cancelLabel={t("modal.cancel")}
				maxWidth="lg"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.description")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("form.descriptionPlaceholder")}
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
							name="category"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.category")}</FormLabel>
										<Select
											onValueChange={(value) =>
												field.onChange(value === "none" ? undefined : value)
											}
											value={field.value ?? "none"}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder={t("form.selectCategory")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">
													{t("form.noCategory")}
												</SelectItem>
												{ExpenseCategories.map((cat) => (
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
						{/* Event selector - only show when not fixed and creating */}
						{!fixedEventId && !isEditing && (
							<FormField
								control={form.control}
								name="eventId"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.event")}</FormLabel>
											<Select
												onValueChange={(value) =>
													field.onChange(value === "none" ? undefined : value)
												}
												value={field.value ?? "none"}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder={t("form.selectEvent")} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="none">
														{t("form.noEvent")}
													</SelectItem>
													{eventsData?.events?.map(
														(event: { id: string; title: string }) => (
															<SelectItem key={event.id} value={event.id}>
																{event.title}
															</SelectItem>
														),
													)}
												</SelectContent>
											</Select>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						)}

						{/* Show linked event info when editing */}
						{isEditing && expense?.event && (
							<Field>
								<FormLabel>{t("form.event")}</FormLabel>
								<Input
									value={expense.event.title}
									disabled
									className="bg-muted"
								/>
							</Field>
						)}
					</ProfileEditSection>

					<ProfileEditSection>
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.amount")}</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="100"
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
											<FormLabel>{t("form.date")}</FormLabel>
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
													onChange={(e) => {
														if (e.target.value) {
															const parts = e.target.value
																.split("-")
																.map(Number);
															field.onChange(
																new Date(parts[0]!, parts[1]! - 1, parts[2]),
															);
														} else {
															field.onChange(undefined);
														}
													}}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>

						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="paymentMethod"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.method")}</FormLabel>
											<Select
												onValueChange={(value) =>
													field.onChange(value === "none" ? undefined : value)
												}
												value={field.value ?? "none"}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder={t("form.selectMethod")} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="none">
														{t("form.notSpecified")}
													</SelectItem>
													{TrainingPaymentMethods.map((method) => (
														<SelectItem key={method} value={method}>
															{t(`methods.${methodKeys[method] ?? method}`)}
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
											<FormLabel>{t("form.vendor")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t("form.vendorPlaceholder")}
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
						</ProfileEditGrid>

						<FormField
							control={form.control}
							name="receiptNumber"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.receiptNumber")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("form.receiptPlaceholder")}
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
					</ProfileEditSection>

					<ProfileEditSection>
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
												className="min-h-[80px] resize-none"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						{/* Receipt - Only show when editing */}
						{isEditing && expense && (
							<Field>
								<FormLabel>{t("form.receiptUpload")}</FormLabel>
								<Button
									type="button"
									variant="outline"
									className="w-full justify-start"
									onClick={() => {
										NiceModal.show(ExpenseReceiptModal, {
											expenseId: expense.id,
											hasReceipt: !!expense.receiptImageKey,
										});
									}}
								>
									<FileTextIcon className="mr-2 size-4" />
									{t("receipt.manage")}
								</Button>
							</Field>
						)}
					</ProfileEditSection>
				</div>
			</ProfileEditSheet>
		);
	},
);
