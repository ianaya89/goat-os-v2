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
import { cn } from "@/lib/utils";
import { CashFlowChart } from "./cash-flow-chart";
import { ExpenseTrendChart } from "./expense-trend-chart";
import { ExpensesByCategoryChart } from "./expenses-by-category-chart";
import { FinancialSummaryCards } from "./financial-summary-cards";
import { OutstandingPaymentsTable } from "./outstanding-payments-table";
import { RevenueByAthleteChart } from "./revenue-by-athlete-chart";
import { RevenueByPaymentMethodChart } from "./revenue-by-payment-method-chart";
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
			<div className="flex flex-wrap items-center gap-4">
				{/* Period Selector */}
				<Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder="Periodo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="day">Diario</SelectItem>
						<SelectItem value="week">Semanal</SelectItem>
						<SelectItem value="month">Mensual</SelectItem>
						<SelectItem value="year">Anual</SelectItem>
					</SelectContent>
				</Select>

				{/* Preset Range Selector */}
				<Select value={presetRange} onValueChange={handlePresetChange}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Rango" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="thisMonth">Este mes</SelectItem>
						<SelectItem value="lastMonth">Mes anterior</SelectItem>
						<SelectItem value="last3Months">Ultimos 3 meses</SelectItem>
						<SelectItem value="last6Months">Ultimos 6 meses</SelectItem>
						<SelectItem value="thisYear">Este ano</SelectItem>
						<SelectItem value="lastYear">Ano anterior</SelectItem>
						<SelectItem value="custom">Personalizado</SelectItem>
					</SelectContent>
				</Select>

				{/* Custom Date Range Picker */}
				{isCustomRange && (
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className={cn(
									"w-[280px] justify-start text-left font-normal",
									!dateRange && "text-muted-foreground",
								)}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{dateRange?.from ? (
									dateRange.to ? (
										<>
											{format(dateRange.from, "dd MMM yyyy", { locale: es })} -{" "}
											{format(dateRange.to, "dd MMM yyyy", { locale: es })}
										</>
									) : (
										format(dateRange.from, "dd MMM yyyy", { locale: es })
									)
								) : (
									<span>Seleccionar fechas</span>
								)}
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
				)}

				{/* Display Current Range */}
				<div className="text-sm text-muted-foreground">
					{format(dateRange.from, "dd MMM yyyy", { locale: es })} -{" "}
					{format(dateRange.to, "dd MMM yyyy", { locale: es })}
				</div>
			</div>

			{/* KPI Summary Cards */}
			<FinancialSummaryCards dateRange={dateRange} />

			{/* Trend Charts Row */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<RevenueTrendChart dateRange={dateRange} period={period} />
				<ExpenseTrendChart dateRange={dateRange} period={period} />
			</div>

			{/* Cash Flow Chart */}
			<CashFlowChart dateRange={dateRange} period={period} />

			{/* Distribution Charts Row */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<RevenueByAthleteChart dateRange={dateRange} />
				<ExpensesByCategoryChart dateRange={dateRange} />
			</div>

			{/* Payment Method Chart */}
			<RevenueByPaymentMethodChart dateRange={dateRange} />

			{/* Outstanding Payments */}
			<OutstandingPaymentsTable />
		</div>
	);
}
