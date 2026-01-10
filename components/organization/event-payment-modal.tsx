"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
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
import {
	EventPaymentMethod,
	EventPaymentMethods,
} from "@/lib/db/schema/enums";
import { formatEventPrice } from "@/lib/format-event";
import { cn } from "@/lib/utils";
import { createEventPaymentSchema } from "@/schemas/organization-sports-event-schemas";
import { trpc } from "@/trpc/client";

// Helper to get payment method label
function getPaymentMethodLabel(method: string): string {
	const labels: Record<string, string> = {
		cash: "Efectivo",
		bank_transfer: "Transferencia Bancaria",
		mercado_pago: "MercadoPago",
		stripe: "Stripe",
		card: "Tarjeta",
		other: "Otro",
	};
	return labels[method] || method;
}

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
					toast.success("Pago registrado correctamente");
					utils.organization.sportsEvent.listPayments.invalidate();
					utils.organization.sportsEvent.listRegistrations.invalidate();
					utils.organization.sportsEvent.get.invalidate();
					onSuccess?.();
					modal.handleClose();
				},
				onError: (error: { message?: string }) => {
					toast.error(error.message || "Error al registrar el pago");
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
						<DialogTitle>Registrar Pago</DialogTitle>
						<DialogDescription>
							{registration
								? `Registrar pago para ${registration.registrantName}`
								: "Selecciona una inscripción y registra el pago"}
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
											<FormLabel>Inscripción</FormLabel>
											<Select
												onValueChange={(value) => {
													field.onChange(value);
													setSelectedRegistrationId(value);
												}}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar inscripción" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{registrationsData?.registrations?.map((reg) => (
														<SelectItem key={reg.id} value={reg.id}>
															#{reg.registrationNumber} - {reg.registrantName}
															{reg.price - reg.paidAmount > 0 && (
																<span className="text-muted-foreground ml-2">
																	(Debe:{" "}
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
										<span className="text-muted-foreground">Total:</span>
										<span className="font-medium">
											{formatEventPrice(selectedReg.price, selectedReg.currency)}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Pagado:</span>
										<span className="font-medium">
											{formatEventPrice(
												selectedReg.paidAmount,
												selectedReg.currency,
											)}
										</span>
									</div>
									<div className="flex justify-between border-t pt-1">
										<span className="text-muted-foreground">Pendiente:</span>
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
										<FormLabel>Monto</FormLabel>
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
											Monto en {selectedReg?.currency || "ARS"}
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
										<FormLabel>Método de Pago</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar método" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{EventPaymentMethods.map((method) => (
													<SelectItem key={method} value={method}>
														{getPaymentMethodLabel(method)}
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
									const dateValue = field.value instanceof Date ? field.value : undefined;
									return (
										<FormItem className="flex flex-col">
											<FormLabel>Fecha de Pago</FormLabel>
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
																<span>Seleccionar fecha</span>
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
										<FormLabel>Número de Comprobante (opcional)</FormLabel>
										<FormControl>
											<Input
												placeholder="Ej: 0001-00012345"
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
										<FormLabel>Notas (opcional)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Notas adicionales sobre el pago..."
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
									Cancelar
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
									Registrar Pago
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		);
	},
);
