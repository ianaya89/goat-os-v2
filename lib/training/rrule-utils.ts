import { RRule, type Options as RRuleOptions, type Weekday } from "rrule";

/**
 * Frequency options for recurring sessions
 */
export const RecurrenceFrequency = {
	daily: "daily",
	weekly: "weekly",
	biweekly: "biweekly",
	monthly: "monthly",
} as const;
export type RecurrenceFrequency =
	(typeof RecurrenceFrequency)[keyof typeof RecurrenceFrequency];

/**
 * Days of the week for recurring sessions
 */
export const WeekDays = {
	MO: "MO",
	TU: "TU",
	WE: "WE",
	TH: "TH",
	FR: "FR",
	SA: "SA",
	SU: "SU",
} as const;
export type WeekDay = (typeof WeekDays)[keyof typeof WeekDays];

/**
 * Map string day names to RRule Weekday objects
 */
const weekdayMap: Record<WeekDay, Weekday> = {
	MO: RRule.MO,
	TU: RRule.TU,
	WE: RRule.WE,
	TH: RRule.TH,
	FR: RRule.FR,
	SA: RRule.SA,
	SU: RRule.SU,
};

/**
 * Recurrence configuration for creating an RRule
 */
export interface RecurrenceConfig {
	frequency: RecurrenceFrequency;
	interval?: number;
	weekDays?: WeekDay[];
	endDate?: Date;
	count?: number;
}

/**
 * Create an RRule string from a recurrence configuration
 */
export function createRRuleString(
	startDate: Date,
	config: RecurrenceConfig,
): string {
	const options: Partial<RRuleOptions> = {
		dtstart: startDate,
	};

	// Set frequency
	switch (config.frequency) {
		case "daily":
			options.freq = RRule.DAILY;
			options.interval = config.interval ?? 1;
			break;
		case "weekly":
			options.freq = RRule.WEEKLY;
			options.interval = config.interval ?? 1;
			if (config.weekDays && config.weekDays.length > 0) {
				options.byweekday = config.weekDays.map((day) => weekdayMap[day]);
			}
			break;
		case "biweekly":
			options.freq = RRule.WEEKLY;
			options.interval = 2;
			if (config.weekDays && config.weekDays.length > 0) {
				options.byweekday = config.weekDays.map((day) => weekdayMap[day]);
			}
			break;
		case "monthly":
			options.freq = RRule.MONTHLY;
			options.interval = config.interval ?? 1;
			break;
	}

	// Set end condition
	if (config.endDate) {
		options.until = config.endDate;
	} else if (config.count) {
		options.count = config.count;
	}

	const rule = new RRule(options);
	return rule.toString();
}

/**
 * Parse an RRule string and return an RRule object
 */
export function parseRRule(rruleString: string): RRule {
	return RRule.fromString(rruleString);
}

/**
 * Get all occurrences of a recurring session between two dates
 */
export function getOccurrences(
	rruleString: string,
	startDate: Date,
	endDate: Date,
): Date[] {
	const rule = parseRRule(rruleString);
	return rule.between(startDate, endDate, true);
}

/**
 * Get the next N occurrences of a recurring session
 */
export function getNextOccurrences(
	rruleString: string,
	count: number,
	after?: Date,
): Date[] {
	const rule = parseRRule(rruleString);
	const afterDate = after ?? new Date();
	return rule.after(afterDate, true)
		? [
				rule.after(afterDate, true)!,
				...rule
					.between(
						afterDate,
						new Date(afterDate.getTime() + 365 * 24 * 60 * 60 * 1000),
						true,
					)
					.slice(0, count - 1),
			]
		: [];
}

/**
 * Human-readable description of an RRule
 */
export function getRRuleDescription(rruleString: string): string {
	try {
		const rule = parseRRule(rruleString);
		return rule.toText();
	} catch {
		return "Invalid recurrence rule";
	}
}

/**
 * Apply session duration to occurrence dates
 * Given a list of occurrence start times and a duration in minutes,
 * returns objects with startTime and endTime
 */
export function applyDuration(
	occurrences: Date[],
	durationMinutes: number,
): Array<{ startTime: Date; endTime: Date }> {
	return occurrences.map((startTime) => ({
		startTime,
		endTime: new Date(startTime.getTime() + durationMinutes * 60 * 1000),
	}));
}

/**
 * Calculate session duration in minutes from start and end times
 */
export function getSessionDuration(startTime: Date, endTime: Date): number {
	return Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000));
}

/**
 * Filter out exceptions from occurrences
 */
export function filterExceptions(
	occurrences: Date[],
	exceptions: Date[],
): Date[] {
	const exceptionTimes = new Set(exceptions.map((d) => d.getTime()));
	return occurrences.filter((d) => !exceptionTimes.has(d.getTime()));
}

/**
 * Add UNTIL clause to an RRule to end it at a specific date
 */
export function addUntilToRRule(rruleString: string, untilDate: Date): string {
	const rule = parseRRule(rruleString);
	const options = rule.origOptions;

	// Create new rule with UNTIL
	const newRule = new RRule({
		...options,
		until: untilDate,
		count: undefined, // Remove count if it was set
	});

	return newRule.toString();
}

/**
 * Get frequency label for UI display
 */
export function getFrequencyLabel(frequency: RecurrenceFrequency): string {
	switch (frequency) {
		case "daily":
			return "Daily";
		case "weekly":
			return "Weekly";
		case "biweekly":
			return "Every 2 weeks";
		case "monthly":
			return "Monthly";
		default:
			return frequency;
	}
}

/**
 * Get day label for UI display
 */
export function getDayLabel(day: WeekDay): string {
	switch (day) {
		case "MO":
			return "Monday";
		case "TU":
			return "Tuesday";
		case "WE":
			return "Wednesday";
		case "TH":
			return "Thursday";
		case "FR":
			return "Friday";
		case "SA":
			return "Saturday";
		case "SU":
			return "Sunday";
		default:
			return day;
	}
}

/**
 * Get short day label for UI display
 */
export function getShortDayLabel(day: WeekDay): string {
	switch (day) {
		case "MO":
			return "Mon";
		case "TU":
			return "Tue";
		case "WE":
			return "Wed";
		case "TH":
			return "Thu";
		case "FR":
			return "Fri";
		case "SA":
			return "Sat";
		case "SU":
			return "Sun";
		default:
			return day;
	}
}
