"use client";

import {
	Building2,
	Loader2,
	Mail,
	MapPin,
	MoreHorizontal,
	Phone,
	Plus,
	Star,
	Trash2,
	User,
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
import { cn } from "@/lib/utils";
import { createVendorSchema } from "@/schemas/organization-event-organization-schemas";
import { trpc } from "@/trpc/client";

interface EventVendorsTabProps {
	eventId: string;
}

const vendorCategories = [
	{ value: "catering", label: "Catering" },
	{ value: "audiovisual", label: "Audiovisual" },
	{ value: "security", label: "Seguridad" },
	{ value: "transport", label: "Transporte" },
	{ value: "rental", label: "Alquiler" },
	{ value: "printing", label: "Imprenta" },
	{ value: "photography", label: "Fotografía" },
	{ value: "decoration", label: "Decoración" },
	{ value: "medical", label: "Servicios Médicos" },
	{ value: "cleaning", label: "Limpieza" },
	{ value: "other", label: "Otro" },
];

export function EventVendorsTab({
	eventId: _eventId,
}: EventVendorsTabProps): React.JSX.Element {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);
	const [filterCategory, setFilterCategory] = React.useState<string | null>(
		null,
	);

	const utils = trpc.useUtils();

	const { data, isPending } =
		trpc.organization.eventOrganization.listVendors.useQuery({
			query: filterCategory ?? undefined,
		});

	const createMutation =
		trpc.organization.eventOrganization.createVendor.useMutation({
			onSuccess: () => {
				toast.success("Proveedor agregado");
				utils.organization.eventOrganization.listVendors.invalidate();
				setIsDialogOpen(false);
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message || "Error al agregar proveedor");
			},
		});

	const deleteMutation =
		trpc.organization.eventOrganization.deleteVendor.useMutation({
			onSuccess: () => {
				toast.success("Proveedor eliminado");
				utils.organization.eventOrganization.listVendors.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar proveedor");
			},
		});

	const form = useZodForm({
		schema: createVendorSchema,
		defaultValues: {
			name: "",
			categories: [],
			contactName: "",
			email: "",
			phone: "",
			address: "",
			notes: "",
			rating: undefined,
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		createMutation.mutate(data);
	});

	const getCategoryLabel = (category: string) => {
		return (
			vendorCategories.find((c) => c.value === category)?.label ?? category
		);
	};

	const getCategoriesLabels = (
		categories: string | string[] | null | undefined,
	) => {
		if (!categories) return null;
		// Handle both string (JSON) and array formats
		let categoryArray: string[];
		if (typeof categories === "string") {
			try {
				categoryArray = JSON.parse(categories) as string[];
			} catch {
				// If not valid JSON, treat as a single category
				categoryArray = [categories];
			}
		} else {
			categoryArray = categories;
		}
		if (!categoryArray || categoryArray.length === 0) return null;
		return categoryArray.map(getCategoryLabel).join(", ");
	};

	const renderRating = (rating?: number | null) => {
		if (!rating) return null;
		return (
			<div className="flex items-center gap-0.5">
				{[1, 2, 3, 4, 5].map((star) => (
					<Star
						key={star}
						className={cn(
							"size-3",
							star <= rating
								? "text-yellow-500 fill-yellow-500"
								: "text-gray-300",
						)}
					/>
				))}
			</div>
		);
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Proveedores</CardTitle>
						<CardDescription>
							Base de datos de proveedores de la organización
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Select
							value={filterCategory ?? "all"}
							onValueChange={(v) => setFilterCategory(v === "all" ? null : v)}
						>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Categoría" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todas</SelectItem>
								{vendorCategories.map((cat) => (
									<SelectItem key={cat.value} value={cat.value}>
										{cat.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button onClick={() => setIsDialogOpen(true)}>
							<Plus className="size-4 mr-1" />
							Nuevo Proveedor
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{isPending ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-40 w-full" />
						))}
					</div>
				) : data?.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						No hay proveedores registrados
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{data?.map((vendor) => (
							<div
								key={vendor.id}
								className="border rounded-lg p-4 hover:shadow-md transition-shadow"
							>
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className="size-10 rounded-lg bg-muted flex items-center justify-center">
											<Building2 className="size-5 text-muted-foreground" />
										</div>
										<div>
											<h3 className="font-medium">{vendor.name}</h3>
											{vendor.categories && (
												<Badge variant="secondary" className="text-xs mt-1">
													{getCategoriesLabels(vendor.categories)}
												</Badge>
											)}
										</div>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="size-8">
												<MoreHorizontal className="size-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => deleteMutation.mutate({ id: vendor.id })}
												variant="destructive"
											>
												<Trash2 className="size-4" />
												Eliminar
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								<div className="mt-4 space-y-2 text-sm text-muted-foreground">
									{vendor.contactName && (
										<div className="flex items-center gap-2">
											<User className="size-3" />
											<span>{vendor.contactName}</span>
										</div>
									)}
									{vendor.email && (
										<div className="flex items-center gap-2">
											<Mail className="size-3" />
											<span className="truncate">{vendor.email}</span>
										</div>
									)}
									{vendor.phone && (
										<div className="flex items-center gap-2">
											<Phone className="size-3" />
											<span>{vendor.phone}</span>
										</div>
									)}
									{vendor.address && (
										<div className="flex items-center gap-2">
											<MapPin className="size-3" />
											<span className="truncate">{vendor.address}</span>
										</div>
									)}
								</div>

								{vendor.rating && (
									<div className="mt-3 pt-3 border-t">
										{renderRating(vendor.rating)}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</CardContent>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Nuevo Proveedor</DialogTitle>
						<DialogDescription>
							Agrega un proveedor a la base de datos de la organización
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={onSubmit} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Empresa</FormLabel>
										<FormControl>
											<Input placeholder="Nombre de la empresa" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="categories"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Categoría</FormLabel>
										<Select
											onValueChange={(v) => field.onChange([v])}
											value={field.value?.[0] ?? ""}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar categoría" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{vendorCategories.map((cat) => (
													<SelectItem key={cat.value} value={cat.value}>
														{cat.label}
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
								name="contactName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Contacto (opcional)</FormLabel>
										<FormControl>
											<Input
												placeholder="Nombre del contacto"
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
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email (opcional)</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="email@empresa.com"
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Teléfono (opcional)</FormLabel>
											<FormControl>
												<Input
													placeholder="+54 11 1234-5678"
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="address"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Dirección (opcional)</FormLabel>
										<FormControl>
											<Input
												placeholder="Dirección completa"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="rating"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Calificación (opcional)</FormLabel>
										<Select
											onValueChange={(v) => field.onChange(Number(v))}
											value={field.value?.toString() ?? ""}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar calificación" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{[1, 2, 3, 4, 5].map((rating) => (
													<SelectItem key={rating} value={rating.toString()}>
														{"★".repeat(rating)}
														{"☆".repeat(5 - rating)}
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
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notas (opcional)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Notas sobre el proveedor..."
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
