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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { CashMovementType, CashMovementTypes } from "@/lib/db/schema/enums";
import { addManualMovementSchema } from "@/schemas/organization-cash-register-schemas";
import { trpc } from "@/trpc/client";

const movementTypeLabels: Record<string, string> = {
	income: "Ingreso",
	expense: "Egreso",
	adjustment: "Ajuste",
};

export type CashMovementModalProps = NiceModalHocProps & {
	cashRegisterId: string;
};

export const CashMovementModal = NiceModal.create<CashMovementModalProps>(
	({ cashRegisterId }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const addMovementMutation =
			trpc.organization.cashRegister.addManualMovement.useMutation({
				onSuccess: () => {
					toast.success("Movimiento agregado exitosamente");
					utils.organization.cashRegister.getCurrent.invalidate();
					utils.organization.cashRegister.getDailySummary.invalidate();
					utils.organization.cashRegister.getMovements.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Error al agregar el movimiento");
				},
			});

		const form = useZodForm({
			schema: addManualMovementSchema,
			defaultValues: {
				type: CashMovementType.income,
				amount: 0,
				description: "",
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			addMovementMutation.mutate(data);
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
						<DialogTitle>Agregar Movimiento</DialogTitle>
						<DialogDescription>
							Registra un movimiento manual en la caja.
						</DialogDescription>
					</DialogHeader>

					<Form {...form}>
						<form onSubmit={onSubmit} className="space-y-4">
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Tipo de Movimiento</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Seleccionar tipo" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{CashMovementTypes.map((type) => (
														<SelectItem key={type} value={type}>
															{movementTypeLabels[type] ?? type}
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
								name="amount"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Monto (centavos)</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="1000"
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
								name="description"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Descripcion</FormLabel>
											<FormControl>
												<Input
													placeholder="Descripcion del movimiento"
													autoComplete="off"
													{...field}
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
									disabled={addMovementMutation.isPending}
								>
									Cancelar
								</Button>
								<Button
									type="submit"
									disabled={addMovementMutation.isPending}
									loading={addMovementMutation.isPending}
								>
									Agregar
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		);
	},
);
