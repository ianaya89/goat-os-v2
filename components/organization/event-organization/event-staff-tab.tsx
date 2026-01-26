"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	Clock,
	Loader2,
	Mail,
	MoreHorizontal,
	Phone,
	Plus,
	Trash2,
	User,
	UserPlus,
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
import type { EventStaffRole } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { createStaffSchema } from "@/schemas/organization-event-organization-schemas";
import { trpc } from "@/trpc/client";

interface EventStaffTabProps {
	eventId: string;
}

const staffRoles = [
	{
		value: "coordinator",
		label: "Coordinador",
		color: "bg-purple-100 text-purple-700",
	},
	{
		value: "volunteer",
		label: "Voluntario",
		color: "bg-green-100 text-green-700",
	},
	{ value: "security", label: "Seguridad", color: "bg-red-100 text-red-700" },
	{ value: "medical", label: "Médico", color: "bg-blue-100 text-blue-700" },
	{
		value: "referee",
		label: "Árbitro",
		color: "bg-orange-100 text-orange-700",
	},
	{
		value: "logistics",
		label: "Logística",
		color: "bg-yellow-100 text-yellow-700",
	},
	{
		value: "registration",
		label: "Acreditación",
		color: "bg-indigo-100 text-indigo-700",
	},
	{ value: "media", label: "Prensa/Media", color: "bg-pink-100 text-pink-700" },
	{
		value: "catering",
		label: "Catering",
		color: "bg-amber-100 text-amber-700",
	},
	{ value: "technical", label: "Técnico", color: "bg-cyan-100 text-cyan-700" },
	{ value: "other", label: "Otro", color: "bg-slate-100 text-slate-700" },
];

export function EventStaffTab({
	eventId,
}: EventStaffTabProps): React.JSX.Element {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);
	const [filterRole, setFilterRole] = React.useState<string | null>(null);

	const utils = trpc.useUtils();

	const { data, isPending } =
		trpc.organization.eventOrganization.listStaff.useQuery({
			eventId,
			role: (filterRole as EventStaffRole) ?? undefined,
		});

	const createMutation =
		trpc.organization.eventOrganization.createStaff.useMutation({
			onSuccess: () => {
				toast.success("Staff agregado");
				utils.organization.eventOrganization.listStaff.invalidate();
				setIsDialogOpen(false);
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message || "Error al agregar staff");
			},
		});

	const deleteMutation =
		trpc.organization.eventOrganization.deleteStaff.useMutation({
			onSuccess: () => {
				toast.success("Staff eliminado");
				utils.organization.eventOrganization.listStaff.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar staff");
			},
		});

	const form = useZodForm({
		schema: createStaffSchema,
		defaultValues: {
			eventId,
			staffType: "external",
			role: "volunteer",
			externalName: "",
			externalEmail: "",
			externalPhone: "",
			notes: "",
		},
	});

	const staffType = form.watch("staffType");

	const onSubmit = form.handleSubmit((data) => {
		createMutation.mutate(data);
	});

	const getRoleBadge = (role: string) => {
		const r = staffRoles.find((r) => r.value === role);
		return r ? (
			<Badge variant="outline" className={cn("text-xs", r.color)}>
				{r.label}
			</Badge>
		) : (
			<Badge variant="outline" className="text-xs">
				{role}
			</Badge>
		);
	};

	const staffByRole = React.useMemo(() => {
		const grouped: Record<string, number> = {};
		if (data) {
			for (const s of data) {
				grouped[s.role] = (grouped[s.role] || 0) + 1;
			}
		}
		return grouped;
	}, [data]);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Staff y Voluntarios</CardTitle>
						<CardDescription>
							{data?.length ?? 0} personas asignadas al evento
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Select
							value={filterRole ?? "all"}
							onValueChange={(v) => setFilterRole(v === "all" ? null : v)}
						>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Rol" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								{staffRoles.map((role) => (
									<SelectItem key={role.value} value={role.value}>
										{role.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button onClick={() => setIsDialogOpen(true)}>
							<UserPlus className="size-4 mr-1" />
							Agregar
						</Button>
					</div>
				</div>
				{Object.keys(staffByRole).length > 0 && (
					<div className="flex flex-wrap gap-2 mt-2">
						{Object.entries(staffByRole).map(([role, count]) => (
							<Badge key={role} variant="secondary" className="text-xs">
								{staffRoles.find((r) => r.value === role)?.label ?? role}:{" "}
								{count}
							</Badge>
						))}
					</div>
				)}
			</CardHeader>
			<CardContent>
				{isPending ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-32 w-full" />
						))}
					</div>
				) : data?.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						No hay staff asignado a este evento
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{data?.map((staff) => (
							<div
								key={staff.id}
								className="border rounded-lg p-4 hover:shadow-md transition-shadow"
							>
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className="size-10 rounded-full bg-muted flex items-center justify-center">
											<User className="size-5 text-muted-foreground" />
										</div>
										<div>
											<h3 className="font-medium">
												{staff.staffType === "system_user"
													? staff.user?.name
													: staff.externalName}
											</h3>
											{getRoleBadge(staff.role)}
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
												onClick={() => deleteMutation.mutate({ id: staff.id })}
												variant="destructive"
											>
												<Trash2 className="size-4" />
												Eliminar
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								<div className="mt-3 space-y-1 text-sm text-muted-foreground">
									{(staff.staffType === "external"
										? staff.externalEmail
										: staff.user?.email) && (
										<div className="flex items-center gap-2">
											<Mail className="size-3" />
											<span className="truncate">
												{staff.staffType === "external"
													? staff.externalEmail
													: staff.user?.email}
											</span>
										</div>
									)}
									{staff.externalPhone && (
										<div className="flex items-center gap-2">
											<Phone className="size-3" />
											<span>{staff.externalPhone}</span>
										</div>
									)}
									{staff.notes && (
										<p className="text-xs line-clamp-2 mt-2">{staff.notes}</p>
									)}
								</div>
								{staff.staffType === "external" && (
									<Badge variant="secondary" className="text-xs mt-2">
										Externo
									</Badge>
								)}
							</div>
						))}
					</div>
				)}
			</CardContent>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Agregar Staff</DialogTitle>
						<DialogDescription>
							Agrega una persona al equipo del evento
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={onSubmit} className="space-y-4">
							<FormField
								control={form.control}
								name="staffType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tipo de Personal</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar tipo" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="external">
													Persona Externa
												</SelectItem>
												<SelectItem value="system_user">
													Usuario del Sistema
												</SelectItem>
											</SelectContent>
										</Select>
										<FormDescription>
											{staffType === "external"
												? "Persona que no tiene cuenta en el sistema"
												: "Usuario registrado en la organización"}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="role"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Rol</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar rol" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{staffRoles.map((role) => (
													<SelectItem key={role.value} value={role.value}>
														{role.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{staffType === "external" && (
								<>
									<FormField
										control={form.control}
										name="externalName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Nombre</FormLabel>
												<FormControl>
													<Input
														placeholder="Nombre completo"
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
											name="externalEmail"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Email (opcional)</FormLabel>
													<FormControl>
														<Input
															type="email"
															placeholder="email@ejemplo.com"
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
											name="externalPhone"
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
								</>
							)}

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
