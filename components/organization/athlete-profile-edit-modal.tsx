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
	UsersIcon,
	VideoIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { ProfileImageUpload } from "@/components/organization/profile-image-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	type AthleteLevel,
	AthleteLevels,
	type AthleteSport,
	AthleteSports,
	type AthleteStatus,
	AthleteStatuses,
	type DominantSide,
	DominantSides,
} from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
import { updateAthleteSchema } from "@/schemas/organization-athlete-schemas";
import { trpc } from "@/trpc/client";

const STEPS = [
	{ id: "basic", title: "Básico", icon: UserIcon },
	{ id: "contact", title: "Contacto", icon: PhoneIcon },
	{ id: "residence", title: "Residencia", icon: HomeIcon },
	{ id: "groups", title: "Grupos", icon: UsersIcon },
	{ id: "physical", title: "Físico", icon: RulerIcon },
	{ id: "sport", title: "Deportivo", icon: TrophyIcon },
	{ id: "education", title: "Educación", icon: GraduationCapIcon },
	{ id: "health", title: "Salud", icon: AlertTriangleIcon },
	{ id: "bio", title: "Perfil", icon: CameraIcon },
	{ id: "videos", title: "Videos", icon: VideoIcon },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export type AthleteProfileEditModalProps = NiceModalHocProps & {
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
		profilePhotoUrl?: string | null;
		bio?: string | null;
		yearsOfExperience?: number | null;
		// Contact information
		phone?: string | null;
		// Parent/Guardian contact
		parentName?: string | null;
		parentPhone?: string | null;
		parentEmail?: string | null;
		parentRelationship?: string | null;
		// YouTube videos
		youtubeVideos?: string[] | null;
		// Education
		educationInstitution?: string | null;
		educationYear?: string | null;
		expectedGraduationDate?: Date | null;
		gpa?: string | null;
		// Health
		dietaryRestrictions?: string | null;
		allergies?: string | null;
		// Residence
		residenceCity?: string | null;
		residenceCountry?: string | null;
		user?: {
			id: string;
			name: string;
			email: string;
			image: string | null;
			imageKey: string | null;
		} | null;
		groups?: Array<{
			id: string;
			name: string;
		}>;
	};
};

export const AthleteProfileEditModal =
	NiceModal.create<AthleteProfileEditModalProps>(({ athlete }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const [currentStep, setCurrentStep] = React.useState<StepId>("basic");

		// Groups management
		const initialGroupIds = React.useMemo(
			() => new Set(athlete.groups?.map((g) => g.id) ?? []),
			[athlete.groups],
		);
		const [selectedGroupIds, setSelectedGroupIds] = React.useState<Set<string>>(
			() => new Set(initialGroupIds),
		);

		// Query for available groups
		const { data: availableGroups, isLoading: isLoadingGroups } =
			trpc.organization.athleteGroup.listActive.useQuery();

		// Mutations for group management
		const addToGroupMutation =
			trpc.organization.athleteGroup.addMembers.useMutation({
				onError: (error) => {
					toast.error(error.message || "Failed to add to group");
				},
			});

		const removeFromGroupMutation =
			trpc.organization.athleteGroup.removeMembers.useMutation({
				onError: (error) => {
					toast.error(error.message || "Failed to remove from group");
				},
			});

		const toggleGroup = (groupId: string) => {
			setSelectedGroupIds((prev) => {
				const next = new Set(prev);
				if (next.has(groupId)) {
					next.delete(groupId);
				} else {
					next.add(groupId);
				}
				return next;
			});
		};

		const updateAthleteMutation = trpc.organization.athlete.update.useMutation({
			onSuccess: () => {
				toast.success("Profile updated successfully");
				utils.organization.athlete.getProfile.invalidate({ id: athlete.id });
				utils.organization.athlete.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to update profile");
			},
		});

		const form = useZodForm({
			schema: updateAthleteSchema,
			defaultValues: {
				id: athlete.id,
				sport: athlete.sport as AthleteSport,
				birthDate: athlete.birthDate ?? undefined,
				level: athlete.level as AthleteLevel,
				status: athlete.status as AthleteStatus,
				height: athlete.height ?? undefined,
				weight: athlete.weight ?? undefined,
				dominantFoot: (athlete.dominantFoot as DominantSide) ?? undefined,
				dominantHand: (athlete.dominantHand as DominantSide) ?? undefined,
				nationality: athlete.nationality ?? undefined,
				position: athlete.position ?? undefined,
				secondaryPosition: athlete.secondaryPosition ?? undefined,
				jerseyNumber: athlete.jerseyNumber ?? undefined,
				profilePhotoUrl: athlete.profilePhotoUrl ?? undefined,
				bio: athlete.bio ?? undefined,
				yearsOfExperience: athlete.yearsOfExperience ?? undefined,
				// Contact
				phone: athlete.phone ?? undefined,
				// Parent/Guardian
				parentName: athlete.parentName ?? undefined,
				parentPhone: athlete.parentPhone ?? undefined,
				parentEmail: athlete.parentEmail ?? undefined,
				parentRelationship: athlete.parentRelationship ?? undefined,
				// YouTube videos
				youtubeVideos: athlete.youtubeVideos ?? [],
				// Education
				educationInstitution: athlete.educationInstitution ?? undefined,
				educationYear: athlete.educationYear ?? undefined,
				expectedGraduationDate: athlete.expectedGraduationDate ?? undefined,
				gpa: athlete.gpa ?? undefined,
				// Health
				dietaryRestrictions: athlete.dietaryRestrictions ?? undefined,
				allergies: athlete.allergies ?? undefined,
				// Residence
				residenceCity: athlete.residenceCity ?? undefined,
				residenceCountry: athlete.residenceCountry ?? undefined,
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
				// Calculate group changes
				const groupsToAdd = [...selectedGroupIds].filter(
					(id) => !initialGroupIds.has(id),
				);
				const groupsToRemove = [...initialGroupIds].filter(
					(id) => !selectedGroupIds.has(id),
				);

				// Update group memberships
				const groupPromises: Promise<unknown>[] = [];

				for (const groupId of groupsToAdd) {
					groupPromises.push(
						addToGroupMutation.mutateAsync({
							groupId,
							athleteIds: [athlete.id],
						}),
					);
				}

				for (const groupId of groupsToRemove) {
					groupPromises.push(
						removeFromGroupMutation.mutateAsync({
							groupId,
							athleteIds: [athlete.id],
						}),
					);
				}

				// Wait for all group updates
				if (groupPromises.length > 0) {
					await Promise.all(groupPromises);
				}

				// Update athlete profile
				updateAthleteMutation.mutate(data);
			},
			(errors) => {
				// Log validation errors for debugging
				console.error("Form validation errors:", errors);
				toast.error("Please check the form for errors");
			},
		);

		const isPending =
			updateAthleteMutation.isPending ||
			addToGroupMutation.isPending ||
			removeFromGroupMutation.isPending;

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<SheetContent
					className="sm:max-w-xl"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
				>
					<SheetHeader>
						<SheetTitle>Edit Athlete Profile</SheetTitle>
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
														"mx-2 h-0.5 w-8 sm:w-12",
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
							onSubmit={(e) => {
								console.log("Form onSubmit triggered");
								onSubmit(e);
							}}
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
															<FormLabel>Sport</FormLabel>
															<Select
																onValueChange={field.onChange}
																defaultValue={field.value}
															>
																<FormControl>
																	<SelectTrigger className="w-full">
																		<SelectValue placeholder="Select sport" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{AthleteSports.map((sport) => (
																		<SelectItem key={sport} value={sport}>
																			{capitalize(sport.replace("_", " "))}
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
												name="birthDate"
												render={({ field }) => {
													const dateValue =
														field.value instanceof Date
															? field.value.toISOString().split("T")[0]
															: "";
													return (
														<FormItem asChild>
															<Field>
																<FormLabel>Birth Date</FormLabel>
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

											<div className="grid grid-cols-2 gap-4">
												<FormField
													control={form.control}
													name="level"
													render={({ field }) => (
														<FormItem asChild>
															<Field>
																<FormLabel>Level</FormLabel>
																<Select
																	onValueChange={field.onChange}
																	value={field.value}
																>
																	<FormControl>
																		<SelectTrigger className="w-full">
																			<SelectValue placeholder="Select level" />
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

												<FormField
													control={form.control}
													name="status"
													render={({ field }) => (
														<FormItem asChild>
															<Field>
																<FormLabel>Status</FormLabel>
																<Select
																	onValueChange={field.onChange}
																	value={field.value}
																>
																	<FormControl>
																		<SelectTrigger className="w-full">
																			<SelectValue placeholder="Select status" />
																		</SelectTrigger>
																	</FormControl>
																	<SelectContent>
																		{AthleteStatuses.map((status) => (
																			<SelectItem key={status} value={status}>
																				{capitalize(status)}
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

									{/* Step 2: Contact */}
									{currentStep === "contact" && (
										<>
											<FormField
												control={form.control}
												name="phone"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Teléfono del Atleta</FormLabel>
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

											<fieldset className="rounded-lg border p-4 mt-4">
												<legend className="px-2 text-sm font-medium text-muted-foreground">
													Contacto de Padre/Madre/Tutor (opcional)
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
																			placeholder="Nombre del padre, madre o tutor"
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
																		<FormLabel>Teléfono</FormLabel>
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
																		<FormLabel>Relación</FormLabel>
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
															<FormLabel>País</FormLabel>
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

									{/* Step 4: Groups */}
									{currentStep === "groups" && (
										<>
											<div className="space-y-4">
												<p className="text-muted-foreground text-sm">
													Selecciona los grupos a los que pertenece este atleta.
												</p>

												{isLoadingGroups ? (
													<div className="py-8 text-center text-muted-foreground text-sm">
														Cargando grupos...
													</div>
												) : availableGroups && availableGroups.length > 0 ? (
													<div className="space-y-2">
														{availableGroups.map((group) => {
															const isSelected = selectedGroupIds.has(group.id);
															const memberCount = group.members?.length ?? 0;

															return (
																<div
																	key={group.id}
																	className={cn(
																		"flex items-center gap-3 rounded-lg border p-3 transition-colors",
																		isSelected
																			? "border-primary bg-primary/5"
																			: "hover:bg-muted/50",
																	)}
																>
																	<Checkbox
																		id={`group-${group.id}`}
																		checked={isSelected}
																		onCheckedChange={() =>
																			toggleGroup(group.id)
																		}
																	/>
																	<label
																		htmlFor={`group-${group.id}`}
																		className="flex flex-1 cursor-pointer items-center justify-between"
																	>
																		<div>
																			<p className="font-medium text-sm">
																				{group.name}
																			</p>
																			{group.description && (
																				<p className="text-muted-foreground text-xs">
																					{group.description}
																				</p>
																			)}
																		</div>
																		<Badge variant="secondary" className="ml-2">
																			{memberCount}{" "}
																			{memberCount === 1
																				? "miembro"
																				: "miembros"}
																		</Badge>
																	</label>
																</div>
															);
														})}
													</div>
												) : (
													<div className="py-8 text-center text-muted-foreground text-sm">
														No hay grupos disponibles. Crea grupos desde la
														sección de Grupos.
													</div>
												)}

												{selectedGroupIds.size > 0 && (
													<div className="mt-4 rounded-lg bg-muted/50 p-3">
														<p className="font-medium text-sm">
															Grupos seleccionados: {selectedGroupIds.size}
														</p>
													</div>
												)}
											</div>
										</>
									)}

									{/* Step 3: Physical Attributes */}
									{currentStep === "physical" && (
										<>
											<div className="grid grid-cols-2 gap-4">
												<FormField
													control={form.control}
													name="height"
													render={({ field }) => (
														<FormItem asChild>
															<Field>
																<FormLabel>Height (cm)</FormLabel>
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
														// Convert grams to kg for display
														const displayValue = field.value
															? (field.value / 1000).toFixed(1)
															: "";
														return (
															<FormItem asChild>
																<Field>
																	<FormLabel>Weight (kg)</FormLabel>
																	<FormControl>
																		<Input
																			type="number"
																			step="0.1"
																			placeholder="72.5"
																			value={displayValue}
																			onChange={(e) => {
																				const value = e.target.value;
																				// Convert kg to grams for storage
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
																<FormLabel>Dominant Foot</FormLabel>
																<Select
																	onValueChange={field.onChange}
																	value={field.value ?? ""}
																>
																	<FormControl>
																		<SelectTrigger className="w-full">
																			<SelectValue placeholder="Select foot" />
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
																<FormLabel>Dominant Hand</FormLabel>
																<Select
																	onValueChange={field.onChange}
																	value={field.value ?? ""}
																>
																	<FormControl>
																		<SelectTrigger className="w-full">
																			<SelectValue placeholder="Select hand" />
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

									{/* Step 4: Sport Profile */}
									{currentStep === "sport" && (
										<>
											<div className="grid grid-cols-2 gap-4">
												<FormField
													control={form.control}
													name="position"
													render={({ field }) => (
														<FormItem asChild>
															<Field>
																<FormLabel>Primary Position</FormLabel>
																<FormControl>
																	<Input
																		placeholder="e.g., Midfielder, Forward"
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
																<FormLabel>Secondary Position</FormLabel>
																<FormControl>
																	<Input
																		placeholder="e.g., Defender"
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
																<FormLabel>Jersey Number</FormLabel>
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
																<FormLabel>Years of Experience</FormLabel>
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
										</>
									)}

									{/* Step 7: Education */}
									{currentStep === "education" && (
										<>
											<fieldset className="rounded-lg border p-4">
												<legend className="px-2 text-sm font-medium text-muted-foreground">
													Educación (Perfil Universitario)
												</legend>
												<div className="space-y-4">
													<FormField
														control={form.control}
														name="educationInstitution"
														render={({ field }) => (
															<FormItem asChild>
																<Field>
																	<FormLabel>Institución Educativa</FormLabel>
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
																	<FormLabel>Año Académico</FormLabel>
																	<FormControl>
																		<Input
																			placeholder="Ej: 5to año"
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
																			Fecha Estimada de Graduación
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
												</div>
											</fieldset>
										</>
									)}

									{/* Step 8: Health */}
									{currentStep === "health" && (
										<>
											<div className="space-y-4">
												<p className="text-muted-foreground text-sm">
													Información importante sobre salud y alimentación del
													atleta.
												</p>

												<FormField
													control={form.control}
													name="dietaryRestrictions"
													render={({ field }) => (
														<FormItem asChild>
															<Field>
																<FormLabel>
																	Restricciones Alimenticias
																</FormLabel>
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
																		placeholder="Ej: Maní, mariscos, penicilina, picaduras de abejas..."
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
											</div>
										</>
									)}

									{/* Step 9: Photo & Bio */}
									{currentStep === "bio" && (
										<>
											{/* Profile Photo Upload */}
											{athlete.user && (
												<div className="flex flex-col items-center py-4">
													<ProfileImageUpload
														userId={athlete.user.id}
														userName={athlete.user.name}
														currentImageUrl={
															athlete.user.imageKey
																? undefined
																: athlete.user.image
														}
														hasS3Image={!!athlete.user.imageKey}
														size="xl"
													/>
													<p className="mt-2 text-center text-muted-foreground text-sm">
														Haz clic en el icono de cámara para cambiar la foto
													</p>
												</div>
											)}

											<FormField
												control={form.control}
												name="bio"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Bio / Scout Notes</FormLabel>
															<FormControl>
																<Textarea
																	placeholder="Add notes about the athlete, their strengths, areas for improvement..."
																	className="min-h-[150px]"
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

									{/* Step 10: Videos */}
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
											Back
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
										Cancel
									</Button>
									{isLastStep ? (
										<Button
											type="submit"
											disabled={isPending}
											loading={isPending}
											onClick={() => {
												console.log("Save Profile button clicked");
												console.log("Form errors:", form.formState.errors);
												console.log("Form values:", form.getValues());
											}}
										>
											Save Profile
										</Button>
									) : (
										<Button type="button" onClick={goToNextStep}>
											Next
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
	form: ReturnType<typeof useZodForm<typeof updateAthleteSchema>>;
}) {
	const [newVideoUrl, setNewVideoUrl] = React.useState("");
	const videos = form.watch("youtubeVideos") ?? [];

	const addVideo = () => {
		if (!newVideoUrl.trim()) return;

		// Validate YouTube URL
		const youtubeRegex =
			/^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/;
		if (!youtubeRegex.test(newVideoUrl)) {
			toast.error("URL de YouTube inválida");
			return;
		}

		if (videos.length >= 10) {
			toast.error("Máximo 10 videos permitidos");
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
				Agrega videos de YouTube con jugadas destacadas del atleta.
			</p>

			{/* Add new video */}
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

			{/* List of videos */}
			{videos.length === 0 ? (
				<div className="py-8 text-center text-muted-foreground text-sm">
					No hay videos agregados todavía
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
								<div className="flex-1 min-w-0">
									<p className="text-sm truncate">{url}</p>
									<a
										href={url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-xs text-primary hover:underline"
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
