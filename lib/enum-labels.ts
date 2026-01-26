/**
 * Centralized enum label translations.
 * Use this file to maintain consistent labels across the application.
 */

// ============================================================================
// STATUS LABELS
// ============================================================================

export const statusLabels = {
	active: "Activo",
	inactive: "Inactivo",
	pending: "Pendiente",
	completed: "Completado",
	cancelled: "Cancelado",
	draft: "Borrador",
	published: "Publicado",
	archived: "Archivado",
} as const;

export const athleteStatusLabels = {
	active: "Activo",
	inactive: "Inactivo",
} as const;

export const coachStatusLabels = {
	active: "Activo",
	inactive: "Inactivo",
} as const;

export const eventStatusLabels = {
	draft: "Borrador",
	published: "Publicado",
	cancelled: "Cancelado",
	completed: "Completado",
} as const;

export const sessionStatusLabels = {
	scheduled: "Programada",
	in_progress: "En Progreso",
	completed: "Completada",
	cancelled: "Cancelada",
} as const;

export const paymentStatusLabels = {
	pending: "Pendiente",
	paid: "Pagado",
	overdue: "Vencido",
	cancelled: "Cancelado",
	refunded: "Reembolsado",
} as const;

export const waitlistStatusLabels = {
	pending: "Pendiente",
	contacted: "Contactado",
	enrolled: "Inscripto",
	rejected: "Rechazado",
} as const;

// ============================================================================
// LEVEL LABELS
// ============================================================================

export const athleteLevelLabels = {
	beginner: "Principiante",
	intermediate: "Intermedio",
	advanced: "Avanzado",
} as const;

// ============================================================================
// SPORT LABELS
// ============================================================================

export const sportLabels = {
	soccer: "Fútbol",
	basketball: "Básquet",
	volleyball: "Vóley",
	tennis: "Tenis",
	swimming: "Natación",
	athletics: "Atletismo",
	gymnastics: "Gimnasia",
	martial_arts: "Artes Marciales",
	hockey: "Hockey",
	rugby: "Rugby",
	handball: "Handball",
	other: "Otro",
} as const;

// ============================================================================
// TIER LABELS (Sponsors)
// ============================================================================

export const sponsorTierLabels = {
	platinum: "Platino",
	gold: "Oro",
	silver: "Plata",
	bronze: "Bronce",
	partner: "Partner",
	supporter: "Supporter",
} as const;

// ============================================================================
// PRODUCT LABELS
// ============================================================================

export const productCategoryLabels = {
	beverage: "Bebida",
	food: "Comida",
	apparel: "Ropa",
	equipment: "Equipamiento",
	merchandise: "Mercadería",
	supplement: "Suplemento",
	other: "Otro",
} as const;

export const productStatusLabels = {
	active: "Activo",
	inactive: "Inactivo",
	discontinued: "Descontinuado",
} as const;

// ============================================================================
// EXPENSE LABELS
// ============================================================================

export const expenseCategoryLabels = {
	equipment: "Equipamiento",
	facilities: "Instalaciones",
	travel: "Viajes",
	food: "Alimentación",
	marketing: "Marketing",
	salaries: "Salarios",
	utilities: "Servicios",
	insurance: "Seguros",
	other: "Otros",
} as const;

// ============================================================================
// ATTENDANCE LABELS
// ============================================================================

export const attendanceStatusLabels = {
	present: "Presente",
	absent: "Ausente",
	late: "Tarde",
	excused: "Justificado",
} as const;

// ============================================================================
// EQUIPMENT LABELS
// ============================================================================

export const equipmentConditionLabels = {
	new: "Nuevo",
	good: "Bueno",
	fair: "Regular",
	poor: "Malo",
	damaged: "Dañado",
} as const;

export const equipmentCategoryLabels = {
	training: "Entrenamiento",
	competition: "Competencia",
	medical: "Médico",
	office: "Oficina",
	maintenance: "Mantenimiento",
	other: "Otro",
} as const;

// ============================================================================
// PRIORITY LABELS
// ============================================================================

export const priorityLabels = {
	low: "Baja",
	medium: "Media",
	high: "Alta",
	urgent: "Urgente",
} as const;

// ============================================================================
// DATE FILTER LABELS
// ============================================================================

export const dateFilterLabels = {
	today: "Hoy",
	"this-week": "Esta semana",
	"this-month": "Este mes",
	older: "Más antiguo",
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the label for a given enum value from a labels object.
 * Returns the original value if no label is found.
 */
export function getLabel<T extends Record<string, string>>(
	labels: T,
	value: string | null | undefined,
): string {
	if (!value) return "-";
	return (labels as Record<string, string>)[value] ?? value;
}

/**
 * Convert a labels object to options array for Select components.
 */
export function labelsToOptions<T extends Record<string, string>>(
	labels: T,
): Array<{ value: keyof T; label: string }> {
	return Object.entries(labels).map(([value, label]) => ({
		value: value as keyof T,
		label,
	}));
}
