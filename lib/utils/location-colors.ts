import type { TrainingSessionStatus } from "@/lib/db/schema/enums";

/**
 * Predefined color palette for locations
 * Muted, balanced pastel colors that are visually distinct and professional
 */
export const LOCATION_COLOR_PALETTE = [
	"#a8c5e2", // Dusty Blue
	"#a3d9c8", // Sage Green
	"#f0c9a6", // Warm Sand
	"#c9b8d9", // Soft Lavender
	"#e8b4b8", // Dusty Rose
	"#9dd1d1", // Muted Teal
	"#e5d4a1", // Soft Gold
	"#b8c4d9", // Steel Blue
	"#c8d9a8", // Sage Lime
	"#d9b8a8", // Warm Taupe
] as const;

/**
 * Get color for a location
 * Uses custom color if set, otherwise falls back to deterministic hash-based color
 */
export function getLocationColor(
	locationId: string,
	customColor?: string | null,
): string {
	if (customColor) return customColor;

	// Hash-based fallback for locations without custom color
	const hash = locationId
		.split("")
		.reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0);
	const index = Math.abs(hash) % LOCATION_COLOR_PALETTE.length;
	return LOCATION_COLOR_PALETTE[index] ?? LOCATION_COLOR_PALETTE[0];
}

/**
 * Status indicator styles for calendar events
 * Status is shown via border style since background color is used for location
 */
export const STATUS_INDICATORS: Record<
	TrainingSessionStatus,
	{
		borderStyle: "solid" | "dashed" | "dotted";
		borderColor: string;
		opacity: number;
	}
> = {
	pending: {
		borderStyle: "dashed",
		borderColor: "#6b7280",
		opacity: 0.8,
	},
	confirmed: {
		borderStyle: "solid",
		borderColor: "inherit",
		opacity: 1,
	},
	completed: {
		borderStyle: "solid",
		borderColor: "#22c55e",
		opacity: 1,
	},
	cancelled: {
		borderStyle: "solid",
		borderColor: "#ef4444",
		opacity: 0.6,
	},
};

/**
 * Get a lighter version of a color for backgrounds
 */
export function getLighterColor(hex: string, amount = 0.3): string {
	// Remove # if present
	const color = hex.replace("#", "");

	// Parse RGB values
	const r = parseInt(color.substring(0, 2), 16);
	const g = parseInt(color.substring(2, 4), 16);
	const b = parseInt(color.substring(4, 6), 16);

	// Lighten by mixing with white
	const newR = Math.round(r + (255 - r) * amount);
	const newG = Math.round(g + (255 - g) * amount);
	const newB = Math.round(b + (255 - b) * amount);

	// Convert back to hex
	return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}
