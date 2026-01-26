"use client";

import {
	Box,
	Loader2,
	MoreHorizontal,
	Package,
	Plus,
	Trash2,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/hooks/use-zod-form";
import type { EventInventoryStatus } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { createInventoryItemSchema } from "@/schemas/organization-event-organization-schemas";
import { trpc } from "@/trpc/client";

interface EventInventoryTabProps {
	eventId: string;
}

const inventoryStatuses = [
	{ value: "needed", label: "Necesario", color: "bg-slate-100 text-slate-700" },
	{ value: "reserved", label: "Reservado", color: "bg-blue-100 text-blue-700" },
	{
		value: "acquired",
		label: "Adquirido",
		color: "bg-green-100 text-green-700",
	},
	{
		value: "deployed",
		label: "Desplegado",
		color: "bg-purple-100 text-purple-700",
	},
	{ value: "returned", label: "Devuelto", color: "bg-gray-100 text-gray-700" },
];

export function EventInventoryTab({
	eventId,
}: EventInventoryTabProps): React.JSX.Element {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);
	const [filterStatus, setFilterStatus] = React.useState<string | null>(null);

	const utils = trpc.useUtils();

	const { data, isPending } =
		trpc.organization.eventOrganization.listInventory.useQuery({
			eventId,
			status: (filterStatus as EventInventoryStatus) ?? undefined,
		});

	const { data: zones } =
		trpc.organization.eventOrganization.listZones.useQuery({ eventId });

	const { data: vendors } =
		trpc.organization.eventOrganization.listVendors.useQuery({});

	const createMutation =
		trpc.organization.eventOrganization.createInventoryItem.useMutation({
			onSuccess: () => {
				toast.success("Item agregado al inventario");
				utils.organization.eventOrganization.listInventory.invalidate();
				setIsDialogOpen(false);
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message || "Error al agregar item");
			},
		});

	const deleteMutation =
		trpc.organization.eventOrganization.deleteInventoryItem.useMutation({
			onSuccess: () => {
				toast.success("Item eliminado");
				utils.organization.eventOrganization.listInventory.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar item");
			},
		});

	const form = useZodForm({
		schema: createInventoryItemSchema,
		defaultValues: {
			eventId,
			name: "",
			description: "",
			quantityNeeded: 1,
			quantityAvailable: 0,
			status: "needed",
			unitCost: undefined,
			zoneId: undefined,
			vendorId: undefined,
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		createMutation.mutate(data);
	});

	const getStatusBadge = (status: string) => {
		const s = inventoryStatuses.find((s) => s.value === status);
		return s ? (
			<Badge variant="outline" className={cn("text-xs", s.color)}>
				{s.label}
			</Badge>
		) : null;
	};

	const totals = React.useMemo(() => {
		if (!data) return { needed: 0, available: 0, cost: 0 };
		return {
			needed: data.reduce((sum, i) => sum + (i.quantityNeeded ?? 0), 0),
			available: data.reduce((sum, i) => sum + (i.quantityAvailable ?? 0), 0),
			cost: data.reduce(
				(sum, i) => sum + (i.unitCost ?? 0) * (i.quantityNeeded ?? 0),
				0,
			),
		};
	}, [data]);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
		}).format(amount);
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Inventario</CardTitle>
						<CardDescription>
							{data?.length ?? 0} items
							{totals.cost > 0 &&
								` - Costo estimado: ${formatCurrency(totals.cost)}`}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Select
							value={filterStatus ?? "all"}
							onValueChange={(v) => setFilterStatus(v === "all" ? null : v)}
						>
							<SelectTrigger className="w-[140px]">
								<SelectValue placeholder="Estado" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								{inventoryStatuses.map((status) => (
									<SelectItem key={status.value} value={status.value}>
										{status.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button onClick={() => setIsDialogOpen(true)}>
							<Plus className="size-4 mr-1" />
							Agregar
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{isPending ? (
					<div className="space-y-2">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				) : data?.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<Package className="size-12 mx-auto mb-2 opacity-50" />
						<p>No hay items en el inventario</p>
					</div>
				) : (
					<div className="space-y-3">
						{data?.map((item) => {
							const fulfillment =
								item.quantityNeeded > 0
									? (item.quantityAvailable / item.quantityNeeded) * 100
									: 0;

							return (
								<div
									key={item.id}
									className="border rounded-lg p-4 hover:shadow-md transition-shadow"
								>
									<div className="flex items-start justify-between">
										<div className="flex items-start gap-3">
											<div className="size-10 rounded-lg bg-muted flex items-center justify-center">
												<Box className="size-5 text-muted-foreground" />
											</div>
											<div>
												<h3 className="font-medium">{item.name}</h3>
												{item.description && (
													<p className="text-sm text-muted-foreground">
														{item.description}
													</p>
												)}
												<div className="flex items-center gap-2 mt-2">
													{getStatusBadge(item.status)}
													{item.zone && (
														<Badge variant="secondary" className="text-xs">
															{item.zone.name}
														</Badge>
													)}
													{item.vendor && (
														<Badge variant="outline" className="text-xs">
															{item.vendor.name}
														</Badge>
													)}
												</div>
											</div>
										</div>
										<div className="flex items-center gap-4">
											<div className="text-right">
												<p className="text-sm font-medium">
													{item.quantityAvailable} / {item.quantityNeeded}
												</p>
												<Progress
													value={Math.min(fulfillment, 100)}
													className="h-1.5 w-20 mt-1"
												/>
												{item.unitCost && (
													<p className="text-xs text-muted-foreground mt-1">
														{formatCurrency(item.unitCost)} c/u
													</p>
												)}
											</div>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="size-8"
													>
														<MoreHorizontal className="size-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() =>
															deleteMutation.mutate({ id: item.id })
														}
														variant="destructive"
													>
														<Trash2 className="size-4" />
														Eliminar
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Agregar Item</DialogTitle>
						<DialogDescription>
							Agrega un item al inventario del evento
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={onSubmit} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nombre del Item</FormLabel>
										<FormControl>
											<Input placeholder="Ej: Sillas plegables" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Descripción (opcional)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Detalles del item..."
												className="resize-none"
												rows={2}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="quantityNeeded"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Cantidad Necesaria</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={1}
													{...field}
													onChange={(e) =>
														field.onChange(
															Number.parseInt(e.target.value, 10) || 1,
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
									name="quantityAvailable"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Cantidad Disponible</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={0}
													{...field}
													value={field.value ?? 0}
													onChange={(e) =>
														field.onChange(
															Number.parseInt(e.target.value, 10) || 0,
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
									name="status"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Estado</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar estado" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{inventoryStatuses.map((status) => (
														<SelectItem key={status.value} value={status.value}>
															{status.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="unitCost"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Costo Unitario (opcional)</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={0}
													placeholder="0"
													{...field}
													value={field.value ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Number.parseFloat(e.target.value)
																: undefined,
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
									name="zoneId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Zona (opcional)</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value ?? ""}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar zona" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{zones?.map((zone) => (
														<SelectItem key={zone.id} value={zone.id}>
															{zone.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="vendorId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Proveedor (opcional)</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value ?? ""}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar proveedor" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{vendors?.map((vendor) => (
														<SelectItem key={vendor.id} value={vendor.id}>
															{vendor.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
								>
									Cancelar
								</Button>
								<Button type="submit" disabled={createMutation.isPending}>
									{createMutation.isPending && (
										<Loader2 className="mr-2 size-4 animate-spin" />
									)}
									Agregar
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
