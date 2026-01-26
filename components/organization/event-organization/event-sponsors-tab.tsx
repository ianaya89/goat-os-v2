"use client";

import {
	Building2,
	Gift,
	Loader2,
	Mail,
	MoreHorizontal,
	Phone,
	Plus,
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
import { createSponsorSchema } from "@/schemas/organization-event-organization-schemas";
import { trpc } from "@/trpc/client";

interface EventSponsorsTabProps {
	eventId: string;
}

const sponsorTiers = [
	{
		value: "platinum",
		label: "Platinum",
		color: "bg-slate-200 text-slate-800",
	},
	{ value: "gold", label: "Gold", color: "bg-yellow-100 text-yellow-800" },
	{ value: "silver", label: "Silver", color: "bg-gray-200 text-gray-700" },
	{ value: "bronze", label: "Bronze", color: "bg-orange-100 text-orange-700" },
	{ value: "partner", label: "Partner", color: "bg-blue-100 text-blue-700" },
	{
		value: "supporter",
		label: "Supporter",
		color: "bg-green-100 text-green-700",
	},
];

export function EventSponsorsTab({
	eventId,
}: EventSponsorsTabProps): React.JSX.Element {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);

	const utils = trpc.useUtils();

	const { data, isPending } =
		trpc.organization.eventOrganization.listSponsors.useQuery({ eventId });

	const createMutation =
		trpc.organization.eventOrganization.createSponsor.useMutation({
			onSuccess: () => {
				toast.success("Sponsor agregado");
				utils.organization.eventOrganization.listSponsors.invalidate();
				setIsDialogOpen(false);
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message || "Error al agregar sponsor");
			},
		});

	const deleteMutation =
		trpc.organization.eventOrganization.deleteSponsor.useMutation({
			onSuccess: () => {
				toast.success("Sponsor eliminado");
				utils.organization.eventOrganization.listSponsors.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar sponsor");
			},
		});

	const form = useZodForm({
		schema: createSponsorSchema,
		defaultValues: {
			eventId,
			name: "",
			tier: "partner",
			contactName: "",
			contactEmail: "",
			contactPhone: "",
			sponsorshipValue: undefined,
			notes: "",
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		createMutation.mutate(data);
	});

	const getTierBadge = (tier: string) => {
		const t = sponsorTiers.find((t) => t.value === tier);
		return t ? (
			<Badge variant="outline" className={cn("text-xs font-semibold", t.color)}>
				{t.label}
			</Badge>
		) : null;
	};

	const totalAmount =
		data?.reduce((sum, s) => sum + (s.sponsorshipValue ?? 0), 0) ?? 0;

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
						<CardTitle>Sponsors</CardTitle>
						<CardDescription>
							{data?.length ?? 0} sponsors
							{totalAmount > 0 && ` - Total: ${formatCurrency(totalAmount)}`}
						</CardDescription>
					</div>
					<Button onClick={() => setIsDialogOpen(true)}>
						<Plus className="size-4 mr-1" />
						Agregar Sponsor
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{isPending ? (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{[1, 2].map((i) => (
							<Skeleton key={i} className="h-40 w-full" />
						))}
					</div>
				) : data?.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						No hay sponsors registrados
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{data?.map((sponsor) => (
							<div
								key={sponsor.id}
								className="border rounded-lg p-4 hover:shadow-md transition-shadow"
							>
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className="size-12 rounded-lg bg-muted flex items-center justify-center">
											<Building2 className="size-6 text-muted-foreground" />
										</div>
										<div>
											<h3 className="font-semibold">{sponsor.name}</h3>
											{getTierBadge(sponsor.tier)}
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
												onClick={() =>
													deleteMutation.mutate({ id: sponsor.id })
												}
												variant="destructive"
											>
												<Trash2 className="size-4" />
												Eliminar
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								<div className="mt-4 space-y-2 text-sm">
									{sponsor.contactName && (
										<div className="flex items-center gap-2 text-muted-foreground">
											<User className="size-3" />
											<span>{sponsor.contactName}</span>
										</div>
									)}
									{sponsor.contactEmail && (
										<div className="flex items-center gap-2 text-muted-foreground">
											<Mail className="size-3" />
											<span className="truncate">{sponsor.contactEmail}</span>
										</div>
									)}
									{sponsor.contactPhone && (
										<div className="flex items-center gap-2 text-muted-foreground">
											<Phone className="size-3" />
											<span>{sponsor.contactPhone}</span>
										</div>
									)}
									{sponsor.sponsorshipValue && sponsor.sponsorshipValue > 0 && (
										<div className="flex items-center gap-2 font-medium">
											<Gift className="size-3" />
											<span>{formatCurrency(sponsor.sponsorshipValue)}</span>
										</div>
									)}
								</div>

								{sponsor.benefits && sponsor.benefits.length > 0 && (
									<div className="mt-3 pt-3 border-t">
										<p className="text-xs text-muted-foreground mb-2">
											Contrapartidas:
										</p>
										<div className="flex flex-wrap gap-1">
											{sponsor.benefits.slice(0, 3).map((benefit) => (
												<Badge
													key={benefit.id}
													variant={
														benefit.status === "delivered"
															? "default"
															: "secondary"
													}
													className="text-xs"
												>
													{benefit.title}
												</Badge>
											))}
											{sponsor.benefits.length > 3 && (
												<Badge variant="outline" className="text-xs">
													+{sponsor.benefits.length - 3} más
												</Badge>
											)}
										</div>
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
						<DialogTitle>Agregar Sponsor</DialogTitle>
						<DialogDescription>
							Registra un nuevo sponsor para el evento
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
								name="tier"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nivel</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar nivel" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{sponsorTiers.map((tier) => (
													<SelectItem key={tier.value} value={tier.value}>
														{tier.label}
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
									name="contactEmail"
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
									name="contactPhone"
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
								name="sponsorshipValue"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Monto Acordado (opcional)</FormLabel>
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
															? Number.parseInt(e.target.value, 10)
															: undefined,
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
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notas (opcional)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Notas adicionales..."
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
