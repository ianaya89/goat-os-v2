"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
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
import { EventPaymentMethod, EventPaymentMethods } from "@/lib/db/schema/enums";
import { formatEventPrice } from "@/lib/format-event";
import { cn } from "@/lib/utils";
import { createEventPaymentSchema } from "@/schemas/organization-sports-event-schemas";
import { trpc } from "@/trpc/client";

const methodKeys: Record<string, string> = {
	cash: "cash",
	bank_transfer: "bankTransfer",
	mercado_pago: "mercadoPago",
	stripe: "stripe",
	card: "card",
	other: "other",
};

interface Registration {
	id: string;
	registrationNumber: number;
	registrantName: string;
	registrantEmail: string;
	price: number;
	paidAmount: number;
	currency: string;
}

export type EventPaymentModalProps = NiceModalHocProps & {
	eventId: string;
	registration?: Registration;
	onSuccess?: () => void;
};

export const EventPaymentModal = NiceModal.create<EventPaymentModalProps>(
	({ eventId, registration, onSuccess }) => {
		const t = useTranslations("finance.eventPayments");
		const modal = useEnhancedModal();
		const [selectedRegistrationId, setSelectedRegistrationId] = React.useState<
			string | null
		>(registration?.id ?? null);

		const utils = trpc.useUtils();

		// Fetch registrations if no registration is provided
		const { data: registrationsData } =
			trpc.organization.sportsEvent.listRegistrations.useQuery(
				{
					eventId,
					limit: 100,
					offset: 0,
				},
				{
					enabled: !registration,
				},
			);

		const createPaymentMutation =
			trpc.organization.sportsEvent.createPayment.useMutation({
				onSuccess: () => {
					toast.success(t("success.created"));
					utils.organization.sportsEvent.listPayments.invalidate();
					utils.organization.sportsEvent.listRegistrations.invalidate();
					utils.organization.sportsEvent.get.invalidate();
					utils.organization.eventOrganization.getProjection.invalidate();
					onSuccess?.();
					modal.handleClose();
				},
				onError: (error: { message?: string }) => {
					toast.error(error.message || t("error.createFailed"));
				},
			});

		const selectedReg = registration
			? registration
			: registrationsData?.registrations?.find(
					(r) => r.id === selectedRegistrationId,
				);

		const remainingAmount = selectedReg
			? selectedReg.price - selectedReg.paidAmount
			: 0;

		const form = useZodForm({
			schema: createEventPaymentSchema,
			defaultValues: {
				registrationId: registration?.id ?? "",
				amount: remainingAmount > 0 ? remainingAmount : 0,
				paymentMethod: EventPaymentMethod.cash,
				paymentDate: new Date(),
				receiptNumber: "",
				notes: "",
			},
		});

		// Update form when registration changes
		React.useEffect(() => {
			if (selectedRegistrationId) {
				form.setValue("registrationId", selectedRegistrationId);
			}
			if (remainingAmount > 0) {
				form.setValue("amount", remainingAmount);
			}
		}, [selectedRegistrationId, remainingAmount, form]);

		const onSubmit = form.handleSubmit((data) => {
			createPaymentMutation.mutate(data);
		});

		return (
			<Dialog open={modal.visible} onOpenChange={modal.handleClose}>
				<DialogContent
					className="sm:max-w-[500px]"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
					onClose={modal.handleClose}
				>
					<DialogHeader>
						<DialogTitle>{t("modal.title")}</DialogTitle>
						<DialogDescription>
							{registration
								? t("modal.descriptionWithName", {
										name: registration.registrantName,
									})
								: t("modal.descriptionGeneric")}
						</DialogDescription>
					</DialogHeader>

					<Form {...form}>
						<form onSubmit={onSubmit} className="space-y-4">
							{!registration && (
								<FormField
									control={form.control}
									name="registrationId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("modal.registration")}</FormLabel>
											<Select
												onValueChange={(value) => {
													field.onChange(value);
													setSelectedRegistrationId(value);
												}}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue
															placeholder={t("modal.selectRegistration")}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{registrationsData?.registrations?.map((reg) => (
														<SelectItem key={reg.id} value={reg.id}>
															#{reg.registrationNumber} - {reg.registrantName}
															{reg.price - reg.paidAmount > 0 && (
																<span className="text-muted-foreground ml-2">
																	({t("modal.owes")}{" "}
																	{formatEventPrice(
																		reg.price - reg.paidAmount,
																		reg.currency,
																	)}
																	)
																</span>
															)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							{selectedReg && (
								<div className="rounded-lg border bg-muted/50 p-3 space-y-1 text-sm">
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											{t("modal.summaryTotal")}
										</span>
										<span className="font-medium">
											{formatEventPrice(
												selectedReg.price,
												selectedReg.currency,
											)}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											{t("modal.summaryPaid")}
										</span>
										<span className="font-medium">
											{formatEventPrice(
												selectedReg.paidAmount,
												selectedReg.currency,
											)}
										</span>
									</div>
									<div className="flex justify-between border-t pt-1">
										<span className="text-muted-foreground">
											{t("modal.summaryPending")}
										</span>
										<span className="font-medium text-primary">
											{formatEventPrice(remainingAmount, selectedReg.currency)}
										</span>
									</div>
								</div>
							)}

							<FormField
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("modal.amount")}</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={1}
												{...field}
												onChange={(e) =>
													field.onChange(parseInt(e.target.value, 10) || 0)
												}
											/>
										</FormControl>
										<FormDescription>
											{t("modal.amountDescription", {
												currency: selectedReg?.currency || "ARS",
											})}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="paymentMethod"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("modal.paymentMethod")}</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t("modal.selectMethod")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{EventPaymentMethods.map((method) => (
													<SelectItem key={method} value={method}>
														{t(`methods.${methodKeys[method] ?? method}`)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="paymentDate"
								render={({ field }) => {
									const dateValue =
										field.value instanceof Date ? field.value : undefined;
									return (
										<FormItem className="flex flex-col">
											<FormLabel>{t("modal.paymentDate")}</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant="outline"
															className={cn(
																"w-full pl-3 text-left font-normal",
																!dateValue && "text-muted-foreground",
															)}
														>
															{dateValue ? (
																format(dateValue, "PPP")
															) : (
																<span>{t("modal.selectDate")}</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={dateValue}
														onSelect={field.onChange}
														disabled={(date) => date > new Date()}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									);
								}}
							/>

							<FormField
								control={form.control}
								name="receiptNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("modal.receiptNumber")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("modal.receiptPlaceholder")}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("modal.notes")}</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("modal.notesPlaceholder")}
												className="resize-none"
												rows={2}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={modal.handleClose}
								>
									{t("modal.cancel")}
								</Button>
								<Button
									type="submit"
									disabled={
										createPaymentMutation.isPending || !selectedRegistrationId
									}
								>
									{createPaymentMutation.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									{t("modal.submit")}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		);
	},
);
