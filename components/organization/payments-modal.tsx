"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	BanknoteIcon,
	CheckIcon,
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
		type?: string;
		sessionId?: string | null;
		athleteId?: string | null;
		registrationId?: string | null;
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
		registration?: {
			id: string;
			registrantName: string;
			event: {
				id: string;
				title: string;
			} | null;
		} | null;
		session?: {
			id: string;
			title: string;
		} | null;
		athlete?: {
			id: string;
			user: {
				id: string;
				name: string;
			} | null;
		} | null;
	};
	/** When set, the session is fixed and cannot be changed (used from session detail) */
	fixedSessionId?: string;
	/** When set, these sessions are pre-selected (for package payments) */
	fixedSessionIds?: string[];
	/** When set, only these athletes are shown in the selector (used from session detail) */
	fixedAthletes?: { id: string; name: string }[];
	/** When set, shows event payment flow with registration selector */
	fixedEventId?: string;
};

type SelectedSession = {
	id: string;
	label: string;
};

export const PaymentsModal = NiceModal.create<PaymentsModalProps>(
	({
		payment,
		fixedSessionId,
		fixedSessionIds,
		fixedAthletes,
		fixedEventId,
	}) => {
		const t = useTranslations("finance.payments");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!payment;

		// Session search state
		const [sessionPopoverOpen, setSessionPopoverOpen] = React.useState(false);
		const [sessionSearchQuery, setSessionSearchQuery] = React.useState("");
		const debouncedSessionQuery = useDebounce(sessionSearchQuery, 300);
		const shouldSearchSessions = debouncedSessionQuery.length >= 2;

		// Track selected athlete for session filtering
		const [sessionAthleteFilter, setSessionAthleteFilter] = React.useState<
			string | null
		>(null);

		const { data: sessionsData, isFetching: isSearchingSessions } =
			trpc.organization.trainingSession.list.useQuery(
				{
					limit: 20,
					offset: 0,
					query: debouncedSessionQuery,
					sortBy: "startTime",
					sortOrder: "desc",
					...(sessionAthleteFilter
						? { filters: { athleteId: sessionAthleteFilter } }
						: {}),
				},
				{
					enabled: shouldSearchSessions,
					staleTime: 10000,
				},
			);

		// Track selected sessions for display (multiple)
		const [selectedSessions, setSelectedSessions] = React.useState<
			SelectedSession[]
		>([]);

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

		// Service selection state (for when no session is selected)
		const [servicePopoverOpen, setServicePopoverOpen] = React.useState(false);
		const [serviceSearchQuery, setServiceSearchQuery] = React.useState("");

		// Fetch all active services for the organization
		const { data: servicesData, isFetching: isLoadingServices } =
			trpc.organization.service.list.useQuery(
				{ limit: 50, offset: 0, filters: { status: ["active"] } },
				{ staleTime: 30000 },
			);

		// Track selected service label for display
		const [selectedServiceLabel, setSelectedServiceLabel] = React.useState<
			string | null
		>(null);

		// Event selection state (for event-type payments)
		const [eventPopoverOpen, setEventPopoverOpen] = React.useState(false);
		const [selectedEventLabel, setSelectedEventLabel] = React.useState<
			string | null
		>(null);
		const [paymentType, setPaymentType] = React.useState<"training" | "event">(
			"training",
		);

		// Event payment state (when fixedEventId is set)
		const [selectedRegistrationId, setSelectedRegistrationId] = React.useState<
			string | null
		>(null);

		const { data: eventRegistrationsData } =
			trpc.organization.sportsEvent.listRegistrations.useQuery(
				{ eventId: fixedEventId!, limit: 100, offset: 0 },
				{ enabled: !!fixedEventId && !isEditing },
			);

		const eventRegistrations = eventRegistrationsData?.registrations ?? [];

		const selectedEventReg = React.useMemo(() => {
			if (!selectedRegistrationId) return null;
			return (
				eventRegistrations.find((r) => r.id === selectedRegistrationId) ?? null
			);
		}, [selectedRegistrationId, eventRegistrations]);

		const eventRemainingAmount = selectedEventReg
			? selectedEventReg.price - selectedEventReg.paidAmount
			: 0;

		const createEventPaymentMutation =
			trpc.organization.sportsEvent.createPayment.useMutation({
				onSuccess: () => {
					toast.success(t("success.created"));
					utils.organization.sportsEvent.listPayments.invalidate();
					utils.organization.sportsEvent.listRegistrations.invalidate();
					utils.organization.sportsEvent.get.invalidate();
					utils.organization.eventOrganization.getProjection.invalidate();
					utils.organization.trainingPayment.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.createFailed"));
				},
			});

		const sessions = sessionsData?.sessions ?? [];
		const services = (servicesData?.items ?? []).filter((s) =>
			s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()),
		);

		const createPaymentMutation =
			trpc.organization.trainingPayment.create.useMutation({
				onSuccess: (data) => {
					toast.success(t("success.created"));
					utils.organization.trainingPayment.invalidate();
					// Invalidate event data if event payment was created
					if (paymentType === "event") {
						utils.organization.sportsEvent.listPayments.invalidate();
						utils.organization.sportsEvent.listRegistrations.invalidate();
						utils.organization.eventOrganization.getProjection.invalidate();
					}
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
					// Invalidate event projection if editing an event payment
					if (payment?.type === "event") {
						utils.organization.sportsEvent.listPayments.invalidate();
						utils.organization.sportsEvent.listRegistrations.invalidate();
						utils.organization.eventOrganization.getProjection.invalidate();
					}
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.updateFailed"));
				},
			});

		// Determine initial session IDs
		const initialSessionIds = React.useMemo(() => {
			if (fixedSessionId) return [fixedSessionId];
			if (fixedSessionIds?.length) return fixedSessionIds;
			return [];
		}, [fixedSessionId, fixedSessionIds]);

		// Determine initial athlete ID (when only one fixed athlete)
		const initialAthleteId = React.useMemo(() => {
			if (fixedAthletes?.length === 1) return fixedAthletes[0]?.id ?? null;
			return null;
		}, [fixedAthletes]);

		// Check if athlete is locked (only one fixed athlete)
		const isAthleteLocked = fixedAthletes?.length === 1;

		const form = useZodForm({
			schema: isEditing
				? updateTrainingPaymentSchema
				: createTrainingPaymentSchema,
			defaultValues: isEditing
				? {
						id: payment.id,
						amount: payment.amount / 100,
						status: payment.status as TrainingPaymentStatus,
						paymentMethod:
							(payment.paymentMethod as TrainingPaymentMethod) ?? null,
						paidAmount: payment.paidAmount / 100,
						paymentDate: payment.paymentDate ?? undefined,
						receiptNumber: payment.receiptNumber ?? "",
						description: payment.description ?? "",
						notes: payment.notes ?? "",
					}
				: {
						type: "training",
						registrationId: null,
						sessionId: null, // Keep for backwards compatibility
						sessionIds: initialSessionIds,
						athleteId: initialAthleteId,
						serviceId: null,
						amount: 0,
						currency: "ARS",
						status: TrainingPaymentStatus.paid,
						paymentMethod: "cash",
						paidAmount: 0,
						discountPercentage: 0,
						paymentDate: new Date(),
						receiptNumber: "",
						description: "",
						notes: "",
					},
		});

		// Watch fields for conditional logic
		const watchedAthleteId = form.watch("athleteId");
		const primarySessionIds = form.watch("sessionIds") ?? [];
		const watchedServiceId = form.watch("serviceId");

		// Fetch events for the selected athlete
		const { data: athleteEventsData } =
			trpc.organization.trainingPayment.listEventsForAthlete.useQuery(
				{ athleteId: watchedAthleteId! },
				{
					enabled: !!watchedAthleteId && !isEditing,
					staleTime: 10000,
				},
			);
		const athleteEvents = athleteEventsData ?? [];

		// For backwards compatibility, use first session for service/athlete logic
		const primarySessionId = primarySessionIds[0] ?? null;

		// Fetch first session details (includes athletes and service)
		const { data: selectedSessionData } =
			trpc.organization.trainingSession.get.useQuery(
				{ id: primarySessionId! },
				{ enabled: !!primarySessionId && !fixedSessionId },
			);

		// Get athletes from the selected session
		const sessionAthletes = React.useMemo(() => {
			if (!selectedSessionData) return [];

			// Combine direct athletes and group members
			const directAthletes =
				selectedSessionData.athletes?.map((sa) => ({
					id: sa.athlete.id,
					name: sa.athlete.user?.name ?? sa.athlete.id,
				})) ?? [];

			const groupAthletes =
				selectedSessionData.athleteGroup?.members?.map((m) => ({
					id: m.athlete.id,
					name: m.athlete.user?.name ?? m.athlete.id,
				})) ?? [];

			// Dedupe by id
			const allAthletes = [...directAthletes, ...groupAthletes];
			const uniqueAthletes = allAthletes.filter(
				(a, index, self) => self.findIndex((b) => b.id === a.id) === index,
			);

			return uniqueAthletes;
		}, [selectedSessionData]);

		// Determine athletes to show based on context:
		// 1. fixedAthletes (from parent) -> use those
		// 2. Session selected -> use sessionAthletes (no search needed)
		// 3. No session -> use search results
		const athletes: { id: string; name: string }[] = React.useMemo(() => {
			if (fixedAthletes) {
				return fixedAthletes.filter((a) =>
					a.name.toLowerCase().includes(athleteSearchQuery.toLowerCase()),
				);
			}
			if (primarySessionId && sessionAthletes.length > 0) {
				// Filter session athletes by search query
				return sessionAthletes.filter((a) =>
					a.name.toLowerCase().includes(athleteSearchQuery.toLowerCase()),
				);
			}
			// Fall back to search results
			return (athletesData?.athletes ?? []).map((a) => ({
				id: a.id,
				name: a.user?.name ?? "Unknown",
			}));
		}, [
			fixedAthletes,
			primarySessionId,
			sessionAthletes,
			athleteSearchQuery,
			athletesData,
		]);

		// Should show session athletes directly (without needing to search)
		const showSessionAthletes = !!primarySessionId && !fixedAthletes;

		// Determine if session has a linked service
		const sessionService =
			selectedSessionData?.service ??
			selectedSessionData?.athleteGroup?.service;
		const sessionHasService = !!sessionService;

		// Fetch service price for selected session
		const { data: sessionServicePriceData } =
			trpc.organization.trainingPayment.getServicePriceForSession.useQuery(
				{ sessionId: primarySessionId! },
				{ enabled: !!primarySessionId && !isEditing },
			);

		// Fetch service price directly (when no session is selected or session has no service)
		const { data: directServicePriceData } =
			trpc.organization.trainingPayment.getServicePrice.useQuery(
				{ serviceId: watchedServiceId! },
				{ enabled: !!watchedServiceId && !sessionHasService && !isEditing },
			);

		// Set serviceId from session when session has a service
		React.useEffect(() => {
			if (primarySessionId && sessionService && !isEditing) {
				form.setValue("serviceId", sessionService.id);
				const priceFormatted = new Intl.NumberFormat("es-AR", {
					style: "currency",
					currency: sessionService.currency,
					minimumFractionDigits: 0,
				}).format(sessionService.currentPrice / 100);
				setSelectedServiceLabel(`${sessionService.name} - ${priceFormatted}`);
			} else if (!primarySessionId && !isEditing) {
				// Clear service when session is cleared (only if not editing)
				form.setValue("serviceId", null);
				setSelectedServiceLabel(null);
			}
		}, [primarySessionId, sessionService, isEditing, form]);

		// Auto-fill amount from session's service price
		React.useEffect(() => {
			if (sessionServicePriceData?.price && !isEditing) {
				const currentAmount = form.getValues("amount");
				if (currentAmount === 0) {
					form.setValue("amount", sessionServicePriceData.price / 100);
					form.setValue("paidAmount", sessionServicePriceData.price / 100);
				}
			}
		}, [sessionServicePriceData, isEditing, form]);

		// Auto-fill amount from direct service price (when no session)
		React.useEffect(() => {
			if (directServicePriceData?.price && !primarySessionId && !isEditing) {
				const currentAmount = form.getValues("amount");
				if (currentAmount === 0) {
					form.setValue("amount", directServicePriceData.price / 100);
					form.setValue("paidAmount", directServicePriceData.price / 100);
				}
			}
		}, [directServicePriceData, primarySessionId, isEditing, form]);

		// Determine which service price data to show in the form
		const servicePriceData = primarySessionId
			? sessionServicePriceData
			: directServicePriceData;

		const onSubmit = form.handleSubmit((data) => {
			// Event payment flow - use sportsEvent.createPayment
			if (fixedEventId && !isEditing && selectedRegistrationId) {
				createEventPaymentMutation.mutate({
					registrationId: selectedRegistrationId,
					amount: Math.round((data.amount ?? 0) * 100),
					paymentMethod: (data.paymentMethod ?? "cash") as Parameters<
						typeof createEventPaymentMutation.mutate
					>[0]["paymentMethod"],
					paymentDate: data.paymentDate ?? undefined,
					receiptNumber: data.receiptNumber || undefined,
					notes: data.notes || undefined,
				});
				return;
			}

			const transformedData = {
				...data,
				amount: Math.round((data.amount ?? 0) * 100),
				paidAmount: Math.round((data.paidAmount ?? 0) * 100),
			};
			if (isEditing) {
				updatePaymentMutation.mutate(
					transformedData as Parameters<typeof updatePaymentMutation.mutate>[0],
				);
			} else {
				createPaymentMutation.mutate(
					transformedData as Parameters<typeof createPaymentMutation.mutate>[0],
				);
			}
		});

		// Reset form and local state when modal opens for creation
		const prevVisibleRef = React.useRef(false);
		React.useEffect(() => {
			if (modal.visible && !prevVisibleRef.current && !isEditing) {
				form.reset({
					type: "training",
					registrationId: null,
					sessionId: null,
					sessionIds: initialSessionIds,
					athleteId: initialAthleteId,
					serviceId: null,
					amount: 0,
					currency: "ARS",
					status: TrainingPaymentStatus.paid,
					paymentMethod: "cash",
					paidAmount: 0,
					discountPercentage: 0,
					paymentDate: new Date(),
					receiptNumber: "",
					description: "",
					notes: "",
				});
				setSelectedSessions([]);
				setSelectedAthleteLabel(null);
				setSelectedServiceLabel(null);
				setSelectedEventLabel(null);
				setPaymentType("training");
				setSessionSearchQuery("");
				setAthleteSearchQuery("");
				setServiceSearchQuery("");
				setSessionAthleteFilter(null);
				setSelectedRegistrationId(null);
			}
			prevVisibleRef.current = modal.visible;
		}, [modal.visible, isEditing, form, initialSessionIds, initialAthleteId]);

		const isPending =
			createPaymentMutation.isPending ||
			updatePaymentMutation.isPending ||
			createEventPaymentMutation.isPending;

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

						{/* Show linked context when editing */}
						{isEditing && payment?.athlete?.user?.name && (
							<Field>
								<FormLabel>{t("form.athlete")}</FormLabel>
								<Input
									value={payment.athlete.user.name}
									disabled
									className="bg-muted"
								/>
							</Field>
						)}
						{isEditing && payment?.type === "event" && payment.registration && (
							<Field>
								<FormLabel>{t("form.event")}</FormLabel>
								<Input
									value={`${payment.registration.event?.title ?? ""} - ${payment.registration.registrantName}`}
									disabled
									className="bg-muted"
								/>
								<FormDescription className="text-xs text-blue-600">
									{t("form.eventSelected")}
								</FormDescription>
							</Field>
						)}
						{isEditing && payment?.session && (
							<Field>
								<FormLabel>{t("form.session")}</FormLabel>
								<Input
									value={payment.session.title}
									disabled
									className="bg-muted"
								/>
							</Field>
						)}

						{/* Event registration flow when fixedEventId is set */}
						{!isEditing && fixedEventId && (
							<>
								<Field>
									<FormLabel>{t("form.registration")}</FormLabel>
									<Select
										onValueChange={(value) => {
											setSelectedRegistrationId(
												value === "none" ? null : value,
											);
											if (value !== "none") {
												const reg = eventRegistrations.find(
													(r) => r.id === value,
												);
												if (reg) {
													const remaining = reg.price - reg.paidAmount;
													if (remaining > 0) {
														form.setValue("amount", remaining / 100);
														form.setValue("paidAmount", remaining / 100);
													}
												}
											}
										}}
										value={selectedRegistrationId ?? "none"}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder={t("form.selectRegistration")} />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">
												{t("form.selectRegistration")}
											</SelectItem>
											{eventRegistrations.map((reg) => (
												<SelectItem key={reg.id} value={reg.id}>
													#{reg.registrationNumber} - {reg.registrantName}
													{reg.price - reg.paidAmount > 0 && (
														<span className="text-muted-foreground ml-2">
															({t("form.owes")}{" "}
															{new Intl.NumberFormat("es-AR", {
																style: "currency",
																currency: reg.currency,
																minimumFractionDigits: 0,
															}).format((reg.price - reg.paidAmount) / 100)}
															)
														</span>
													)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>

								{selectedEventReg && (
									<div className="rounded-lg border bg-muted/50 p-3 space-y-1 text-sm">
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												{t("form.summaryTotal")}
											</span>
											<span className="font-medium">
												{new Intl.NumberFormat("es-AR", {
													style: "currency",
													currency: selectedEventReg.currency,
													minimumFractionDigits: 0,
												}).format(selectedEventReg.price / 100)}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												{t("form.summaryPaid")}
											</span>
											<span className="font-medium">
												{new Intl.NumberFormat("es-AR", {
													style: "currency",
													currency: selectedEventReg.currency,
													minimumFractionDigits: 0,
												}).format(selectedEventReg.paidAmount / 100)}
											</span>
										</div>
										<div className="flex justify-between border-t pt-1">
											<span className="text-muted-foreground">
												{t("form.summaryPending")}
											</span>
											<span className="font-medium text-primary">
												{new Intl.NumberFormat("es-AR", {
													style: "currency",
													currency: selectedEventReg.currency,
													minimumFractionDigits: 0,
												}).format(eventRemainingAmount / 100)}
											</span>
										</div>
									</div>
								)}
							</>
						)}

						{!isEditing && !fixedEventId && (
							<>
								{/* Athlete selector - appears first so sessions can be filtered by athlete */}
								<FormField
									control={form.control}
									name="athleteId"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>
													{isAthleteLocked
														? t("form.athlete")
														: t("form.athleteOptional")}
												</FormLabel>
												{/* When athlete is locked (only one fixed athlete), show read-only */}
												{isAthleteLocked ? (
													<FormControl>
														<Input
															value={fixedAthletes?.[0]?.name ?? ""}
															disabled
															className="bg-muted"
														/>
													</FormControl>
												) : fixedAthletes || showSessionAthletes ? (
													<Select
														onValueChange={(value) => {
															const newValue = value === "none" ? null : value;
															field.onChange(newValue);
															setSessionAthleteFilter(newValue);
															// Clear selected sessions when athlete changes
															form.setValue("sessionIds", []);
															setSelectedSessions([]);
															// Clear event selection when athlete changes
															form.setValue("registrationId", null);
															form.setValue("type", "training");
															setSelectedEventLabel(null);
															setPaymentType("training");
														}}
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
																					setSessionAthleteFilter(null);
																					// Clear selected sessions when athlete is cleared
																					form.setValue("sessionIds", []);
																					setSelectedSessions([]);
																					// Clear event selection
																					form.setValue("registrationId", null);
																					form.setValue("type", "training");
																					setSelectedEventLabel(null);
																					setPaymentType("training");
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
																						setSessionAthleteFilter(null);
																						form.setValue("sessionIds", []);
																						setSelectedSessions([]);
																						// Clear event selection
																						form.setValue(
																							"registrationId",
																							null,
																						);
																						form.setValue("type", "training");
																						setSelectedEventLabel(null);
																						setPaymentType("training");
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
																							setSessionAthleteFilter(
																								athlete.id,
																							);
																							// Clear selected sessions when athlete changes
																							form.setValue("sessionIds", []);
																							setSelectedSessions([]);
																							// Clear event selection when athlete changes
																							form.setValue(
																								"registrationId",
																								null,
																							);
																							form.setValue("type", "training");
																							setSelectedEventLabel(null);
																							setPaymentType("training");
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

								{/* Event selector - only when athlete is selected and not in session-fixed context */}
								{watchedAthleteId && !fixedSessionId && (
									<FormField
										control={form.control}
										name="registrationId"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("form.eventOptional")}</FormLabel>
													<Popover
														open={eventPopoverOpen}
														onOpenChange={setEventPopoverOpen}
													>
														<PopoverTrigger asChild>
															<FormControl>
																<Button
																	variant="outline"
																	className="w-full justify-between font-normal"
																>
																	{selectedEventLabel ?? (
																		<span className="text-muted-foreground">
																			{t("form.selectEvent")}
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
																					setSelectedEventLabel(null);
																					setPaymentType("training");
																					form.setValue("type", "training");
																				}}
																				onKeyDown={(e) => {
																					if (
																						e.key === "Enter" ||
																						e.key === " "
																					) {
																						e.preventDefault();
																						e.stopPropagation();
																						field.onChange(null);
																						setSelectedEventLabel(null);
																						setPaymentType("training");
																						form.setValue("type", "training");
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
																	placeholder={t("form.searchEvent")}
																/>
																<CommandList>
																	{athleteEvents.length === 0 && (
																		<CommandEmpty>
																			{t("form.noEventsFound")}
																		</CommandEmpty>
																	)}
																	{athleteEvents.length > 0 && (
																		<CommandGroup>
																			{athleteEvents.map((reg) => {
																				const eventTitle =
																					reg.event?.title ?? "Evento";
																				const eventDate = reg.event?.startDate
																					? format(
																							reg.event.startDate,
																							"dd/MM/yyyy",
																						)
																					: "";
																				const label = `${eventTitle} - ${reg.registrantName}${eventDate ? ` (${eventDate})` : ""}`;
																				return (
																					<CommandItem
																						key={reg.id}
																						value={reg.id}
																						onSelect={() => {
																							field.onChange(reg.id);
																							setSelectedEventLabel(label);
																							setPaymentType("event");
																							form.setValue("type", "event");
																							setEventPopoverOpen(false);
																							// Auto-fill amount from registration price
																							const currentAmount =
																								form.getValues("amount");
																							if (
																								currentAmount === 0 &&
																								reg.price > 0
																							) {
																								form.setValue(
																									"amount",
																									reg.price / 100,
																								);
																								form.setValue(
																									"paidAmount",
																									reg.price / 100,
																								);
																							}
																							// Auto-fill description
																							const currentDesc =
																								form.getValues("description");
																							if (!currentDesc) {
																								form.setValue(
																									"description",
																									`${eventTitle} - ${reg.registrantName}`,
																								);
																							}
																							// Clear session/service selections
																							form.setValue("sessionIds", []);
																							form.setValue("sessionId", null);
																							form.setValue("serviceId", null);
																							setSelectedSessions([]);
																							setSelectedServiceLabel(null);
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
													{paymentType === "event" && (
														<FormDescription className="text-xs text-blue-600">
															{t("form.eventSelected")}
														</FormDescription>
													)}
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
								)}

								{!fixedSessionId && paymentType !== "event" && (
									<FormField
										control={form.control}
										name="sessionIds"
										render={({ field }) => {
											const currentIds = field.value ?? [];
											const isSelected = (id: string) =>
												currentIds.includes(id);
											const toggleSession = (
												sessionId: string,
												label: string,
											) => {
												if (isSelected(sessionId)) {
													field.onChange(
														currentIds.filter((id: string) => id !== sessionId),
													);
													setSelectedSessions((prev) =>
														prev.filter((s) => s.id !== sessionId),
													);
												} else {
													field.onChange([...currentIds, sessionId]);
													setSelectedSessions((prev) => [
														...prev,
														{ id: sessionId, label },
													]);
												}
											};

											const sessionDisplayLabel =
												selectedSessions.length === 1
													? selectedSessions[0]?.label
													: selectedSessions.length > 1
														? `${selectedSessions.length} ${t("form.sessions").toLowerCase()}`
														: null;

											return (
												<FormItem asChild>
													<Field>
														<FormLabel>{t("form.sessionsOptional")}</FormLabel>
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
																		{sessionDisplayLabel ?? (
																			<span className="text-muted-foreground">
																				{t("form.selectSession")}
																			</span>
																		)}
																		<div className="flex items-center gap-1">
																			{selectedSessions.length > 0 && (
																				<span
																					role="button"
																					tabIndex={0}
																					className="rounded-sm p-0.5 hover:bg-muted"
																					onClick={(e) => {
																						e.stopPropagation();
																						field.onChange([]);
																						setSelectedSessions([]);
																						setSessionSearchQuery("");
																					}}
																					onKeyDown={(e) => {
																						if (
																							e.key === "Enter" ||
																							e.key === " "
																						) {
																							e.preventDefault();
																							e.stopPropagation();
																							field.onChange([]);
																							setSelectedSessions([]);
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
																						const selected = isSelected(
																							session.id,
																						);
																						return (
																							<CommandItem
																								key={session.id}
																								value={session.id}
																								onSelect={() => {
																									toggleSession(
																										session.id,
																										label,
																									);
																									setSessionSearchQuery("");
																								}}
																							>
																								<div
																									className={`mr-2 flex size-4 items-center justify-center rounded-sm border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted"}`}
																								>
																									{selected && (
																										<CheckIcon className="size-3" />
																									)}
																								</div>
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
											);
										}}
									/>
								)}

								{/* Service selector - hidden when session has a linked service or event selected */}
								{!sessionHasService && paymentType !== "event" && (
									<FormField
										control={form.control}
										name="serviceId"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("form.serviceOptional")}</FormLabel>
													<Popover
														open={servicePopoverOpen}
														onOpenChange={setServicePopoverOpen}
													>
														<PopoverTrigger asChild>
															<FormControl>
																<Button
																	variant="outline"
																	className="w-full justify-between font-normal"
																>
																	{selectedServiceLabel ?? (
																		<span className="text-muted-foreground">
																			{t("form.selectService")}
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
																					setSelectedServiceLabel(null);
																					setServiceSearchQuery("");
																					// Reset amount when clearing service
																					form.setValue("amount", 0);
																					form.setValue("paidAmount", 0);
																				}}
																				onKeyDown={(e) => {
																					if (
																						e.key === "Enter" ||
																						e.key === " "
																					) {
																						e.preventDefault();
																						e.stopPropagation();
																						field.onChange(null);
																						setSelectedServiceLabel(null);
																						setServiceSearchQuery("");
																						form.setValue("amount", 0);
																						form.setValue("paidAmount", 0);
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
																	placeholder={t("form.searchService")}
																	value={serviceSearchQuery}
																	onValueChange={setServiceSearchQuery}
																/>
																<CommandList>
																	{isLoadingServices && (
																		<div className="flex items-center justify-center py-6">
																			<Loader2Icon className="size-5 animate-spin text-muted-foreground" />
																		</div>
																	)}
																	{!isLoadingServices &&
																		services.length === 0 && (
																			<CommandEmpty>
																				{t("form.noServicesFound")}
																			</CommandEmpty>
																		)}
																	{!isLoadingServices &&
																		services.length > 0 && (
																			<CommandGroup>
																				{services.map((service) => {
																					const priceFormatted =
																						new Intl.NumberFormat("es-AR", {
																							style: "currency",
																							currency: service.currency,
																							minimumFractionDigits: 0,
																						}).format(
																							service.currentPrice / 100,
																						);
																					const label = `${service.name} - ${priceFormatted}`;
																					return (
																						<CommandItem
																							key={service.id}
																							value={service.id}
																							onSelect={() => {
																								field.onChange(service.id);
																								setSelectedServiceLabel(label);
																								setServicePopoverOpen(false);
																								setServiceSearchQuery("");
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
													<FormDescription>
														{t("form.serviceHint")}
													</FormDescription>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
								)}
							</>
						)}
					</ProfileEditSection>

					<ProfileEditSection>
						{fixedEventId && !isEditing ? (
							<ProfileEditGrid cols={2}>
								<FormField
									control={form.control}
									name="amount"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>{t("form.amount")}</FormLabel>
												<FormControl>
													<Input
														type="number"
														placeholder="100"
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
															<SelectValue
																placeholder={t("form.selectMethod")}
															/>
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
						) : (
							<>
								<ProfileEditGrid cols={3}>
									<FormField
										control={form.control}
										name="amount"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("form.amount")}</FormLabel>
													<FormControl>
														<Input
															type="number"
															placeholder="100"
															{...field}
															onChange={(e) =>
																field.onChange(Number(e.target.value))
															}
														/>
													</FormControl>
													<FormMessage />
													{servicePriceData && (
														<FormDescription className="text-xs text-blue-600">
															{t("form.servicePriceHint", {
																name: servicePriceData.serviceName,
																price: new Intl.NumberFormat("es-AR", {
																	style: "currency",
																	currency: servicePriceData.currency,
																	minimumFractionDigits: 0,
																}).format(servicePriceData.price / 100),
															})}
														</FormDescription>
													)}
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
													<FormLabel>{t("form.paidAmount")}</FormLabel>
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
										name="discountPercentage"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("form.discountPercentage")}</FormLabel>
													<FormControl>
														<Input
															type="number"
															min={0}
															max={100}
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
																<SelectValue
																	placeholder={t("form.selectStatus")}
																/>
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
																<SelectValue
																	placeholder={t("form.selectMethod")}
																/>
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
							</>
						)}

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
													onChange={(e) => {
														if (e.target.value) {
															const parts = e.target.value
																.split("-")
																.map(Number);
															field.onChange(
																new Date(parts[0]!, parts[1]! - 1, parts[2]),
															);
														} else {
															field.onChange(undefined);
														}
													}}
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
