"use client";

import {
	addDays,
	addMonths,
	addWeeks,
	endOfMonth,
	endOfWeek,
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
import { AttendanceByAthleteChart } from "./attendance-by-athlete-chart";
import { AttendanceByGroupChart } from "./attendance-by-group-chart";
import { AttendanceTrendChart } from "./attendance-trend-chart";
import { SessionsByCoachChart } from "./sessions-by-coach-chart";
import { SessionsTrendChart } from "./sessions-trend-chart";
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

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-wrap gap-2">
					<Button
						variant={datePreset === "thisWeek" ? "default" : "outline"}
						size="sm"
						onClick={() => setDatePreset("thisWeek")}
					>
						Esta semana
					</Button>
					<Button
						variant={datePreset === "thisMonth" ? "default" : "outline"}
						size="sm"
						onClick={() => setDatePreset("thisMonth")}
					>
						Este mes
					</Button>
					<Button
						variant={datePreset === "last3Months" ? "default" : "outline"}
						size="sm"
						onClick={() => setDatePreset("last3Months")}
					>
						3 meses
					</Button>
					<Button
						variant={datePreset === "last6Months" ? "default" : "outline"}
						size="sm"
						onClick={() => setDatePreset("last6Months")}
					>
						6 meses
					</Button>
					<Button
						variant={datePreset === "lastYear" ? "default" : "outline"}
						size="sm"
						onClick={() => setDatePreset("lastYear")}
					>
						1 año
					</Button>
				</div>

				<Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder="Agrupar por" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="day">Por día</SelectItem>
						<SelectItem value="week">Por semana</SelectItem>
						<SelectItem value="month">Por mes</SelectItem>
						<SelectItem value="year">Por año</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<TrainingSummaryCards dateRange={dateRange} />

			<div className="grid gap-6 lg:grid-cols-2">
				<SessionsTrendChart dateRange={dateRange} period={period} />
				<AttendanceTrendChart dateRange={dateRange} period={period} />
			</div>

			<AttendanceByAthleteChart dateRange={dateRange} />

			<div className="grid gap-6 lg:grid-cols-2">
				<AttendanceByGroupChart dateRange={dateRange} />
				<SessionsByCoachChart dateRange={dateRange} />
			</div>
		</div>
	);
}
