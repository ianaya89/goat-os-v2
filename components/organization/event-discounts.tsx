"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	CalendarIcon,
	CopyIcon,
	DollarSignIcon,
	PencilIcon,
	PercentIcon,
	PlusIcon,
	TagIcon,
	Trash2Icon,
	ZapIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod/v4";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useZodForm } from "@/hooks/use-zod-form";
import { DiscountMode, DiscountValueType } from "@/lib/db/schema/enums";
import { formatEventPrice } from "@/lib/format-event";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

// Form schema for adding/editing a discount
const discountFormSchema = z
	.object({
		name: z.string().trim().min(1, "El nombre es requerido").max(100),
		description: z.string().trim().max(500).optional(),
		discountMode: z.nativeEnum(DiscountMode),
		code: z.string().trim().min(1).max(50).optional(),
		discountValueType: z.nativeEnum(DiscountValueType),
		discountValue: z.number().min(1, "El valor debe ser mayor a 0"),
		maxUses: z.number().int().min(1).optional().nullable(),
		maxUsesPerUser: z.number().int().min(1).optional().nullable(),
		validFrom: z.date().optional().nullable(),
		validUntil: z.date().optional().nullable(),
		minPurchaseAmount: z.number().int().min(0).optional().nullable(),
		priority: z.number().int().default(0),
		isActive: z.boolean().default(true),
	})
	.refine(
		(data) => {
			if (data.discountMode === DiscountMode.code && !data.code) {
				return false;
			}
			return true;
		},
		{
			message: "El código es requerido para descuentos con código",
			path: ["code"],
		},
	)
	.refine(
		(data) => {
			if (
				data.discountValueType === DiscountValueType.percentage &&
				data.discountValue > 100
			) {
				return false;
			}
			return true;
		},
		{
			message: "El porcentaje debe estar entre 1 y 100",
			path: ["discountValue"],
		},
	);

interface EventDiscountsProps {
	eventId: string;
	currency: string;
}

interface Discount {
	id: string;
	eventId: string;
	organizationId: string;
	name: string;
	description: string | null;
	discountMode: DiscountMode;
	code: string | null;
	discountValueType: DiscountValueType;
	discountValue: number;
	maxUses: number | null;
	maxUsesPerUser: number | null;
	currentUses: number;
	validFrom: Date | null;
	validUntil: Date | null;
	minPurchaseAmount: number | null;
	priority: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export function EventDiscounts({
	eventId,
	currency,
}: EventDiscountsProps): React.JSX.Element {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);
	const [editingDiscount, setEditingDiscount] = React.useState<Discount | null>(
		null,
	);

	const utils = trpc.useUtils();

	const { data: discounts, isPending } =
		trpc.organization.sportsEvent.listDiscounts.useQuery(
			{ eventId, includeInactive: true },
			{ placeholderData: (prev) => prev },
		);

	const createMutation =
		trpc.organization.sportsEvent.createDiscount.useMutation({
			onSuccess: () => {
				toast.success("Descuento creado");
				utils.organization.sportsEvent.listDiscounts.invalidate({ eventId });
				setIsDialogOpen(false);
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message || "Error al crear descuento");
			},
		});

	const updateMutation =
		trpc.organization.sportsEvent.updateDiscount.useMutation({
			onSuccess: () => {
				toast.success("Descuento actualizado");
				utils.organization.sportsEvent.listDiscounts.invalidate({ eventId });
				setIsDialogOpen(false);
				setEditingDiscount(null);
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar descuento");
			},
		});

	const deleteMutation =
		trpc.organization.sportsEvent.deleteDiscount.useMutation({
			onSuccess: () => {
				toast.success("Descuento eliminado");
				utils.organization.sportsEvent.listDiscounts.invalidate({ eventId });
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar descuento");
			},
		});

	const form = useZodForm({
		schema: discountFormSchema,
		defaultValues: {
			name: "",
			description: "",
			discountMode: DiscountMode.code,
			code: "",
			discountValueType: DiscountValueType.percentage,
			discountValue: 10,
			maxUses: null,
			maxUsesPerUser: null,
			validFrom: null,
			validUntil: null,
			minPurchaseAmount: null,
			priority: 0,
			isActive: true,
		},
	});

	const discountMode = form.watch("discountMode");
	const discountValueType = form.watch("discountValueType");

	const openCreateDialog = () => {
		setEditingDiscount(null);
		form.reset({
			name: "",
			description: "",
			discountMode: DiscountMode.code,
			code: "",
			discountValueType: DiscountValueType.percentage,
			discountValue: 10,
			maxUses: null,
			maxUsesPerUser: null,
			validFrom: null,
			validUntil: null,
			minPurchaseAmount: null,
			priority: 0,
			isActive: true,
		});
		setIsDialogOpen(true);
	};

	const openEditDialog = (discount: Discount) => {
		setEditingDiscount(discount);
		form.reset({
			name: discount.name,
			description: discount.description || "",
			discountMode: discount.discountMode,
			code: discount.code || "",
			discountValueType: discount.discountValueType,
			discountValue:
				discount.discountValueType === DiscountValueType.percentage
					? discount.discountValue
					: discount.discountValue / 100, // Convert from cents for display
			maxUses: discount.maxUses,
			maxUsesPerUser: discount.maxUsesPerUser,
			validFrom: discount.validFrom,
			validUntil: discount.validUntil,
			minPurchaseAmount: discount.minPurchaseAmount
				? discount.minPurchaseAmount / 100
				: null,
			priority: discount.priority,
			isActive: discount.isActive,
		});
		setIsDialogOpen(true);
	};

	const handleFormSubmit = form.handleSubmit((values) => {
		const data = {
			name: values.name,
			description: values.description,
			discountMode: values.discountMode,
			code:
				values.discountMode === DiscountMode.code
					? values.code?.toUpperCase()
					: null,
			discountValueType: values.discountValueType,
			discountValue:
				values.discountValueType === DiscountValueType.percentage
					? values.discountValue
					: Math.round(values.discountValue * 100), // Convert to cents
			maxUses: values.maxUses,
			maxUsesPerUser: values.maxUsesPerUser,
			validFrom: values.validFrom,
			validUntil: values.validUntil,
			minPurchaseAmount: values.minPurchaseAmount
				? Math.round(values.minPurchaseAmount * 100)
				: null,
			priority: values.priority ?? 0,
			isActive: values.isActive ?? true,
		};

		if (editingDiscount) {
			updateMutation.mutate({
				id: editingDiscount.id,
				...data,
			});
		} else {
			createMutation.mutate({
				eventId,
				...data,
			});
		}
	});

	const copyCode = (code: string) => {
		navigator.clipboard.writeText(code);
		toast.success("Código copiado");
	};

	const formatDiscountValue = (discount: Discount) => {
		if (discount.discountValueType === DiscountValueType.percentage) {
			return `${discount.discountValue}%`;
		}
		return formatEventPrice(discount.discountValue, currency);
	};

	if (isPending) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-32 w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Descuentos</CardTitle>
						<CardDescription>
							Configura descuentos automáticos y códigos promocionales
						</CardDescription>
					</div>
					<Button onClick={openCreateDialog} size="sm">
						<PlusIcon className="mr-2 h-4 w-4" />
						Agregar descuento
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{discounts && discounts.length > 0 ? (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nombre</TableHead>
								<TableHead>Tipo</TableHead>
								<TableHead>Código</TableHead>
								<TableHead>Descuento</TableHead>
								<TableHead>Usos</TableHead>
								<TableHead>Estado</TableHead>
								<TableHead className="text-right">Acciones</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{discounts.map((discount) => (
								<TableRow key={discount.id}>
									<TableCell className="font-medium">{discount.name}</TableCell>
									<TableCell>
										{discount.discountMode === DiscountMode.automatic ? (
											<Badge variant="secondary">
												<ZapIcon className="mr-1 h-3 w-3" />
												Automático
											</Badge>
										) : (
											<Badge variant="outline">
												<TagIcon className="mr-1 h-3 w-3" />
												Código
											</Badge>
										)}
									</TableCell>
									<TableCell>
										{discount.code ? (
											<div className="flex items-center gap-1">
												<code className="rounded bg-muted px-1.5 py-0.5 text-sm">
													{discount.code}
												</code>
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6"
													onClick={() => copyCode(discount.code!)}
												>
													<CopyIcon className="h-3 w-3" />
												</Button>
											</div>
										) : (
											<span className="text-muted-foreground">-</span>
										)}
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-1">
											{discount.discountValueType ===
											DiscountValueType.percentage ? (
												<PercentIcon className="h-3 w-3 text-muted-foreground" />
											) : (
												<DollarSignIcon className="h-3 w-3 text-muted-foreground" />
											)}
											{formatDiscountValue(discount)}
										</div>
									</TableCell>
									<TableCell>
										{discount.maxUses ? (
											<span>
												{discount.currentUses}/{discount.maxUses}
											</span>
										) : (
											<span>{discount.currentUses}</span>
										)}
									</TableCell>
									<TableCell>
										{discount.isActive ? (
											<Badge variant="default">Activo</Badge>
										) : (
											<Badge variant="secondary">Inactivo</Badge>
										)}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-1">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={() => openEditDialog(discount)}
											>
												<PencilIcon className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-destructive hover:text-destructive"
												onClick={() =>
													deleteMutation.mutate({ id: discount.id })
												}
											>
												<Trash2Icon className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				) : (
					<div className="py-8 text-center">
						<TagIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
						<h3 className="mt-4 text-lg font-medium">No hay descuentos</h3>
						<p className="mt-2 text-sm text-muted-foreground">
							Crea tu primer descuento para ofrecer promociones
						</p>
						<Button onClick={openCreateDialog} className="mt-4">
							<PlusIcon className="mr-2 h-4 w-4" />
							Agregar descuento
						</Button>
					</div>
				)}
			</CardContent>

			{/* Create/Edit Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{editingDiscount ? "Editar descuento" : "Crear descuento"}
						</DialogTitle>
						<DialogDescription>
							{editingDiscount
								? "Modifica los datos del descuento"
								: "Configura un nuevo descuento para este evento"}
						</DialogDescription>
					</DialogHeader>

					<Form {...form}>
						<form onSubmit={handleFormSubmit} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nombre</FormLabel>
										<FormControl>
											<Input placeholder="Ej: Black Friday" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="discountMode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tipo de descuento</FormLabel>
										<FormControl>
											<RadioGroup
												value={field.value}
												onValueChange={field.onChange}
												className="grid grid-cols-2 gap-4"
											>
												<Label
													htmlFor="mode-code"
													className={cn(
														"flex cursor-pointer flex-col gap-2 rounded-lg border p-4 hover:bg-accent",
														field.value === DiscountMode.code &&
															"border-primary bg-primary/5",
													)}
												>
													<RadioGroupItem
														value={DiscountMode.code}
														id="mode-code"
														className="sr-only"
													/>
													<div className="flex items-center gap-2">
														<TagIcon className="h-4 w-4" />
														<span className="font-medium">Con código</span>
													</div>
													<span className="text-xs text-muted-foreground">
														El usuario debe ingresar un código
													</span>
												</Label>
												<Label
													htmlFor="mode-auto"
													className={cn(
														"flex cursor-pointer flex-col gap-2 rounded-lg border p-4 hover:bg-accent",
														field.value === DiscountMode.automatic &&
															"border-primary bg-primary/5",
													)}
												>
													<RadioGroupItem
														value={DiscountMode.automatic}
														id="mode-auto"
														className="sr-only"
													/>
													<div className="flex items-center gap-2">
														<ZapIcon className="h-4 w-4" />
														<span className="font-medium">Automático</span>
													</div>
													<span className="text-xs text-muted-foreground">
														Se aplica automáticamente
													</span>
												</Label>
											</RadioGroup>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{discountMode === DiscountMode.code && (
								<FormField
									control={form.control}
									name="code"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Código</FormLabel>
											<FormControl>
												<Input
													placeholder="EARLYBIRD20"
													{...field}
													onChange={(e) =>
														field.onChange(e.target.value.toUpperCase())
													}
												/>
											</FormControl>
											<FormDescription>
												El código que los usuarios deben ingresar
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="discountValueType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tipo de valor</FormLabel>
											<FormControl>
												<RadioGroup
													value={field.value}
													onValueChange={field.onChange}
													className="flex gap-4"
												>
													<Label
														htmlFor="type-percent"
														className={cn(
															"flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2",
															field.value === DiscountValueType.percentage &&
																"border-primary",
														)}
													>
														<RadioGroupItem
															value={DiscountValueType.percentage}
															id="type-percent"
															className="sr-only"
														/>
														<PercentIcon className="h-4 w-4" />
														Porcentaje
													</Label>
													<Label
														htmlFor="type-fixed"
														className={cn(
															"flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2",
															field.value === DiscountValueType.fixed &&
																"border-primary",
														)}
													>
														<RadioGroupItem
															value={DiscountValueType.fixed}
															id="type-fixed"
															className="sr-only"
														/>
														<DollarSignIcon className="h-4 w-4" />
														Monto fijo
													</Label>
												</RadioGroup>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="discountValue"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Valor{" "}
												{discountValueType === DiscountValueType.percentage
													? "(%)"
													: `(${currency})`}
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={1}
													max={
														discountValueType === DiscountValueType.percentage
															? 100
															: undefined
													}
													step={
														discountValueType === DiscountValueType.percentage
															? 1
															: 0.01
													}
													{...field}
													onChange={(e) =>
														field.onChange(
															Number.parseFloat(e.target.value) || 0,
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="maxUses"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Límite de usos totales</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={1}
													placeholder="Ilimitado"
													value={field.value ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Number.parseInt(e.target.value, 10)
																: null,
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="maxUsesPerUser"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Límite por persona</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={1}
													placeholder="Ilimitado"
													value={field.value ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Number.parseInt(e.target.value, 10)
																: null,
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

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
																format(field.value, "PP", { locale: es })
															) : (
																<span>Sin límite</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={field.value ?? undefined}
														onSelect={field.onChange}
														locale={es}
													/>
													{field.value && (
														<div className="border-t p-2">
															<Button
																variant="ghost"
																size="sm"
																className="w-full"
																onClick={() => field.onChange(null)}
															>
																Limpiar
															</Button>
														</div>
													)}
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
																format(field.value, "PP", { locale: es })
															) : (
																<span>Sin límite</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={field.value ?? undefined}
														onSelect={field.onChange}
														locale={es}
													/>
													{field.value && (
														<div className="border-t p-2">
															<Button
																variant="ghost"
																size="sm"
																className="w-full"
																onClick={() => field.onChange(null)}
															>
																Limpiar
															</Button>
														</div>
													)}
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="isActive"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between rounded-lg border p-3">
										<div className="space-y-0.5">
											<FormLabel>Activo</FormLabel>
											<FormDescription>
												El descuento se puede usar cuando está activo
											</FormDescription>
										</div>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
								>
									Cancelar
								</Button>
								<Button
									type="submit"
									disabled={
										createMutation.isPending || updateMutation.isPending
									}
								>
									{createMutation.isPending || updateMutation.isPending
										? "Guardando..."
										: editingDiscount
											? "Guardar cambios"
											: "Crear descuento"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
