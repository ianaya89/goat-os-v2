import * as p from "@clack/prompts";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import { REAL_LIFE_ATHLETES } from "./real-life-athletes";

// Organization ID from real-life seed
const REAL_LIFE_ORG_ID = "20000000-0000-4000-8000-000000000001";

// Location name (will be looked up dynamically)
const LOCATION_CAMPO_VERDE_NAME = "Campo Verde";

// Coach IDs - mapping abbreviations to IDs
const COACH_IDS = {
	NP: "20000000-0000-4000-8000-000000000042", // Ignacio Pacheco (Nacho Pacheco)
	SM: "20000000-0000-4000-8000-000000000032", // Santi Maceratezi
	RS: "20000000-0000-4000-8000-000000000052", // Manuel Saman
	SA: "20000000-0000-4000-8000-000000000062", // Sasha London
	TS: "20000000-0000-4000-8000-000000000072", // Santiago Tarazona
	TM: "20000000-0000-4000-8000-000000000082", // Tomas Suarez
} as const;

// Group names (will be looked up dynamically)
const GROUP_PRETEMPORADA_NAME = "Pretemporada Hockey 2026";
const GROUP_SUB10_NAME = "Sub 10 Hockey";

// Session UUID prefix (40xxxxxx to avoid conflicts with real-life entities)
const SESSION_UUID_PREFIX = "40000000-0000-4000-8000";
const SESSION_ATHLETE_UUID_PREFIX = "41000000-0000-4000-8000";
const SESSION_COACH_UUID_PREFIX = "42000000-0000-4000-8000";

function sessionUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${SESSION_UUID_PREFIX}-${indexHex}`;
}

function sessionAthleteUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${SESSION_ATHLETE_UUID_PREFIX}-${indexHex}`;
}

function sessionCoachUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${SESSION_COACH_UUID_PREFIX}-${indexHex}`;
}

// Athlete name to index mapping (for looking up athlete IDs)
function findAthleteIndex(searchName: string): number {
	const normalizedSearch = searchName
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");

	for (let i = 0; i < REAL_LIFE_ATHLETES.length; i++) {
		const athlete = REAL_LIFE_ATHLETES[i];
		if (!athlete) continue;

		const fullName = athlete.lastName
			? `${athlete.firstName} ${athlete.lastName}`
			: athlete.firstName;

		const normalizedName = fullName
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "");

		// Exact match
		if (normalizedName === normalizedSearch) {
			return i;
		}

		// Partial match (first name + last name start)
		if (normalizedName.includes(normalizedSearch)) {
			return i;
		}

		// Check first name only
		const normalizedFirst = athlete.firstName
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "");
		if (normalizedFirst === normalizedSearch) {
			return i;
		}
	}

	return -1;
}

function getAthleteId(index: number): string {
	const indexHex = (index + 1).toString(16).padStart(12, "0");
	return `30000000-0000-4000-8000-${indexHex}`;
}

type CoachAbbrev = keyof typeof COACH_IDS;

interface SessionData {
	date: string; // YYYY-MM-DD
	hour: number;
	minute?: number;
	title: string;
	athletes: string[]; // Athlete names
	coach: CoachAbbrev;
	isGroup?: boolean;
	groupName?: string; // Group name to lookup
	description?: string;
}

// Calendar data extracted from images (January 2026)
const CALENDAR_SESSIONS: SessionData[] = [
	// === 2 de Enero (Viernes) ===
	{
		date: "2026-01-02",
		hour: 9,
		title: "Sesión Individual",
		athletes: ["Maia Dinardo", "Josefina Escurra"],
		coach: "NP",
	},
	{
		date: "2026-01-02",
		hour: 10,
		title: "Sesión Individual",
		athletes: ["Lara Espinosa"],
		coach: "NP",
	},
	{
		date: "2026-01-02",
		hour: 11,
		title: "Sesión Individual",
		athletes: ["Sofia Villareal"],
		coach: "NP",
	},
	{
		date: "2026-01-02",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Justina Alvarez"],
		coach: "NP",
	},
	{
		date: "2026-01-02",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Farah Contador"],
		coach: "SA",
	},
	{
		date: "2026-01-02",
		hour: 14,
		title: "Sesión Grupal",
		athletes: ["Helena Minckas"],
		coach: "SA",
	},
	{
		date: "2026-01-02",
		hour: 15,
		title: "Sesión Individual",
		athletes: ["Valen Zuccardi"],
		coach: "SA",
	},

	// === 5 de Enero (Lunes) ===
	{
		date: "2026-01-05",
		hour: 9,
		title: "Sesión Individual",
		athletes: ["Josefina Dinardo"],
		coach: "NP",
	},
	{
		date: "2026-01-05",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		coach: "NP",
		isGroup: true,
		groupName: GROUP_PRETEMPORADA_NAME,
		description: "Sesión de pretemporada grupal",
	},
	{
		date: "2026-01-05",
		hour: 11,
		title: "Sesión Grupal",
		athletes: ["Guillermina Montoya"],
		coach: "NP",
	},
	{
		date: "2026-01-05",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Rosario Leone"],
		coach: "NP",
	},
	{
		date: "2026-01-05",
		hour: 17,
		title: "Sesión Grupal",
		athletes: ["Octavio", "Francisco Knopoff"],
		coach: "RS",
	},
	{
		date: "2026-01-05",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Trinidad Francica"],
		coach: "RS",
	},
	{
		date: "2026-01-05",
		hour: 19,
		title: "Sesión Grupal",
		athletes: ["Juana Sanchez Azagra", "Maria Sanchez Azagra"],
		coach: "RS",
	},
	{
		date: "2026-01-05",
		hour: 20,
		title: "Sesión Individual",
		athletes: ["Andrea Dallaglio"],
		coach: "RS",
	},

	// === 6 de Enero (Martes) ===
	{
		date: "2026-01-06",
		hour: 10,
		title: "Sesión Individual",
		athletes: ["Lara Espinosa"],
		coach: "NP",
	},
	{
		date: "2026-01-06",
		hour: 11,
		title: "Sesión Grupal",
		athletes: ["Olivia Canepa", "Matilda Canepa"],
		coach: "NP",
	},
	{
		date: "2026-01-06",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Sofia Villareal"],
		coach: "NP",
	},
	{
		date: "2026-01-06",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Matilda Antunez"],
		coach: "NP",
	},
	{
		date: "2026-01-06",
		hour: 15,
		title: "Sesión Grupal",
		athletes: ["Helena Minckas"],
		coach: "RS",
	},
	{
		date: "2026-01-06",
		hour: 16,
		title: "Sesión Individual",
		athletes: ["Felicitas Rusconi"],
		coach: "RS",
	},
	{
		date: "2026-01-06",
		hour: 17,
		title: "Sesión Grupal",
		athletes: ["Joaquina Etchepare", "Antonia Etchepare"],
		coach: "RS",
	},
	{
		date: "2026-01-06",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Manuel Contreras"],
		coach: "RS",
	},
	{
		date: "2026-01-06",
		hour: 19,
		title: "Grupo Sub 10",
		athletes: [],
		coach: "SM",
		isGroup: true,
		groupName: GROUP_SUB10_NAME,
		description: "Entrenamiento categoría Sub 10",
	},
	{
		date: "2026-01-06",
		hour: 20,
		title: "Sesión Individual",
		athletes: ["Theo Bergeonneau"],
		coach: "SM",
	},

	// === 7 de Enero (Miércoles) ===
	{
		date: "2026-01-07",
		hour: 9,
		title: "Sesión Individual",
		athletes: ["Josefina Dinardo"],
		coach: "NP",
	},
	{
		date: "2026-01-07",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		coach: "NP",
		isGroup: true,
		groupName: GROUP_PRETEMPORADA_NAME,
		description: "Sesión de pretemporada grupal",
	},
	{
		date: "2026-01-07",
		hour: 11,
		title: "Sesión Grupal",
		athletes: ["Guillermina Montoya"],
		coach: "NP",
	},
	{
		date: "2026-01-07",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Kiara Greco"],
		coach: "NP",
	},
	{
		date: "2026-01-07",
		hour: 18,
		title: "Arrastrada",
		athletes: [],
		coach: "TS",
		description: "Sesión de técnica de arrastre",
	},
	{
		date: "2026-01-07",
		hour: 19,
		title: "Sesión Individual",
		athletes: ["Margarita Caballero Basconnet"],
		coach: "RS",
	},
	{
		date: "2026-01-07",
		hour: 20,
		title: "Sesión Individual",
		athletes: ["Clara Hagelstrom"],
		coach: "RS",
	},

	// === 8 de Enero (Jueves) ===
	{
		date: "2026-01-08",
		hour: 9,
		title: "Sesión Grupal",
		athletes: ["Benicio", "Pedro Astete"],
		coach: "NP",
	},
	{
		date: "2026-01-08",
		hour: 10,
		title: "Sesión Grupal",
		athletes: ["Olivia Canepa", "Matilda Canepa"],
		coach: "NP",
	},
	{
		date: "2026-01-08",
		hour: 11,
		title: "Sesión Individual",
		athletes: ["Sofia Villareal"],
		coach: "NP",
	},
	{
		date: "2026-01-08",
		hour: 12,
		title: "Sesión Grupal",
		athletes: ["Joaquina Etchepare", "Antonia Etchepare"],
		coach: "NP",
	},
	{
		date: "2026-01-08",
		hour: 15,
		title: "Sesión Grupal",
		athletes: ["Helena Minckas"],
		coach: "RS",
	},
	{
		date: "2026-01-08",
		hour: 16,
		title: "Sesión Individual",
		athletes: ["Felicitas Rusconi"],
		coach: "RS",
	},
	{
		date: "2026-01-08",
		hour: 17,
		title: "Sesión Individual",
		athletes: ["Ludmila Comandu"],
		coach: "RS",
	},
	{
		date: "2026-01-08",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Trinidad Francica"],
		coach: "RS",
	},

	// === 9 de Enero (Viernes) ===
	{
		date: "2026-01-09",
		hour: 9,
		title: "Sesión Individual",
		athletes: ["Josefina Dinardo"],
		coach: "NP",
	},
	{
		date: "2026-01-09",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		coach: "NP",
		isGroup: true,
		groupName: GROUP_PRETEMPORADA_NAME,
		description: "Sesión de pretemporada grupal",
	},
	{
		date: "2026-01-09",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Augusto Szafowal"],
		coach: "NP",
	},
	{
		date: "2026-01-09",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Justina Alvarez"],
		coach: "NP",
	},
	{
		date: "2026-01-09",
		hour: 14,
		title: "Sesión Grupal",
		athletes: ["Victoria Ianelli", "Valentina Diaz Tobares"],
		coach: "SM",
	},
	{
		date: "2026-01-09",
		hour: 15,
		title: "Sesión Individual",
		athletes: ["Catalina Perlini"],
		coach: "SM",
	},
	{
		date: "2026-01-09",
		hour: 16,
		title: "Sesión Individual",
		athletes: ["Renata D'Onofrio"],
		coach: "SM",
	},
	{
		date: "2026-01-09",
		hour: 17,
		title: "Sesión Individual",
		athletes: ["Maria Emilia Mendez Picone"],
		coach: "SM",
	},

	// === 12 de Enero (Lunes) ===
	{
		date: "2026-01-12",
		hour: 9,
		title: "Sesión Individual",
		athletes: ["Josefina Dinardo"],
		coach: "NP",
	},
	{
		date: "2026-01-12",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		coach: "NP",
		isGroup: true,
		groupName: GROUP_PRETEMPORADA_NAME,
		description: "Sesión de pretemporada grupal",
	},
	{
		date: "2026-01-12",
		hour: 11,
		title: "Sesión Grupal",
		athletes: ["Guillermina Montoya"],
		coach: "NP",
	},
	{
		date: "2026-01-12",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Sofia Villareal"],
		coach: "NP",
	},
	{
		date: "2026-01-12",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Rosario Leone"],
		coach: "SM",
	},
	{
		date: "2026-01-12",
		hour: 14,
		title: "Sesión Individual",
		athletes: ["Augusto Szafowal"],
		coach: "SM",
	},
	{
		date: "2026-01-12",
		hour: 17,
		title: "Sesión Grupal",
		athletes: ["Octavio", "Francisco Knopoff"],
		coach: "RS",
	},
	{
		date: "2026-01-12",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Francesca Purificato"],
		coach: "RS",
	},
	{
		date: "2026-01-12",
		hour: 19,
		title: "Sesión Grupal",
		athletes: ["Juana Sanchez Azagra", "Maria Sanchez Azagra"],
		coach: "RS",
	},
	{
		date: "2026-01-12",
		hour: 20,
		title: "Sesión Individual",
		athletes: ["Andrea Dallaglio"],
		coach: "RS",
	},

	// === 13 de Enero (Martes) ===
	{
		date: "2026-01-13",
		hour: 10,
		title: "Sesión Grupal",
		athletes: ["Pedro Astete", "Benicio"],
		coach: "NP",
	},
	{
		date: "2026-01-13",
		hour: 11,
		title: "Sesión Individual",
		athletes: ["Sofia Villareal"],
		coach: "NP",
	},
	{
		date: "2026-01-13",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Kiara Greco"],
		coach: "NP",
	},
	{
		date: "2026-01-13",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Matilda Antunez"],
		coach: "NP",
	},
	{
		date: "2026-01-13",
		hour: 15,
		title: "Sesión Grupal",
		athletes: ["Helena Minckas"],
		coach: "RS",
	},
	{
		date: "2026-01-13",
		hour: 16,
		title: "Sesión Individual",
		athletes: ["Felicitas Rusconi"],
		coach: "RS",
	},
	{
		date: "2026-01-13",
		hour: 17,
		title: "Sesión Individual",
		athletes: ["Lucrecia Gonzalez"],
		coach: "RS",
	},
	{
		date: "2026-01-13",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Manuel Contreras"],
		coach: "RS",
	},
	{
		date: "2026-01-13",
		hour: 19,
		title: "Grupo Sub 10",
		athletes: [],
		coach: "SM",
		isGroup: true,
		groupName: GROUP_SUB10_NAME,
		description: "Entrenamiento categoría Sub 10",
	},
	{
		date: "2026-01-13",
		hour: 20,
		title: "Sesión Individual",
		athletes: ["Clara Hagelstrom"],
		coach: "SM",
	},

	// === 14 de Enero (Miércoles) ===
	{
		date: "2026-01-14",
		hour: 9,
		title: "Sesión Individual",
		athletes: ["Josefina Dinardo"],
		coach: "NP",
	},
	{
		date: "2026-01-14",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		coach: "NP",
		isGroup: true,
		groupName: GROUP_PRETEMPORADA_NAME,
		description: "Sesión de pretemporada grupal",
	},
	{
		date: "2026-01-14",
		hour: 11,
		title: "Sesión Grupal",
		athletes: ["Guillermina Montoya"],
		coach: "NP",
	},
	{
		date: "2026-01-14",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Augusto Szafowal"],
		coach: "NP",
	},
	{
		date: "2026-01-14",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Francesca Purificato"],
		coach: "NP",
	},
	{
		date: "2026-01-14",
		hour: 16,
		title: "Sesión Individual",
		athletes: ["Sasha"],
		coach: "SA",
		description: "Sesión especial",
	},
	{
		date: "2026-01-14",
		hour: 17,
		title: "Sesión Grupal",
		athletes: ["Catalina Perlini"],
		coach: "RS",
	},
	{
		date: "2026-01-14",
		hour: 18,
		title: "Arrastrada",
		athletes: [],
		coach: "TS",
		description: "Sesión de técnica de arrastre",
	},
	{
		date: "2026-01-14",
		hour: 18,
		minute: 30,
		title: "Sesión Individual",
		athletes: ["Lola Alvarez Pastorino"],
		coach: "RS",
	},
	{
		date: "2026-01-14",
		hour: 19,
		title: "Sesión Individual",
		athletes: ["Margarita Caballero Basconnet"],
		coach: "RS",
	},
	{
		date: "2026-01-14",
		hour: 20,
		title: "Sesión Individual",
		athletes: ["Theo Bergeonneau"],
		coach: "RS",
	},

	// === 15 de Enero (Jueves) ===
	{
		date: "2026-01-15",
		hour: 10,
		title: "Sesión Individual",
		athletes: ["Mia Eisenberg"],
		coach: "NP",
	},
	{
		date: "2026-01-15",
		hour: 11,
		title: "Sesión Individual",
		athletes: ["Francine Varas"],
		coach: "NP",
	},
	{
		date: "2026-01-15",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Augusto Szafowal"],
		coach: "NP",
	},
	{
		date: "2026-01-15",
		hour: 15,
		title: "Sesión Grupal",
		athletes: ["Helena Minckas"],
		coach: "RS",
	},
	{
		date: "2026-01-15",
		hour: 16,
		title: "Sesión Individual",
		athletes: ["Felicitas Rusconi"],
		coach: "RS",
	},
	{
		date: "2026-01-15",
		hour: 17,
		title: "Sesión Individual",
		athletes: ["Renata D'Onofrio"],
		coach: "RS",
	},
	{
		date: "2026-01-15",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Trinidad Francica"],
		coach: "RS",
	},

	// === 16 de Enero (Viernes) ===
	{
		date: "2026-01-16",
		hour: 9,
		title: "Sesión Individual",
		athletes: ["Justina Alvarez"],
		coach: "NP",
	},
	{
		date: "2026-01-16",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		coach: "NP",
		isGroup: true,
		groupName: GROUP_PRETEMPORADA_NAME,
		description: "Sesión de pretemporada grupal",
	},
	{
		date: "2026-01-16",
		hour: 11,
		title: "Sesión Individual",
		athletes: ["Francesca Purificato"],
		coach: "NP",
	},
	{
		date: "2026-01-16",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Francesca Purificato"],
		coach: "NP",
	},
	{
		date: "2026-01-16",
		hour: 14,
		title: "Sesión Grupal",
		athletes: ["Victoria Ianelli", "Valentina Diaz Tobares"],
		coach: "SM",
	},
	{
		date: "2026-01-16",
		hour: 16,
		title: "Sesión Individual",
		athletes: ["Renata D'Onofrio"],
		coach: "SM",
	},

	// === 19 de Enero (Lunes) ===
	{
		date: "2026-01-19",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		coach: "NP",
		isGroup: true,
		groupName: GROUP_PRETEMPORADA_NAME,
		description: "Sesión de pretemporada grupal",
	},
	{
		date: "2026-01-19",
		hour: 11,
		title: "Sesión Grupal",
		athletes: ["Guillermina Montoya"],
		coach: "NP",
	},
	{
		date: "2026-01-19",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Rosario Leone"],
		coach: "NP",
	},
	{
		date: "2026-01-19",
		hour: 14,
		title: "Sesión Individual",
		athletes: ["Francesca Purificato"],
		coach: "NP",
	},
	{
		date: "2026-01-19",
		hour: 15,
		title: "Sesión Grupal",
		athletes: ["Alvaro Gibelli", "Pilar Gibelli"],
		coach: "NP",
	},
	{
		date: "2026-01-19",
		hour: 16,
		title: "Sesión Grupal",
		athletes: ["Octavio", "Francisco Knopoff"],
		coach: "RS",
	},
	{
		date: "2026-01-19",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Trinidad Francica"],
		coach: "RS",
	},
	{
		date: "2026-01-19",
		hour: 19,
		title: "Sesión Grupal",
		athletes: ["Juana Sanchez Azagra", "Maria Sanchez Azagra"],
		coach: "RS",
	},

	// === 20 de Enero (Martes) ===
	{
		date: "2026-01-20",
		hour: 11,
		title: "Sesión Individual",
		athletes: ["Delfina Alberto"],
		coach: "NP",
	},
	{
		date: "2026-01-20",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Delfina Alberto"],
		coach: "NP",
	},
	{
		date: "2026-01-20",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Manuel Contreras"],
		coach: "RS",
	},
	{
		date: "2026-01-20",
		hour: 19,
		title: "Grupo Sub 10",
		athletes: [],
		coach: "SM",
		isGroup: true,
		groupName: GROUP_SUB10_NAME,
		description: "Entrenamiento categoría Sub 10",
	},
	{
		date: "2026-01-20",
		hour: 19,
		minute: 30,
		title: "Sesión Individual",
		athletes: ["Joaquina Vital Fassi"],
		coach: "SM",
	},
	{
		date: "2026-01-20",
		hour: 20,
		title: "Sesión Individual",
		athletes: ["Felicitas Camporro"],
		coach: "SM",
	},

	// === 21 de Enero (Miércoles) ===
	{
		date: "2026-01-21",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		coach: "NP",
		isGroup: true,
		groupName: GROUP_PRETEMPORADA_NAME,
		description: "Sesión de pretemporada grupal",
	},
	{
		date: "2026-01-21",
		hour: 11,
		title: "Sesión Grupal",
		athletes: ["Guillermina Montoya"],
		coach: "NP",
	},
	{
		date: "2026-01-21",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Delfina Alberto"],
		coach: "NP",
	},
	{
		date: "2026-01-21",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Delfina Alberto"],
		coach: "NP",
	},
	{
		date: "2026-01-21",
		hour: 14,
		title: "Sesión Individual",
		athletes: ["Francesca Purificato"],
		coach: "NP",
	},
	{
		date: "2026-01-21",
		hour: 18,
		title: "Arrastrada",
		athletes: [],
		coach: "TS",
		description: "Sesión de técnica de arrastre",
	},
	{
		date: "2026-01-21",
		hour: 19,
		title: "Sesión Individual",
		athletes: ["Margarita Caballero Basconnet"],
		coach: "RS",
	},

	// === 22 de Enero (Jueves) ===
	{
		date: "2026-01-22",
		hour: 10,
		title: "Sesión Individual",
		athletes: ["Mia Eisenberg"],
		coach: "NP",
	},
	{
		date: "2026-01-22",
		hour: 11,
		title: "Sesión Individual",
		athletes: ["Delfina Alberto"],
		coach: "NP",
	},
	{
		date: "2026-01-22",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Delfina Alberto"],
		coach: "NP",
	},
	{
		date: "2026-01-22",
		hour: 17,
		title: "Sesión Individual",
		athletes: ["Ludmila Comandu"],
		coach: "RS",
	},
	{
		date: "2026-01-22",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Trinidad Francica"],
		coach: "RS",
	},
	{
		date: "2026-01-22",
		hour: 19,
		title: "Sesión Individual",
		athletes: ["Joaquina Vital Fassi"],
		coach: "SM",
	},
	{
		date: "2026-01-22",
		hour: 20,
		title: "Sesión Individual",
		athletes: ["Theo Bergeonneau"],
		coach: "SM",
	},

	// === 23 de Enero (Viernes) ===
	{
		date: "2026-01-23",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		coach: "NP",
		isGroup: true,
		groupName: GROUP_PRETEMPORADA_NAME,
		description: "Sesión de pretemporada grupal",
	},
	{
		date: "2026-01-23",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Justina Alvarez"],
		coach: "NP",
	},
	{
		date: "2026-01-23",
		hour: 14,
		title: "Sesión Grupal",
		athletes: ["Victoria Ianelli", "Valentina Diaz Tobares"],
		coach: "SM",
	},

	// === 26 de Enero (Lunes) ===
	{
		date: "2026-01-26",
		hour: 9,
		title: "Sesión Individual",
		athletes: ["Maia Dinardo"],
		coach: "NP",
	},
	{
		date: "2026-01-26",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		coach: "NP",
		isGroup: true,
		groupName: GROUP_PRETEMPORADA_NAME,
		description: "Sesión de pretemporada grupal",
	},
	{
		date: "2026-01-26",
		hour: 11,
		title: "Sesión Grupal",
		athletes: ["Guillermina Montoya"],
		coach: "NP",
	},
	{
		date: "2026-01-26",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Rosario Leone"],
		coach: "NP",
	},
	{
		date: "2026-01-26",
		hour: 14,
		title: "Sesión Individual",
		athletes: ["Francesca Purificato"],
		coach: "NP",
	},
	{
		date: "2026-01-26",
		hour: 15,
		title: "Sesión Grupal",
		athletes: ["Alvaro Gibelli", "Pilar Gibelli"],
		coach: "NP",
	},
	{
		date: "2026-01-26",
		hour: 16,
		title: "Sesión Grupal",
		athletes: ["Octavio", "Francisco Knopoff"],
		coach: "RS",
	},
	{
		date: "2026-01-26",
		hour: 17,
		title: "Sesión Individual",
		athletes: ["Sofia Aiupe"],
		coach: "RS",
	},
	{
		date: "2026-01-26",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Trinidad Francica"],
		coach: "RS",
	},
	{
		date: "2026-01-26",
		hour: 19,
		title: "Sesión Grupal",
		athletes: ["Juana Sanchez Azagra", "Maria Sanchez Azagra"],
		coach: "RS",
	},
	{
		date: "2026-01-26",
		hour: 20,
		title: "Sesión Individual",
		athletes: ["Andrea Dallaglio"],
		coach: "RS",
	},

	// === 27 de Enero (Martes) ===
	{
		date: "2026-01-27",
		hour: 10,
		title: "Sesión Individual",
		athletes: ["Lara Espinosa"],
		coach: "NP",
	},
	{
		date: "2026-01-27",
		hour: 15,
		title: "Sesión Grupal",
		athletes: ["Helena Minckas"],
		coach: "RS",
	},
	{
		date: "2026-01-27",
		hour: 17,
		title: "Sesión Individual",
		athletes: ["Clara Hagelstrom"],
		coach: "RS",
	},
	{
		date: "2026-01-27",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Manuel Contreras"],
		coach: "RS",
	},
	{
		date: "2026-01-27",
		hour: 18,
		minute: 30,
		title: "Sesión Individual",
		athletes: ["Matilda Antunez"],
		coach: "RS",
	},
	{
		date: "2026-01-27",
		hour: 19,
		title: "Sesión Individual",
		athletes: ["Joaquina Vital Fassi"],
		coach: "SM",
	},
	{
		date: "2026-01-27",
		hour: 20,
		title: "Sesión Individual",
		athletes: ["Felicitas Camporro"],
		coach: "SM",
	},

	// === 28 de Enero (Miércoles) ===
	{
		date: "2026-01-28",
		hour: 9,
		title: "Sesión Individual",
		athletes: ["Maia Dinardo"],
		coach: "NP",
	},
	{
		date: "2026-01-28",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		coach: "NP",
		isGroup: true,
		groupName: GROUP_PRETEMPORADA_NAME,
		description: "Sesión de pretemporada grupal",
	},
	{
		date: "2026-01-28",
		hour: 11,
		title: "Sesión Grupal",
		athletes: ["Guillermina Montoya"],
		coach: "NP",
	},
	{
		date: "2026-01-28",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Augusto Szafowal"],
		coach: "NP",
	},
	{
		date: "2026-01-28",
		hour: 14,
		title: "Sesión Individual",
		athletes: ["Francesca Purificato"],
		coach: "NP",
	},
	{
		date: "2026-01-28",
		hour: 18,
		title: "Arrastrada",
		athletes: [],
		coach: "TS",
		description: "Sesión de técnica de arrastre",
	},
	{
		date: "2026-01-28",
		hour: 19,
		title: "Sesión Individual",
		athletes: ["Margarita Caballero Basconnet"],
		coach: "RS",
	},

	// === 29 de Enero (Jueves) ===
	{
		date: "2026-01-29",
		hour: 10,
		title: "Sesión Individual",
		athletes: ["Sofia Aiupe"],
		coach: "NP",
	},
	{
		date: "2026-01-29",
		hour: 11,
		title: "Sesión Individual",
		athletes: ["Mia Eisenberg"],
		coach: "NP",
	},
	{
		date: "2026-01-29",
		hour: 15,
		title: "Sesión Grupal",
		athletes: ["Helena Minckas"],
		coach: "RS",
	},
	{
		date: "2026-01-29",
		hour: 16,
		title: "Sesión Individual",
		athletes: ["Felicitas Rusconi"],
		coach: "RS",
	},
	{
		date: "2026-01-29",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Clara Hagelstrom"],
		coach: "RS",
	},
	{
		date: "2026-01-29",
		hour: 19,
		title: "Sesión Individual",
		athletes: ["Joaquina Vital Fassi"],
		coach: "SM",
	},

	// === 30 de Enero (Viernes) ===
	{
		date: "2026-01-30",
		hour: 9,
		title: "Sesión Individual",
		athletes: ["Maia Dinardo"],
		coach: "NP",
	},
	{
		date: "2026-01-30",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		coach: "NP",
		isGroup: true,
		groupName: GROUP_PRETEMPORADA_NAME,
		description: "Sesión de pretemporada grupal",
	},
	{
		date: "2026-01-30",
		hour: 11,
		title: "Sesión Individual",
		athletes: ["Lara Espinosa"],
		coach: "NP",
	},
	{
		date: "2026-01-30",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Francesca Purificato"],
		coach: "NP",
	},
	{
		date: "2026-01-30",
		hour: 14,
		title: "Sesión Individual",
		athletes: ["Victoria Ianelli"],
		coach: "SM",
	},
	{
		date: "2026-01-30",
		hour: 15,
		title: "Sesión Grupal",
		athletes: ["Helena Minckas"],
		coach: "RS",
	},
];

/**
 * Seed training sessions from calendar data
 */
export async function seedRealLifeSessions(): Promise<void> {
	const db = getDb();

	const sessionSpinner = p.spinner();
	sessionSpinner.start(
		`Creating ${CALENDAR_SESSIONS.length} training sessions from calendar...`,
	);

	// Lookup location ID by name (more resilient than hardcoded IDs)
	const location = await db.query.locationTable.findFirst({
		where: and(
			eq(schema.locationTable.organizationId, REAL_LIFE_ORG_ID),
			eq(schema.locationTable.name, LOCATION_CAMPO_VERDE_NAME),
		),
	});
	const locationId = location?.id ?? null;

	// Lookup group IDs by name (more resilient than hardcoded IDs)
	const groupIdCache: Record<string, string | null> = {};
	async function getGroupId(
		groupName: string | undefined,
	): Promise<string | null> {
		if (!groupName) return null;
		if (groupName in groupIdCache) return groupIdCache[groupName] ?? null;

		const group = await db.query.athleteGroupTable.findFirst({
			where: and(
				eq(schema.athleteGroupTable.organizationId, REAL_LIFE_ORG_ID),
				eq(schema.athleteGroupTable.name, groupName),
			),
		});
		groupIdCache[groupName] = group?.id ?? null;
		return groupIdCache[groupName] ?? null;
	}

	let sessionsCreated = 0;
	let athleteAssignmentsCreated = 0;
	let coachAssignmentsCreated = 0;
	let sessionIndex = 0;
	let athleteAssignmentIndex = 0;
	let coachAssignmentIndex = 0;

	for (const sessionData of CALENDAR_SESSIONS) {
		sessionIndex++;
		const sessionId = sessionUUID(sessionIndex);

		// Parse date and time
		const [year, month, day] = sessionData.date.split("-").map(Number);
		if (!year || !month || !day) continue;

		const startTime = new Date(
			year,
			month - 1,
			day,
			sessionData.hour,
			sessionData.minute || 0,
			0,
		);
		const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour sessions

		// Check if session already exists by startTime + org (more resilient than ID)
		const existingSession = await db.query.trainingSessionTable.findFirst({
			where: and(
				eq(schema.trainingSessionTable.organizationId, REAL_LIFE_ORG_ID),
				eq(schema.trainingSessionTable.startTime, startTime),
				eq(schema.trainingSessionTable.title, sessionData.title),
			),
		});

		if (existingSession) {
			continue;
		}

		// Lookup group ID if this is a group session
		const athleteGroupId = sessionData.isGroup
			? await getGroupId(sessionData.groupName)
			: null;

		// Create session
		await db
			.insert(schema.trainingSessionTable)
			.values({
				id: sessionId,
				organizationId: REAL_LIFE_ORG_ID,
				title: sessionData.title,
				description:
					sessionData.description || `Sesión de entrenamiento con coach`,
				startTime,
				endTime,
				status: "pending",
				locationId,
				athleteGroupId,
			})
			.onConflictDoNothing();

		sessionsCreated++;

		// Assign coach
		coachAssignmentIndex++;
		const coachId = COACH_IDS[sessionData.coach];
		if (coachId) {
			await db
				.insert(schema.trainingSessionCoachTable)
				.values({
					id: sessionCoachUUID(coachAssignmentIndex),
					sessionId,
					coachId,
					isPrimary: true,
				})
				.onConflictDoNothing();
			coachAssignmentsCreated++;
		}

		// Assign athletes (if not a group session or if specific athletes mentioned)
		for (const athleteName of sessionData.athletes) {
			const athleteIndex = findAthleteIndex(athleteName);
			if (athleteIndex >= 0) {
				athleteAssignmentIndex++;
				const athleteId = getAthleteId(athleteIndex);

				await db
					.insert(schema.trainingSessionAthleteTable)
					.values({
						id: sessionAthleteUUID(athleteAssignmentIndex),
						sessionId,
						athleteId,
					})
					.onConflictDoNothing();
				athleteAssignmentsCreated++;
			}
		}
	}

	sessionSpinner.stop(
		sessionsCreated > 0
			? `Created ${sessionsCreated} sessions, ${coachAssignmentsCreated} coach assignments, ${athleteAssignmentsCreated} athlete assignments`
			: "Sessions already exist",
	);
}
