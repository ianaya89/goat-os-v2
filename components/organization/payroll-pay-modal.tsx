"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
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
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	TrainingPaymentMethod,
	TrainingPaymentMethods,
} from "@/lib/db/schema/enums";
import { capitalize } from "@/lib/utils";
import { markPayrollAsPaidSchema } from "@/schemas/organization-payroll-schemas";
import { trpc } from "@/trpc/client";

const paymentMethodLabels: Record<string, string> = {
	cash: "Efectivo",
	bank_transfer: "Transferencia",
	mercado_pago: "Mercado Pago",
	card: "Tarjeta",
	other: "Otro",
};

export type PayrollPayModalProps = NiceModalHocProps & {
	payroll: {
		id: string;
		totalAmount: number;
		currency: string;
		concept: string | null;
		periodStart: Date;
		periodEnd: Date;
	};
};

const payFormSchema = z.object({
	paymentMethod: z.nativeEnum(TrainingPaymentMethod),
	paymentDate: z.string().min(1, "Fecha requerida"),
	createExpense: z.boolean(),
});

export const PayrollPayModal = NiceModal.create<PayrollPayModalProps>(
	({ payroll }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const markAsPaidMutation = trpc.organization.payroll.markAsPaid.useMutation(
			{
				onSuccess: () => {
					toast.success("Pago registrado exitosamente");
					utils.organization.payroll.list.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Error al registrar el pago");
				},
			},
		);

		const form = useZodForm({
			schema: payFormSchema,
			defaultValues: {
				paymentMethod: TrainingPaymentMethod.bankTransfer,
				paymentDate: format(new Date(), "yyyy-MM-dd"),
				createExpense: true,
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			markAsPaidMutation.mutate({
				id: payroll.id,
				paymentMethod: data.paymentMethod,
				paymentDate: new Date(data.paymentDate),
				createExpense: data.createExpense,
			});
		});

		const isPending = markAsPaidMutation.isPending;

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<SheetContent
					className="sm:max-w-md"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
				>
					<SheetHeader>
						<SheetTitle>Registrar Pago</SheetTitle>
						<SheetDescription>
							Confirma los datos del pago de la liquidacion.
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form
							onSubmit={onSubmit}
							className="flex flex-1 flex-col overflow-hidden"
						>
							<div className="space-y-4 px-6 py-4">
								{/* Payment Summary */}
								<div className="rounded-lg border bg-muted/50 p-4 space-y-2">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Periodo:</span>
										<span>
											{format(payroll.periodStart, "dd MMM", { locale: es })} -{" "}
											{format(payroll.periodEnd, "dd MMM yyyy", { locale: es })}
										</span>
									</div>
									{payroll.concept && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">Concepto:</span>
											<span>{payroll.concept}</span>
										</div>
									)}
									<div className="flex justify-between border-t pt-2">
										<span className="font-medium">Total a Pagar:</span>
										<span className="font-bold text-lg">
											$
											{(payroll.totalAmount / 100).toLocaleString("es-AR", {
												minimumFractionDigits: 2,
											})}
										</span>
									</div>
								</div>

								{/* Payment Method */}
								<FormField
									control={form.control}
									name="paymentMethod"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>Metodo de Pago</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Seleccionar metodo" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{TrainingPaymentMethods.map((method) => (
															<SelectItem key={method} value={method}>
																{paymentMethodLabels[method] ||
																	capitalize(method.replace("_", " "))}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</Field>
										</FormItem>
									)}
								/>

								{/* Payment Date */}
								<FormField
									control={form.control}
									name="paymentDate"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>Fecha de Pago</FormLabel>
												<FormControl>
													<Input type="date" {...field} />
												</FormControl>
												<FormMessage />
											</Field>
										</FormItem>
									)}
								/>

								{/* Create Expense */}
								<FormField
									control={form.control}
									name="createExpense"
									render={({ field }) => (
										<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
											<FormControl>
												<Checkbox
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
											<div className="space-y-1 leading-none">
												<FormLabel>Registrar como gasto</FormLabel>
												<FormDescription>
													Crear un registro de gasto automaticamente en la
													categoria de personal.
												</FormDescription>
											</div>
										</FormItem>
									)}
								/>
							</div>

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
									Confirmar Pago
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
