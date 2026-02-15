"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	BatteryIcon,
	BedIcon,
	BrainIcon,
	CalendarIcon,
	HeartPulseIcon,
	MoonIcon,
	SmileIcon,
	ZapIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
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
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const wellnessFormSchema = z.object({
	surveyDate: z.date(),
	sleepHours: z.string(),
	sleepQuality: z.number().int().min(1).max(10),
	fatigue: z.number().int().min(1).max(10),
	muscleSoreness: z.number().int().min(1).max(10),
	mood: z.number().int().min(1).max(10),
	stressLevel: z.number().int().min(1).max(10),
	energy: z.number().int().min(1).max(10),
	notes: z.string().optional(),
});

type WellnessFormData = z.infer<typeof wellnessFormSchema>;

interface AddWellnessModalProps {
	athleteId: string;
	athleteName?: string;
	initialValues?: {
		id: string;
		surveyDate: Date | string;
		sleepHours: number;
		sleepQuality: number;
		fatigue: number;
		muscleSoreness: number;
		mood: number;
		stressLevel: number;
		energy: number;
		notes: string | null;
	};
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
	({ athleteId, initialValues }) => {
		const t = useTranslations("athletes.wellness");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!initialValues;

		const form = useZodForm({
			schema: wellnessFormSchema,
			defaultValues: {
				surveyDate: initialValues?.surveyDate
					? new Date(initialValues.surveyDate)
					: new Date(),
				sleepHours: initialValues
					? (initialValues.sleepHours / 60).toFixed(1)
					: "8",
				sleepQuality: initialValues?.sleepQuality ?? 7,
				fatigue: initialValues?.fatigue ?? 3,
				muscleSoreness: initialValues?.muscleSoreness ?? 3,
				mood: initialValues?.mood ?? 7,
				stressLevel: initialValues?.stressLevel ?? 3,
				energy: initialValues?.energy ?? 7,
				notes: initialValues?.notes ?? "",
			},
		});

		const createMutation =
			trpc.organization.athleteWellness.createForAthlete.useMutation({
				onSuccess: () => {
					toast.success(t("recordSuccess"));
					utils.organization.athlete.getProfile.invalidate({
						id: athleteId,
					});
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		const updateMutation =
			trpc.organization.athleteWellness.updateForAthlete.useMutation({
				onSuccess: () => {
					toast.success(t("updateSuccess"));
					utils.organization.athlete.getProfile.invalidate({
						id: athleteId,
					});
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		const onSubmit = form.handleSubmit((data: WellnessFormData) => {
			const sleepHoursNum = Number.parseFloat(data.sleepHours);
			if (
				Number.isNaN(sleepHoursNum) ||
				sleepHoursNum < 0 ||
				sleepHoursNum > 24
			) {
				toast.error(t("invalidSleepHours"));
				return;
			}

			const payload = {
				athleteId,
				surveyDate: data.surveyDate,
				sleepHours: Math.round(sleepHoursNum * 60),
				sleepQuality: data.sleepQuality,
				fatigue: data.fatigue,
				muscleSoreness: data.muscleSoreness,
				mood: data.mood,
				stressLevel: data.stressLevel,
				energy: data.energy,
				notes: data.notes || undefined,
			};

			if (isEditing && initialValues) {
				updateMutation.mutate({
					id: initialValues.id,
					...payload,
				});
			} else {
				createMutation.mutate(payload);
			}
		});

		const isPending = createMutation.isPending || updateMutation.isPending;

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={isEditing ? t("editSurvey") : t("addSurvey")}
				subtitle={t("subtitle")}
				icon={<HeartPulseIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					{/* Survey Date */}
					<ProfileEditSection>
						<FormField
							control={form.control}
							name="surveyDate"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>{t("surveyDate")}</FormLabel>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													className={cn(
														"w-full pl-3 text-left font-normal",
														!field.value && "text-muted-foreground",
													)}
												>
													{field.value ? (
														format(field.value, "PPP")
													) : (
														<span>{t("selectDate")}</span>
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
					</ProfileEditSection>

					{/* Sleep Section */}
					<ProfileEditSection title={t("sleepSection")}>
						<FormField
							control={form.control}
							name="sleepHours"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel className="flex items-center gap-2">
											<BedIcon className="size-4 text-muted-foreground" />
											{t("sleepHours")}
										</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.5"
												min="0"
												max="24"
												placeholder="8"
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
							name="sleepQuality"
							render={({ field }) => (
								<MetricSlider
									label={t("sleepQuality")}
									icon={MoonIcon}
									value={field.value}
									onChange={field.onChange}
									lowLabel={t("sleepQualityLow")}
									highLabel={t("sleepQualityHigh")}
								/>
							)}
						/>
					</ProfileEditSection>

					{/* Physical State */}
					<ProfileEditSection title={t("physicalSection")}>
						<FormField
							control={form.control}
							name="energy"
							render={({ field }) => (
								<MetricSlider
									label={t("energy")}
									icon={BatteryIcon}
									value={field.value}
									onChange={field.onChange}
									lowLabel={t("energyLow")}
									highLabel={t("energyHigh")}
								/>
							)}
						/>

						<FormField
							control={form.control}
							name="fatigue"
							render={({ field }) => (
								<MetricSlider
									label={t("fatigue")}
									icon={BatteryIcon}
									value={field.value}
									onChange={field.onChange}
									lowLabel={t("fatigueLow")}
									highLabel={t("fatigueHigh")}
									inverse
								/>
							)}
						/>

						<FormField
							control={form.control}
							name="muscleSoreness"
							render={({ field }) => (
								<MetricSlider
									label={t("soreness")}
									icon={HeartPulseIcon}
									value={field.value}
									onChange={field.onChange}
									lowLabel={t("sorenessLow")}
									highLabel={t("sorenessHigh")}
									inverse
								/>
							)}
						/>
					</ProfileEditSection>

					{/* Mental State */}
					<ProfileEditSection title={t("mentalSection")}>
						<FormField
							control={form.control}
							name="mood"
							render={({ field }) => (
								<MetricSlider
									label={t("mood")}
									icon={SmileIcon}
									value={field.value}
									onChange={field.onChange}
									lowLabel={t("moodLow")}
									highLabel={t("moodHigh")}
								/>
							)}
						/>

						<FormField
							control={form.control}
							name="stressLevel"
							render={({ field }) => (
								<MetricSlider
									label={t("stress")}
									icon={BrainIcon}
									value={field.value}
									onChange={field.onChange}
									lowLabel={t("stressLow")}
									highLabel={t("stressHigh")}
									inverse
								/>
							)}
						/>
					</ProfileEditSection>

					{/* Notes */}
					<ProfileEditSection>
						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("notes")}</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("notesPlaceholder")}
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
