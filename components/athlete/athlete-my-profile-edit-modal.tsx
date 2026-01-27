"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import {
	AlertTriangleIcon,
	CameraIcon,
	CheckIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	GraduationCapIcon,
	HomeIcon,
	PhoneIcon,
	PlusIcon,
	RulerIcon,
	TrashIcon,
	TrophyIcon,
	UserIcon,
	VideoIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod/v4";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { SportSelect } from "@/components/ui/sport-select";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	type AthleteLevel,
	AthleteLevels,
	type AthleteSport,
	AthleteSport as AthleteSportEnum,
	AthleteSports,
	type DominantSide,
	DominantSides,
} from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const STEPS = [
	{ id: "basic", title: "Basico", icon: UserIcon },
	{ id: "contact", title: "Contacto", icon: PhoneIcon },
	{ id: "residence", title: "Residencia", icon: HomeIcon },
	{ id: "physical", title: "Fisico", icon: RulerIcon },
	{ id: "sport", title: "Deportivo", icon: TrophyIcon },
	{ id: "education", title: "Educacion", icon: GraduationCapIcon },
	{ id: "health", title: "Salud", icon: AlertTriangleIcon },
	{ id: "bio", title: "Perfil", icon: CameraIcon },
	{ id: "videos", title: "Videos", icon: VideoIcon },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// Schema for updating own profile (no status field)
const updateMyProfileSchema = z.object({
	sport: z.enum(AthleteSports as unknown as [string, ...string[]]).optional(),
	birthDate: z.coerce.date().optional().nullable(),
	level: z.enum(AthleteLevels as unknown as [string, ...string[]]).optional(),
	height: z.number().int().min(50).max(300).optional().nullable(),
	weight: z.number().int().min(10000).max(300000).optional().nullable(),
	dominantFoot: z
		.enum(DominantSides as unknown as [string, ...string[]])
		.optional()
		.nullable(),
	dominantHand: z
		.enum(DominantSides as unknown as [string, ...string[]])
		.optional()
		.nullable(),
	nationality: z.string().trim().max(100).optional().nullable(),
	position: z.string().trim().max(100).optional().nullable(),
	secondaryPosition: z.string().trim().max(100).optional().nullable(),
	jerseyNumber: z.number().int().min(0).max(999).optional().nullable(),
	bio: z.string().trim().max(2000).optional().nullable(),
	yearsOfExperience: z.number().int().min(0).max(50).optional().nullable(),
	phone: z.string().trim().max(30).optional().nullable(),
	parentName: z.string().trim().max(200).optional().nullable(),
	parentPhone: z.string().trim().max(30).optional().nullable(),
	parentEmail: z.string().trim().email().max(255).optional().nullable(),
	parentRelationship: z.string().trim().max(100).optional().nullable(),
	youtubeVideos: z.array(z.string().url()).max(10).optional().nullable(),
	educationInstitution: z.string().trim().max(200).optional().nullable(),
	educationYear: z.string().trim().max(50).optional().nullable(),
	expectedGraduationDate: z.coerce.date().optional().nullable(),
	gpa: z.string().trim().max(10).optional().nullable(),
	dietaryRestrictions: z.string().trim().max(500).optional().nullable(),
	allergies: z.string().trim().max(500).optional().nullable(),
	residenceCity: z.string().trim().max(100).optional().nullable(),
	residenceCountry: z.string().trim().max(100).optional().nullable(),
	currentClub: z.string().trim().max(200).optional().nullable(),
	category: z.string().trim().max(100).optional().nullable(),
});

export type AthleteMyProfileEditModalProps = NiceModalHocProps & {
	startStep?: StepId;
	athlete: {
		id: string;
		sport: string;
		birthDate?: Date | null;
		level: string;
		status: string;
		height?: number | null;
		weight?: number | null;
		dominantFoot?: string | null;
		dominantHand?: string | null;
		nationality?: string | null;
		position?: string | null;
		secondaryPosition?: string | null;
		jerseyNumber?: number | null;
		bio?: string | null;
		yearsOfExperience?: number | null;
		phone?: string | null;
		parentName?: string | null;
		parentPhone?: string | null;
		parentEmail?: string | null;
		parentRelationship?: string | null;
		youtubeVideos?: string[] | null;
		educationInstitution?: string | null;
		educationYear?: string | null;
		expectedGraduationDate?: Date | null;
		gpa?: string | null;
		dietaryRestrictions?: string | null;
		allergies?: string | null;
		residenceCity?: string | null;
		residenceCountry?: string | null;
		currentClub?: string | null;
		category?: string | null;
		user?: {
			id: string;
			name: string;
			email: string;
			image: string | null;
		} | null;
	};
};

export const AthleteMyProfileEditModal =
	NiceModal.create<AthleteMyProfileEditModalProps>(({ athlete, startStep }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const [currentStep, setCurrentStep] = React.useState<StepId>(
			startStep ?? "basic",
		);

		const updateProfileMutation = trpc.athlete.updateMyProfile.useMutation({
			onSuccess: () => {
				toast.success("Perfil actualizado correctamente");
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar el perfil");
			},
		});

		const form = useZodForm({
			schema: updateMyProfileSchema,
			defaultValues: {
				sport: athlete.sport as AthleteSport,
				birthDate: athlete.birthDate ?? undefined,
				level: athlete.level as AthleteLevel,
				height: athlete.height ?? undefined,
				weight: athlete.weight ?? undefined,
				dominantFoot: (athlete.dominantFoot as DominantSide) ?? undefined,
				dominantHand: (athlete.dominantHand as DominantSide) ?? undefined,
				nationality: athlete.nationality ?? undefined,
				position: athlete.position ?? undefined,
				secondaryPosition: athlete.secondaryPosition ?? undefined,
				jerseyNumber: athlete.jerseyNumber ?? undefined,
				bio: athlete.bio ?? undefined,
				yearsOfExperience: athlete.yearsOfExperience ?? undefined,
				phone: athlete.phone ?? undefined,
				parentName: athlete.parentName ?? undefined,
				parentPhone: athlete.parentPhone ?? undefined,
				parentEmail: athlete.parentEmail ?? undefined,
				parentRelationship: athlete.parentRelationship ?? undefined,
				youtubeVideos: athlete.youtubeVideos ?? [],
				educationInstitution: athlete.educationInstitution ?? undefined,
				educationYear: athlete.educationYear ?? undefined,
				expectedGraduationDate: athlete.expectedGraduationDate ?? undefined,
				gpa: athlete.gpa ?? undefined,
				dietaryRestrictions: athlete.dietaryRestrictions ?? undefined,
				allergies: athlete.allergies ?? undefined,
				residenceCity: athlete.residenceCity ?? undefined,
				residenceCountry: athlete.residenceCountry ?? undefined,
				currentClub: athlete.currentClub ?? undefined,
				category: athlete.category ?? undefined,
			},
		});

		const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
		const isFirstStep = currentStepIndex === 0;
		const isLastStep = currentStepIndex === STEPS.length - 1;

		const goToNextStep = () => {
			const nextStep = STEPS[currentStepIndex + 1];
			if (nextStep) {
				setCurrentStep(nextStep.id);
			}
		};

		const goToPreviousStep = () => {
			const prevStep = STEPS[currentStepIndex - 1];
			if (prevStep) {
				setCurrentStep(prevStep.id);
			}
		};

		const onSubmit = form.handleSubmit(
			async (data) => {
				// Cast is needed because z.enum infers string but mutation expects specific enum values
				updateProfileMutation.mutate(
					data as Parameters<typeof updateProfileMutation.mutate>[0],
				);
			},
			(errors) => {
				console.error("Form validation errors:", errors);
				toast.error("Por favor revisa los campos del formulario");
			},
		);

		const isPending = updateProfileMutation.isPending;

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<SheetContent
					className="flex h-[100dvh] w-full flex-col sm:max-w-3xl"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
				>
					<SheetHeader>
						<SheetTitle>Editar Mi Perfil</SheetTitle>
						<SheetDescription>
							{athlete.user?.name} - {athlete.user?.email}
						</SheetDescription>
					</SheetHeader>

					{/* Step Indicator */}
					<div className="border-b px-6 py-4">
						<nav aria-label="Progress">
							<ol className="flex items-center justify-between">
								{STEPS.map((step, index) => {
									const isCurrent = step.id === currentStep;
									const isCompleted = index < currentStepIndex;
									const Icon = step.icon;

									return (
										<li key={step.id} className="flex items-center">
											<button
												type="button"
												onClick={() => setCurrentStep(step.id)}
												className={cn(
													"flex flex-col items-center gap-1",
													"transition-colors",
													isCurrent && "text-primary",
													isCompleted && "text-primary",
													!isCurrent && !isCompleted && "text-muted-foreground",
												)}
											>
												<span
													className={cn(
														"flex size-8 items-center justify-center rounded-full border-2 transition-colors",
														isCurrent &&
															"border-primary bg-primary text-primary-foreground",
														isCompleted &&
															"border-primary bg-primary text-primary-foreground",
														!isCurrent &&
															!isCompleted &&
															"border-muted-foreground",
													)}
												>
													{isCompleted ? (
														<CheckIcon className="size-4" />
													) : (
														<Icon className="size-4" />
													)}
												</span>
												<span className="hidden text-xs sm:block">
													{step.title}
												</span>
											</button>
											{index < STEPS.length - 1 && (
												<div
													className={cn(
														"mx-2 h-0.5 w-4 sm:w-8",
														index < currentStepIndex
															? "bg-primary"
															: "bg-muted",
													)}
												/>
											)}
										</li>
									);
								})}
							</ol>
						</nav>
					</div>

					<Form {...form}>
						<form
							onSubmit={onSubmit}
							className="flex flex-1 flex-col overflow-hidden"
						>
							<ScrollArea className="flex-1">
								<div className="space-y-4 px-6 py-4">
									{/* Step 1: Basic Info */}
									{currentStep === "basic" && (
										<>
											<FormField
												control={form.control}
												name="sport"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Deporte</FormLabel>
															<FormControl>
																<SportSelect
																	value={field.value}
																	onValueChange={(value) =>
																		field.onChange(value ?? field.value)
																	}
																	className="w-full"
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="birthDate"
												render={({ field }) => {
													const dateValue =
														field.value instanceof Date
															? field.value.toISOString().split("T")[0]
															: "";
													return (
														<FormItem asChild>
															<Field>
																<FormLabel>Fecha de Nacimiento</FormLabel>
																<FormControl>
																	<Input
																		type="date"
																		{...field}
																		value={dateValue}
																		onChange={(e) => {
																			const value = e.target.value;
																			field.onChange(
																				value ? new Date(value) : undefined,
																			);
																		}}
																	/>
																</FormControl>
																<FormMessage />
															</Field>
														</FormItem>
													);
												}}
											/>

											<FormField
												control={form.control}
												name="level"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Nivel</FormLabel>
															<Select
																onValueChange={field.onChange}
																value={field.value}
															>
																<FormControl>
																	<SelectTrigger className="w-full">
																		<SelectValue placeholder="Seleccionar nivel" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{AthleteLevels.map((level) => (
																		<SelectItem key={level} value={level}>
																			{capitalize(level)}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</>
									)}

									{/* Step 2: Contact */}
									{currentStep === "contact" && (
										<>
											<FormField
												control={form.control}
												name="phone"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Mi Telefono</FormLabel>
															<FormControl>
																<Input
																	placeholder="+54 9 11 1234-5678"
																	{...field}
																	value={field.value ?? ""}
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>

											<fieldset className="mt-4 rounded-lg border p-4">
												<legend className="px-2 font-medium text-muted-foreground text-sm">
													Contacto de Emergencia (Padre/Madre/Tutor)
												</legend>
												<div className="space-y-4">
													<FormField
														control={form.control}
														name="parentName"
														render={({ field }) => (
															<FormItem asChild>
																<Field>
																	<FormLabel>Nombre Completo</FormLabel>
																	<FormControl>
																		<Input
																			placeholder="Nombre del contacto"
																			{...field}
																			value={field.value ?? ""}
																		/>
																	</FormControl>
																	<FormMessage />
																</Field>
															</FormItem>
														)}
													/>

													<div className="grid grid-cols-2 gap-4">
														<FormField
															control={form.control}
															name="parentPhone"
															render={({ field }) => (
																<FormItem asChild>
																	<Field>
																		<FormLabel>Telefono</FormLabel>
																		<FormControl>
																			<Input
																				placeholder="+54 9 11 1234-5678"
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
															name="parentRelationship"
															render={({ field }) => (
																<FormItem asChild>
																	<Field>
																		<FormLabel>Relacion</FormLabel>
																		<Select
																			onValueChange={field.onChange}
																			value={field.value ?? ""}
																		>
																			<FormControl>
																				<SelectTrigger className="w-full">
																					<SelectValue placeholder="Seleccionar" />
																				</SelectTrigger>
																			</FormControl>
																			<SelectContent>
																				<SelectItem value="mother">
																					Madre
																				</SelectItem>
																				<SelectItem value="father">
																					Padre
																				</SelectItem>
																				<SelectItem value="guardian">
																					Tutor Legal
																				</SelectItem>
																				<SelectItem value="grandparent">
																					Abuelo/a
																				</SelectItem>
																				<SelectItem value="other">
																					Otro
																				</SelectItem>
																			</SelectContent>
																		</Select>
																		<FormMessage />
																	</Field>
																</FormItem>
															)}
														/>
													</div>

													<FormField
														control={form.control}
														name="parentEmail"
														render={({ field }) => (
															<FormItem asChild>
																<Field>
																	<FormLabel>Email</FormLabel>
																	<FormControl>
																		<Input
																			type="email"
																			placeholder="email@ejemplo.com"
																			{...field}
																			value={field.value ?? ""}
																		/>
																	</FormControl>
																	<FormMessage />
																</Field>
															</FormItem>
														)}
													/>
												</div>
											</fieldset>
										</>
									)}

									{/* Step 3: Residence */}
									{currentStep === "residence" && (
										<>
											<FormField
												control={form.control}
												name="residenceCity"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Ciudad de Residencia</FormLabel>
															<FormControl>
																<Input
																	placeholder="Ej: Buenos Aires"
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
												name="residenceCountry"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Pais</FormLabel>
															<FormControl>
																<Input
																	placeholder="Ej: Argentina"
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
												name="nationality"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Nacionalidad</FormLabel>
															<FormControl>
																<Input
																	placeholder="Tu nacionalidad"
																	{...field}
																	value={field.value ?? ""}
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</>
									)}

									{/* Step 4: Physical */}
									{currentStep === "physical" && (
										<>
											<div className="grid grid-cols-2 gap-4">
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
																		{...field}
																		value={field.value ?? ""}
																		onChange={(e) => {
																			const value = e.target.value;
																			field.onChange(
																				value
																					? Number.parseInt(value, 10)
																					: undefined,
																			);
																		}}
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
													render={({ field }) => {
														const displayValue = field.value
															? (field.value / 1000).toFixed(1)
															: "";
														return (
															<FormItem asChild>
																<Field>
																	<FormLabel>Peso (kg)</FormLabel>
																	<FormControl>
																		<Input
																			type="number"
																			step="0.1"
																			placeholder="72.5"
																			value={displayValue}
																			onChange={(e) => {
																				const value = e.target.value;
																				field.onChange(
																					value
																						? Math.round(
																								Number.parseFloat(value) * 1000,
																							)
																						: undefined,
																				);
																			}}
																		/>
																	</FormControl>
																	<FormMessage />
																</Field>
															</FormItem>
														);
													}}
												/>
											</div>

											<div className="grid grid-cols-2 gap-4">
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
																		<SelectTrigger className="w-full">
																			<SelectValue placeholder="Seleccionar" />
																		</SelectTrigger>
																	</FormControl>
																	<SelectContent>
																		{DominantSides.map((side) => (
																			<SelectItem key={side} value={side}>
																				{capitalize(side)}
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
																		<SelectTrigger className="w-full">
																			<SelectValue placeholder="Seleccionar" />
																		</SelectTrigger>
																	</FormControl>
																	<SelectContent>
																		{DominantSides.map((side) => (
																			<SelectItem key={side} value={side}>
																				{capitalize(side)}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
																<FormMessage />
															</Field>
														</FormItem>
													)}
												/>
											</div>
										</>
									)}

									{/* Step 5: Sport */}
									{currentStep === "sport" && (
										<>
											<div className="grid grid-cols-2 gap-4">
												<FormField
													control={form.control}
													name="position"
													render={({ field }) => (
														<FormItem asChild>
															<Field>
																<FormLabel>Posicion Principal</FormLabel>
																<FormControl>
																	<Input
																		placeholder="Ej: Delantero, Mediocampista"
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
													name="secondaryPosition"
													render={({ field }) => (
														<FormItem asChild>
															<Field>
																<FormLabel>Posicion Secundaria</FormLabel>
																<FormControl>
																	<Input
																		placeholder="Ej: Defensor"
																		{...field}
																		value={field.value ?? ""}
																	/>
																</FormControl>
																<FormMessage />
															</Field>
														</FormItem>
													)}
												/>
											</div>

											<div className="grid grid-cols-2 gap-4">
												<FormField
													control={form.control}
													name="jerseyNumber"
													render={({ field }) => (
														<FormItem asChild>
															<Field>
																<FormLabel>Numero de Camiseta</FormLabel>
																<FormControl>
																	<Input
																		type="number"
																		placeholder="10"
																		{...field}
																		value={field.value ?? ""}
																		onChange={(e) => {
																			const value = e.target.value;
																			field.onChange(
																				value
																					? Number.parseInt(value, 10)
																					: undefined,
																			);
																		}}
																	/>
																</FormControl>
																<FormMessage />
															</Field>
														</FormItem>
													)}
												/>

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
																		{...field}
																		value={field.value ?? ""}
																		onChange={(e) => {
																			const value = e.target.value;
																			field.onChange(
																				value
																					? Number.parseInt(value, 10)
																					: undefined,
																			);
																		}}
																	/>
																</FormControl>
																<FormMessage />
															</Field>
														</FormItem>
													)}
												/>
											</div>

											<FormField
												control={form.control}
												name="currentClub"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Club Actual</FormLabel>
															<FormControl>
																<Input
																	placeholder="Nombre del club"
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
												name="category"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Categoria</FormLabel>
															<FormControl>
																<Input
																	placeholder="Ej: Sub-17, Primera"
																	{...field}
																	value={field.value ?? ""}
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</>
									)}

									{/* Step 6: Education */}
									{currentStep === "education" && (
										<>
											<FormField
												control={form.control}
												name="educationInstitution"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Institucion Educativa</FormLabel>
															<FormControl>
																<Input
																	placeholder="Nombre del colegio/universidad"
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
												name="educationYear"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Ano Academico</FormLabel>
															<FormControl>
																<Input
																	placeholder="Ej: 5to ano"
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
												name="expectedGraduationDate"
												render={({ field }) => {
													const dateValue =
														field.value instanceof Date
															? field.value.toISOString().split("T")[0]
															: "";
													return (
														<FormItem asChild>
															<Field>
																<FormLabel>
																	Fecha Estimada de Graduacion
																</FormLabel>
																<FormControl>
																	<Input
																		type="date"
																		{...field}
																		value={dateValue}
																		onChange={(e) => {
																			const value = e.target.value;
																			field.onChange(
																				value ? new Date(value) : undefined,
																			);
																		}}
																	/>
																</FormControl>
																<FormMessage />
															</Field>
														</FormItem>
													);
												}}
											/>

											<FormField
												control={form.control}
												name="gpa"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Promedio (GPA)</FormLabel>
															<FormControl>
																<Input
																	type="text"
																	placeholder="Ej: 8.5"
																	{...field}
																	value={field.value ?? ""}
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</>
									)}

									{/* Step 7: Health */}
									{currentStep === "health" && (
										<>
											<p className="text-muted-foreground text-sm">
												Informacion importante sobre salud y alimentacion.
											</p>

											<FormField
												control={form.control}
												name="dietaryRestrictions"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Restricciones Alimenticias</FormLabel>
															<FormControl>
																<Textarea
																	placeholder="Ej: Vegetariano, vegano, sin gluten, sin lactosa..."
																	className="min-h-[100px]"
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
												name="allergies"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Alergias</FormLabel>
															<FormControl>
																<Textarea
																	placeholder="Ej: Mani, mariscos, penicilina..."
																	className="min-h-[100px]"
																	{...field}
																	value={field.value ?? ""}
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</>
									)}

									{/* Step 8: Bio */}
									{currentStep === "bio" && (
										<>
											<FormField
												control={form.control}
												name="bio"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Biografia / Sobre mi</FormLabel>
															<FormControl>
																<Textarea
																	placeholder="Cuenta sobre ti, tus logros, objetivos..."
																	className="min-h-[200px]"
																	{...field}
																	value={field.value ?? ""}
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</>
									)}

									{/* Step 9: Videos */}
									{currentStep === "videos" && (
										<YoutubeVideosStep form={form} />
									)}
								</div>
							</ScrollArea>

							<SheetFooter className="flex-row justify-between gap-2 border-t">
								<div>
									{!isFirstStep && (
										<Button
											type="button"
											variant="outline"
											onClick={goToPreviousStep}
											disabled={isPending}
										>
											<ChevronLeftIcon className="mr-1 size-4" />
											Atras
										</Button>
									)}
								</div>
								<div className="flex gap-2">
									<Button
										type="button"
										variant="outline"
										onClick={modal.handleClose}
										disabled={isPending}
									>
										Cancelar
									</Button>
									<Button
										type="submit"
										disabled={isPending}
										loading={isPending}
									>
										Guardar
									</Button>
									{!isLastStep && (
										<Button
											type="button"
											variant="secondary"
											onClick={goToNextStep}
										>
											Siguiente
											<ChevronRightIcon className="ml-1 size-4" />
										</Button>
									)}
								</div>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	});

// YouTube Videos Step Component
function YoutubeVideosStep({
	form,
}: {
	form: ReturnType<typeof useZodForm<typeof updateMyProfileSchema>>;
}) {
	const [newVideoUrl, setNewVideoUrl] = React.useState("");
	const videos = form.watch("youtubeVideos") ?? [];

	const addVideo = () => {
		if (!newVideoUrl.trim()) return;

		const youtubeRegex =
			/^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/;
		if (!youtubeRegex.test(newVideoUrl)) {
			toast.error("URL de YouTube invalida");
			return;
		}

		if (videos.length >= 10) {
			toast.error("Maximo 10 videos permitidos");
			return;
		}

		form.setValue("youtubeVideos", [...videos, newVideoUrl.trim()]);
		setNewVideoUrl("");
	};

	const removeVideo = (index: number) => {
		const newVideos = videos.filter((_, i) => i !== index);
		form.setValue("youtubeVideos", newVideos);
	};

	const getYoutubeVideoId = (url: string): string | null => {
		const match = url.match(
			/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/,
		);
		return match?.[1] ?? null;
	};

	return (
		<div className="space-y-4">
			<p className="text-muted-foreground text-sm">
				Agrega videos de YouTube con tus jugadas destacadas.
			</p>

			<div className="flex gap-2">
				<Input
					placeholder="https://youtube.com/watch?v=..."
					value={newVideoUrl}
					onChange={(e) => setNewVideoUrl(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							addVideo();
						}
					}}
				/>
				<Button type="button" onClick={addVideo} disabled={!newVideoUrl.trim()}>
					<PlusIcon className="size-4" />
				</Button>
			</div>

			{videos.length === 0 ? (
				<div className="py-8 text-center text-muted-foreground text-sm">
					No hay videos agregados todavia
				</div>
			) : (
				<div className="space-y-3">
					{videos.map((url, index) => {
						const videoId = getYoutubeVideoId(url);
						return (
							<div
								key={`video-${index}`}
								className="flex items-start gap-3 rounded-lg border p-3"
							>
								{videoId && (
									<img
										src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
										alt={`Video ${index + 1}`}
										className="size-20 rounded object-cover"
									/>
								)}
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm">{url}</p>
									<a
										href={url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary text-xs hover:underline"
									>
										Ver en YouTube
									</a>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => removeVideo(index)}
								>
									<TrashIcon className="size-4 text-destructive" />
								</Button>
							</div>
						);
					})}
				</div>
			)}

			<p className="text-muted-foreground text-xs">{videos.length}/10 videos</p>
		</div>
	);
}
