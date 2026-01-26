"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import * as React from "react";
import { toast } from "sonner";
import { TrainingPaymentReceiptUpload } from "@/components/organization/training-payment-receipt-upload";
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
	TrainingPaymentStatus,
	TrainingPaymentStatuses,
} from "@/lib/db/schema/enums";
import { capitalize } from "@/lib/utils";
import {
	createTrainingPaymentSchema,
	updateTrainingPaymentSchema,
} from "@/schemas/organization-training-payment-schemas";
import { trpc } from "@/trpc/client";

const methodLabels: Record<string, string> = {
	cash: "Cash",
	bank_transfer: "Bank Transfer",
	mercado_pago: "Mercado Pago",
	card: "Card",
	other: "Other",
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
					toast.success("Payment created successfully");
					utils.organization.trainingPayment.list.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Failed to create payment");
				},
			});

		const updatePaymentMutation =
			trpc.organization.trainingPayment.update.useMutation({
				onSuccess: () => {
					toast.success("Payment updated successfully");
					utils.organization.trainingPayment.list.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Failed to update payment");
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
							{isEditing ? "Edit Payment" : "Create Payment"}
						</SheetTitle>
						<SheetDescription className="sr-only">
							{isEditing
								? "Update the payment information below."
								: "Fill in the details to create a new payment."}
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
													<FormLabel>Description</FormLabel>
													<FormControl>
														<Input
															placeholder="e.g., Monthly training fee"
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
															<FormLabel>Session (Optional)</FormLabel>
															<Select
																onValueChange={(value) =>
																	field.onChange(
																		value === "none" ? null : value,
																	)
																}
																value={field.value ?? "none"}
															>
																<FormControl>
																	<SelectTrigger className="w-full">
																		<SelectValue placeholder="Select session" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	<SelectItem value="none">
																		No session
																	</SelectItem>
																	{sessions.map((session) => (
																		<SelectItem
																			key={session.id}
																			value={session.id}
																		>
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
															<FormLabel>Athlete (Optional)</FormLabel>
															<Select
																onValueChange={(value) =>
																	field.onChange(
																		value === "none" ? null : value,
																	)
																}
																value={field.value ?? "none"}
															>
																<FormControl>
																	<SelectTrigger className="w-full">
																		<SelectValue placeholder="Select athlete" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	<SelectItem value="none">
																		No athlete
																	</SelectItem>
																	{athletes.map((athlete) => (
																		<SelectItem
																			key={athlete.id}
																			value={athlete.id}
																		>
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

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="amount"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Amount (cents)</FormLabel>
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
														<FormLabel>Paid Amount (cents)</FormLabel>
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
									</div>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="status"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Status</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Select status" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{TrainingPaymentStatuses.map((status) => (
																	<SelectItem key={status} value={status}>
																		{capitalize(status)}
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
														<FormLabel>Payment Method</FormLabel>
														<Select
															onValueChange={(value) =>
																field.onChange(value === "none" ? null : value)
															}
															value={field.value ?? "none"}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Select method" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="none">
																	Not specified
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
									</div>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="paymentDate"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Payment Date</FormLabel>
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
														<FormLabel>Receipt Number</FormLabel>
														<FormControl>
															<Input
																placeholder="Receipt #"
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
										name="notes"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Notes</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Additional notes..."
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

									{/* Receipt Upload - Only show when editing */}
									{isEditing && payment && (
										<Field>
											<FormLabel>Comprobante de Pago</FormLabel>
											<TrainingPaymentReceiptUpload
												paymentId={payment.id}
												hasReceipt={!!payment.receiptImageKey}
												onUploadComplete={() => {
													utils.organization.trainingPayment.list.invalidate();
												}}
											/>
										</Field>
									)}
								</div>
							</ScrollArea>

							<SheetFooter className="flex-row justify-end gap-2 border-t">
								<Button
									type="button"
									variant="outline"
									onClick={modal.handleClose}
									disabled={isPending}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isPending} loading={isPending}>
									{isEditing ? "Update Payment" : "Create Payment"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
