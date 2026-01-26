"use client";

import NiceModal from "@ebay/nice-modal-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { type AthleteSport, TeamStatus } from "@/lib/db/schema/enums";
import {
	createTeamSchema,
	updateTeamSchema,
} from "@/schemas/organization-team-schemas";
import { trpc } from "@/trpc/client";

const sportLabels: Record<string, string> = {
	soccer: "Fútbol",
	basketball: "Básquetbol",
	volleyball: "Vóley",
	tennis: "Tenis",
	swimming: "Natación",
	athletics: "Atletismo",
	rugby: "Rugby",
	hockey: "Hockey",
	baseball: "Béisbol",
	handball: "Handball",
	padel: "Pádel",
	golf: "Golf",
	boxing: "Boxeo",
	martial_arts: "Artes marciales",
	gymnastics: "Gimnasia",
	cycling: "Ciclismo",
	running: "Running",
	fitness: "Fitness",
	crossfit: "CrossFit",
	other: "Otro",
};

const statusLabels: Record<string, string> = {
	active: "Activo",
	inactive: "Inactivo",
	archived: "Archivado",
};

interface Team {
	id: string;
	name: string;
	description: string | null;
	sport: string | null;
	status: string;
	seasonId?: string | null;
	ageCategoryId?: string | null;
	homeVenue?: string | null;
	primaryColor?: string | null;
	secondaryColor?: string | null;
}

interface TeamsModalProps {
	team?: Team;
}

export const TeamsModal = NiceModal.create<TeamsModalProps>(({ team }) => {
	const modal = useEnhancedModal();
	const isEditing = !!team;
	const utils = trpc.useUtils();

	const { data: seasons } = trpc.organization.season.listActive.useQuery();
	const { data: ageCategories } =
		trpc.organization.sportsEvent.listAgeCategories.useQuery({});

	const form = useZodForm({
		schema: isEditing ? updateTeamSchema : createTeamSchema,
		defaultValues: {
			id: team?.id,
			name: team?.name ?? "",
			description: team?.description ?? "",
			sport:
				(team?.sport as (typeof AthleteSport)[keyof typeof AthleteSport]) ??
				undefined,
			status:
				(team?.status as (typeof TeamStatus)[keyof typeof TeamStatus]) ??
				TeamStatus.active,
			seasonId: team?.seasonId ?? undefined,
			ageCategoryId: team?.ageCategoryId ?? undefined,
			homeVenue: team?.homeVenue ?? "",
			primaryColor: team?.primaryColor ?? "#3B82F6",
			secondaryColor: team?.secondaryColor ?? "#1E40AF",
		},
	});

	const createMutation = trpc.organization.team.create.useMutation({
		onSuccess: () => {
			toast.success("Equipo creado");
			utils.organization.team.list.invalidate();
			utils.organization.team.listActive.invalidate();
			modal.hide();
		},
		onError: (error) => {
			toast.error(error.message || "Error al crear equipo");
		},
	});

	const updateMutation = trpc.organization.team.update.useMutation({
		onSuccess: () => {
			toast.success("Equipo actualizado");
			utils.organization.team.list.invalidate();
			utils.organization.team.listActive.invalidate();
			utils.organization.team.get.invalidate();
			modal.hide();
		},
		onError: (error) => {
			toast.error(error.message || "Error al actualizar equipo");
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		const name = data.name || "";

		if (isEditing && team) {
			updateMutation.mutate({
				id: team.id,
				name,
				description: data.description,
				sport: data.sport,
				status: data.status,
				seasonId: data.seasonId,
				ageCategoryId: data.ageCategoryId,
				homeVenue: data.homeVenue,
				primaryColor: data.primaryColor,
				secondaryColor: data.secondaryColor,
			});
		} else {
			createMutation.mutate({
				name,
				description: data.description,
				sport: data.sport,
				status: data.status,
				seasonId: data.seasonId,
				ageCategoryId: data.ageCategoryId,
				homeVenue: data.homeVenue,
				primaryColor: data.primaryColor,
				secondaryColor: data.secondaryColor,
			});
		}
	});

	const isPending = createMutation.isPending || updateMutation.isPending;

	return (
		<Sheet open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
			<SheetContent className="sm:max-w-lg overflow-y-auto">
				<SheetHeader>
					<SheetTitle>
						{isEditing ? "Editar equipo" : "Nuevo equipo"}
					</SheetTitle>
					<SheetDescription>
						{isEditing
							? "Modifica los datos del equipo"
							: "Crea un nuevo equipo para competencias"}
					</SheetDescription>
				</SheetHeader>

				<Form {...form}>
					<form onSubmit={onSubmit} className="mt-6 space-y-6">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nombre del equipo</FormLabel>
									<FormControl>
										<Input placeholder="Sub-15 A" {...field} />
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
									<FormLabel>Descripción</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Descripción del equipo..."
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
								name="sport"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Deporte</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value ?? undefined}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Object.entries(sportLabels).map(([value, label]) => (
													<SelectItem key={value} value={value}>
														{label}
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
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Estado</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Object.entries(statusLabels).map(([value, label]) => (
													<SelectItem key={value} value={value}>
														{label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="seasonId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Temporada</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value ?? undefined}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{seasons?.map((season) => (
													<SelectItem key={season.id} value={season.id}>
														{season.name}
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
								name="ageCategoryId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Categoría</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value ?? undefined}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{ageCategories?.map((category) => (
													<SelectItem key={category.id} value={category.id}>
														{category.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="homeVenue"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Sede local</FormLabel>
									<FormControl>
										<Input
											placeholder="Estadio / Cancha"
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormDescription>
										Donde juega de local el equipo
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="primaryColor"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Color primario</FormLabel>
										<FormControl>
											<div className="flex gap-2">
												<Input
													type="color"
													className="h-10 w-14 cursor-pointer p-1"
													{...field}
													value={field.value ?? "#3B82F6"}
												/>
												<Input
													placeholder="#3B82F6"
													{...field}
													value={field.value ?? "#3B82F6"}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="secondaryColor"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Color secundario</FormLabel>
										<FormControl>
											<div className="flex gap-2">
												<Input
													type="color"
													className="h-10 w-14 cursor-pointer p-1"
													{...field}
													value={field.value ?? "#1E40AF"}
												/>
												<Input
													placeholder="#1E40AF"
													{...field}
													value={field.value ?? "#1E40AF"}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<SheetFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => modal.hide()}
								disabled={isPending}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending
									? "Guardando..."
									: isEditing
										? "Guardar cambios"
										: "Crear equipo"}
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
});
