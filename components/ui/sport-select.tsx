"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type AthleteSport, AthleteSports } from "@/lib/db/schema/enums";

export type SportSelectProps = {
	value?: string | null;
	onValueChange?: (value: string | null) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	/** Show "All sports" option for filters */
	showAllOption?: boolean;
	/** Value for the "All" option (defaults to empty string) */
	allOptionValue?: string;
	/** Sort options alphabetically by translated label */
	sorted?: boolean;
};

export function SportSelect({
	value,
	onValueChange,
	placeholder,
	disabled,
	className,
	showAllOption = false,
	allOptionValue = "",
	sorted = true,
}: SportSelectProps): React.JSX.Element {
	const t = useTranslations("common.sports");

	const getSportLabel = (sport: AthleteSport): string => {
		return t(sport as Parameters<typeof t>[0]);
	};

	const sportOptions = React.useMemo(() => {
		const options = AthleteSports.map((sport) => ({
			value: sport,
			label: getSportLabel(sport),
		}));

		if (sorted) {
			return options.sort((a, b) => a.label.localeCompare(b.label));
		}

		return options;
	}, [sorted, t]);

	const handleValueChange = (newValue: string) => {
		if (showAllOption && newValue === allOptionValue) {
			onValueChange?.(null);
		} else {
			onValueChange?.(newValue || null);
		}
	};

	return (
		<Select
			value={value ?? (showAllOption ? allOptionValue : undefined)}
			onValueChange={handleValueChange}
			disabled={disabled}
		>
			<SelectTrigger className={className}>
				<SelectValue placeholder={placeholder ?? t("selectSport")} />
			</SelectTrigger>
			<SelectContent>
				{showAllOption && (
					<SelectItem value={allOptionValue || "all"}>
						{t("allSports")}
					</SelectItem>
				)}
				{sportOptions.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

/**
 * Hook to get translated sport labels
 * Useful for tables, filters, and other non-select contexts
 */
export function useSportLabels() {
	const t = useTranslations("common.sports");

	const getSportLabel = React.useCallback(
		(sport: AthleteSport | string): string => {
			return t(sport as Parameters<typeof t>[0]);
		},
		[t],
	);

	const sportOptions = React.useMemo(() => {
		return AthleteSports.map((sport) => ({
			value: sport,
			label: getSportLabel(sport),
		})).sort((a, b) => a.label.localeCompare(b.label));
	}, [getSportLabel]);

	return { getSportLabel, sportOptions };
}
