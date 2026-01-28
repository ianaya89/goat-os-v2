"use client";

import {
	endOfMonth,
	endOfYear,
	format,
	startOfMonth,
	startOfYear,
	subMonths,
	subYears,
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { CashFlowChart } from "./cash-flow-chart";
import { ExpenseTrendChart } from "./expense-trend-chart";
import { ExpensesByCategoryChart } from "./expenses-by-category-chart";
import { FinancialSummaryCards } from "./financial-summary-cards";
import { PeriodGrowthChart } from "./period-growth-chart";
import { ProfitMarginTrendChart } from "./profit-margin-trend-chart";
import { RevenueByEventChart } from "./revenue-by-event-chart";
import { RevenueByLocationChart } from "./revenue-by-location-chart";
import { RevenueByServiceChart } from "./revenue-by-service-chart";
import { RevenueCompositionChart } from "./revenue-composition-chart";
import { RevenueCumulativeChart } from "./revenue-cumulative-chart";
import { RevenueTrendChart } from "./revenue-trend-chart";

type Period = "day" | "week" | "month" | "year";

type PresetRange =
	| "thisMonth"
	| "lastMonth"
	| "last3Months"
	| "last6Months"
	| "thisYear"
	| "lastYear"
	| "custom";

function getPresetDateRange(preset: PresetRange): { from: Date; to: Date } {
	const now = new Date();
	switch (preset) {
		case "thisMonth":
			return { from: startOfMonth(now), to: endOfMonth(now) };
		case "lastMonth": {
			const lastMonth = subMonths(now, 1);
			return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
		}
		case "last3Months":
			return { from: subMonths(now, 3), to: now };
		case "last6Months":
			return { from: subMonths(now, 6), to: now };
		case "thisYear":
			return { from: startOfYear(now), to: endOfYear(now) };
		case "lastYear": {
			const lastYear = subYears(now, 1);
			return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
		}
		default:
			return { from: subMonths(now, 3), to: now };
	}
}

export function FinancialDashboard(): React.JSX.Element {
	const [period, setPeriod] = React.useState<Period>("month");
	const [presetRange, setPresetRange] =
		React.useState<PresetRange>("last3Months");
	const [dateRange, setDateRange] = React.useState(() =>
		getPresetDateRange("last3Months"),
	);
	const [isCustomRange, setIsCustomRange] = React.useState(false);

	const handlePresetChange = (value: PresetRange) => {
		setPresetRange(value);
		if (value !== "custom") {
			setDateRange(getPresetDateRange(value));
			setIsCustomRange(false);
			// Auto-adjust period granularity based on the selected range
			if (value === "thisMonth" || value === "lastMonth") {
				setPeriod("day");
			} else if (value === "last3Months" || value === "last6Months") {
				setPeriod("week");
			} else if (value === "thisYear" || value === "lastYear") {
				setPeriod("month");
			}
		} else {
			setIsCustomRange(true);
		}
	};

	const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
		if (range?.from && range?.to) {
			setDateRange({ from: range.from, to: range.to });
		}
	};

	return (
		<div className="space-y-6">
			{/* Filters */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-wrap gap-2">
					<Button
						variant={presetRange === "thisMonth" ? "default" : "outline"}
						size="sm"
						onClick={() => handlePresetChange("thisMonth")}
					>
						Este mes
					</Button>
					<Button
						variant={presetRange === "lastMonth" ? "default" : "outline"}
						size="sm"
						onClick={() => handlePresetChange("lastMonth")}
					>
						Mes anterior
					</Button>
					<Button
						variant={presetRange === "last3Months" ? "default" : "outline"}
						size="sm"
						onClick={() => handlePresetChange("last3Months")}
					>
						3 meses
					</Button>
					<Button
						variant={presetRange === "last6Months" ? "default" : "outline"}
						size="sm"
						onClick={() => handlePresetChange("last6Months")}
					>
						6 meses
					</Button>
					<Button
						variant={presetRange === "thisYear" ? "default" : "outline"}
						size="sm"
						onClick={() => handlePresetChange("thisYear")}
					>
						Este año
					</Button>
					<Button
						variant={presetRange === "lastYear" ? "default" : "outline"}
						size="sm"
						onClick={() => handlePresetChange("lastYear")}
					>
						Año anterior
					</Button>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant={presetRange === "custom" ? "default" : "outline"}
								size="sm"
								onClick={() => {
									setPresetRange("custom");
									setIsCustomRange(true);
								}}
							>
								<CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
								Personalizado
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								initialFocus
								mode="range"
								defaultMonth={dateRange?.from}
								selected={dateRange}
								onSelect={handleDateSelect}
								numberOfMonths={2}
							/>
						</PopoverContent>
					</Popover>
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
			<FinancialSummaryCards dateRange={dateRange} />

			{/* Trend Charts Row */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<RevenueTrendChart dateRange={dateRange} period={period} />
				<ExpenseTrendChart dateRange={dateRange} period={period} />
			</div>

			{/* Cash Flow & Profit Margin Row */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<CashFlowChart dateRange={dateRange} period={period} />
				<ProfitMarginTrendChart dateRange={dateRange} period={period} />
			</div>

			{/* Revenue Cumulative Chart */}
			<RevenueCumulativeChart dateRange={dateRange} period={period} />

			{/* Revenue Composition & Period Growth Row */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<RevenueCompositionChart dateRange={dateRange} period={period} />
				<PeriodGrowthChart dateRange={dateRange} period={period} />
			</div>

			{/* Revenue by Event, Location, and Service */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<RevenueByEventChart dateRange={dateRange} />
				<RevenueByLocationChart dateRange={dateRange} />
			</div>
			<RevenueByServiceChart dateRange={dateRange} />

			{/* Distribution Charts Row */}
			<ExpensesByCategoryChart dateRange={dateRange} />
		</div>
	);
}
