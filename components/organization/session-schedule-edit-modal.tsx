"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format, setHours, setMinutes } from "date-fns";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
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
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const scheduleSchema = z.object({
	startTime: z.coerce.date(),
	locationId: z.string().optional().nullable(),
});

interface SessionScheduleEditModalProps {
	sessionId: string;
	startTime: Date;
	endTime: Date;
	locationId: string | null;
}

export const SessionScheduleEditModal = NiceModal.create(
	({
		sessionId,
		startTime,
		endTime,
		locationId,
	}: SessionScheduleEditModalProps) => {
		const t = useTranslations("training");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		// Duration in minutes
		const initialDuration = Math.round(
			(new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000,
		);
		const [duration, setDuration] = React.useState(initialDuration);

		const { data: locationsData } =
			trpc.organization.location.listActive.useQuery();
		const locations = locationsData ?? [];

		const form = useZodForm({
			schema: scheduleSchema,
			defaultValues: {
				startTime: new Date(startTime),
				locationId: locationId ?? null,
			},
		});

		const updateMutation = trpc.organization.trainingSession.update.useMutation(
			{
				onSuccess: () => {
					toast.success(t("success.updated"));
					utils.organization.trainingSession.get.invalidate({
						id: sessionId,
					});
					utils.organization.trainingSession.list.invalidate();
					utils.organization.trainingSession.listForCalendar.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.updateFailed"));
				},
			},
		);

		// Time helpers
		const timeOptions = React.useMemo(() => {
			const options: { value: string; label: string }[] = [];
			for (let hour = 5; hour <= 23; hour++) {
				for (let minute = 0; minute < 60; minute += 15) {
					const h = hour.toString().padStart(2, "0");
					const m = minute.toString().padStart(2, "0");
					options.push({ value: `${h}:${m}`, label: `${h}:${m}` });
				}
			}
			return options;
		}, []);

		const getTimeFromDate = (date: Date | undefined): string => {
			if (!date) return "09:00";
			const d = new Date(date);
			const h = d.getHours().toString().padStart(2, "0");
			const m = ((Math.round(d.getMinutes() / 15) * 15) % 60)
				.toString()
				.padStart(2, "0");
			return `${h}:${m}`;
		};

		const combineDateAndTime = (date: Date, timeString: string): Date => {
			const parts = timeString.split(":");
			const hours = parseInt(parts[0] ?? "9", 10);
			const minutes = parseInt(parts[1] ?? "0", 10);
			return setMinutes(setHours(new Date(date), hours), minutes);
		};

		const onSubmit = form.handleSubmit((data) => {
			const st = new Date(data.startTime as Date);
			const et = new Date(st.getTime() + duration * 60 * 1000);
			updateMutation.mutate({
				id: sessionId,
				startTime: st,
				endTime: et,
				locationId: data.locationId ?? null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("modal.editScheduleTitle")}
				subtitle={t("modal.editScheduleSubtitle")}
				icon={<CalendarIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection>
						{/* Date picker */}
						<FormField
							control={form.control}
							name="startTime"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.date")}</FormLabel>
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
															? format(
																	new Date(
																		field.value as string | number | Date,
																	),
																	"EEE, dd MMM yyyy",
																)
															: t("modal.selectDate")}
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={
														field.value
															? new Date(field.value as string | number | Date)
															: undefined
													}
													onSelect={(date) => {
														if (date) {
															const currentTime = getTimeFromDate(
																field.value
																	? new Date(
																			field.value as string | number | Date,
																		)
																	: undefined,
															);
															field.onChange(
																combineDateAndTime(date, currentTime),
															);
														}
													}}
													initialFocus
												/>
											</PopoverContent>
										</Popover>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						{/* Time and Duration */}
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="startTime"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.time")}</FormLabel>
											<Select
												value={getTimeFromDate(
													field.value
														? new Date(field.value as string | number | Date)
														: undefined,
												)}
												onValueChange={(time) => {
													const currentDate = field.value
														? new Date(field.value as string | number | Date)
														: new Date();
													field.onChange(combineDateAndTime(currentDate, time));
												}}
											>
												<FormControl>
													<SelectTrigger>
														<ClockIcon className="mr-2 size-4 text-muted-foreground" />
														<SelectValue placeholder={t("modal.selectTime")} />
													</SelectTrigger>
												</FormControl>
												<SelectContent className="max-h-[280px]">
													{timeOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<Field>
								<FormLabel>{t("form.duration")}</FormLabel>
								<Select
									onValueChange={(value) => setDuration(parseInt(value, 10))}
									value={duration.toString()}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder={t("modal.selectDuration")} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="15">15 min</SelectItem>
										<SelectItem value="30">30 min</SelectItem>
										<SelectItem value="45">45 min</SelectItem>
										<SelectItem value="60">1 hour</SelectItem>
										<SelectItem value="75">1h 15min</SelectItem>
										<SelectItem value="90">1h 30min</SelectItem>
										<SelectItem value="105">1h 45min</SelectItem>
										<SelectItem value="120">2 hours</SelectItem>
										<SelectItem value="150">2h 30min</SelectItem>
										<SelectItem value="180">3 hours</SelectItem>
									</SelectContent>
								</Select>
							</Field>
						</ProfileEditGrid>

						{/* Location */}
						<FormField
							control={form.control}
							name="locationId"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.location")}</FormLabel>
										<Select
											onValueChange={(value) =>
												field.onChange(value === "none" ? null : value)
											}
											value={field.value ?? "none"}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue
														placeholder={t("modal.selectLocation")}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">
													{t("modal.noLocation")}
												</SelectItem>
												{locations.map((location) => (
													<SelectItem key={location.id} value={location.id}>
														{location.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
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
