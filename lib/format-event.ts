import { format, isSameDay, isSameMonth, isSameYear } from "date-fns";
import {
	Calendar,
	GraduationCap,
	Target,
	Tent,
	Trophy,
	Users,
	Zap,
	type LucideIcon,
} from "lucide-react";
import type { EventStatus, EventType } from "@/lib/db/schema/enums";

/**
 * Format event date range for display
 * Examples:
 * - Same day: "15 Feb 2026"
 * - Same month: "15 - 20 Feb 2026"
 * - Different months: "15 Feb - 5 Mar 2026"
 * - Different years: "28 Dec 2025 - 3 Jan 2026"
 */
export function formatEventDateRange(start: Date, end: Date): string {
	if (isSameDay(start, end)) {
		return format(start, "d MMM yyyy");
	}

	if (isSameMonth(start, end)) {
		return `${format(start, "d")} - ${format(end, "d MMM yyyy")}`;
	}

	if (isSameYear(start, end)) {
		return `${format(start, "d MMM")} - ${format(end, "d MMM yyyy")}`;
	}

	return `${format(start, "d MMM yyyy")} - ${format(end, "d MMM yyyy")}`;
}

/**
 * Format event capacity display
 * Examples: "45/100", "100 (sin límite)" for unlimited
 */
export function formatEventCapacity(
	current: number,
	max: number | null,
): string {
	if (max === null || max === 0) {
		return `${current} (sin límite)`;
	}
	return `${current}/${max}`;
}

/**
 * Calculate capacity percentage for progress indicators
 */
export function getCapacityPercentage(
	current: number,
	max: number | null,
): number {
	if (max === null || max === 0) {
		return 0;
	}
	return Math.min(100, Math.round((current / max) * 100));
}

/**
 * Format price with currency
 * Examples: "$50,000 ARS", "$100 USD"
 */
export function formatEventPrice(
	price: number,
	currency: string = "ARS",
): string {
	const formatter = new Intl.NumberFormat("es-AR", {
		style: "currency",
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});
	return formatter.format(price);
}

/**
 * Get status color classes for badges
 */
export function getEventStatusColor(status: EventStatus): string {
	const colors: Record<EventStatus, string> = {
		draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
		published:
			"bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
		registration_open:
			"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
		registration_closed:
			"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
		in_progress:
			"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
		completed:
			"bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
		cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
	};
	return colors[status] || colors.draft;
}

/**
 * Get human-readable status label
 */
export function getEventStatusLabel(status: EventStatus): string {
	const labels: Record<EventStatus, string> = {
		draft: "Borrador",
		published: "Publicado",
		registration_open: "Inscripciones Abiertas",
		registration_closed: "Inscripciones Cerradas",
		in_progress: "En Progreso",
		completed: "Completado",
		cancelled: "Cancelado",
	};
	return labels[status] || status;
}

/**
 * Get event type color classes for badges
 */
export function getEventTypeColor(type: EventType): string {
	const colors: Record<EventType, string> = {
		campus: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
		camp: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
		clinic: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
		showcase: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
		tournament: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
		tryout: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
		other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
	};
	return colors[type] || colors.other;
}

/**
 * Get human-readable event type label
 */
export function getEventTypeLabel(type: EventType): string {
	const labels: Record<EventType, string> = {
		campus: "Campus",
		camp: "Campamento",
		clinic: "Clínica",
		showcase: "Showcase",
		tournament: "Torneo",
		tryout: "Tryout",
		other: "Otro",
	};
	return labels[type] || type;
}

/**
 * Get icon for event type
 */
export function getEventTypeIcon(type: EventType): LucideIcon {
	const icons: Record<EventType, LucideIcon> = {
		campus: GraduationCap,
		camp: Tent,
		clinic: Target,
		showcase: Zap,
		tournament: Trophy,
		tryout: Users,
		other: Calendar,
	};
	return icons[type] || Calendar;
}

/**
 * Get registration status color classes
 */
export function getRegistrationStatusColor(status: string): string {
	const defaultColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
	const colors: Record<string, string> = {
		pending_payment: defaultColor,
		confirmed:
			"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
		waitlist:
			"bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
		cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
		refunded:
			"bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
		no_show: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
	};
	return colors[status] ?? defaultColor;
}

/**
 * Get human-readable registration status label
 */
export function getRegistrationStatusLabel(status: string): string {
	const labels: Record<string, string> = {
		pending_payment: "Pendiente de Pago",
		confirmed: "Confirmado",
		waitlist: "Lista de Espera",
		cancelled: "Cancelado",
		refunded: "Reembolsado",
		no_show: "No Asistió",
	};
	return labels[status] || status;
}

/**
 * Get payment status color classes
 */
export function getPaymentStatusColor(status: string): string {
	const defaultColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
	const colors: Record<string, string> = {
		pending: defaultColor,
		processing:
			"bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
		paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
		partial:
			"bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
		failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
		refunded:
			"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
		cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
	};
	return colors[status] ?? defaultColor;
}

/**
 * Get human-readable payment status label
 */
export function getPaymentStatusLabel(status: string): string {
	const labels: Record<string, string> = {
		pending: "Pendiente",
		processing: "Procesando",
		paid: "Pagado",
		partial: "Pago Parcial",
		failed: "Fallido",
		refunded: "Reembolsado",
		cancelled: "Cancelado",
	};
	return labels[status] || status;
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // Remove accents
		.replace(/[^a-z0-9\s-]/g, "") // Remove special chars
		.replace(/\s+/g, "-") // Replace spaces with hyphens
		.replace(/-+/g, "-") // Replace multiple hyphens
		.replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Format age range for display
 */
export function formatAgeRange(
	minAge: number | null,
	maxAge: number | null,
): string {
	if (minAge === null && maxAge === null) {
		return "Todas las edades";
	}
	if (minAge !== null && maxAge !== null) {
		return `${minAge} - ${maxAge} años`;
	}
	if (minAge !== null) {
		return `${minAge}+ años`;
	}
	return `Hasta ${maxAge} años`;
}
