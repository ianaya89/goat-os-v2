"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { BanknoteIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	ProfileEditGrid,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { TrainingPaymentReceiptUpload } from "@/components/organization/training-payment-receipt-upload";
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
	type TrainingPaymentMethod,
	TrainingPaymentMethods,
	TrainingPaymentStatus,
	TrainingPaymentStatuses,
} from "@/lib/db/schema/enums";
import {
	createTrainingPaymentSchema,
	updateTrainingPaymentSchema,
} from "@/schemas/organization-training-payment-schemas";
import { trpc } from "@/trpc/client";

const methodKeys: Record<string, string> = {
	cash: "cash",
	bank_transfer: "bankTransfer",
	mercado_pago: "mercadoPago",
	card: "card",
	other: "other",
};

export type PaymentsModalProps = NiceModalHocProps & {
	payment?: {
		id: string;
		sessionId?: string | null;
		athleteId?: string | null;
		amount: number;
		currency: string;
		status: string;
		paymentMethod?: string | null;
		paidAmount: number;
		paymentDate?: Date | null;
		receiptNumber?: string | null;
		description?: string | null;
		notes?: string | null;
		receiptImageKey?: string | null;
	};
};

export const PaymentsModal = NiceModal.create<PaymentsModalProps>(
	({ payment }) => {
		const t = useTranslations("finance.payments");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!payment;

		// Fetch data for dropdowns
		const { data: sessionsData } =
			trpc.organization.trainingSession.list.useQuery({
				limit: 100,
				offset: 0,
				sortBy: "startTime",
				sortOrder: "desc",
			});
		const { data: athletesData } = trpc.organization.athlete.list.useQuery({
			limit: 100,
			offset: 0,
		});

		const sessions = sessionsData?.sessions ?? [];
		const athletes = athletesData?.athletes ?? [];

		const createPaymentMutation =
			trpc.organization.trainingPayment.create.useMutation({
				onSuccess: () => {
					toast.success(t("success.created"));
					utils.organization.trainingPayment.list.invalidate();
					utils.organization.trainingPayment.getSessionPayments.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.createFailed"));
				},
			});

		const updatePaymentMutation =
			trpc.organization.trainingPayment.update.useMutation({
				onSuccess: () => {
					toast.success(t("success.updated"));
					utils.organization.trainingPayment.list.invalidate();
					utils.organization.trainingPayment.getSessionPayments.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.updateFailed"));
				},
			});

		const form = useZodForm({
			schema: isEditing
				? updateTrainingPaymentSchema
				: createTrainingPaymentSchema,
			defaultValues: isEditing
				? {
						id: payment.id,
						amount: payment.amount,
						status: payment.status as TrainingPaymentStatus,
						paymentMethod:
							(payment.paymentMethod as TrainingPaymentMethod) ?? null,
						paidAmount: payment.paidAmount,
						paymentDate: payment.paymentDate ?? undefined,
						receiptNumber: payment.receiptNumber ?? "",
						description: payment.description ?? "",
						notes: payment.notes ?? "",
					}
				: {
						sessionId: null,
						athleteId: null,
						amount: 0,
						currency: "ARS",
						status: TrainingPaymentStatus.paid,
						paymentMethod: undefined,
						paidAmount: 0,
						paymentDate: new Date(),
						receiptNumber: "",
						description: "",
						notes: "",
					},
		});

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing) {
				updatePaymentMutation.mutate(
					data as Parameters<typeof updatePaymentMutation.mutate>[0],
				);
			} else {
				createPaymentMutation.mutate(
					data as Parameters<typeof createPaymentMutation.mutate>[0],
				);
			}
		});

		const isPending =
			createPaymentMutation.isPending || updatePaymentMutation.isPending;

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={isEditing ? t("modal.editTitle") : t("modal.createTitle")}
				subtitle={
					isEditing ? t("modal.editSubtitle") : t("modal.createSubtitle")
				}
				icon={<BanknoteIcon className="size-5" />}
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

						{!isEditing && (
							<>
								<FormField
									control={form.control}
									name="sessionId"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>{t("form.session")}</FormLabel>
												<Select
													onValueChange={(value) =>
														field.onChange(value === "none" ? null : value)
													}
													value={field.value ?? "none"}
												>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue
																placeholder={t("form.selectSession")}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="none">
															{t("form.noSession")}
														</SelectItem>
														{sessions.map((session) => (
															<SelectItem key={session.id} value={session.id}>
																{session.title} -{" "}
																{format(session.startTime, "dd/MM/yyyy")}
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
									name="athleteId"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>{t("form.athleteOptional")}</FormLabel>
												<Select
													onValueChange={(value) =>
														field.onChange(value === "none" ? null : value)
													}
													value={field.value ?? "none"}
												>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue
																placeholder={t("form.selectAthlete")}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="none">
															{t("form.noAthlete")}
														</SelectItem>
														{athletes.map((athlete) => (
															<SelectItem key={athlete.id} value={athlete.id}>
																{athlete.user?.name ?? "Unknown"}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</Field>
										</FormItem>
									)}
								/>
							</>
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
											<FormLabel>{t("form.amountCents")}</FormLabel>
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
								name="paidAmount"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.paidAmountCents")}</FormLabel>
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
						</ProfileEditGrid>

						<ProfileEditGrid cols={2}>
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
														<SelectValue placeholder={t("form.selectStatus")} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{TrainingPaymentStatuses.map((status) => (
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
								name="paymentMethod"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.method")}</FormLabel>
											<Select
												onValueChange={(value) =>
													field.onChange(value === "none" ? null : value)
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
						</ProfileEditGrid>

						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="paymentDate"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.paymentDate")}</FormLabel>
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
						</ProfileEditGrid>
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

						{/* Receipt Upload - Only show when editing */}
						{isEditing && payment && (
							<Field>
								<FormLabel>{t("form.receiptUpload")}</FormLabel>
								<TrainingPaymentReceiptUpload
									paymentId={payment.id}
									hasReceipt={!!payment.receiptImageKey}
									onUploadComplete={() => {
										utils.organization.trainingPayment.list.invalidate();
										utils.organization.trainingPayment.getSessionPayments.invalidate();
									}}
								/>
							</Field>
						)}
					</ProfileEditSection>
				</div>
			</ProfileEditSheet>
		);
	},
);
