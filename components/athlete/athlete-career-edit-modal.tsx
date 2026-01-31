"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	BriefcaseIcon,
	CalendarIcon,
	FlagIcon,
	TrophyIcon,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditGrid,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

// TODO: Implement club/nationalTeam selectors instead of text inputs
const careerSchema = z.object({
	clubId: z.string().uuid().optional().nullable(),
	nationalTeamId: z.string().uuid().optional().nullable(),
	startDate: z.date().optional().nullable(),
	endDate: z.date().optional().nullable(),
	position: z.string().max(100).optional().nullable(),
	achievements: z.string().max(1000).optional().nullable(),
	notes: z.string().max(500).optional().nullable(),
});

type CareerFormData = z.infer<typeof careerSchema>;

interface CareerEntry {
	id: string;
	clubId: string | null;
	nationalTeamId: string | null;
	startDate: Date | null;
	endDate: Date | null;
	position: string | null;
	achievements: string | null;
	notes: string | null;
}

interface AthleteCareerEditModalProps {
	athleteId: string;
	entry?: CareerEntry;
}

export const AthleteCareerEditModal = NiceModal.create(
	({ entry }: AthleteCareerEditModalProps) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!entry;

		const form = useZodForm({
			schema: careerSchema,
			defaultValues: {
				clubId: entry?.clubId ?? null,
				nationalTeamId: entry?.nationalTeamId ?? null,
				startDate: entry?.startDate ?? null,
				endDate: entry?.endDate ?? null,
				position: entry?.position ?? "",
				achievements: entry?.achievements ?? "",
				notes: entry?.notes ?? "",
			},
		});

		const isNationalTeam = !!form.watch("nationalTeamId");

		const createMutation = trpc.athlete.addCareerHistory.useMutation({
			onSuccess: () => {
				toast.success("Historial de carrera agregado");
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const updateMutation = trpc.athlete.updateCareerHistory.useMutation({
			onSuccess: () => {
				toast.success("Historial de carrera actualizado");
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const deleteMutation = trpc.athlete.deleteCareerHistory.useMutation({
			onSuccess: () => {
				toast.success("Historial de carrera eliminado");
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const onSubmit = form.handleSubmit((data: CareerFormData) => {
			const payload = {
				clubId: data.clubId ?? undefined,
				nationalTeamId: data.nationalTeamId ?? undefined,
				startDate: data.startDate ?? undefined,
				endDate: data.endDate ?? undefined,
				position: data.position || undefined,
				achievements: data.achievements || undefined,
				notes: data.notes || undefined,
			};

			if (isEditing && entry) {
				updateMutation.mutate({ id: entry.id, ...payload });
			} else {
				createMutation.mutate(payload);
			}
		});

		const handleDelete = () => {
			if (entry && confirm("Eliminar este historial de carrera?")) {
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
				title={isEditing ? "Editar Historial" : "Agregar Historial"}
				subtitle="Registra tu trayectoria en clubes y selecciones"
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
					{/* Type Selector */}
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
								<FlagIcon className="size-4" />
								Seleccion Nacional
							</TabsTrigger>
						</TabsList>

						<TabsContent value="club" className="mt-4">
							{/* TODO: Implement club selector */}
							<div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground text-sm">
								Selector de club pendiente. Los clubes se configuran desde la
								organización.
							</div>
						</TabsContent>

						<TabsContent value="national" className="mt-4 space-y-4">
							{/* TODO: Implement national team selector */}
							<div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground text-sm">
								Selector de selección nacional pendiente. Las selecciones se
								configuran desde la organización.
							</div>
						</TabsContent>
					</Tabs>

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

					<ProfileEditSection title="Detalles">
						<FormField
							control={form.control}
							name="position"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Posicion / Rol</FormLabel>
										<FormControl>
											<Input
												placeholder="Mediocampista, Delantero, Base..."
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
							name="achievements"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel className="flex items-center gap-2">
											<TrophyIcon className="size-4 text-amber-500" />
											Logros
										</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Campeon liga 2024, Goleador, MVP, Mejor defensor..."
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
							name="notes"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Notas Adicionales</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Cualquier informacion adicional..."
												className="resize-none"
												rows={2}
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
