"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
	type AthleteSport,
	CompetitionStatus,
	CompetitionType,
} from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import {
	createCompetitionSchema,
	updateCompetitionSchema,
} from "@/schemas/organization-competition-schemas";
import { trpc } from "@/trpc/client";

const typeLabels: Record<string, string> = {
	league: "Liga",
	tournament: "Torneo",
	cup: "Copa",
	friendly: "Amistoso",
	championship: "Campeonato",
	playoff: "Playoff",
	other: "Otro",
};

const statusLabels: Record<string, string> = {
	upcoming: "Próximo",
	in_progress: "En curso",
	completed: "Completado",
	cancelled: "Cancelado",
};

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

interface Competition {
	id: string;
	name: string;
	description: string | null;
	type: string;
	sport: string | null;
	seasonId: string | null;
	startDate: Date | null;
	endDate: Date | null;
	status: string;
	venue: string | null;
}

interface CompetitionsModalProps {
	competition?: Competition;
}

export const CompetitionsModal = NiceModal.create<CompetitionsModalProps>(
	({ competition }) => {
		const modal = useEnhancedModal();
		const isEditing = !!competition;
		const utils = trpc.useUtils();

		const { data: seasons } = trpc.organization.season.listActive.useQuery();

		const form = useZodForm({
			schema: isEditing ? updateCompetitionSchema : createCompetitionSchema,
			defaultValues: {
				id: competition?.id,
				name: competition?.name ?? "",
				description: competition?.description ?? "",
				type:
					(competition?.type as (typeof CompetitionType)[keyof typeof CompetitionType]) ??
					CompetitionType.tournament,
				sport:
					(competition?.sport as (typeof AthleteSport)[keyof typeof AthleteSport]) ??
					undefined,
				seasonId: competition?.seasonId ?? undefined,
				startDate: competition?.startDate
					? new Date(competition.startDate)
					: undefined,
				endDate: competition?.endDate
					? new Date(competition.endDate)
					: undefined,
				status:
					(competition?.status as (typeof CompetitionStatus)[keyof typeof CompetitionStatus]) ??
					CompetitionStatus.upcoming,
				venue: competition?.venue ?? "",
			},
		});

		const createMutation = trpc.organization.competition.create.useMutation({
			onSuccess: () => {
				toast.success("Competencia creada");
				utils.organization.competition.list.invalidate();
				modal.hide();
			},
			onError: (error) => {
				toast.error(error.message || "Error al crear competencia");
			},
		});

		const updateMutation = trpc.organization.competition.update.useMutation({
			onSuccess: () => {
				toast.success("Competencia actualizada");
				utils.organization.competition.list.invalidate();
				utils.organization.competition.get.invalidate();
				modal.hide();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar competencia");
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing && competition) {
				updateMutation.mutate({
					id: competition.id,
					name: data.name,
					description: data.description,
					type: data.type,
					sport: data.sport,
					seasonId: data.seasonId,
					startDate:
						data.startDate instanceof Date ? data.startDate : undefined,
					endDate: data.endDate instanceof Date ? data.endDate : undefined,
					status: data.status,
					logoKey: data.logoKey,
					externalId: data.externalId,
					venue: data.venue,
					rules: data.rules,
				});
			} else {
				const name = data.name || "";
				const type = data.type!;
				createMutation.mutate({
					name,
					type,
					description: data.description,
					sport: data.sport,
					seasonId: data.seasonId,
					startDate:
						data.startDate instanceof Date ? data.startDate : undefined,
					endDate: data.endDate instanceof Date ? data.endDate : undefined,
					status: data.status,
					logoKey: data.logoKey,
					externalId: data.externalId,
					venue: data.venue,
					rules: data.rules,
				});
			}
		});

		const isPending = createMutation.isPending || updateMutation.isPending;

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.hide()}
			>
				<SheetContent className="sm:max-w-lg overflow-y-auto">
					<SheetHeader>
						<SheetTitle>
							{isEditing ? "Editar competencia" : "Nueva competencia"}
						</SheetTitle>
						<SheetDescription>
							{isEditing
								? "Modifica los datos de la competencia"
								: "Crea una nueva competencia (torneo, liga, copa, etc.)"}
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form onSubmit={onSubmit} className="mt-6 space-y-6">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nombre de la competencia</FormLabel>
										<FormControl>
											<Input placeholder="Liga Juvenil 2026" {...field} />
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
												placeholder="Descripción de la competencia..."
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
									name="type"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tipo</FormLabel>
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
													{Object.entries(typeLabels).map(([value, label]) => (
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
													{Object.entries(statusLabels).map(
														([value, label]) => (
															<SelectItem key={value} value={value}>
																{label}
															</SelectItem>
														),
													)}
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
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="startDate"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>Fecha de inicio</FormLabel>
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
															{field.value instanceof Date ? (
																format(field.value, "PPP", { locale: es })
															) : (
																<span>Seleccionar</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={
															field.value instanceof Date
																? field.value
																: undefined
														}
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
									name="endDate"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>Fecha de fin</FormLabel>
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
															{field.value instanceof Date ? (
																format(field.value, "PPP", { locale: es })
															) : (
																<span>Seleccionar</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={
															field.value instanceof Date
																? field.value
																: undefined
														}
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

							<FormField
								control={form.control}
								name="venue"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sede</FormLabel>
										<FormControl>
											<Input
												placeholder="Estadio / Complejo deportivo"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormDescription>
											Lugar principal donde se desarrolla la competencia
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

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
											: "Crear competencia"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
