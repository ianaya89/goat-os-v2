"use client";

import NiceModal from "@ebay/nice-modal-react";
import { BriefcaseIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditGrid,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { AthleteSport } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

const professionalSchema = z.object({
	sport: z.nativeEnum(AthleteSport).optional().nullable(),
	specialty: z.string().trim().max(500).optional(),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

interface CoachProfessionalEditModalProps {
	sport: AthleteSport | null;
	specialty: string;
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

export const CoachProfessionalEditModal = NiceModal.create(
	({ sport, specialty }: CoachProfessionalEditModalProps) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: professionalSchema,
			defaultValues: {
				sport: sport ?? undefined,
				specialty: specialty ?? "",
			},
		});

		const updateMutation = trpc.coach.updateMyProfile.useMutation({
			onSuccess: () => {
				toast.success("Informacion profesional actualizada");
				utils.coach.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar");
			},
		});

		const onSubmit = form.handleSubmit((data: ProfessionalFormData) => {
			updateMutation.mutate({
				sport: data.sport || null,
				specialty: data.specialty || undefined,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title="Informacion Profesional"
				subtitle="Tu deporte y especialidades"
				icon={<BriefcaseIcon className="size-5" />}
				accentColor="emerald"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection title="Datos profesionales">
						<ProfileEditGrid cols={1}>
							<FormField
								control={form.control}
								name="sport"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Deporte principal</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value ?? ""}
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
								name="specialty"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Especialidades</FormLabel>
											<FormControl>
												<Input
													placeholder="Ej: Preparacion fisica, Tactica, Juveniles..."
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormDescription>
												Separadas por comas. Ej: Preparacion fisica, Tactica
											</FormDescription>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>
					</ProfileEditSection>
				</div>
			</ProfileEditSheet>
		);
	},
);
