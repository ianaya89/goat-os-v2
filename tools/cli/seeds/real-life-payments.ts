import * as p from "@clack/prompts";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import { REAL_LIFE_ATHLETES } from "./real-life-athletes";

// Organization ID from real-life seed
const REAL_LIFE_ORG_ID = "20000000-0000-4000-8000-000000000001";

// Payment UUID prefix (50xxxxxx to avoid conflicts with other entities)
const PAYMENT_UUID_PREFIX = "50000000-0000-4000-8000";

function paymentUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${PAYMENT_UUID_PREFIX}-${indexHex}`;
}

// Athlete UUID prefix (matches real-life.ts)
const ATHLETE_UUID_PREFIX = "30000000-0000-4000-8000";

function getAthleteId(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${ATHLETE_UUID_PREFIX}-${indexHex}`;
}

// Session UUID prefix (matches real-life-sessions.ts)
const SESSION_UUID_PREFIX = "40000000-0000-4000-8000";

function sessionUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${SESSION_UUID_PREFIX}-${indexHex}`;
}

// Find athlete index by name (normalized search)
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

		// Partial match
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

type PaymentMethod = "cash" | "bank_transfer";

interface HockeyPaymentData {
	date: string; // YYYY-MM-DD
	athleteNames: string[]; // Athletes involved in the payment
	amount: number; // Amount in pesos (will be converted to centavos)
	method: PaymentMethod;
	notes?: string;
	sessionHour?: number; // Optional: specific session hour to match
}

// Convert payment method from Spanish
function _parseMethod(methodStr: string): PaymentMethod {
	const normalized = methodStr.toLowerCase().trim();
	if (normalized === "efectivo") return "cash";
	if (normalized === "transferencia") return "bank_transfer";
	return "cash"; // Default
}

// Real Hockey Personalizado payments from January 2026
const HOCKEY_PAYMENTS: HockeyPaymentData[] = [
	// === VIERNES 2 ENERO ===
	{
		date: "2026-01-02",
		athleteNames: ["Lara Espinosa"],
		amount: 40000,
		method: "cash",
		sessionHour: 10,
	},
	{
		date: "2026-01-02",
		athleteNames: ["Helena Minckas"],
		amount: 20000,
		method: "bank_transfer",
		sessionHour: 14,
	},
	{
		date: "2026-01-02",
		athleteNames: ["Helena Minckas"],
		amount: 20000,
		method: "cash",
		sessionHour: 14,
	},
	{
		date: "2026-01-02",
		athleteNames: ["Helena Minckas"],
		amount: 20000,
		method: "cash",
		sessionHour: 14,
	},
	{
		date: "2026-01-02",
		athleteNames: ["Chiara Pezzarini"],
		amount: 40000,
		method: "bank_transfer",
		notes: "Sin sesión registrada este día",
	},
	{
		date: "2026-01-02",
		athleteNames: ["Justina Alvarez"],
		amount: 40000,
		method: "bank_transfer",
		sessionHour: 12,
	},
	{
		date: "2026-01-02",
		athleteNames: ["Maia Dinardo", "Josefina Dinardo"],
		amount: 117000,
		method: "bank_transfer",
		sessionHour: 9,
	},

	// === LUNES 5 ENERO ===
	{
		date: "2026-01-05",
		athleteNames: ["Guillermina Montoya"],
		amount: 50000,
		method: "cash",
		sessionHour: 11,
		notes: "Fran y Guille Montoya",
	},
	{
		date: "2026-01-05",
		athleteNames: ["Trinidad Francica"],
		amount: 75000,
		method: "bank_transfer",
		sessionHour: 18,
		notes: "Clase del 5/1 y 8/1",
	},
	{
		date: "2026-01-05",
		athleteNames: ["Octavio", "Francisco Knopoff"],
		amount: 50000,
		method: "bank_transfer",
		sessionHour: 17,
	},
	{
		date: "2026-01-05",
		athleteNames: ["Juana Sanchez Azagra", "Maria Sanchez Azagra"],
		amount: 50000,
		method: "cash",
		sessionHour: 19,
	},
	{
		date: "2026-01-05",
		athleteNames: ["Chiara Pezzarini"],
		amount: 40000,
		method: "bank_transfer",
		notes: "Sin sesión registrada",
	},
	{
		date: "2026-01-05",
		athleteNames: ["Andrea Dallaglio"],
		amount: 47000,
		method: "bank_transfer",
		sessionHour: 20,
	},

	// === MARTES 6 ENERO ===
	{
		date: "2026-01-06",
		athleteNames: ["Lara Espinosa"],
		amount: 40000,
		method: "cash",
		sessionHour: 10,
		notes: "Clase 6/1",
	},
	{
		date: "2026-01-06",
		athleteNames: ["Sofia Villareal"],
		amount: 200000,
		method: "cash",
		sessionHour: 12,
	},
	{
		date: "2026-01-06",
		athleteNames: ["Matilda Antunez"],
		amount: 40000,
		method: "bank_transfer",
		sessionHour: 13,
	},
	{
		date: "2026-01-06",
		athleteNames: ["Felicitas Rusconi"],
		amount: 40000,
		method: "cash",
		sessionHour: 16,
	},
	{
		date: "2026-01-06",
		athleteNames: ["Helena Minckas"],
		amount: 20000,
		method: "cash",
		sessionHour: 15,
	},
	{
		date: "2026-01-06",
		athleteNames: ["Helena Minckas"],
		amount: 20000,
		method: "bank_transfer",
		sessionHour: 15,
	},
	{
		date: "2026-01-06",
		athleteNames: ["Helena Minckas"],
		amount: 20000,
		method: "cash",
		sessionHour: 15,
	},
	{
		date: "2026-01-06",
		athleteNames: ["Joaquina Etchepare", "Antonia Etchepare"],
		amount: 75000,
		method: "cash",
		sessionHour: 17,
	},
	{
		date: "2026-01-06",
		athleteNames: ["Justina Stroeder"],
		amount: 20000,
		method: "cash",
		sessionHour: 19,
		notes: "Grupo Sub 10",
	},
	{
		date: "2026-01-06",
		athleteNames: ["Theo Bergeonneau"],
		amount: 120000,
		method: "cash",
		sessionHour: 20,
		notes: "3 clases",
	},
	{
		date: "2026-01-06",
		athleteNames: ["Uma Pereyna Aquerman"],
		amount: 20000,
		method: "bank_transfer",
		sessionHour: 19,
		notes: "Grupo Sub 10 - Uma Preyra",
	},

	// === MIÉRCOLES 7 ENERO ===
	{
		date: "2026-01-07",
		athleteNames: ["Guillermina Montoya"],
		amount: 50000,
		method: "bank_transfer",
		sessionHour: 11,
		notes: "Fran y Guille Montoya",
	},
	{
		date: "2026-01-07",
		athleteNames: ["Kiara Greco"],
		amount: 80000,
		method: "bank_transfer",
		sessionHour: 12,
	},
	{
		date: "2026-01-07",
		athleteNames: ["Margarita Caballero Basconnet"],
		amount: 40000,
		method: "cash",
		sessionHour: 19,
	},
	{
		date: "2026-01-07",
		athleteNames: ["Clara Hagelstrom"],
		amount: 40000,
		method: "bank_transfer",
		sessionHour: 20,
	},

	// === JUEVES 8 ENERO ===
	{
		date: "2026-01-08",
		athleteNames: ["Matilda Canepa", "Olivia Canepa"],
		amount: 50000,
		method: "bank_transfer",
		sessionHour: 10,
		notes: "2 clases",
	},
	{
		date: "2026-01-08",
		athleteNames: ["Joaquina Etchepare", "Antonia Etchepare"],
		amount: 20000,
		method: "cash",
		sessionHour: 12,
		notes: "Clase 8/1",
	},
	{
		date: "2026-01-08",
		athleteNames: ["Joaquina Etchepare", "Antonia Etchepare"],
		amount: 30000,
		method: "bank_transfer",
		sessionHour: 12,
		notes: "Clase 8/1",
	},
	{
		date: "2026-01-08",
		athleteNames: ["Felicitas Rusconi"],
		amount: 40000,
		method: "cash",
		sessionHour: 16,
	},
	{
		date: "2026-01-08",
		athleteNames: ["Helena Minckas"],
		amount: 50000,
		method: "cash",
		sessionHour: 15,
	},
	{
		date: "2026-01-08",
		athleteNames: ["Ludmila Comandu"],
		amount: 40000,
		method: "bank_transfer",
		sessionHour: 17,
	},

	// === VIERNES 9 ENERO ===
	{
		date: "2026-01-09",
		athleteNames: ["Francisca Rodriguez Morcillo"],
		amount: 25000,
		method: "cash",
		notes: "Pretem 9/1",
	},
	{
		date: "2026-01-09",
		athleteNames: ["Augusto Szafowal"],
		amount: 40000,
		method: "cash",
		sessionHour: 12,
	},
	{
		date: "2026-01-09",
		athleteNames: ["Valentina Diaz Tobares"],
		amount: 75000,
		method: "cash",
		sessionHour: 14,
		notes: "3 clases 9 16 23",
	},
	{
		date: "2026-01-09",
		athleteNames: ["Victoria Ianelli"],
		amount: 75000,
		method: "bank_transfer",
		sessionHour: 14,
		notes: "3 clases 9 16 23",
	},
	{
		date: "2026-01-09",
		athleteNames: ["Catalina Perlini"],
		amount: 25000,
		method: "cash",
		sessionHour: 15,
	},
	{
		date: "2026-01-09",
		athleteNames: ["Justina Alvarez"],
		amount: 40000,
		method: "bank_transfer",
		sessionHour: 13,
	},
	{
		date: "2026-01-09",
		athleteNames: ["Renata D'Onofrio"],
		amount: 25000,
		method: "cash",
		sessionHour: 16,
	},
	{
		date: "2026-01-09",
		athleteNames: ["Maria Emilia Mendez Picone"],
		amount: 40000,
		method: "bank_transfer",
		sessionHour: 17,
	},

	// === LUNES 12 ENERO ===
	{
		date: "2026-01-12",
		athleteNames: ["Josefina Escurra"],
		amount: 30000,
		method: "cash",
		notes: "12/1",
	},
	{
		date: "2026-01-12",
		athleteNames: ["Guillermina Montoya"],
		amount: 50000,
		method: "bank_transfer",
		sessionHour: 11,
		notes: "Fran y Guille Montoya",
	},
	{
		date: "2026-01-12",
		athleteNames: ["Augusto Szafowal"],
		amount: 40000,
		method: "bank_transfer",
		sessionHour: 14,
	},
	{
		date: "2026-01-12",
		athleteNames: ["Octavio", "Francisco Knopoff"],
		amount: 50000,
		method: "bank_transfer",
		sessionHour: 17,
	},
	{
		date: "2026-01-12",
		athleteNames: ["Francesca Purificato"],
		amount: 288000,
		method: "cash",
		sessionHour: 18,
		notes: "Pago 9 clases",
	},
	{
		date: "2026-01-12",
		athleteNames: ["Juana Sanchez Azagra", "Maria Sanchez Azagra"],
		amount: 50000,
		method: "cash",
		sessionHour: 19,
	},
	{
		date: "2026-01-12",
		athleteNames: ["Andrea Dallaglio"],
		amount: 47000,
		method: "bank_transfer",
		sessionHour: 20,
		notes: "Andrea Dallaglio + 1",
	},
	{
		date: "2026-01-12",
		athleteNames: ["Luz Entre Rios"],
		amount: 20000,
		method: "bank_transfer",
		notes: "Sub 10",
	},
];

// Session index cache (maps date+hour+title to session index)
// This is based on the CALENDAR_SESSIONS array order in real-life-sessions.ts
interface SessionMatch {
	date: string;
	hour: number;
	title: string;
	athletes: string[];
	index: number;
}

// Pre-computed session matches from real-life-sessions.ts CALENDAR_SESSIONS
const SESSION_MATCHES: SessionMatch[] = [
	// === 2 de Enero (Viernes) ===
	{
		date: "2026-01-02",
		hour: 9,
		title: "Sesión Individual",
		athletes: ["Maia Dinardo", "Josefina Escurra"],
		index: 1,
	},
	{
		date: "2026-01-02",
		hour: 10,
		title: "Sesión Individual",
		athletes: ["Lara Espinosa"],
		index: 2,
	},
	{
		date: "2026-01-02",
		hour: 11,
		title: "Sesión Individual",
		athletes: ["Sofia Villareal"],
		index: 3,
	},
	{
		date: "2026-01-02",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Justina Alvarez"],
		index: 4,
	},
	{
		date: "2026-01-02",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Farah Contador"],
		index: 5,
	},
	{
		date: "2026-01-02",
		hour: 14,
		title: "Sesión Grupal",
		athletes: ["Helena Minckas"],
		index: 6,
	},
	{
		date: "2026-01-02",
		hour: 15,
		title: "Sesión Individual",
		athletes: ["Valen Zuccardi"],
		index: 7,
	},

	// === 5 de Enero (Lunes) ===
	{
		date: "2026-01-05",
		hour: 9,
		title: "Sesión Individual",
		athletes: ["Josefina Dinardo"],
		index: 8,
	},
	{
		date: "2026-01-05",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		index: 9,
	},
	{
		date: "2026-01-05",
		hour: 11,
		title: "Sesión Grupal",
		athletes: ["Guillermina Montoya"],
		index: 10,
	},
	{
		date: "2026-01-05",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Rosario Leone"],
		index: 11,
	},
	{
		date: "2026-01-05",
		hour: 17,
		title: "Sesión Grupal",
		athletes: ["Octavio", "Francisco Knopoff"],
		index: 12,
	},
	{
		date: "2026-01-05",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Trinidad Francica"],
		index: 13,
	},
	{
		date: "2026-01-05",
		hour: 19,
		title: "Sesión Grupal",
		athletes: ["Juana Sanchez Azagra", "Maria Sanchez Azagra"],
		index: 14,
	},
	{
		date: "2026-01-05",
		hour: 20,
		title: "Sesión Individual",
		athletes: ["Andrea Dallaglio"],
		index: 15,
	},

	// === 6 de Enero (Martes) ===
	{
		date: "2026-01-06",
		hour: 10,
		title: "Sesión Individual",
		athletes: ["Lara Espinosa"],
		index: 16,
	},
	{
		date: "2026-01-06",
		hour: 11,
		title: "Sesión Grupal",
		athletes: ["Olivia Canepa", "Matilda Canepa"],
		index: 17,
	},
	{
		date: "2026-01-06",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Sofia Villareal"],
		index: 18,
	},
	{
		date: "2026-01-06",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Matilda Antunez"],
		index: 19,
	},
	{
		date: "2026-01-06",
		hour: 15,
		title: "Sesión Grupal",
		athletes: ["Helena Minckas"],
		index: 20,
	},
	{
		date: "2026-01-06",
		hour: 16,
		title: "Sesión Individual",
		athletes: ["Felicitas Rusconi"],
		index: 21,
	},
	{
		date: "2026-01-06",
		hour: 17,
		title: "Sesión Grupal",
		athletes: ["Joaquina Etchepare", "Antonia Etchepare"],
		index: 22,
	},
	{
		date: "2026-01-06",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Manuel Contreras"],
		index: 23,
	},
	{
		date: "2026-01-06",
		hour: 19,
		title: "Grupo Sub 10",
		athletes: [],
		index: 24,
	},
	{
		date: "2026-01-06",
		hour: 20,
		title: "Sesión Individual",
		athletes: ["Theo Bergeonneau"],
		index: 25,
	},

	// === 7 de Enero (Miércoles) ===
	{
		date: "2026-01-07",
		hour: 9,
		title: "Sesión Individual",
		athletes: ["Josefina Dinardo"],
		index: 26,
	},
	{
		date: "2026-01-07",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		index: 27,
	},
	{
		date: "2026-01-07",
		hour: 11,
		title: "Sesión Grupal",
		athletes: ["Guillermina Montoya"],
		index: 28,
	},
	{
		date: "2026-01-07",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Kiara Greco"],
		index: 29,
	},
	{
		date: "2026-01-07",
		hour: 18,
		title: "Arrastrada",
		athletes: [],
		index: 30,
	},
	{
		date: "2026-01-07",
		hour: 19,
		title: "Sesión Individual",
		athletes: ["Margarita Caballero Basconnet"],
		index: 31,
	},
	{
		date: "2026-01-07",
		hour: 20,
		title: "Sesión Individual",
		athletes: ["Clara Hagelstrom"],
		index: 32,
	},

	// === 8 de Enero (Jueves) ===
	{
		date: "2026-01-08",
		hour: 9,
		title: "Sesión Grupal",
		athletes: ["Benicio", "Pedro Astete"],
		index: 33,
	},
	{
		date: "2026-01-08",
		hour: 10,
		title: "Sesión Grupal",
		athletes: ["Olivia Canepa", "Matilda Canepa"],
		index: 34,
	},
	{
		date: "2026-01-08",
		hour: 11,
		title: "Sesión Individual",
		athletes: ["Sofia Villareal"],
		index: 35,
	},
	{
		date: "2026-01-08",
		hour: 12,
		title: "Sesión Grupal",
		athletes: ["Joaquina Etchepare", "Antonia Etchepare"],
		index: 36,
	},
	{
		date: "2026-01-08",
		hour: 15,
		title: "Sesión Grupal",
		athletes: ["Helena Minckas"],
		index: 37,
	},
	{
		date: "2026-01-08",
		hour: 16,
		title: "Sesión Individual",
		athletes: ["Felicitas Rusconi"],
		index: 38,
	},
	{
		date: "2026-01-08",
		hour: 17,
		title: "Sesión Individual",
		athletes: ["Ludmila Comandu"],
		index: 39,
	},
	{
		date: "2026-01-08",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Trinidad Francica"],
		index: 40,
	},

	// === 9 de Enero (Viernes) ===
	{
		date: "2026-01-09",
		hour: 9,
		title: "Sesión Individual",
		athletes: ["Josefina Dinardo"],
		index: 41,
	},
	{
		date: "2026-01-09",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		index: 42,
	},
	{
		date: "2026-01-09",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Augusto Szafowal"],
		index: 43,
	},
	{
		date: "2026-01-09",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Justina Alvarez"],
		index: 44,
	},
	{
		date: "2026-01-09",
		hour: 14,
		title: "Sesión Grupal",
		athletes: ["Victoria Ianelli", "Valentina Diaz Tobares"],
		index: 45,
	},
	{
		date: "2026-01-09",
		hour: 15,
		title: "Sesión Individual",
		athletes: ["Catalina Perlini"],
		index: 46,
	},
	{
		date: "2026-01-09",
		hour: 16,
		title: "Sesión Individual",
		athletes: ["Renata D'Onofrio"],
		index: 47,
	},
	{
		date: "2026-01-09",
		hour: 17,
		title: "Sesión Individual",
		athletes: ["Maria Emilia Mendez Picone"],
		index: 48,
	},

	// === 12 de Enero (Lunes) ===
	{
		date: "2026-01-12",
		hour: 9,
		title: "Sesión Individual",
		athletes: ["Josefina Dinardo"],
		index: 49,
	},
	{
		date: "2026-01-12",
		hour: 10,
		title: "Pretemporada",
		athletes: [],
		index: 50,
	},
	{
		date: "2026-01-12",
		hour: 11,
		title: "Sesión Grupal",
		athletes: ["Guillermina Montoya"],
		index: 51,
	},
	{
		date: "2026-01-12",
		hour: 12,
		title: "Sesión Individual",
		athletes: ["Sofia Villareal"],
		index: 52,
	},
	{
		date: "2026-01-12",
		hour: 13,
		title: "Sesión Individual",
		athletes: ["Rosario Leone"],
		index: 53,
	},
	{
		date: "2026-01-12",
		hour: 14,
		title: "Sesión Individual",
		athletes: ["Augusto Szafowal"],
		index: 54,
	},
	{
		date: "2026-01-12",
		hour: 17,
		title: "Sesión Grupal",
		athletes: ["Octavio", "Francisco Knopoff"],
		index: 55,
	},
	{
		date: "2026-01-12",
		hour: 18,
		title: "Sesión Individual",
		athletes: ["Francesca Purificato"],
		index: 56,
	},
	{
		date: "2026-01-12",
		hour: 19,
		title: "Sesión Grupal",
		athletes: ["Juana Sanchez Azagra", "Maria Sanchez Azagra"],
		index: 57,
	},
	{
		date: "2026-01-12",
		hour: 20,
		title: "Sesión Individual",
		athletes: ["Andrea Dallaglio"],
		index: 58,
	},
];

// Find session index by date, hour, and athlete name
function findSessionIndex(
	date: string,
	hour: number | undefined,
	_athleteNames: string[],
): number | null {
	if (!hour) return null;

	// Find session that matches date and hour
	const matchingSession = SESSION_MATCHES.find(
		(s) => s.date === date && s.hour === hour,
	);

	if (matchingSession) {
		return matchingSession.index;
	}

	return null;
}

/**
 * Seed real-life hockey personalizado payments from January 2026
 */
export async function seedRealLifePayments(): Promise<void> {
	const db = getDb();

	const paymentSpinner = p.spinner();
	paymentSpinner.start(
		`Creating ${HOCKEY_PAYMENTS.length} hockey personalizado payments...`,
	);

	let paymentsCreated = 0;
	let paymentIndex = 0;

	for (const paymentData of HOCKEY_PAYMENTS) {
		paymentIndex++;
		const paymentId = paymentUUID(paymentIndex);

		// Parse date for payment
		const [year, month, day] = paymentData.date.split("-").map(Number);
		if (!year || !month || !day) continue;

		const paymentDate = new Date(year, month - 1, day, 12, 0, 0);

		// Find session ID if we have an hour
		let sessionId: string | null = null;
		const sessionIndex = findSessionIndex(
			paymentData.date,
			paymentData.sessionHour,
			paymentData.athleteNames,
		);
		if (sessionIndex) {
			sessionId = sessionUUID(sessionIndex);
		}

		// Find athlete ID (use first athlete for payment record)
		let athleteId: string | null = null;
		if (paymentData.athleteNames.length > 0) {
			const firstAthleteName = paymentData.athleteNames[0];
			if (firstAthleteName) {
				const athleteIndex = findAthleteIndex(firstAthleteName);
				if (athleteIndex >= 0) {
					athleteId = getAthleteId(athleteIndex + 1);
				}
			}
		}

		// Convert amount to centavos (smallest currency unit)
		const amountInCentavos = paymentData.amount * 100;

		// Build description
		let description = "Hockey Personalizado";
		if (paymentData.athleteNames.length > 1) {
			description += ` - ${paymentData.athleteNames.join(", ")}`;
		} else if (paymentData.athleteNames.length === 1) {
			description += ` - ${paymentData.athleteNames[0]}`;
		}
		if (paymentData.notes) {
			description += ` (${paymentData.notes})`;
		}

		// Check if payment already exists
		const existingPayment = await db.query.trainingPaymentTable.findFirst({
			where: and(
				eq(schema.trainingPaymentTable.id, paymentId),
				eq(schema.trainingPaymentTable.organizationId, REAL_LIFE_ORG_ID),
			),
		});

		if (existingPayment) {
			continue;
		}

		// Create payment
		await db
			.insert(schema.trainingPaymentTable)
			.values({
				id: paymentId,
				organizationId: REAL_LIFE_ORG_ID,
				sessionId,
				athleteId,
				amount: amountInCentavos,
				currency: "ARS",
				status: "paid",
				paymentMethod: paymentData.method,
				paidAmount: amountInCentavos,
				paymentDate,
				description,
				notes: paymentData.notes || null,
			})
			.onConflictDoNothing();

		paymentsCreated++;
	}

	paymentSpinner.stop(
		paymentsCreated > 0
			? `Created ${paymentsCreated} hockey personalizado payments`
			: "Payments already exist",
	);
}
