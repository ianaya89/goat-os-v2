"use client";

import { addMonths, format } from "date-fns";
import { CalendarDaysIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	createRRuleString,
	getAllOccurrences,
	getFrequencyLabel,
	getShortDayLabel,
	MAX_RECURRING_SESSIONS,
	type RecurrenceConfig,
	RecurrenceFrequency,
	type WeekDay,
	WeekDays,
} from "@/lib/training/rrule-utils";
import { cn } from "@/lib/utils";

interface RecurringSessionFormProps {
	isRecurring: boolean;
	onIsRecurringChange: (value: boolean) => void;
	recurrenceConfig: RecurrenceConfig;
	onRecurrenceConfigChange: (config: RecurrenceConfig) => void;
	startTime: Date;
}

export function RecurringSessionForm({
	isRecurring,
	onIsRecurringChange,
	recurrenceConfig,
	onRecurrenceConfigChange,
	startTime,
}: RecurringSessionFormProps) {
	const t = useTranslations("training.recurring");
	const [endType, setEndType] = React.useState<"date" | "count">(
		recurrenceConfig.endDate ? "date" : "count",
	);

	// Compute dynamic occurrence count
	const occurrenceCount = React.useMemo(() => {
		if (!isRecurring) return 0;
		try {
			const rrule = createRRuleString(startTime, recurrenceConfig);
			const occurrences = getAllOccurrences(rrule, MAX_RECURRING_SESSIONS);
			return occurrences.length;
		} catch {
			return 0;
		}
	}, [isRecurring, startTime, recurrenceConfig]);

	const handleFrequencyChange = (frequency: RecurrenceFrequency) => {
		onRecurrenceConfigChange({
			...recurrenceConfig,
			frequency,
			// Reset weekDays if not weekly/biweekly
			weekDays:
				frequency === "weekly" || frequency === "biweekly"
					? recurrenceConfig.weekDays
					: undefined,
		});
	};

	const handleWeekDayToggle = (day: WeekDay) => {
		const currentDays = recurrenceConfig.weekDays ?? [];
		const newDays = currentDays.includes(day)
			? currentDays.filter((d) => d !== day)
			: [...currentDays, day];

		onRecurrenceConfigChange({
			...recurrenceConfig,
			weekDays: newDays.length > 0 ? newDays : undefined,
		});
	};

	const handleEndTypeChange = (type: "date" | "count") => {
		setEndType(type);
		onRecurrenceConfigChange({
			...recurrenceConfig,
			endDate: type === "date" ? addMonths(new Date(), 3) : undefined,
			count: type === "count" ? 10 : undefined,
		});
	};

	const handleEndDateChange = (dateString: string) => {
		onRecurrenceConfigChange({
			...recurrenceConfig,
			endDate: dateString ? new Date(dateString) : undefined,
		});
	};

	const handleCountChange = (count: number) => {
		onRecurrenceConfigChange({
			...recurrenceConfig,
			count: count > 0 ? count : undefined,
		});
	};

	const showWeekDays =
		recurrenceConfig.frequency === "weekly" ||
		recurrenceConfig.frequency === "biweekly";

	return (
		<div className="space-y-4">
			{/* Toggle recurring */}
			<div className="flex items-center justify-between rounded-lg border p-4">
				<div className="space-y-0.5">
					<Label htmlFor="recurring-toggle" className="text-base">
						{t("title")}
					</Label>
					<p className="text-muted-foreground text-sm">{t("description")}</p>
				</div>
				<Switch
					id="recurring-toggle"
					checked={isRecurring}
					onCheckedChange={onIsRecurringChange}
				/>
			</div>

			{isRecurring && (
				<div className="space-y-4 rounded-lg border p-4">
					{/* Frequency */}
					<div className="space-y-2">
						<Label>{t("repeat")}</Label>
						<Select
							value={recurrenceConfig.frequency}
							onValueChange={(value) =>
								handleFrequencyChange(value as RecurrenceFrequency)
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Object.values(RecurrenceFrequency).map((freq) => (
									<SelectItem key={freq} value={freq}>
										{getFrequencyLabel(freq)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Week days selector */}
					{showWeekDays && (
						<div className="space-y-2">
							<Label>{t("onDays")}</Label>
							<div className="flex flex-wrap gap-2">
								{Object.values(WeekDays).map((day) => {
									const isSelected =
										recurrenceConfig.weekDays?.includes(day) ?? false;
									return (
										<button
											key={day}
											type="button"
											onClick={() => handleWeekDayToggle(day)}
											className={cn(
												"flex size-10 items-center justify-center rounded-full border text-sm font-medium transition-colors",
												isSelected
													? "border-primary bg-primary text-primary-foreground"
													: "border-muted-foreground/30 hover:border-primary hover:bg-muted",
											)}
										>
											{getShortDayLabel(day).charAt(0)}
										</button>
									);
								})}
							</div>
							<p className="text-muted-foreground text-xs">
								{recurrenceConfig.weekDays?.length
									? t("selected", {
											days: recurrenceConfig.weekDays
												.map(getShortDayLabel)
												.join(", "),
										})
									: t("selectAtLeastOneDay")}
							</p>
						</div>
					)}

					{/* End condition */}
					<div className="space-y-3">
						<Label>{t("ends")}</Label>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Checkbox
									id="end-date"
									checked={endType === "date"}
									onCheckedChange={() => handleEndTypeChange("date")}
								/>
								<Label htmlFor="end-date" className="font-normal">
									{t("onDate")}
								</Label>
								{endType === "date" && (
									<Input
										type="date"
										className="ml-2 w-auto"
										value={
											recurrenceConfig.endDate
												? format(recurrenceConfig.endDate, "yyyy-MM-dd")
												: ""
										}
										onChange={(e) => handleEndDateChange(e.target.value)}
										min={format(new Date(), "yyyy-MM-dd")}
									/>
								)}
							</div>

							<div className="flex items-center gap-2">
								<Checkbox
									id="end-count"
									checked={endType === "count"}
									onCheckedChange={() => handleEndTypeChange("count")}
								/>
								<Label htmlFor="end-count" className="font-normal">
									{t("after")}
								</Label>
								{endType === "count" && (
									<>
										<Input
											type="number"
											className="ml-2 w-20"
											value={recurrenceConfig.count ?? 10}
											onChange={(e) =>
												handleCountChange(Number.parseInt(e.target.value, 10))
											}
											min={1}
											max={MAX_RECURRING_SESSIONS}
										/>
										<span className="text-sm">{t("occurrences")}</span>
									</>
								)}
							</div>
						</div>
					</div>

					{/* Dynamic occurrence count */}
					{occurrenceCount > 0 && (
						<div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
							<CalendarDaysIcon className="size-4 text-muted-foreground" />
							<Badge variant="secondary">
								{t("sessionsWillBeCreated", { count: occurrenceCount })}
							</Badge>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
