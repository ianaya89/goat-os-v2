"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	BatteryIcon,
	BedIcon,
	BrainIcon,
	CalendarIcon,
	HeartPulseIcon,
	Loader2Icon,
	MoonIcon,
	SmileIcon,
	ZapIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface FormValues {
	surveyDate: Date;
	sleepHours: string;
	sleepQuality: number;
	fatigue: number;
	muscleSoreness: number;
	mood: number;
	stressLevel: number;
	energy: number;
	notes: string;
}

interface AddWellnessModalProps {
	athleteId: string;
	athleteName?: string;
}

function getScoreColor(value: number, inverse = false): string {
	const score = inverse ? 11 - value : value;
	if (score <= 3) return "text-red-600";
	if (score <= 5) return "text-yellow-600";
	if (score <= 7) return "text-blue-600";
	return "text-green-600";
}

function MetricSlider({
	label,
	icon: Icon,
	value,
	onChange,
	lowLabel,
	highLabel,
	inverse = false,
}: {
	label: string;
	icon: React.ElementType;
	value: number;
	onChange: (value: number) => void;
	lowLabel: string;
	highLabel: string;
	inverse?: boolean;
}) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label className="flex items-center gap-2 text-sm">
					<Icon className="size-4 text-muted-foreground" />
					{label}
				</Label>
				<span
					className={cn(
						"font-bold text-lg tabular-nums",
						getScoreColor(value, inverse),
					)}
				>
					{value}
				</span>
			</div>
			<Slider
				value={[value]}
				onValueChange={([v]) => v !== undefined && onChange(v)}
				min={1}
				max={10}
				step={1}
				className="py-1"
			/>
			<div className="flex justify-between text-muted-foreground text-xs">
				<span>{lowLabel}</span>
				<span>{highLabel}</span>
			</div>
		</div>
	);
}

export const AddWellnessModal = NiceModal.create<AddWellnessModalProps>(
	({ athleteId, athleteName }) => {
		const modal = useModal();
		const utils = trpc.useUtils();

		const form = useForm<FormValues>({
			defaultValues: {
				surveyDate: new Date(),
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

		const createMutation =
			trpc.organization.athleteWellness.createForAthlete.useMutation({
				onSuccess: () => {
					toast.success("Wellness survey added successfully");
					utils.organization.athlete.getProfile.invalidate({ id: athleteId });
					modal.hide();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		const onSubmit = (values: FormValues) => {
			const sleepHoursNum = parseFloat(values.sleepHours);
			if (
				Number.isNaN(sleepHoursNum) ||
				sleepHoursNum < 0 ||
				sleepHoursNum > 24
			) {
				toast.error("Please enter valid sleep hours (0-24)");
				return;
			}

			createMutation.mutate({
				athleteId,
				surveyDate: values.surveyDate,
				sleepHours: Math.round(sleepHoursNum * 60),
				sleepQuality: values.sleepQuality,
				fatigue: values.fatigue,
				muscleSoreness: values.muscleSoreness,
				mood: values.mood,
				stressLevel: values.stressLevel,
				energy: values.energy,
				notes: values.notes || undefined,
			});
		};

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => {
					if (!open) modal.hide();
				}}
			>
				<SheetContent className="sm:max-w-lg p-0 flex flex-col">
					{/* Header */}
					<div className="bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent px-6 pt-6 pb-4">
						<SheetHeader>
							<SheetTitle className="flex items-center gap-3 text-xl">
								<div className="flex items-center justify-center size-10 rounded-full bg-red-500/10">
									<HeartPulseIcon className="size-5 text-red-500" />
								</div>
								<div>
									<span>Add Wellness Survey</span>
									{athleteName && (
										<p className="text-sm font-normal text-muted-foreground mt-0.5">
											for {athleteName}
										</p>
									)}
								</div>
							</SheetTitle>
						</SheetHeader>
					</div>

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="flex-1 flex flex-col overflow-hidden"
						>
							<div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
								{/* Date */}
								<FormField
									control={form.control}
									name="surveyDate"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel className="flex items-center gap-2">
												<CalendarIcon className="size-4 text-muted-foreground" />
												Survey Date
											</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant="outline"
															className={cn(
																"h-11 w-full pl-3 text-left font-normal",
																!field.value && "text-muted-foreground",
															)}
														>
															{field.value ? (
																format(field.value, "EEEE, MMMM d, yyyy")
															) : (
																<span>Select date...</span>
															)}
															<CalendarIcon className="ml-auto size-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={field.value}
														onSelect={(date) => date && field.onChange(date)}
														disabled={(date) => date > new Date()}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Separator />

								{/* Sleep Section */}
								<div className="space-y-4">
									<h3 className="text-sm font-medium flex items-center gap-2">
										<MoonIcon className="size-4 text-muted-foreground" />
										Sleep
									</h3>

									<FormField
										control={form.control}
										name="sleepHours"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="flex items-center gap-2 text-muted-foreground text-xs">
													<BedIcon className="size-3.5" />
													Hours of Sleep
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.5"
														min="0"
														max="24"
														placeholder="8"
														className="h-11"
														{...field}
													/>
												</FormControl>
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
												icon={MoonIcon}
												value={field.value}
												onChange={field.onChange}
												lowLabel="Poor"
												highLabel="Excellent"
											/>
										)}
									/>
								</div>

								<Separator />

								{/* Physical State */}
								<div className="space-y-4">
									<h3 className="text-sm font-medium flex items-center gap-2">
										<ZapIcon className="size-4 text-muted-foreground" />
										Physical State
									</h3>

									<FormField
										control={form.control}
										name="energy"
										render={({ field }) => (
											<MetricSlider
												label="Energy Level"
												icon={BatteryIcon}
												value={field.value}
												onChange={field.onChange}
												lowLabel="Exhausted"
												highLabel="Full of energy"
											/>
										)}
									/>

									<FormField
										control={form.control}
										name="fatigue"
										render={({ field }) => (
											<MetricSlider
												label="Fatigue"
												icon={BatteryIcon}
												value={field.value}
												onChange={field.onChange}
												lowLabel="Fresh"
												highLabel="Very tired"
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
												icon={HeartPulseIcon}
												value={field.value}
												onChange={field.onChange}
												lowLabel="No soreness"
												highLabel="Very sore"
												inverse
											/>
										)}
									/>
								</div>

								<Separator />

								{/* Mental State */}
								<div className="space-y-4">
									<h3 className="text-sm font-medium flex items-center gap-2">
										<BrainIcon className="size-4 text-muted-foreground" />
										Mental State
									</h3>

									<FormField
										control={form.control}
										name="mood"
										render={({ field }) => (
											<MetricSlider
												label="Mood"
												icon={SmileIcon}
												value={field.value}
												onChange={field.onChange}
												lowLabel="Very bad"
												highLabel="Excellent"
											/>
										)}
									/>

									<FormField
										control={form.control}
										name="stressLevel"
										render={({ field }) => (
											<MetricSlider
												label="Stress Level"
												icon={BrainIcon}
												value={field.value}
												onChange={field.onChange}
												lowLabel="Relaxed"
												highLabel="Very stressed"
												inverse
											/>
										)}
									/>
								</div>

								<Separator />

								{/* Notes */}
								<FormField
									control={form.control}
									name="notes"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-muted-foreground text-xs">
												Additional Notes
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Any additional observations..."
													className="resize-none min-h-[80px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Footer */}
							<SheetFooter className="px-6 py-4 border-t bg-muted/30">
								<div className="flex gap-3 w-full">
									<Button
										type="button"
										variant="outline"
										className="flex-1"
										onClick={() => modal.hide()}
										disabled={createMutation.isPending}
									>
										Cancel
									</Button>
									<Button
										type="submit"
										className="flex-1"
										disabled={createMutation.isPending}
									>
										{createMutation.isPending && (
											<Loader2Icon className="mr-2 size-4 animate-spin" />
										)}
										Add Survey
									</Button>
								</div>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
