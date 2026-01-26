"use client";

import NiceModal from "@ebay/nice-modal-react";
import { RulerIcon } from "lucide-react";
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
import { DominantSide } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

const physicalSchema = z.object({
	height: z.coerce.number().min(50).max(300).optional().nullable(),
	weight: z.coerce.number().min(10000).max(300000).optional().nullable(), // in grams
	dominantFoot: z.nativeEnum(DominantSide).optional().nullable(),
	dominantHand: z.nativeEnum(DominantSide).optional().nullable(),
	yearsOfExperience: z.coerce.number().min(0).max(50).optional().nullable(),
});

interface AthletePhysicalEditModalProps {
	height: number | null;
	weight: number | null;
	dominantFoot: DominantSide | null;
	dominantHand: DominantSide | null;
	yearsOfExperience: number | null;
}

export const AthletePhysicalEditModal = NiceModal.create(
	({
		height,
		weight,
		dominantFoot,
		dominantHand,
		yearsOfExperience,
	}: AthletePhysicalEditModalProps) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: physicalSchema,
			defaultValues: {
				height: height ?? undefined,
				weight: weight ?? undefined,
				dominantFoot: dominantFoot ?? undefined,
				dominantHand: dominantHand ?? undefined,
				yearsOfExperience: yearsOfExperience ?? undefined,
			},
		});

		const updateMutation = trpc.athlete.updateMyProfile.useMutation({
			onSuccess: () => {
				toast.success("Atributos fisicos actualizados");
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar");
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			updateMutation.mutate({
				height: typeof data.height === "number" ? data.height : null,
				weight: typeof data.weight === "number" ? data.weight : null,
				dominantFoot: data.dominantFoot || null,
				dominantHand: data.dominantHand || null,
				yearsOfExperience:
					typeof data.yearsOfExperience === "number"
						? data.yearsOfExperience
						: null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title="Atributos Fisicos"
				subtitle="Tus medidas y caracteristicas deportivas"
				icon={<RulerIcon className="size-5" />}
				accentColor="primary"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection title="Medidas">
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="height"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Altura (cm)</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="175"
													value={
														typeof field.value === "number" ? field.value : ""
													}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Number(e.target.value)
																: undefined,
														)
													}
													onBlur={field.onBlur}
													name={field.name}
													ref={field.ref}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="weight"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Peso (kg)</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.1"
													placeholder="70"
													value={
														typeof field.value === "number"
															? field.value / 1000
															: ""
													}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Math.round(Number(e.target.value) * 1000)
																: undefined,
														)
													}
													onBlur={field.onBlur}
													name={field.name}
													ref={field.ref}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>
					</ProfileEditSection>

					<ProfileEditSection title="Dominancia">
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="dominantFoot"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Pie Dominante</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value ?? ""}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="right">Derecho</SelectItem>
													<SelectItem value="left">Izquierdo</SelectItem>
													<SelectItem value="both">Ambos</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="dominantHand"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Mano Dominante</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value ?? ""}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Seleccionar" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="right">Derecha</SelectItem>
													<SelectItem value="left">Izquierda</SelectItem>
													<SelectItem value="both">Ambas</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>
					</ProfileEditSection>

					<ProfileEditSection title="Experiencia">
						<FormField
							control={form.control}
							name="yearsOfExperience"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Anos de Experiencia</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="5"
												value={
													typeof field.value === "number" ? field.value : ""
												}
												onChange={(e) =>
													field.onChange(
														e.target.value ? Number(e.target.value) : undefined,
													)
												}
												onBlur={field.onBlur}
												name={field.name}
												ref={field.ref}
											/>
										</FormControl>
										<FormDescription>
											Tiempo que llevas practicando tu deporte
										</FormDescription>
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
