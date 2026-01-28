"use client";

import {
	addMonths,
	endOfMonth,
	endOfWeek,
	format,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import type * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { AttendanceTrendChart } from "./attendance-trend-chart";
import { SessionsByCoachChart } from "./sessions-by-coach-chart";
import { SessionsCompletionChart } from "./sessions-completion-chart";
import { SessionsCumulativeChart } from "./sessions-cumulative-chart";
import { SessionsGrowthChart } from "./sessions-growth-chart";
import { TrainingSummaryCards } from "./training-summary-cards";

type Period = "day" | "week" | "month" | "year";
type DatePreset =
	| "thisWeek"
	| "thisMonth"
	| "last3Months"
	| "last6Months"
	| "lastYear";

function getPresetDates(preset: DatePreset): { from: Date; to: Date } {
	const now = new Date();

	switch (preset) {
		case "thisWeek":
			return {
				from: startOfWeek(now, { locale: es }),
				to: endOfWeek(now, { locale: es }),
			};
		case "thisMonth":
			return {
				from: startOfMonth(now),
				to: endOfMonth(now),
			};
		case "last3Months":
			return {
				from: addMonths(now, -3),
				to: now,
			};
		case "last6Months":
			return {
				from: addMonths(now, -6),
				to: now,
			};
		case "lastYear":
			return {
				from: addMonths(now, -12),
				to: now,
			};
		default:
			return {
				from: addMonths(now, -3),
				to: now,
			};
	}
}

export function TrainingDashboard(): React.JSX.Element {
	const [period, setPeriod] = useState<Period>("month");
	const [datePreset, setDatePreset] = useState<DatePreset>("last3Months");

	const dateRange = getPresetDates(datePreset);

	const handlePresetChange = (preset: DatePreset) => {
		setDatePreset(preset);
		if (preset === "thisWeek" || preset === "thisMonth") {
			setPeriod("day");
		} else if (preset === "last3Months" || preset === "last6Months") {
			setPeriod("week");
		} else if (preset === "lastYear") {
			setPeriod("month");
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-wrap gap-2">
					<Button
						variant={datePreset === "thisWeek" ? "default" : "outline"}
						size="sm"
						onClick={() => handlePresetChange("thisWeek")}
					>
						Esta semana
					</Button>
					<Button
						variant={datePreset === "thisMonth" ? "default" : "outline"}
						size="sm"
						onClick={() => handlePresetChange("thisMonth")}
					>
						Este mes
					</Button>
					<Button
						variant={datePreset === "last3Months" ? "default" : "outline"}
						size="sm"
						onClick={() => handlePresetChange("last3Months")}
					>
						3 meses
					</Button>
					<Button
						variant={datePreset === "last6Months" ? "default" : "outline"}
						size="sm"
						onClick={() => handlePresetChange("last6Months")}
					>
						6 meses
					</Button>
					<Button
						variant={datePreset === "lastYear" ? "default" : "outline"}
						size="sm"
						onClick={() => handlePresetChange("lastYear")}
					>
						1 año
					</Button>
				</div>

				<div className="flex items-center gap-3">
					<span className="text-sm text-muted-foreground">
						{format(dateRange.from, "dd MMM yyyy", { locale: es })} -{" "}
						{format(dateRange.to, "dd MMM yyyy", { locale: es })}
					</span>
					<Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder="Agrupar por" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="day">Por dia</SelectItem>
							<SelectItem value="week">Por semana</SelectItem>
							<SelectItem value="month">Por mes</SelectItem>
							<SelectItem value="year">Por año</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<TrainingSummaryCards dateRange={dateRange} />

			{/* Trend Charts Row */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<SessionsCompletionChart dateRange={dateRange} period={period} />
				<AttendanceTrendChart dateRange={dateRange} period={period} />
			</div>

			{/* Cumulative Sessions */}
			<SessionsCumulativeChart dateRange={dateRange} period={period} />

			{/* Growth & Coach Charts */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<SessionsGrowthChart dateRange={dateRange} period={period} />
				<SessionsByCoachChart dateRange={dateRange} />
			</div>
		</div>
	);
}
