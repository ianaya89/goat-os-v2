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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { MatchStatus } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import {
	createMatchSchema,
	updateMatchSchema,
} from "@/schemas/organization-match-schemas";
import { trpc } from "@/trpc/client";

const statusLabels: Record<string, string> = {
	scheduled: "Programado",
	in_progress: "En curso",
	completed: "Completado",
	postponed: "Aplazado",
	cancelled: "Cancelado",
};

interface Match {
	id: string;
	competitionId: string | null;
	homeTeamId: string | null;
	awayTeamId: string | null;
	opponentName: string | null;
	isHomeGame: boolean;
	scheduledAt: Date;
	status: string;
	venue: string | null;
	round: string | null;
	matchday: number | null;
	referee: string | null;
	preMatchNotes: string | null;
}

interface MatchesModalProps {
	match?: Match;
	defaultCompetitionId?: string;
	defaultTeamId?: string;
}

export const MatchesModal = NiceModal.create<MatchesModalProps>(
	({ match, defaultCompetitionId, defaultTeamId }) => {
		const modal = useEnhancedModal();
		const isEditing = !!match;
		const utils = trpc.useUtils();

		const { data: teams } = trpc.organization.team.listActive.useQuery();
		const { data: competitions } = trpc.organization.competition.list.useQuery({
			limit: 100,
			offset: 0,
		});
		const { data: _locations } = trpc.organization.location.list.useQuery({
			limit: 100,
			offset: 0,
		});

		const form = useZodForm({
			schema: isEditing ? updateMatchSchema : createMatchSchema,
			defaultValues: {
				id: match?.id,
				competitionId:
					match?.competitionId ?? defaultCompetitionId ?? undefined,
				homeTeamId: match?.homeTeamId ?? defaultTeamId ?? undefined,
				awayTeamId: match?.awayTeamId ?? undefined,
				opponentName: match?.opponentName ?? "",
				isHomeGame: match?.isHomeGame ?? true,
				scheduledAt: match?.scheduledAt
					? new Date(match.scheduledAt)
					: new Date(),
				status:
					(match?.status as (typeof MatchStatus)[keyof typeof MatchStatus]) ??
					MatchStatus.scheduled,
				venue: match?.venue ?? "",
				round: match?.round ?? "",
				matchday: match?.matchday ?? undefined,
				referee: match?.referee ?? "",
				preMatchNotes: match?.preMatchNotes ?? "",
			},
		});

		const createMutation = trpc.organization.match.create.useMutation({
			onSuccess: () => {
				toast.success("Partido creado");
				utils.organization.match.list.invalidate();
				utils.organization.match.listUpcoming.invalidate();
				modal.hide();
			},
			onError: (error) => {
				toast.error(error.message || "Error al crear partido");
			},
		});

		const updateMutation = trpc.organization.match.update.useMutation({
			onSuccess: () => {
				toast.success("Partido actualizado");
				utils.organization.match.list.invalidate();
				utils.organization.match.get.invalidate();
				utils.organization.match.listUpcoming.invalidate();
				modal.hide();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar partido");
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			const scheduledAt =
				data.scheduledAt instanceof Date
					? data.scheduledAt
					: new Date(data.scheduledAt as unknown as string);
			if (isEditing && match) {
				updateMutation.mutate({
					id: match.id,
					competitionId: data.competitionId,
					homeTeamId: data.homeTeamId,
					awayTeamId: data.awayTeamId,
					opponentName: data.opponentName,
					isHomeGame: data.isHomeGame,
					scheduledAt,
					status: data.status,
					venue: data.venue,
					locationId: data.locationId,
					round: data.round,
					matchday: data.matchday,
					referee: data.referee,
					preMatchNotes: data.preMatchNotes,
				});
			} else {
				createMutation.mutate({
					competitionId: data.competitionId,
					homeTeamId: data.homeTeamId,
					awayTeamId: data.awayTeamId,
					opponentName: data.opponentName,
					isHomeGame: data.isHomeGame,
					scheduledAt,
					status: data.status,
					venue: data.venue,
					locationId: data.locationId,
					round: data.round,
					matchday: data.matchday,
					referee: data.referee,
					preMatchNotes: data.preMatchNotes,
				});
			}
		});

		const isPending = createMutation.isPending || updateMutation.isPending;
		const isHomeGame = form.watch("isHomeGame");

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.hide()}
			>
				<SheetContent className="sm:max-w-lg overflow-y-auto">
					<SheetHeader>
						<SheetTitle>
							{isEditing ? "Editar partido" : "Nuevo partido"}
						</SheetTitle>
						<SheetDescription>
							{isEditing
								? "Modifica los datos del partido"
								: "Programa un nuevo partido"}
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form onSubmit={onSubmit} className="mt-6 space-y-6">
							<FormField
								control={form.control}
								name="competitionId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Competencia</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value ?? undefined}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar competencia" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{competitions?.competitions.map((competition) => (
													<SelectItem
														key={competition.id}
														value={competition.id}
													>
														{competition.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>
											Opcional. Deja vacío para partidos amistosos
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="isHomeGame"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">
												Partido de local
											</FormLabel>
											<FormDescription>
												¿El equipo juega de local?
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

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="homeTeamId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{isHomeGame ? "Nuestro equipo" : "Equipo local"}
											</FormLabel>
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
													{teams?.map((team) => (
														<SelectItem key={team.id} value={team.id}>
															{team.name}
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
									name="awayTeamId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{isHomeGame ? "Equipo visitante" : "Nuestro equipo"}
											</FormLabel>
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
													{teams?.map((team) => (
														<SelectItem key={team.id} value={team.id}>
															{team.name}
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
								name="opponentName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Rival externo</FormLabel>
										<FormControl>
											<Input
												placeholder="Nombre del equipo rival"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormDescription>
											Usar solo si el rival no es un equipo de la organización
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="scheduledAt"
								render={({ field }) => {
									const dateValue =
										field.value instanceof Date ? field.value : undefined;
									return (
										<FormItem className="flex flex-col">
											<FormLabel>Fecha y hora</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant="outline"
															className={cn(
																"w-full pl-3 text-left font-normal",
																!dateValue && "text-muted-foreground",
															)}
														>
															{dateValue ? (
																format(dateValue, "PPP HH:mm", { locale: es })
															) : (
																<span>Seleccionar fecha</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={dateValue}
														onSelect={(date) => {
															if (date) {
																const current = dateValue || new Date();
																date.setHours(current.getHours());
																date.setMinutes(current.getMinutes());
																field.onChange(date);
															}
														}}
														initialFocus
													/>
													<div className="border-t p-3">
														<Input
															type="time"
															value={
																dateValue ? format(dateValue, "HH:mm") : ""
															}
															onChange={(e) => {
																const [hours, minutes] =
																	e.target.value.split(":");
																const date = dateValue
																	? new Date(dateValue)
																	: new Date();
																date.setHours(parseInt(hours || "0", 10));
																date.setMinutes(parseInt(minutes || "0", 10));
																field.onChange(new Date(date));
															}}
														/>
													</div>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									);
								}}
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

							<FormField
								control={form.control}
								name="venue"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sede</FormLabel>
										<FormControl>
											<Input
												placeholder="Estadio / Cancha"
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
									name="round"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Ronda</FormLabel>
											<FormControl>
												<Input
													placeholder="Cuartos de final"
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
									name="matchday"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Jornada</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={1}
													placeholder="1"
													{...field}
													value={field.value ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? parseInt(e.target.value, 10)
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

							<FormField
								control={form.control}
								name="referee"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Árbitro</FormLabel>
										<FormControl>
											<Input
												placeholder="Nombre del árbitro"
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
								name="preMatchNotes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notas previas</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Notas sobre el partido..."
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
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
											: "Crear partido"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
