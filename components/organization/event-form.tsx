"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { ServiceSelector } from "@/components/organization/service-selector";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/custom/date-picker";
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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	type EventPaymentMethod,
	EventPaymentMethods,
	EventStatus,
	EventStatuses,
	EventType,
	EventTypes,
} from "@/lib/db/schema/enums";
import {
	generateSlug,
	getEventStatusLabel,
	getEventTypeLabel,
} from "@/lib/format-event";
import {
	createSportsEventSchema,
	updateSportsEventSchema,
} from "@/schemas/organization-sports-event-schemas";
import { trpc } from "@/trpc/client";

interface SportsEventData {
	id: string;
	title: string;
	slug: string;
	description: string | null;
	eventType: string;
	status: string;
	startDate: Date;
	endDate: Date;
	registrationOpenDate: Date | null;
	registrationCloseDate: Date | null;
	locationId: string | null;
	serviceId: string | null;
	venueDetails: string | null;
	maxCapacity: number | null;
	enableWaitlist: boolean;
	maxWaitlistSize: number | null;
	allowPublicRegistration: boolean;
	allowEarlyAccessForMembers: boolean;
	memberEarlyAccessDays: number | null;
	requiresApproval: boolean;
	currency: string;
	acceptedPaymentMethods: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	coverImageUrl: string | null;
	ageCategories?: Array<{
		ageCategoryId: string;
		ageCategory: { id: string; displayName: string };
	}>;
}

interface EventFormProps {
	event?: SportsEventData;
	eventId?: string;
}

function getPaymentMethodLabel(method: EventPaymentMethod): string {
	const labels: Record<EventPaymentMethod, string> = {
		cash: "Efectivo",
		bank_transfer: "Transferencia Bancaria",
		mercado_pago: "MercadoPago",
		stripe: "Stripe",
		card: "Tarjeta",
		other: "Otro",
	};
	return labels[method] || method;
}

export function EventForm({
	event,
	eventId,
}: EventFormProps): React.JSX.Element {
	const router = useRouter();
	const utils = trpc.useUtils();
	const isEditing = !!event;

	// Fetch locations for the select
	const { data: locationsData } = trpc.organization.location.list.useQuery({
		limit: 100,
		offset: 0,
	});

	// Fetch age categories for the select
	const { data: ageCategoriesData } =
		trpc.organization.sportsEvent.listAgeCategories.useQuery({
			includeInactive: false,
		});

	// Fetch coaches for the select
	const { data: _coachesData } = trpc.organization.coach.list.useQuery({
		limit: 100,
		offset: 0,
		filters: { status: ["active"] },
	});

	const createEventMutation = trpc.organization.sportsEvent.create.useMutation({
		onSuccess: (result) => {
			toast.success("Evento creado");
			utils.organization.sportsEvent.list.invalidate();
			router.push(`/dashboard/organization/events/${result.id}`);
		},
		onError: (error: { message?: string }) => {
			toast.error(error.message || "Error al crear el evento");
		},
	});

	const updateEventMutation = trpc.organization.sportsEvent.update.useMutation({
		onSuccess: () => {
			toast.success("Evento actualizado");
			utils.organization.sportsEvent.list.invalidate();
			utils.organization.sportsEvent.get.invalidate();
			router.push(`/dashboard/organization/events/${eventId}`);
		},
		onError: (error: { message?: string }) => {
			toast.error(error.message || "Error al actualizar el evento");
		},
	});

	// Parse accepted payment methods from JSON string
	const parsePaymentMethods = (value: string | null): EventPaymentMethod[] => {
		if (!value) return [];
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	};

	const form = useZodForm({
		schema: isEditing ? updateSportsEventSchema : createSportsEventSchema,
		defaultValues:
			isEditing && event
				? {
						id: event.id,
						title: event.title,
						slug: event.slug,
						description: event.description ?? "",
						eventType: event.eventType as EventType,
						status: event.status as EventStatus,
						startDate: event.startDate,
						endDate: event.endDate,
						registrationOpenDate: event.registrationOpenDate ?? undefined,
						registrationCloseDate: event.registrationCloseDate ?? undefined,
						locationId: event.locationId ?? undefined,
						serviceId: event.serviceId ?? undefined,
						venueDetails: event.venueDetails ?? "",
						maxCapacity: event.maxCapacity ?? undefined,
						enableWaitlist: event.enableWaitlist,
						maxWaitlistSize: event.maxWaitlistSize ?? undefined,
						allowPublicRegistration: event.allowPublicRegistration,
						allowEarlyAccessForMembers: event.allowEarlyAccessForMembers,
						memberEarlyAccessDays: event.memberEarlyAccessDays ?? 7,
						requiresApproval: event.requiresApproval,
						currency: event.currency,
						acceptedPaymentMethods: parsePaymentMethods(
							event.acceptedPaymentMethods,
						),
						contactEmail: event.contactEmail ?? "",
						contactPhone: event.contactPhone ?? "",
						coverImageUrl: event.coverImageUrl ?? undefined,
						ageCategoryIds:
							event.ageCategories?.map((ac) => ac.ageCategoryId) ?? [],
					}
				: {
						title: "",
						slug: "",
						description: "",
						eventType: EventType.campus,
						status: EventStatus.draft,
						startDate: new Date(),
						endDate: new Date(),
						enableWaitlist: true,
						allowPublicRegistration: true,
						allowEarlyAccessForMembers: false,
						memberEarlyAccessDays: 7,
						requiresApproval: false,
						currency: "ARS",
						acceptedPaymentMethods: [],
						ageCategoryIds: [],
					},
	});

	// Auto-generate slug from title
	const title = form.watch("title");
	React.useEffect(() => {
		if (!isEditing && title) {
			const slug = generateSlug(title);
			form.setValue("slug", slug, { shouldValidate: true });
		}
	}, [title, isEditing, form]);

	const onSubmit = form.handleSubmit((data) => {
		if (isEditing) {
			updateEventMutation.mutate(
				data as Parameters<typeof updateEventMutation.mutate>[0],
			);
		} else {
			createEventMutation.mutate(
				data as Parameters<typeof createEventMutation.mutate>[0],
			);
		}
	});

	const isPending =
		createEventMutation.isPending || updateEventMutation.isPending;

	const enableWaitlist = form.watch("enableWaitlist");
	const allowEarlyAccessForMembers = form.watch("allowEarlyAccessForMembers");

	return (
		<Form {...form}>
			<form onSubmit={onSubmit} className="space-y-6">
				{/* Basic Information */}
				<Card>
					<CardHeader>
						<CardTitle>Información Básica</CardTitle>
						<CardDescription>Datos principales del evento</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Título</FormLabel>
										<FormControl>
											<Input
												placeholder="Ej: Campus de Verano 2026"
												autoComplete="off"
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
							name="slug"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>URL amigable</FormLabel>
										<FormControl>
											<Input
												placeholder="campus-verano-2026"
												autoComplete="off"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Se genera automáticamente desde el título
										</FormDescription>
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
										<FormLabel>Descripción</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Descripción del evento..."
												className="resize-none"
												rows={4}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="eventType"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Tipo de Evento</FormLabel>
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
													{EventTypes.map((type) => (
														<SelectItem key={type} value={type}>
															{getEventTypeLabel(type as EventType)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							{isEditing && (
								<FormField
									control={form.control}
									name="status"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>Estado</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Seleccionar estado" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{EventStatuses.map((status) => (
															<SelectItem key={status} value={status}>
																{getEventStatusLabel(status as EventStatus)}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</Field>
										</FormItem>
									)}
								/>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Age Categories */}
				{ageCategoriesData && ageCategoriesData.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Categorías de Edad</CardTitle>
							<CardDescription>
								Selecciona las categorías de edad que participarán en este
								evento
							</CardDescription>
						</CardHeader>
						<CardContent>
							<FormField
								control={form.control}
								name="ageCategoryIds"
								render={({ field }) => (
									<FormItem>
										<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
											{ageCategoriesData.map((category) => {
												const isChecked = field.value?.includes(category.id);
												return (
													<div
														key={category.id}
														className="flex items-center space-x-2"
													>
														<Checkbox
															id={`category-${category.id}`}
															checked={isChecked}
															onCheckedChange={(checked) => {
																const current = field.value || [];
																if (checked) {
																	field.onChange([...current, category.id]);
																} else {
																	field.onChange(
																		current.filter((id) => id !== category.id),
																	);
																}
															}}
														/>
														<Label
															htmlFor={`category-${category.id}`}
															className="text-sm cursor-pointer"
														>
															{category.displayName}
														</Label>
													</div>
												);
											})}
										</div>
										<FormDescription className="mt-3">
											Si no seleccionas ninguna, el evento estará abierto a
											todas las edades
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>
				)}

				{/* Dates and Location */}
				<Card>
					<CardHeader>
						<CardTitle>Fechas y Ubicación</CardTitle>
						<CardDescription>
							Cuándo y dónde se realizará el evento
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="startDate"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Fecha de Inicio</FormLabel>
											<FormControl>
												<DatePicker
													date={
														field.value instanceof Date
															? field.value
															: new Date()
													}
													onDateChange={field.onChange}
													placeholder="Seleccionar fecha"
													className="w-full"
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="endDate"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Fecha de Fin</FormLabel>
											<FormControl>
												<DatePicker
													date={
														field.value instanceof Date
															? field.value
															: new Date()
													}
													onDateChange={field.onChange}
													placeholder="Seleccionar fecha"
													className="w-full"
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
								name="registrationOpenDate"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Apertura de Inscripciones</FormLabel>
											<FormControl>
												<DatePicker
													date={
														field.value instanceof Date
															? field.value
															: undefined
													}
													onDateChange={field.onChange}
													placeholder="Opcional"
													className="w-full"
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="registrationCloseDate"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Cierre de Inscripciones</FormLabel>
											<FormControl>
												<DatePicker
													date={
														field.value instanceof Date
															? field.value
															: undefined
													}
													onDateChange={field.onChange}
													placeholder="Opcional"
													className="w-full"
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
							name="locationId"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Ubicación</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value ?? ""}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Seleccionar ubicación" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{locationsData?.locations?.map((location) => (
													<SelectItem key={location.id} value={location.id}>
														{location.name}
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
							name="venueDetails"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Detalles del Lugar</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Información adicional sobre el lugar..."
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

						<FormField
							control={form.control}
							name="serviceId"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Servicio Asociado</FormLabel>
										<FormDescription>
											Vincular a un servicio para reportes financieros
										</FormDescription>
										<FormControl>
											<ServiceSelector
												value={field.value}
												onValueChange={field.onChange}
											/>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				{/* Capacity and Registration */}
				<Card>
					<CardHeader>
						<CardTitle>Capacidad e Inscripción</CardTitle>
						<CardDescription>
							Configuración de cupos y opciones de registro
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<FormField
							control={form.control}
							name="maxCapacity"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Capacidad Máxima</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="Sin límite"
												min={1}
												{...field}
												value={field.value ?? ""}
												onChange={(e) =>
													field.onChange(
														e.target.value ? Number(e.target.value) : undefined,
													)
												}
											/>
										</FormControl>
										<FormDescription>
											Dejar vacío para capacidad ilimitada
										</FormDescription>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="enableWaitlist"
							render={({ field }) => (
								<FormItem>
									<div className="flex items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">
												Lista de Espera
											</FormLabel>
											<FormDescription>
												Permitir inscripciones en lista de espera cuando se
												alcance la capacidad
											</FormDescription>
										</div>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
									</div>
								</FormItem>
							)}
						/>

						{enableWaitlist && (
							<FormField
								control={form.control}
								name="maxWaitlistSize"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Tamaño Máximo de Lista de Espera</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="Sin límite"
													min={1}
													{...field}
													value={field.value ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Number(e.target.value)
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
						)}

						<FormField
							control={form.control}
							name="allowPublicRegistration"
							render={({ field }) => (
								<FormItem>
									<div className="flex items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">
												Inscripción Pública
											</FormLabel>
											<FormDescription>
												Permitir que cualquiera se inscriba sin cuenta previa
											</FormDescription>
										</div>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="allowEarlyAccessForMembers"
							render={({ field }) => (
								<FormItem>
									<div className="flex items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">
												Acceso Anticipado para Miembros
											</FormLabel>
											<FormDescription>
												Permitir que miembros existentes se inscriban antes
											</FormDescription>
										</div>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
									</div>
								</FormItem>
							)}
						/>

						{allowEarlyAccessForMembers && (
							<FormField
								control={form.control}
								name="memberEarlyAccessDays"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Días de Acceso Anticipado</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={1}
													max={60}
													{...field}
													onChange={(e) =>
														field.onChange(Number(e.target.value) || 7)
													}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						)}

						<FormField
							control={form.control}
							name="requiresApproval"
							render={({ field }) => (
								<FormItem>
									<div className="flex items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">
												Requiere Aprobación
											</FormLabel>
											<FormDescription>
												Las inscripciones deben ser aprobadas manualmente
											</FormDescription>
										</div>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
									</div>
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				{/* Pricing and Payment */}
				<Card>
					<CardHeader>
						<CardTitle>Precios y Pagos</CardTitle>
						<CardDescription>
							Configuración de moneda y métodos de pago aceptados
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<FormField
							control={form.control}
							name="currency"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Moneda</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Seleccionar moneda" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="ARS">
													ARS - Peso Argentino
												</SelectItem>
												<SelectItem value="USD">
													USD - Dólar Estadounidense
												</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="acceptedPaymentMethods"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Métodos de Pago Aceptados</FormLabel>
									<div className="grid grid-cols-2 gap-3 pt-2">
										{EventPaymentMethods.map((method) => (
											<div key={method} className="flex items-center space-x-2">
												<Checkbox
													id={`payment-${method}`}
													checked={(field.value ?? []).includes(
														method as EventPaymentMethod,
													)}
													onCheckedChange={(checked) => {
														const current = field.value ?? [];
														if (checked) {
															field.onChange([...current, method]);
														} else {
															field.onChange(
																current.filter((m) => m !== method),
															);
														}
													}}
												/>
												<Label
													htmlFor={`payment-${method}`}
													className="text-sm font-normal cursor-pointer"
												>
													{getPaymentMethodLabel(method as EventPaymentMethod)}
												</Label>
											</div>
										))}
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				{/* Contact Information */}
				<Card>
					<CardHeader>
						<CardTitle>Información de Contacto</CardTitle>
						<CardDescription>
							Datos de contacto para consultas sobre el evento
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="contactEmail"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Email de Contacto</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="eventos@ejemplo.com"
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="contactPhone"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Teléfono de Contacto</FormLabel>
											<FormControl>
												<Input
													type="tel"
													placeholder="+54 11 1234 5678"
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
					</CardContent>
				</Card>

				{/* Form Actions */}
				<div className="flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.back()}
						disabled={isPending}
					>
						Cancelar
					</Button>
					<Button type="submit" disabled={isPending} loading={isPending}>
						{isEditing ? "Actualizar Evento" : "Crear Evento"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
