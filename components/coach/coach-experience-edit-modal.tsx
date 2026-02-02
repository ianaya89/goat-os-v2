"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { BriefcaseIcon, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditGrid,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { InstitutionSelector } from "@/components/shared/institution-selector";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field } from "@/components/ui/field";
import {
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { AthleteSport, CoachExperienceLevel } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const experienceSchema = z.object({
	clubId: z.string().uuid().optional().nullable(),
	nationalTeamId: z.string().uuid().optional().nullable(),
	role: z.string().trim().max(100),
	sport: z.nativeEnum(AthleteSport).optional().nullable(),
	level: z.nativeEnum(CoachExperienceLevel).optional().nullable(),
	startDate: z.date().optional().nullable(),
	endDate: z.date().optional().nullable(),
	achievements: z.string().trim().max(2000).optional().nullable(),
	description: z.string().trim().max(2000).optional().nullable(),
});

type ExperienceFormData = z.infer<typeof experienceSchema>;

interface ExperienceEntry {
	id: string;
	clubId: string | null;
	nationalTeamId: string | null;
	role: string;
	sport: AthleteSport | null;
	level: CoachExperienceLevel | null;
	startDate: Date | null;
	endDate: Date | null;
	achievements: string | null;
	description: string | null;
}

interface CoachExperienceEditModalProps {
	entry?: ExperienceEntry;
}

const sportLabels: Record<AthleteSport, string> = {
	[AthleteSport.soccer]: "Futbol",
	[AthleteSport.basketball]: "Basquetbol",
	[AthleteSport.volleyball]: "Voleibol",
	[AthleteSport.tennis]: "Tenis",
	[AthleteSport.swimming]: "Natacion",
	[AthleteSport.athletics]: "Atletismo",
	[AthleteSport.rugby]: "Rugby",
	[AthleteSport.hockey]: "Hockey",
	[AthleteSport.baseball]: "Beisbol",
	[AthleteSport.handball]: "Handball",
	[AthleteSport.padel]: "Padel",
	[AthleteSport.golf]: "Golf",
	[AthleteSport.boxing]: "Boxeo",
	[AthleteSport.martialArts]: "Artes Marciales",
	[AthleteSport.gymnastics]: "Gimnasia",
	[AthleteSport.cycling]: "Ciclismo",
	[AthleteSport.running]: "Running",
	[AthleteSport.fitness]: "Fitness",
	[AthleteSport.crossfit]: "CrossFit",
	[AthleteSport.other]: "Otro",
};

const levelLabels: Record<CoachExperienceLevel, string> = {
	[CoachExperienceLevel.amateur]: "Amateur",
	[CoachExperienceLevel.professional]: "Profesional",
	[CoachExperienceLevel.nationalTeam]: "Seleccion Nacional",
};

export const CoachExperienceEditModal = NiceModal.create(
	({ entry }: CoachExperienceEditModalProps) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!entry;

		const form = useZodForm({
			schema: experienceSchema,
			defaultValues: {
				clubId: entry?.clubId ?? null,
				nationalTeamId: entry?.nationalTeamId ?? null,
				role: entry?.role ?? "",
				sport: entry?.sport ?? null,
				level: entry?.level ?? null,
				startDate: entry?.startDate ?? null,
				endDate: entry?.endDate ?? null,
				achievements: entry?.achievements ?? "",
				description: entry?.description ?? "",
			},
		});

		const isNationalTeam = !!form.watch("nationalTeamId");

		const createMutation = trpc.coach.addSportsExperience.useMutation({
			onSuccess: () => {
				toast.success("Experiencia agregada");
				utils.coach.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const updateMutation = trpc.coach.updateSportsExperience.useMutation({
			onSuccess: () => {
				toast.success("Experiencia actualizada");
				utils.coach.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const deleteMutation = trpc.coach.deleteSportsExperience.useMutation({
			onSuccess: () => {
				toast.success("Experiencia eliminada");
				utils.coach.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const onSubmit = form.handleSubmit((data: ExperienceFormData) => {
			const payload = {
				clubId: data.clubId ?? undefined,
				nationalTeamId: data.nationalTeamId ?? undefined,
				role: data.role,
				sport: data.sport ?? undefined,
				level: data.level ?? undefined,
				startDate: data.startDate ?? undefined,
				endDate: data.endDate ?? undefined,
				achievements: data.achievements || undefined,
				description: data.description || undefined,
			};

			if (isEditing && entry) {
				updateMutation.mutate({ id: entry.id, ...payload });
			} else {
				createMutation.mutate(payload);
			}
		});

		const handleDelete = () => {
			if (entry && confirm("Eliminar esta experiencia?")) {
				deleteMutation.mutate({ id: entry.id });
			}
		};

		const handleTabChange = (value: string) => {
			if (value === "national") {
				form.setValue("clubId", null);
			} else {
				form.setValue("nationalTeamId", null);
			}
		};

		const isPending =
			createMutation.isPending ||
			updateMutation.isPending ||
			deleteMutation.isPending;

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={isEditing ? "Editar Experiencia" : "Agregar Experiencia"}
				subtitle="Registra tu experiencia como entrenador"
				icon={<BriefcaseIcon className="size-5" />}
				accentColor="primary"
				form={form}
				onSubmit={onSubmit}
				isPending={isPending}
				submitLabel={isEditing ? "Guardar" : "Agregar"}
				maxWidth="lg"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
				customFooter={
					<div className="flex items-center justify-between">
						{isEditing ? (
							<Button
								type="button"
								variant="destructive"
								size="sm"
								onClick={handleDelete}
								disabled={isPending}
							>
								Eliminar
							</Button>
						) : (
							<div />
						)}
						<div className="flex gap-3">
							<Button
								type="button"
								variant="ghost"
								onClick={modal.handleClose}
								disabled={isPending}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isPending} loading={isPending}>
								{isEditing ? "Guardar" : "Agregar"}
							</Button>
						</div>
					</div>
				}
			>
				<div className="space-y-6">
					{/* Institution Type Selector */}
					<Tabs
						defaultValue={isNationalTeam ? "national" : "club"}
						onValueChange={handleTabChange}
					>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="club" className="gap-2">
								<BriefcaseIcon className="size-4" />
								Club / Equipo
							</TabsTrigger>
							<TabsTrigger value="national" className="gap-2">
								Seleccion Nacional
							</TabsTrigger>
						</TabsList>

						<TabsContent value="club" className="mt-4">
							<FormField
								control={form.control}
								name="clubId"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Club / Equipo</FormLabel>
											<FormControl>
												<InstitutionSelector
													type="club"
													value={field.value}
													onChange={field.onChange}
													placeholder="Seleccionar club..."
												/>
											</FormControl>
											<FormDescription>
												Los clubes se configuran desde la organizacion
											</FormDescription>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</TabsContent>

						<TabsContent value="national" className="mt-4">
							<FormField
								control={form.control}
								name="nationalTeamId"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Seleccion Nacional</FormLabel>
											<FormControl>
												<InstitutionSelector
													type="nationalTeam"
													value={field.value}
													onChange={field.onChange}
													placeholder="Seleccionar seleccion..."
												/>
											</FormControl>
											<FormDescription>
												Las selecciones se configuran desde la organizacion
											</FormDescription>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</TabsContent>
					</Tabs>

					<ProfileEditSection title="Detalles del Rol">
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="role"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Rol / Posicion</FormLabel>
											<FormControl>
												<Input
													placeholder="Entrenador Principal, Asistente..."
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
								name="sport"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Deporte</FormLabel>
											<Select
												value={field.value ?? ""}
												onValueChange={(v) => field.onChange(v || null)}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar deporte" />
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
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="level"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Nivel</FormLabel>
											<Select
												value={field.value ?? ""}
												onValueChange={(v) => field.onChange(v || null)}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar nivel" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{Object.entries(levelLabels).map(([value, label]) => (
														<SelectItem key={value} value={value}>
															{label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>
					</ProfileEditSection>

					<ProfileEditSection title="Periodo">
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="startDate"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Fecha de Inicio</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant="outline"
															className={cn(
																"w-full justify-start text-left font-normal",
																!field.value && "text-muted-foreground",
															)}
														>
															<CalendarIcon className="mr-2 size-4" />
															{field.value
																? format(field.value, "MMM yyyy")
																: "Seleccionar"}
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={field.value ?? undefined}
														onSelect={field.onChange}
														disabled={(date) =>
															date > new Date() || date < new Date("1950-01-01")
														}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
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
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant="outline"
															className={cn(
																"w-full justify-start text-left font-normal",
																!field.value && "text-muted-foreground",
															)}
														>
															<CalendarIcon className="mr-2 size-4" />
															{field.value
																? format(field.value, "MMM yyyy")
																: "Presente"}
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={field.value ?? undefined}
														onSelect={field.onChange}
														disabled={(date) =>
															date > new Date() || date < new Date("1950-01-01")
														}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormDescription>
												Dejar vacio si es actual
											</FormDescription>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>
					</ProfileEditSection>

					<ProfileEditSection title="Informacion Adicional">
						<FormField
							control={form.control}
							name="achievements"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Logros</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Campeonatos ganados, records, etc..."
												className="resize-none"
												rows={3}
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
							name="description"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Descripcion</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Describe tus responsabilidades y logros..."
												className="resize-none"
												rows={3}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>
					</ProfileEditSection>
				</div>
			</ProfileEditSheet>
		);
	},
);
