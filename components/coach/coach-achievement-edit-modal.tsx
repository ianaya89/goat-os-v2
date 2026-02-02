"use client";

import NiceModal from "@ebay/nice-modal-react";
import { TrophyIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditGrid,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
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
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { AchievementScope, AchievementType } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

const achievementSchema = z.object({
	title: z.string().trim().min(1, "El titulo es requerido").max(200),
	type: z.nativeEnum(AchievementType),
	scope: z.nativeEnum(AchievementScope),
	year: z.number().int().min(1900).max(2100),
	organization: z.string().trim().max(200).optional().nullable(),
	team: z.string().trim().max(200).optional().nullable(),
	competition: z.string().trim().max(200).optional().nullable(),
	position: z.string().trim().max(100).optional().nullable(),
	description: z.string().trim().max(2000).optional().nullable(),
});

type AchievementFormData = z.infer<typeof achievementSchema>;

interface AchievementEntry {
	id: string;
	title: string;
	type: AchievementType;
	scope: AchievementScope;
	year: number;
	organization: string | null;
	team: string | null;
	competition: string | null;
	position: string | null;
	description: string | null;
}

interface CoachAchievementEditModalProps {
	entry?: AchievementEntry;
}

const typeLabels: Record<AchievementType, string> = {
	[AchievementType.championship]: "Campeonato",
	[AchievementType.award]: "Premio",
	[AchievementType.selection]: "Seleccion",
	[AchievementType.record]: "Record",
	[AchievementType.recognition]: "Reconocimiento",
	[AchievementType.mvp]: "MVP",
	[AchievementType.topScorer]: "Goleador",
	[AchievementType.bestPlayer]: "Mejor Jugador",
	[AchievementType.allStar]: "All-Star",
	[AchievementType.scholarship]: "Beca Deportiva",
	[AchievementType.other]: "Otro",
};

const scopeLabels: Record<AchievementScope, string> = {
	[AchievementScope.individual]: "Individual",
	[AchievementScope.collective]: "Colectivo",
};

export const CoachAchievementEditModal = NiceModal.create(
	({ entry }: CoachAchievementEditModalProps) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!entry;

		const currentYear = new Date().getFullYear();

		const form = useZodForm({
			schema: achievementSchema,
			defaultValues: {
				title: entry?.title ?? "",
				type: entry?.type ?? AchievementType.championship,
				scope: entry?.scope ?? AchievementScope.collective,
				year: entry?.year ?? currentYear,
				organization: entry?.organization ?? "",
				team: entry?.team ?? "",
				competition: entry?.competition ?? "",
				position: entry?.position ?? "",
				description: entry?.description ?? "",
			},
		});

		const createMutation = trpc.coach.addAchievement.useMutation({
			onSuccess: () => {
				toast.success("Logro agregado");
				utils.coach.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const updateMutation = trpc.coach.updateAchievement.useMutation({
			onSuccess: () => {
				toast.success("Logro actualizado");
				utils.coach.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const deleteMutation = trpc.coach.deleteAchievement.useMutation({
			onSuccess: () => {
				toast.success("Logro eliminado");
				utils.coach.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const onSubmit = form.handleSubmit((data: AchievementFormData) => {
			const payload = {
				title: data.title,
				type: data.type,
				scope: data.scope,
				year: data.year,
				organization: data.organization || undefined,
				team: data.team || undefined,
				competition: data.competition || undefined,
				position: data.position || undefined,
				description: data.description || undefined,
			};

			if (isEditing && entry) {
				updateMutation.mutate({ id: entry.id, ...payload });
			} else {
				createMutation.mutate(payload);
			}
		});

		const handleDelete = () => {
			if (entry && confirm("Eliminar este logro?")) {
				deleteMutation.mutate({ id: entry.id });
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
				title={isEditing ? "Editar Logro" : "Agregar Logro"}
				subtitle="Registra tus logros y reconocimientos"
				icon={<TrophyIcon className="size-5" />}
				accentColor="amber"
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
					<ProfileEditSection title="Informacion del Logro">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Titulo del Logro</FormLabel>
										<FormControl>
											<Input
												placeholder="Campeon Liga Nacional 2024..."
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<ProfileEditGrid cols={3}>
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Tipo</FormLabel>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar tipo" />
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
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="scope"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Ambito</FormLabel>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar ambito" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{Object.entries(scopeLabels).map(([value, label]) => (
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
								name="year"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Ano</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={1900}
													max={2100}
													value={field.value}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Number.parseInt(e.target.value)
																: currentYear,
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>
					</ProfileEditSection>

					<ProfileEditSection title="Detalles">
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="organization"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Organizacion</FormLabel>
											<FormControl>
												<Input
													placeholder="Liga Nacional, FIFA, etc."
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
								name="team"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Equipo</FormLabel>
											<FormControl>
												<Input
													placeholder="Nombre del equipo"
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
								name="competition"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Competicion</FormLabel>
											<FormControl>
												<Input
													placeholder="Liga, Torneo, Copa..."
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
								name="position"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Posicion / Resultado</FormLabel>
											<FormControl>
												<Input
													placeholder="1er lugar, Campeon, etc."
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Descripcion</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Describe el logro con mas detalle..."
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
