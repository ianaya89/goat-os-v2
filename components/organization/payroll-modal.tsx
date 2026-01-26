"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
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
	CoachPaymentType,
	PayrollPeriodType,
	PayrollPeriodTypes,
	PayrollStaffType,
} from "@/lib/db/schema/enums";
import { capitalize } from "@/lib/utils";
import { trpc } from "@/trpc/client";

// Create a unified form schema for the modal (using strings for dates to avoid zod v4 typing issues)
const payrollFormSchema = z.object({
	staffType: z.nativeEnum(PayrollStaffType),
	coachId: z.string().uuid().optional(),
	coachPaymentType: z.nativeEnum(CoachPaymentType).optional(),
	ratePerSession: z.number().min(0).optional(),
	externalName: z.string().optional(),
	externalEmail: z.string().email().optional().or(z.literal("")),
	periodStart: z.string().min(1, "Fecha requerida"),
	periodEnd: z.string().min(1, "Fecha requerida"),
	periodType: z.nativeEnum(PayrollPeriodType),
	baseSalary: z.number().min(0),
	bonuses: z.number().min(0),
	deductions: z.number().min(0),
	concept: z.string().optional(),
	notes: z.string().optional(),
});

type PayrollFormValues = z.infer<typeof payrollFormSchema>;

const coachPaymentTypeLabels: Record<string, string> = {
	per_session: "Por Sesion",
	fixed: "Monto Fijo",
};

export type PayrollModalProps = NiceModalHocProps & {
	payroll?: {
		id: string;
		staffType: string;
		coachId: string | null;
		userId: string | null;
		externalName: string | null;
		externalEmail: string | null;
		periodStart: Date;
		periodEnd: Date;
		periodType: string;
		baseSalary: number;
		bonuses: number;
		deductions: number;
		totalAmount: number;
		concept: string | null;
		notes: string | null;
		status: string;
	};
};

const periodTypeLabels: Record<string, string> = {
	monthly: "Mensual",
	biweekly: "Quincenal",
	weekly: "Semanal",
	event: "Por evento",
};

const _staffTypeLabels: Record<string, string> = {
	coach: "Coach",
	staff: "Staff",
	external: "Externo",
};

export const PayrollModal = NiceModal.create<PayrollModalProps>(
	({ payroll }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!payroll;

		// Get available coaches
		const { data: staffData } =
			trpc.organization.payroll.getAvailableStaff.useQuery();

		const createPayrollMutation = trpc.organization.payroll.create.useMutation({
			onSuccess: () => {
				toast.success("Liquidacion creada exitosamente");
				utils.organization.payroll.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al crear la liquidacion");
			},
		});

		const updatePayrollMutation = trpc.organization.payroll.update.useMutation({
			onSuccess: () => {
				toast.success("Liquidacion actualizada exitosamente");
				utils.organization.payroll.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar la liquidacion");
			},
		});

		// Set default period (current month)
		const now = new Date();
		const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

		const form = useZodForm({
			schema: payrollFormSchema,
			defaultValues: isEditing
				? {
						staffType: payroll.staffType as PayrollStaffType,
						coachId: payroll.coachId ?? undefined,
						coachPaymentType: CoachPaymentType.fixed,
						ratePerSession: 0,
						externalName: payroll.externalName ?? "",
						externalEmail: payroll.externalEmail ?? "",
						periodStart: format(new Date(payroll.periodStart), "yyyy-MM-dd"),
						periodEnd: format(new Date(payroll.periodEnd), "yyyy-MM-dd"),
						periodType: payroll.periodType as PayrollPeriodType,
						baseSalary: payroll.baseSalary / 100,
						bonuses: payroll.bonuses / 100,
						deductions: payroll.deductions / 100,
						concept: payroll.concept ?? "",
						notes: payroll.notes ?? "",
					}
				: {
						staffType: PayrollStaffType.coach,
						coachId: undefined,
						coachPaymentType: CoachPaymentType.fixed,
						ratePerSession: 0,
						externalName: "",
						externalEmail: "",
						periodStart: format(firstDayOfMonth, "yyyy-MM-dd"),
						periodEnd: format(lastDayOfMonth, "yyyy-MM-dd"),
						periodType: PayrollPeriodType.monthly,
						baseSalary: 0,
						bonuses: 0,
						deductions: 0,
						concept: "",
						notes: "",
					},
		});

		const staffType = form.watch("staffType");
		const coachId = form.watch("coachId");
		const coachPaymentType = form.watch("coachPaymentType");
		const ratePerSession = form.watch("ratePerSession");
		const periodStart = form.watch("periodStart");
		const periodEnd = form.watch("periodEnd");
		const baseSalary = form.watch("baseSalary");
		const bonuses = form.watch("bonuses");
		const deductions = form.watch("deductions");

		// Query coach sessions when coach and dates are set (for per_session type)
		const shouldFetchSessions =
			!isEditing &&
			staffType === PayrollStaffType.coach &&
			coachPaymentType === CoachPaymentType.perSession &&
			coachId &&
			periodStart &&
			periodEnd;

		const { data: sessionData, isLoading: isLoadingSessions } =
			trpc.organization.payroll.getCoachSessions.useQuery(
				{
					coachId: coachId!,
					periodStart: new Date(periodStart),
					periodEnd: new Date(periodEnd),
				},
				{
					enabled: !!shouldFetchSessions,
				},
			);

		// Calculate total based on payment type
		const calculatedBaseSalary =
			coachPaymentType === CoachPaymentType.perSession && sessionData
				? sessionData.completedSessions * (ratePerSession || 0)
				: baseSalary || 0;

		const totalAmount =
			calculatedBaseSalary + (bonuses || 0) - (deductions || 0);

		const onSubmit = form.handleSubmit((data: PayrollFormValues) => {
			// Convert date strings to Date objects
			const periodStartDate = new Date(data.periodStart);
			const periodEndDate = new Date(data.periodEnd);

			if (isEditing) {
				updatePayrollMutation.mutate({
					id: payroll.id,
					periodStart: periodStartDate,
					periodEnd: periodEndDate,
					periodType: data.periodType,
					baseSalary: Math.round(data.baseSalary * 100),
					bonuses: Math.round(data.bonuses * 100),
					deductions: Math.round(data.deductions * 100),
					concept: data.concept || null,
					notes: data.notes || null,
				});
			} else {
				// Create based on staff type
				if (data.staffType === PayrollStaffType.coach && data.coachId) {
					const isPerSession =
						data.coachPaymentType === CoachPaymentType.perSession;
					createPayrollMutation.mutate({
						staffType: PayrollStaffType.coach,
						coachId: data.coachId,
						coachPaymentType: data.coachPaymentType ?? CoachPaymentType.fixed,
						ratePerSession: isPerSession
							? Math.round((data.ratePerSession ?? 0) * 100)
							: undefined,
						sessionCount: isPerSession
							? sessionData?.completedSessions
							: undefined,
						periodStart: periodStartDate,
						periodEnd: periodEndDate,
						periodType: data.periodType,
						baseSalary: isPerSession
							? 0 // Will be calculated on backend
							: Math.round(data.baseSalary * 100),
						bonuses: Math.round(data.bonuses * 100),
						deductions: Math.round(data.deductions * 100),
						concept: data.concept,
						notes: data.notes,
					});
				} else if (
					data.staffType === PayrollStaffType.external &&
					data.externalName
				) {
					createPayrollMutation.mutate({
						staffType: PayrollStaffType.external,
						externalName: data.externalName,
						externalEmail: data.externalEmail || undefined,
						periodStart: periodStartDate,
						periodEnd: periodEndDate,
						periodType: data.periodType,
						baseSalary: Math.round(data.baseSalary * 100),
						bonuses: Math.round(data.bonuses * 100),
						deductions: Math.round(data.deductions * 100),
						concept: data.concept,
						notes: data.notes,
					});
				}
			}
		});

		const isPending =
			createPayrollMutation.isPending || updatePayrollMutation.isPending;

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
							{isEditing ? "Editar Liquidacion" : "Nueva Liquidacion"}
						</SheetTitle>
						<SheetDescription className="sr-only">
							{isEditing
								? "Actualiza los datos de la liquidacion."
								: "Completa los datos para crear una nueva liquidacion."}
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form
							onSubmit={onSubmit}
							className="flex flex-1 flex-col overflow-hidden"
						>
							<ScrollArea className="flex-1">
								<div className="space-y-4 px-6 py-4">
									{/* Staff Type Selection (only for create) */}
									{!isEditing && (
										<FormField
											control={form.control}
											name="staffType"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Tipo de Personal</FormLabel>
														<Select
															onValueChange={field.onChange}
															defaultValue={field.value}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Seleccionar tipo" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value={PayrollStaffType.coach}>
																	Coach
																</SelectItem>
																<SelectItem value={PayrollStaffType.external}>
																	Externo
																</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>
									)}

									{/* Coach Selection */}
									{!isEditing && staffType === PayrollStaffType.coach && (
										<>
											<FormField
												control={form.control}
												name="coachId"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Coach</FormLabel>
															<Select
																onValueChange={field.onChange}
																defaultValue={field.value}
															>
																<FormControl>
																	<SelectTrigger className="w-full">
																		<SelectValue placeholder="Seleccionar coach" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{staffData?.coaches.map((coach) => (
																		<SelectItem key={coach.id} value={coach.id}>
																			{coach.name} - {coach.specialty}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>

											{/* Coach Payment Type */}
											<FormField
												control={form.control}
												name="coachPaymentType"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Tipo de Pago</FormLabel>
															<Select
																onValueChange={field.onChange}
																defaultValue={field.value}
															>
																<FormControl>
																	<SelectTrigger className="w-full">
																		<SelectValue placeholder="Seleccionar tipo" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	<SelectItem value={CoachPaymentType.fixed}>
																		{coachPaymentTypeLabels.fixed}
																	</SelectItem>
																	<SelectItem
																		value={CoachPaymentType.perSession}
																	>
																		{coachPaymentTypeLabels.per_session}
																	</SelectItem>
																</SelectContent>
															</Select>
															<FormDescription>
																{field.value === CoachPaymentType.perSession
																	? "Se calculara automaticamente segun las sesiones completadas"
																	: "Ingrese el monto fijo del sueldo base"}
															</FormDescription>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>

											{/* Rate per Session (only for per_session type) */}
											{coachPaymentType === CoachPaymentType.perSession && (
												<FormField
													control={form.control}
													name="ratePerSession"
													render={({ field }) => (
														<FormItem asChild>
															<Field>
																<FormLabel>Tarifa por Sesion ($)</FormLabel>
																<FormControl>
																	<Input
																		type="number"
																		min="0"
																		step="0.01"
																		placeholder="0.00"
																		{...field}
																		value={field.value ?? 0}
																		onChange={(e) =>
																			field.onChange(
																				parseFloat(e.target.value) || 0,
																			)
																		}
																	/>
																</FormControl>
																<FormMessage />
															</Field>
														</FormItem>
													)}
												/>
											)}

											{/* Session count display */}
											{coachPaymentType === CoachPaymentType.perSession &&
												coachId && (
													<div className="rounded-lg border bg-muted/50 p-4 space-y-2">
														<div className="flex justify-between items-center">
															<span className="text-sm text-muted-foreground">
																Sesiones en el periodo:
															</span>
															{isLoadingSessions ? (
																<Loader2 className="h-4 w-4 animate-spin" />
															) : (
																<span className="font-medium">
																	{sessionData?.completedSessions ?? 0}{" "}
																	completadas /{" "}
																	{sessionData?.totalSessions ?? 0} totales
																</span>
															)}
														</div>
														{sessionData && ratePerSession ? (
															<div className="flex justify-between border-t pt-2">
																<span className="text-sm font-medium">
																	Calculo:
																</span>
																<span className="text-sm">
																	{sessionData.completedSessions} sesiones x $
																	{ratePerSession.toLocaleString("es-AR", {
																		minimumFractionDigits: 2,
																	})}{" "}
																	= $
																	{(
																		sessionData.completedSessions *
																		ratePerSession
																	).toLocaleString("es-AR", {
																		minimumFractionDigits: 2,
																	})}
																</span>
															</div>
														) : null}
													</div>
												)}
										</>
									)}

									{/* External Staff Fields */}
									{!isEditing && staffType === PayrollStaffType.external && (
										<>
											<FormField
												control={form.control}
												name="externalName"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Nombre</FormLabel>
															<FormControl>
																<Input
																	placeholder="Nombre del contratista"
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
												name="externalEmail"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Email (opcional)</FormLabel>
															<FormControl>
																<Input
																	type="email"
																	placeholder="email@ejemplo.com"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</>
									)}

									{/* Period Type */}
									<FormField
										control={form.control}
										name="periodType"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Tipo de Periodo</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
													>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Seleccionar periodo" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{PayrollPeriodTypes.map((type) => (
																<SelectItem key={type} value={type}>
																	{periodTypeLabels[type] || capitalize(type)}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									{/* Period Dates */}
									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="periodStart"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Inicio Periodo</FormLabel>
														<FormControl>
															<Input type="date" {...field} />
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="periodEnd"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Fin Periodo</FormLabel>
														<FormControl>
															<Input type="date" {...field} />
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>
									</div>

									{/* Amounts - Base Salary (hidden for per_session coach) */}
									{!(
										staffType === PayrollStaffType.coach &&
										coachPaymentType === CoachPaymentType.perSession
									) && (
										<FormField
											control={form.control}
											name="baseSalary"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Sueldo Base ($)</FormLabel>
														<FormControl>
															<Input
																type="number"
																min="0"
																step="0.01"
																placeholder="0.00"
																{...field}
																onChange={(e) =>
																	field.onChange(
																		parseFloat(e.target.value) || 0,
																	)
																}
															/>
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>
									)}

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="bonuses"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Bonificaciones ($)</FormLabel>
														<FormControl>
															<Input
																type="number"
																min="0"
																step="0.01"
																placeholder="0.00"
																{...field}
																onChange={(e) =>
																	field.onChange(
																		parseFloat(e.target.value) || 0,
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
											name="deductions"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Deducciones ($)</FormLabel>
														<FormControl>
															<Input
																type="number"
																min="0"
																step="0.01"
																placeholder="0.00"
																{...field}
																onChange={(e) =>
																	field.onChange(
																		parseFloat(e.target.value) || 0,
																	)
																}
															/>
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>
									</div>

									{/* Total Display */}
									<div className="rounded-lg border bg-muted/50 p-4 space-y-2">
										{coachPaymentType === CoachPaymentType.perSession && (
											<div className="flex justify-between text-sm">
												<span className="text-muted-foreground">
													Sueldo Base (calculado):
												</span>
												<span>
													$
													{calculatedBaseSalary.toLocaleString("es-AR", {
														minimumFractionDigits: 2,
													})}
												</span>
											</div>
										)}
										{(bonuses || 0) > 0 && (
											<div className="flex justify-between text-sm">
												<span className="text-muted-foreground">
													+ Bonificaciones:
												</span>
												<span>
													$
													{(bonuses || 0).toLocaleString("es-AR", {
														minimumFractionDigits: 2,
													})}
												</span>
											</div>
										)}
										{(deductions || 0) > 0 && (
											<div className="flex justify-between text-sm">
												<span className="text-muted-foreground">
													- Deducciones:
												</span>
												<span>
													$
													{(deductions || 0).toLocaleString("es-AR", {
														minimumFractionDigits: 2,
													})}
												</span>
											</div>
										)}
										<div className="flex justify-between border-t pt-2">
											<span className="font-medium">Total a Pagar:</span>
											<span className="font-bold text-lg">
												$
												{totalAmount.toLocaleString("es-AR", {
													minimumFractionDigits: 2,
												})}
											</span>
										</div>
									</div>

									{/* Concept */}
									<FormField
										control={form.control}
										name="concept"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Concepto</FormLabel>
													<FormControl>
														<Input
															placeholder="Ej: Sueldo Enero 2026"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									{/* Notes */}
									<FormField
										control={form.control}
										name="notes"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Notas</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Notas adicionales..."
															className="resize-none"
															rows={3}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
								</div>
							</ScrollArea>

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
									{isEditing ? "Actualizar" : "Crear Liquidacion"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
