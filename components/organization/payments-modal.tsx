"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	BanknoteIcon,
	ChevronsUpDownIcon,
	Loader2Icon,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	ProfileEditGrid,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { PaymentReceiptModal } from "@/components/organization/receipt-modal";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
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
import { useDebounce } from "@/hooks/use-debounce";
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
	/** When set, the session is fixed and cannot be changed (used from session detail) */
	fixedSessionId?: string;
	/** When set, only these athletes are shown in the selector (used from session detail) */
	fixedAthletes?: { id: string; name: string }[];
};

export const PaymentsModal = NiceModal.create<PaymentsModalProps>(
	({ payment, fixedSessionId, fixedAthletes }) => {
		const t = useTranslations("finance.payments");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!payment;

		// Session search state
		const [sessionPopoverOpen, setSessionPopoverOpen] = React.useState(false);
		const [sessionSearchQuery, setSessionSearchQuery] = React.useState("");
		const debouncedSessionQuery = useDebounce(sessionSearchQuery, 300);
		const shouldSearchSessions = debouncedSessionQuery.length >= 2;

		const { data: sessionsData, isFetching: isSearchingSessions } =
			trpc.organization.trainingSession.list.useQuery(
				{
					limit: 20,
					offset: 0,
					query: debouncedSessionQuery,
					sortBy: "startTime",
					sortOrder: "desc",
				},
				{
					enabled: shouldSearchSessions,
					staleTime: 10000,
				},
			);

		// Track selected session label for display
		const [selectedSessionLabel, setSelectedSessionLabel] = React.useState<
			string | null
		>(null);

		// Athlete search state
		const [athletePopoverOpen, setAthletePopoverOpen] = React.useState(false);
		const [athleteSearchQuery, setAthleteSearchQuery] = React.useState("");
		const debouncedAthleteQuery = useDebounce(athleteSearchQuery, 300);
		const shouldSearchAthletes =
			!fixedAthletes && debouncedAthleteQuery.length >= 2;

		const { data: athletesData, isFetching: isSearchingAthletes } =
			trpc.organization.athlete.list.useQuery(
				{
					limit: 20,
					offset: 0,
					query: debouncedAthleteQuery,
				},
				{
					enabled: shouldSearchAthletes,
					staleTime: 10000,
				},
			);

		// Track selected athlete label for display
		const [selectedAthleteLabel, setSelectedAthleteLabel] = React.useState<
			string | null
		>(null);

		const sessions = sessionsData?.sessions ?? [];

		// When fixedAthletes is provided, filter locally; otherwise use tRPC results
		// Normalize to common shape {id, name}
		const athletes: { id: string; name: string }[] = fixedAthletes
			? fixedAthletes.filter((a) =>
					a.name.toLowerCase().includes(athleteSearchQuery.toLowerCase()),
				)
			: (athletesData?.athletes ?? []).map((a) => ({
					id: a.id,
					name: a.user?.name ?? "Unknown",
				}));

		const createPaymentMutation =
			trpc.organization.trainingPayment.create.useMutation({
				onSuccess: (data) => {
					toast.success(t("success.created"));
					utils.organization.trainingPayment.invalidate();
					modal.handleClose();
					const method = form.getValues("paymentMethod");
					if (data?.id && method === "bank_transfer") {
						NiceModal.show(PaymentReceiptModal, {
							paymentId: data.id,
							hasReceipt: false,
						});
					}
				},
				onError: (error) => {
					toast.error(error.message || t("error.createFailed"));
				},
			});

		const updatePaymentMutation =
			trpc.organization.trainingPayment.update.useMutation({
				onSuccess: () => {
					toast.success(t("success.updated"));
					utils.organization.trainingPayment.invalidate();
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
						sessionId: fixedSessionId ?? null,
						athleteId: null,
						amount: 0,
						currency: "ARS",
						status: TrainingPaymentStatus.paid,
						paymentMethod: "cash",
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
								{!fixedSessionId && (
									<FormField
										control={form.control}
										name="sessionId"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("form.session")}</FormLabel>
													<Popover
														open={sessionPopoverOpen}
														onOpenChange={setSessionPopoverOpen}
													>
														<PopoverTrigger asChild>
															<FormControl>
																<Button
																	variant="outline"
																	className="w-full justify-between font-normal"
																>
																	{selectedSessionLabel ?? (
																		<span className="text-muted-foreground">
																			{t("form.selectSession")}
																		</span>
																	)}
																	<div className="flex items-center gap-1">
																		{field.value && (
																			<span
																				role="button"
																				tabIndex={0}
																				className="rounded-sm p-0.5 hover:bg-muted"
																				onClick={(e) => {
																					e.stopPropagation();
																					field.onChange(null);
																					setSelectedSessionLabel(null);
																					setSessionSearchQuery("");
																				}}
																				onKeyDown={(e) => {
																					if (
																						e.key === "Enter" ||
																						e.key === " "
																					) {
																						e.preventDefault();
																						e.stopPropagation();
																						field.onChange(null);
																						setSelectedSessionLabel(null);
																						setSessionSearchQuery("");
																					}
																				}}
																			>
																				<XIcon className="size-3.5 text-muted-foreground" />
																			</span>
																		)}
																		<ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
																	</div>
																</Button>
															</FormControl>
														</PopoverTrigger>
														<PopoverContent
															className="w-[350px] p-0"
															align="start"
														>
															<Command shouldFilter={false}>
																<CommandInput
																	placeholder={t("form.searchSession")}
																	value={sessionSearchQuery}
																	onValueChange={setSessionSearchQuery}
																/>
																<CommandList>
																	{!shouldSearchSessions && (
																		<div className="py-6 text-center text-muted-foreground text-sm">
																			{t("form.typeToSearchSession")}
																		</div>
																	)}
																	{shouldSearchSessions &&
																		isSearchingSessions && (
																			<div className="flex items-center justify-center py-6">
																				<Loader2Icon className="size-5 animate-spin text-muted-foreground" />
																			</div>
																		)}
																	{shouldSearchSessions &&
																		!isSearchingSessions &&
																		sessions.length === 0 && (
																			<CommandEmpty>
																				{t("form.noSessionsFound")}
																			</CommandEmpty>
																		)}
																	{shouldSearchSessions &&
																		!isSearchingSessions &&
																		sessions.length > 0 && (
																			<CommandGroup>
																				{sessions.map((session) => {
																					const label = `${session.title} - ${format(session.startTime, "dd/MM/yyyy")}`;
																					return (
																						<CommandItem
																							key={session.id}
																							value={session.id}
																							onSelect={() => {
																								field.onChange(session.id);
																								setSelectedSessionLabel(label);
																								setSessionPopoverOpen(false);
																								setSessionSearchQuery("");
																							}}
																						>
																							<span>{label}</span>
																						</CommandItem>
																					);
																				})}
																			</CommandGroup>
																		)}
																</CommandList>
															</Command>
														</PopoverContent>
													</Popover>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
								)}

								<FormField
									control={form.control}
									name="athleteId"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>{t("form.athleteOptional")}</FormLabel>
												{fixedAthletes ? (
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
															{fixedAthletes.map((athlete) => (
																<SelectItem key={athlete.id} value={athlete.id}>
																	{athlete.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												) : (
													<Popover
														open={athletePopoverOpen}
														onOpenChange={setAthletePopoverOpen}
													>
														<PopoverTrigger asChild>
															<FormControl>
																<Button
																	variant="outline"
																	className="w-full justify-between font-normal"
																>
																	{selectedAthleteLabel ?? (
																		<span className="text-muted-foreground">
																			{t("form.selectAthlete")}
																		</span>
																	)}
																	<div className="flex items-center gap-1">
																		{field.value && (
																			<span
																				role="button"
																				tabIndex={0}
																				className="rounded-sm p-0.5 hover:bg-muted"
																				onClick={(e) => {
																					e.stopPropagation();
																					field.onChange(null);
																					setSelectedAthleteLabel(null);
																					setAthleteSearchQuery("");
																				}}
																				onKeyDown={(e) => {
																					if (
																						e.key === "Enter" ||
																						e.key === " "
																					) {
																						e.preventDefault();
																						e.stopPropagation();
																						field.onChange(null);
																						setSelectedAthleteLabel(null);
																						setAthleteSearchQuery("");
																					}
																				}}
																			>
																				<XIcon className="size-3.5 text-muted-foreground" />
																			</span>
																		)}
																		<ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
																	</div>
																</Button>
															</FormControl>
														</PopoverTrigger>
														<PopoverContent
															className="w-[350px] p-0"
															align="start"
														>
															<Command shouldFilter={false}>
																<CommandInput
																	placeholder={t("form.searchAthlete")}
																	value={athleteSearchQuery}
																	onValueChange={setAthleteSearchQuery}
																/>
																<CommandList>
																	{!shouldSearchAthletes && (
																		<div className="py-6 text-center text-muted-foreground text-sm">
																			{t("form.typeToSearchAthlete")}
																		</div>
																	)}
																	{shouldSearchAthletes &&
																		isSearchingAthletes && (
																			<div className="flex items-center justify-center py-6">
																				<Loader2Icon className="size-5 animate-spin text-muted-foreground" />
																			</div>
																		)}
																	{shouldSearchAthletes &&
																		!isSearchingAthletes &&
																		athletes.length === 0 && (
																			<CommandEmpty>
																				{t("form.noAthletesFound")}
																			</CommandEmpty>
																		)}
																	{shouldSearchAthletes &&
																		!isSearchingAthletes &&
																		athletes.length > 0 && (
																			<CommandGroup>
																				{athletes.map((athlete) => (
																					<CommandItem
																						key={athlete.id}
																						value={athlete.id}
																						onSelect={() => {
																							field.onChange(athlete.id);
																							setSelectedAthleteLabel(
																								athlete.name,
																							);
																							setAthletePopoverOpen(false);
																							setAthleteSearchQuery("");
																						}}
																					>
																						<span>{athlete.name}</span>
																					</CommandItem>
																				))}
																			</CommandGroup>
																		)}
																</CommandList>
															</Command>
														</PopoverContent>
													</Popover>
												)}
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

						{/* Receipt - Only show when editing */}
						{isEditing && payment && (
							<Field>
								<FormLabel>{t("form.receiptUpload")}</FormLabel>
								<Button
									type="button"
									variant="outline"
									className="w-full justify-start"
									onClick={() => {
										NiceModal.show(PaymentReceiptModal, {
											paymentId: payment.id,
											hasReceipt: !!payment.receiptImageKey,
										});
									}}
								>
									{t(
										`receipt.${payment.receiptImageKey ? "hasReceipt" : "noReceipt"}`,
									)}
								</Button>
							</Field>
						)}
					</ProfileEditSection>
				</div>
			</ProfileEditSheet>
		);
	},
);
