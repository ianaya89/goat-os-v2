"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { HeartPulseIcon, Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface FormValues {
	sleepHours: string;
	sleepQuality: number;
	fatigue: number;
	muscleSoreness: number;
	mood: number;
	stressLevel: number;
	energy: number;
	notes: string;
}

// Helper to get color based on value (1-10 scale)
function getScoreColor(value: number, inverse = false): string {
	const score = inverse ? 11 - value : value;
	if (score <= 3) return "text-red-600";
	if (score <= 5) return "text-yellow-600";
	if (score <= 7) return "text-blue-600";
	return "text-green-600";
}

// Helper to get emoji based on mood score
function getMoodEmoji(value: number): string {
	if (value <= 2) return "😫";
	if (value <= 4) return "😕";
	if (value <= 6) return "😐";
	if (value <= 8) return "🙂";
	return "😊";
}

function MetricSlider({
	label,
	description,
	value,
	onChange,
	lowLabel,
	highLabel,
	inverse = false,
}: {
	label: string;
	description?: string;
	value: number;
	onChange: (value: number) => void;
	lowLabel: string;
	highLabel: string;
	inverse?: boolean;
}) {
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<Label>{label}</Label>
				<span className={cn("font-bold text-lg", getScoreColor(value, inverse))}>
					{value}/10
				</span>
			</div>
			{description && (
				<p className="text-muted-foreground text-xs">{description}</p>
			)}
			<Slider
				value={[value]}
				onValueChange={([v]) => v !== undefined && onChange(v)}
				min={1}
				max={10}
				step={1}
				className="py-2"
			/>
			<div className="flex justify-between text-muted-foreground text-xs">
				<span>{lowLabel}</span>
				<span>{highLabel}</span>
			</div>
		</div>
	);
}

export const WellnessSurveyModal = NiceModal.create(() => {
	const modal = useModal();
	const utils = trpc.useUtils();

	const form = useForm<FormValues>({
		defaultValues: {
			sleepHours: "8",
			sleepQuality: 7,
			fatigue: 3,
			muscleSoreness: 3,
			mood: 7,
			stressLevel: 3,
			energy: 7,
			notes: "",
		},
	});

	const createMutation = trpc.organization.athleteWellness.create.useMutation({
		onSuccess: () => {
			toast.success("Wellness survey submitted successfully!");
			utils.organization.athleteWellness.getMyToday.invalidate();
			utils.organization.athleteWellness.listMySurveys.invalidate();
			modal.hide();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const onSubmit = (values: FormValues) => {
		const sleepHoursNum = parseFloat(values.sleepHours);
		if (isNaN(sleepHoursNum) || sleepHoursNum < 0 || sleepHoursNum > 24) {
			toast.error("Please enter valid sleep hours (0-24)");
			return;
		}

		createMutation.mutate({
			sleepHours: Math.round(sleepHoursNum * 60), // Convert hours to minutes
			sleepQuality: values.sleepQuality,
			fatigue: values.fatigue,
			muscleSoreness: values.muscleSoreness,
			mood: values.mood,
			stressLevel: values.stressLevel,
			energy: values.energy,
			notes: values.notes || undefined,
		});
	};

	const moodValue = form.watch("mood");

	return (
		<Sheet
			open={modal.visible}
			onOpenChange={(open) => {
				if (!open) modal.hide();
			}}
		>
			<SheetContent className="overflow-y-auto sm:max-w-lg">
				<SheetHeader>
					<SheetTitle className="flex items-center gap-2">
						<HeartPulseIcon className="size-5 text-red-500" />
						Daily Wellness Check
					</SheetTitle>
					<SheetDescription>
						Track how you're feeling today to monitor your recovery and readiness.
					</SheetDescription>
				</SheetHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
						{/* Sleep Section */}
						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium">Sleep</h3>

							<FormField
								control={form.control}
								name="sleepHours"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Hours of Sleep</FormLabel>
										<div className="flex items-center gap-2">
											<FormControl>
												<Input
													type="number"
													step="0.5"
													min="0"
													max="24"
													className="w-24"
													{...field}
												/>
											</FormControl>
											<span className="text-muted-foreground text-sm">hours</span>
										</div>
										<div className="flex gap-2 pt-1">
											{[6, 7, 8, 9].map((h) => (
												<Button
													key={h}
													type="button"
													variant="outline"
													size="sm"
													className="h-7 px-2 text-xs"
													onClick={() => form.setValue("sleepHours", String(h))}
												>
													{h}h
												</Button>
											))}
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="sleepQuality"
								render={({ field }) => (
									<MetricSlider
										label="Sleep Quality"
										value={field.value}
										onChange={field.onChange}
										lowLabel="Poor"
										highLabel="Excellent"
									/>
								)}
							/>
						</div>

						{/* Physical Section */}
						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium">Physical State</h3>

							<FormField
								control={form.control}
								name="fatigue"
								render={({ field }) => (
									<MetricSlider
										label="Fatigue Level"
										description="How tired do you feel?"
										value={field.value}
										onChange={field.onChange}
										lowLabel="Fresh"
										highLabel="Exhausted"
										inverse
									/>
								)}
							/>

							<FormField
								control={form.control}
								name="muscleSoreness"
								render={({ field }) => (
									<MetricSlider
										label="Muscle Soreness"
										description="Any muscle pain or stiffness?"
										value={field.value}
										onChange={field.onChange}
										lowLabel="None"
										highLabel="Very sore"
										inverse
									/>
								)}
							/>

							<FormField
								control={form.control}
								name="energy"
								render={({ field }) => (
									<MetricSlider
										label="Energy Level"
										description="How energetic do you feel?"
										value={field.value}
										onChange={field.onChange}
										lowLabel="Low energy"
										highLabel="High energy"
									/>
								)}
							/>
						</div>

						{/* Mental Section */}
						<div className="space-y-4 rounded-lg border p-4">
							<h3 className="font-medium">Mental State</h3>

							<FormField
								control={form.control}
								name="mood"
								render={({ field }) => (
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<Label>Mood</Label>
											<span className="text-2xl">{getMoodEmoji(field.value)}</span>
										</div>
										<Slider
											value={[field.value]}
											onValueChange={([v]) => field.onChange(v)}
											min={1}
											max={10}
											step={1}
											className="py-2"
										/>
										<div className="flex justify-between text-muted-foreground text-xs">
											<span>Very low</span>
											<span>Excellent</span>
										</div>
									</div>
								)}
							/>

							<FormField
								control={form.control}
								name="stressLevel"
								render={({ field }) => (
									<MetricSlider
										label="Stress Level"
										description="How stressed do you feel?"
										value={field.value}
										onChange={field.onChange}
										lowLabel="Relaxed"
										highLabel="Very stressed"
										inverse
									/>
								)}
							/>
						</div>

						{/* Notes */}
						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Additional Notes (Optional)</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Any other information about how you're feeling..."
											className="resize-none"
											rows={3}
											{...field}
										/>
									</FormControl>
									<FormDescription className="text-xs">
										Note any injuries, illness, or other factors affecting your wellness.
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
								disabled={createMutation.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={createMutation.isPending}>
								{createMutation.isPending && (
									<Loader2Icon className="mr-2 size-4 animate-spin" />
								)}
								Submit
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
});
