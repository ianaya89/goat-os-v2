import type { TrainingSessionStatus } from "@/lib/db/schema/enums";

/**
 * Predefined color palette for locations
 * Mid-tone saturated colors with good contrast for white text (WCAG AA)
 */
export const LOCATION_COLOR_PALETTE = [
	"#4a7fb5", // Steel Blue
	"#5a9e6f", // Forest Green
	"#c47834", // Burnt Orange
	"#7e5baa", // Medium Purple
	"#c25560", // Brick Rose
	"#3a8f8f", // Deep Teal
	"#a0853b", // Dark Gold
	"#5874a6", // Slate Blue
	"#6d8f4e", // Olive Green
	"#9e6b5a", // Warm Brown
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
 * Parse a hex color string into RGB components
 */
function parseHex(hex: string): { r: number; g: number; b: number } {
	const color = hex.replace("#", "");
	return {
		r: parseInt(color.substring(0, 2), 16),
		g: parseInt(color.substring(2, 4), 16),
		b: parseInt(color.substring(4, 6), 16),
	};
}

/**
 * Get the relative luminance of a color (WCAG formula)
 * Returns a value between 0 (black) and 1 (white)
 */
export function getRelativeLuminance(hex: string): number {
	const { r, g, b } = parseHex(hex);
	const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
		c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
	);
	return 0.2126 * rs! + 0.7152 * gs! + 0.0722 * bs!;
}

/**
 * Returns the best text color (white or dark) for a given background hex color
 * Based on WCAG contrast ratio guidelines
 */
export function getContrastTextColor(bgHex: string): string {
	const luminance = getRelativeLuminance(bgHex);
	return luminance > 0.4 ? "#1f2937" : "#ffffff";
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(
	r: number,
	g: number,
	b: number,
): { h: number; s: number; l: number } {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;

	if (max === min) return { h: 0, s: 0, l };

	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h = 0;
	if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
	else if (max === gn) h = ((bn - rn) / d + 2) / 6;
	else h = ((rn - gn) / d + 4) / 6;

	return { h, s, l };
}

/**
 * Convert HSL to hex
 */
function hslToHex(h: number, s: number, l: number): string {
	const hue2rgb = (p: number, q: number, t: number) => {
		const tt = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
		if (tt < 1 / 6) return p + (q - p) * 6 * tt;
		if (tt < 1 / 2) return q;
		if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
		return p;
	};

	let r: number;
	let g: number;
	let b: number;

	if (s === 0) {
		r = g = b = l;
	} else {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	const toHex = (n: number) =>
		Math.round(n * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Normalize a color for use as a calendar event background.
 * Clamps lightness to 35-50% and ensures minimum saturation of 30%,
 * so the hue is always recognizable and white text is always legible,
 * regardless of what color the user picked.
 */
export function getSafeEventColor(hex: string): string {
	const { r, g, b } = parseHex(hex);
	const { h, s, l } = rgbToHsl(r, g, b);

	const safeLightness = Math.max(0.35, Math.min(0.5, l));
	const safeSaturation = Math.max(0.3, Math.min(0.75, s));

	return hslToHex(h, safeSaturation, safeLightness);
}

/**
 * Get a lighter version of a color for backgrounds
 */
export function getLighterColor(hex: string, amount = 0.3): string {
	const { r, g, b } = parseHex(hex);

	const newR = Math.round(r + (255 - r) * amount);
	const newG = Math.round(g + (255 - g) * amount);
	const newB = Math.round(b + (255 - b) * amount);

	return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}
