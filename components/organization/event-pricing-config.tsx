"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	AlertCircleIcon,
	CalendarIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useZodForm } from "@/hooks/use-zod-form";
import { PricingTierType } from "@/lib/db/schema/enums";
import { formatEventPrice } from "@/lib/format-event";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

// Form schema for adding/editing a tier
const tierFormSchema = z.object({
	name: z.string().trim().min(1, "El nombre es requerido").max(100),
	price: z.number().min(0, "El precio debe ser positivo"),
	validFrom: z.date().optional(),
	validUntil: z.date().optional(),
});

interface EventPricingConfigProps {
	eventId: string;
	currency: string;
}

interface PricingTier {
	id: string;
	eventId: string;
	name: string;
	description: string | null;
	tierType: string;
	price: number;
	currency: string;
	validFrom: Date | null;
	validUntil: Date | null;
	capacityStart: number | null;
	capacityEnd: number | null;
	ageCategoryId: string | null;
	isActive: boolean;
	sortOrder: number;
	createdAt: Date;
	updatedAt: Date;
}

export function EventPricingConfig({
	eventId,
	currency,
}: EventPricingConfigProps): React.JSX.Element {
	const [pricingMode, setPricingMode] = React.useState<"flat" | "tiered">(
		"flat",
	);
	const [isAddingTier, setIsAddingTier] = React.useState(false);
	const [editingTierId, setEditingTierId] = React.useState<string | null>(null);

	const utils = trpc.useUtils();

	const { data: tiers, isPending } =
		trpc.organization.sportsEvent.listPricingTiers.useQuery(
			{ eventId, includeInactive: true },
			{ placeholderData: (prev) => prev },
		);

	const createTierMutation =
		trpc.organization.sportsEvent.createPricingTier.useMutation({
			onSuccess: () => {
				toast.success("Precio creado");
				utils.organization.sportsEvent.listPricingTiers.invalidate({ eventId });
				setIsAddingTier(false);
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message || "Error al crear el precio");
			},
		});

	const updateTierMutation =
		trpc.organization.sportsEvent.updatePricingTier.useMutation({
			onSuccess: () => {
				toast.success("Precio actualizado");
				utils.organization.sportsEvent.listPricingTiers.invalidate({ eventId });
				setEditingTierId(null);
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar el precio");
			},
		});

	const deleteTierMutation =
		trpc.organization.sportsEvent.deletePricingTier.useMutation({
			onSuccess: () => {
				toast.success("Precio eliminado");
				utils.organization.sportsEvent.listPricingTiers.invalidate({ eventId });
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar el precio");
			},
		});

	const form = useZodForm({
		schema: tierFormSchema,
		defaultValues: {
			name: "",
			price: 0,
			validFrom: undefined,
			validUntil: undefined,
		},
	});

	// Determine pricing mode from existing tiers
	React.useEffect(() => {
		if (tiers && tiers.length > 0) {
			const hasDatedTiers = tiers.some(
				(t: PricingTier) => t.validFrom || t.validUntil,
			);
			setPricingMode(hasDatedTiers ? "tiered" : "flat");
		}
	}, [tiers]);

	const onSubmitTier = form.handleSubmit((data) => {
		if (editingTierId) {
			updateTierMutation.mutate({
				id: editingTierId,
				name: data.name,
				price: Math.round(data.price * 100), // Convert to cents
				validFrom: pricingMode === "tiered" ? data.validFrom : null,
				validUntil: pricingMode === "tiered" ? data.validUntil : null,
			});
		} else {
			createTierMutation.mutate({
				eventId,
				name: data.name,
				tierType: PricingTierType.dateBased,
				price: Math.round(data.price * 100), // Convert to cents
				currency,
				validFrom: pricingMode === "tiered" ? data.validFrom : undefined,
				validUntil: pricingMode === "tiered" ? data.validUntil : undefined,
				isActive: true,
				sortOrder: (tiers?.length ?? 0) + 1,
			});
		}
	});

	const handleEditTier = (tier: PricingTier) => {
		setEditingTierId(tier.id);
		form.reset({
			name: tier.name,
			price: tier.price / 100, // Convert from cents
			validFrom: tier.validFrom ?? undefined,
			validUntil: tier.validUntil ?? undefined,
		});
		setIsAddingTier(true);
	};

	const handleDeleteTier = (tierId: string) => {
		if (window.confirm("¿Estás seguro de eliminar este precio?")) {
			deleteTierMutation.mutate({ id: tierId });
		}
	};

	const handleCancelEdit = () => {
		setIsAddingTier(false);
		setEditingTierId(null);
		form.reset();
	};

	const handleModeChange = (mode: "flat" | "tiered") => {
		setPricingMode(mode);
		// If switching to flat and there are multiple tiers, warn the user
		if (mode === "flat" && tiers && tiers.length > 1) {
			toast.info(
				"Con tarifa única solo se usará un precio. Puedes eliminar los demás.",
			);
		}
	};

	if (isPending) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-40" />
					<Skeleton className="h-4 w-60" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-32 w-full" />
				</CardContent>
			</Card>
		);
	}

	const flatRateTier = tiers?.find(
		(t: PricingTier) => !t.validFrom && !t.validUntil,
	);
	const tieredPrices = tiers?.filter(
		(t: PricingTier) => t.validFrom || t.validUntil,
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Configuración de Precios</CardTitle>
				<CardDescription>
					Define cómo se calcularán los precios de las inscripciones
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Pricing Mode Selection */}
				<div className="space-y-3">
					<Label>Tipo de precio</Label>
					<RadioGroup
						value={pricingMode}
						onValueChange={(v) => handleModeChange(v as "flat" | "tiered")}
						className="grid grid-cols-2 gap-4"
					>
						<div>
							<RadioGroupItem value="flat" id="flat" className="peer sr-only" />
							<Label
								htmlFor="flat"
								className={cn(
									"flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
									pricingMode === "flat" && "border-primary",
								)}
							>
								<span className="font-medium">Tarifa Única</span>
								<span className="text-xs text-muted-foreground text-center mt-1">
									Un solo precio para todas las inscripciones
								</span>
							</Label>
						</div>
						<div>
							<RadioGroupItem
								value="tiered"
								id="tiered"
								className="peer sr-only"
							/>
							<Label
								htmlFor="tiered"
								className={cn(
									"flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
									pricingMode === "tiered" && "border-primary",
								)}
							>
								<span className="font-medium">Precios por Fecha</span>
								<span className="text-xs text-muted-foreground text-center mt-1">
									Early bird, regular, late registration
								</span>
							</Label>
						</div>
					</RadioGroup>
				</div>

				{/* Flat Rate Mode */}
				{pricingMode === "flat" && (
					<div className="space-y-4">
						{flatRateTier ? (
							<div className="flex items-center justify-between rounded-lg border p-4">
								<div>
									<p className="font-medium">{flatRateTier.name}</p>
									<p className="text-2xl font-bold text-primary">
										{formatEventPrice(
											flatRateTier.price,
											flatRateTier.currency,
										)}
									</p>
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleEditTier(flatRateTier)}
									>
										Editar
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleDeleteTier(flatRateTier.id)}
									>
										<Trash2Icon className="size-4" />
									</Button>
								</div>
							</div>
						) : !isAddingTier ? (
							<div className="rounded-lg border border-dashed p-6 text-center">
								<AlertCircleIcon className="mx-auto size-8 text-muted-foreground mb-2" />
								<p className="text-muted-foreground mb-4">
									No hay precio configurado
								</p>
								<Button onClick={() => setIsAddingTier(true)}>
									<PlusIcon className="size-4 mr-2" />
									Agregar Precio
								</Button>
							</div>
						) : null}

						{isAddingTier && pricingMode === "flat" && (
							<Form {...form}>
								<form
									onSubmit={onSubmitTier}
									className="space-y-4 rounded-lg border p-4"
								>
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Nombre</FormLabel>
												<FormControl>
													<Input
														placeholder="Ej: Inscripción General"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="price"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Precio ({currency})</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={0}
														step={0.01}
														placeholder="0.00"
														value={field.value}
														onChange={(e) =>
															field.onChange(e.target.valueAsNumber || 0)
														}
													/>
												</FormControl>
												<FormDescription>
													Ingresa el precio en {currency}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
									<div className="flex gap-2 justify-end">
										<Button
											type="button"
											variant="outline"
											onClick={handleCancelEdit}
										>
											Cancelar
										</Button>
										<Button
											type="submit"
											disabled={
												createTierMutation.isPending ||
												updateTierMutation.isPending
											}
										>
											{editingTierId ? "Actualizar" : "Guardar"}
										</Button>
									</div>
								</form>
							</Form>
						)}
					</div>
				)}

				{/* Tiered Pricing Mode */}
				{pricingMode === "tiered" && (
					<div className="space-y-4">
						{/* Existing Tiers List */}
						{tieredPrices && tieredPrices.length > 0 ? (
							<div className="space-y-2">
								{tieredPrices.map((tier: PricingTier) => (
									<div
										key={tier.id}
										className="flex items-center justify-between rounded-lg border p-4"
									>
										<div className="space-y-1">
											<p className="font-medium">{tier.name}</p>
											<p className="text-lg font-bold text-primary">
												{formatEventPrice(tier.price, tier.currency)}
											</p>
											<p className="text-sm text-muted-foreground">
												{tier.validFrom && tier.validUntil
													? `${format(tier.validFrom, "dd MMM", { locale: es })} - ${format(tier.validUntil, "dd MMM yyyy", { locale: es })}`
													: tier.validFrom
														? `Desde ${format(tier.validFrom, "dd MMM yyyy", { locale: es })}`
														: tier.validUntil
															? `Hasta ${format(tier.validUntil, "dd MMM yyyy", { locale: es })}`
															: "Sin fechas definidas"}
											</p>
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleEditTier(tier)}
											>
												Editar
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDeleteTier(tier.id)}
											>
												<Trash2Icon className="size-4" />
											</Button>
										</div>
									</div>
								))}
							</div>
						) : (
							!isAddingTier && (
								<div className="rounded-lg border border-dashed p-6 text-center">
									<AlertCircleIcon className="mx-auto size-8 text-muted-foreground mb-2" />
									<p className="text-muted-foreground mb-4">
										No hay precios configurados
									</p>
								</div>
							)
						)}

						{/* Add Tier Button */}
						{!isAddingTier && (
							<Button
								variant="outline"
								onClick={() => setIsAddingTier(true)}
								className="w-full"
							>
								<PlusIcon className="size-4 mr-2" />
								Agregar Precio
							</Button>
						)}

						{/* Add/Edit Tier Form */}
						{isAddingTier && pricingMode === "tiered" && (
							<Form {...form}>
								<form
									onSubmit={onSubmitTier}
									className="space-y-4 rounded-lg border p-4"
								>
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Nombre</FormLabel>
												<FormControl>
													<Input
														placeholder="Ej: Early Bird, Regular, Late"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="price"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Precio ({currency})</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={0}
														step={0.01}
														placeholder="0.00"
														value={field.value}
														onChange={(e) =>
															field.onChange(e.target.valueAsNumber || 0)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="validFrom"
											render={({ field }) => (
												<FormItem className="flex flex-col">
													<FormLabel>Válido desde</FormLabel>
													<Popover>
														<PopoverTrigger asChild>
															<FormControl>
																<Button
																	variant="outline"
																	className={cn(
																		"w-full pl-3 text-left font-normal",
																		!field.value && "text-muted-foreground",
																	)}
																>
																	{field.value ? (
																		format(field.value, "PPP", { locale: es })
																	) : (
																		<span>Seleccionar fecha</span>
																	)}
																	<CalendarIcon className="ml-auto size-4 opacity-50" />
																</Button>
															</FormControl>
														</PopoverTrigger>
														<PopoverContent
															className="w-auto p-0"
															align="start"
														>
															<Calendar
																mode="single"
																selected={field.value}
																onSelect={field.onChange}
																initialFocus
															/>
														</PopoverContent>
													</Popover>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="validUntil"
											render={({ field }) => (
												<FormItem className="flex flex-col">
													<FormLabel>Válido hasta</FormLabel>
													<Popover>
														<PopoverTrigger asChild>
															<FormControl>
																<Button
																	variant="outline"
																	className={cn(
																		"w-full pl-3 text-left font-normal",
																		!field.value && "text-muted-foreground",
																	)}
																>
																	{field.value ? (
																		format(field.value, "PPP", { locale: es })
																	) : (
																		<span>Seleccionar fecha</span>
																	)}
																	<CalendarIcon className="ml-auto size-4 opacity-50" />
																</Button>
															</FormControl>
														</PopoverTrigger>
														<PopoverContent
															className="w-auto p-0"
															align="start"
														>
															<Calendar
																mode="single"
																selected={field.value}
																onSelect={field.onChange}
																initialFocus
															/>
														</PopoverContent>
													</Popover>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
									<div className="flex gap-2 justify-end">
										<Button
											type="button"
											variant="outline"
											onClick={handleCancelEdit}
										>
											Cancelar
										</Button>
										<Button
											type="submit"
											disabled={
												createTierMutation.isPending ||
												updateTierMutation.isPending
											}
										>
											{editingTierId ? "Actualizar" : "Guardar"}
										</Button>
									</div>
								</form>
							</Form>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
