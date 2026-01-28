import type { Locale } from "date-fns";
import {
	eachDayOfInterval,
	eachMonthOfInterval,
	eachWeekOfInterval,
	format,
} from "date-fns";

type Period = "day" | "week" | "month" | "year";

/**
 * Generate all period start dates within a date range.
 * Used to fill gaps in chart data so empty periods show as zero.
 */
export function generatePeriodDates(
	dateRange: { from: Date; to: Date },
	period: Period,
): Date[] {
	switch (period) {
		case "day":
			return eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
		case "week":
			return eachWeekOfInterval(
				{ start: dateRange.from, end: dateRange.to },
				{ weekStartsOn: 1 },
			);
		case "month":
			return eachMonthOfInterval({
				start: dateRange.from,
				end: dateRange.to,
			});
		case "year": {
			const startYear = dateRange.from.getFullYear();
			const endYear = dateRange.to.getFullYear();
			return Array.from(
				{ length: endYear - startYear + 1 },
				(_, i) => new Date(startYear + i, 0, 1),
			);
		}
	}
}

/**
 * Get a normalized string key for a date given a period.
 * Normalizes to noon UTC before extracting components so that backend dates
 * (which may sit at midnight UTC from DATE_TRUNC) and frontend dates
 * (at local midnight from generatePeriodDates) produce identical keys
 * regardless of the client or server timezone.
 */
export function getPeriodKey(date: Date, period: Period): string {
	const pad = (n: number) => String(n).padStart(2, "0");

	// Shift to noon UTC so dates within ±12h of midnight all resolve
	// to the same calendar day in UTC.
	const d = new Date(date);
	d.setUTCHours(12, 0, 0, 0);

	const y = d.getUTCFullYear();
	const m = d.getUTCMonth() + 1;
	const day = d.getUTCDate();

	switch (period) {
		case "day":
			return `${y}-${pad(m)}-${pad(day)}`;
		case "week": {
			const dow = d.getUTCDay(); // 0=Sun … 6=Sat
			const diff = dow === 0 ? -6 : 1 - dow; // offset to Monday (ISO week)
			const monday = new Date(d);
			monday.setUTCDate(day + diff);
			return `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`;
		}
		case "month":
			return `${y}-${pad(m)}`;
		case "year":
			return `${y}`;
	}
}

/**
 * Format a date as a chart axis label based on the period granularity.
 */
export function getPeriodLabel(
	date: Date,
	period: Period,
	locale: Locale,
): string {
	switch (period) {
		case "year":
			return format(date, "yyyy", { locale });
		case "month":
			return format(date, "MMM yy", { locale });
		default:
			return format(date, "dd MMM", { locale });
	}
}
