import { MapPinIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import {
	getContrastTextColor,
	getLocationColor,
	getSafeEventColor,
} from "@/lib/utils/location-colors";

type LocationBadgeProps = {
	locationId: string;
	name: string;
	color?: string | null;
	className?: string;
};

export function LocationBadge({
	locationId,
	name,
	color,
	className,
}: LocationBadgeProps): React.JSX.Element {
	const baseColor = getLocationColor(locationId, color);
	const bgColor = getSafeEventColor(baseColor);
	const textColor = getContrastTextColor(bgColor);

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium max-w-[160px]",
				className,
			)}
			style={{ backgroundColor: bgColor, color: textColor }}
		>
			<MapPinIcon className="size-3 shrink-0" />
			<span className="truncate">{name}</span>
		</span>
	);
}
