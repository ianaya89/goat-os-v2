"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { closeCashRegisterSchema } from "@/schemas/organization-cash-register-schemas";
import { trpc } from "@/trpc/client";

export type CashRegisterCloseModalProps = NiceModalHocProps & {
	cashRegister: {
		id: string;
		openingBalance: number;
	};
};

export const CashRegisterCloseModal =
	NiceModal.create<CashRegisterCloseModalProps>(({ cashRegister }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const closeMutation = trpc.organization.cashRegister.close.useMutation({
			onSuccess: () => {
				toast.success("Caja cerrada exitosamente");
				utils.organization.cashRegister.getCurrent.invalidate();
				utils.organization.cashRegister.getDailySummary.invalidate();
				utils.organization.cashRegister.getHistory.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al cerrar la caja");
			},
		});

		const form = useZodForm({
			schema: closeCashRegisterSchema,
			defaultValues: {
				id: cashRegister.id,
				closingBalance: 0,
				notes: "",
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			closeMutation.mutate(data);
		});

		const formatAmount = (amount: number) => {
			return new Intl.NumberFormat("es-AR", {
				style: "currency",
				currency: "ARS",
			}).format(amount / 100);
		};

		return (
			<Dialog
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<DialogContent
					className="sm:max-w-md"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
				>
					<DialogHeader>
						<DialogTitle>Cerrar Caja</DialogTitle>
						<DialogDescription>
							Ingresa el saldo final para cerrar la caja del dia.
						</DialogDescription>
					</DialogHeader>

					<div className="rounded-lg bg-muted/50 p-3 mb-4">
						<p className="text-muted-foreground text-sm">Saldo Inicial:</p>
						<p className="font-semibold">
							{formatAmount(cashRegister.openingBalance)}
						</p>
					</div>

					<Form {...form}>
						<form onSubmit={onSubmit} className="space-y-4">
							<FormField
								control={form.control}
								name="closingBalance"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Saldo Final (centavos)</FormLabel>
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

							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Notas (opcional)</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Observaciones al cerrar la caja..."
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

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={modal.handleClose}
									disabled={closeMutation.isPending}
								>
									Cancelar
								</Button>
								<Button
									type="submit"
									disabled={closeMutation.isPending}
									loading={closeMutation.isPending}
								>
									Cerrar Caja
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		);
	});
