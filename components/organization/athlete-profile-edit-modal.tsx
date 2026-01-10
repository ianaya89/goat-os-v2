"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import {
	CheckIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	UserIcon,
	RulerIcon,
	TrophyIcon,
	FileTextIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	AthleteLevel,
	AthleteLevels,
	AthleteStatus,
	AthleteStatuses,
	DominantSide,
	DominantSides,
} from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
import { updateAthleteSchema } from "@/schemas/organization-athlete-schemas";
import { trpc } from "@/trpc/client";

const STEPS = [
	{ id: "basic", title: "Basic Info", icon: UserIcon },
	{ id: "physical", title: "Physical", icon: RulerIcon },
	{ id: "sport", title: "Sport Profile", icon: TrophyIcon },
	{ id: "bio", title: "Bio & Notes", icon: FileTextIcon },
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
		user?: {
			id: string;
			name: string;
			email: string;
			image: string | null;
		} | null;
	};
};

export const AthleteProfileEditModal =
	NiceModal.create<AthleteProfileEditModalProps>(({ athlete }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const [currentStep, setCurrentStep] = React.useState<StepId>("basic");

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
				sport: athlete.sport,
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

		const onSubmit = form.handleSubmit((data) => {
			updateAthleteMutation.mutate(data);
		});

		const isPending = updateAthleteMutation.isPending;

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
														isCurrent && "border-primary bg-primary text-primary-foreground",
														isCompleted && "border-primary bg-primary text-primary-foreground",
														!isCurrent && !isCompleted && "border-muted-foreground",
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
															<FormLabel>Sport</FormLabel>
															<FormControl>
																<Input
																	placeholder="e.g., Hockey, Football"
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

									{/* Step 2: Physical Attributes */}
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
																				value ? Number.parseInt(value) : undefined,
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
																						? Math.round(Number.parseFloat(value) * 1000)
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

									{/* Step 3: Sport Profile */}
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
																				value ? Number.parseInt(value) : undefined,
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
																				value ? Number.parseInt(value) : undefined,
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
												name="nationality"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Nationality</FormLabel>
															<FormControl>
																<Input
																	placeholder="e.g., Argentina"
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

									{/* Step 4: Bio & Notes */}
									{currentStep === "bio" && (
										<>
											<FormField
												control={form.control}
												name="profilePhotoUrl"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Profile Photo URL</FormLabel>
															<FormControl>
																<Input
																	type="url"
																	placeholder="https://..."
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
										<Button type="submit" disabled={isPending} loading={isPending}>
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
