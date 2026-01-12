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
import { openCashRegisterSchema } from "@/schemas/organization-cash-register-schemas";
import { trpc } from "@/trpc/client";

export type CashRegisterOpenModalProps = NiceModalHocProps;

export const CashRegisterOpenModal =
	NiceModal.create<CashRegisterOpenModalProps>(() => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const openMutation = trpc.organization.cashRegister.open.useMutation({
			onSuccess: () => {
				toast.success("Caja abierta exitosamente");
				utils.organization.cashRegister.getCurrent.invalidate();
				utils.organization.cashRegister.getDailySummary.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al abrir la caja");
			},
		});

		const form = useZodForm({
			schema: openCashRegisterSchema,
			defaultValues: {
				openingBalance: 0,
				notes: "",
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			openMutation.mutate(data);
		});

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
						<DialogTitle>Abrir Caja</DialogTitle>
						<DialogDescription>
							Ingresa el saldo inicial para abrir la caja del dia.
						</DialogDescription>
					</DialogHeader>

					<Form {...form}>
						<form onSubmit={onSubmit} className="space-y-4">
							<FormField
								control={form.control}
								name="openingBalance"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Saldo Inicial (centavos)</FormLabel>
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
													placeholder="Observaciones al abrir la caja..."
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
									disabled={openMutation.isPending}
								>
									Cancelar
								</Button>
								<Button
									type="submit"
									disabled={openMutation.isPending}
									loading={openMutation.isPending}
								>
									Abrir Caja
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		);
	});
