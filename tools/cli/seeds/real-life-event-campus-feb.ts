import * as p from "@clack/prompts";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import { REAL_LIFE_ATHLETES } from "./real-life-athletes";

// Organization ID from real-life seed
const REAL_LIFE_ORG_ID = "20000000-0000-4000-8000-000000000001";

// Event ID (defined in real-life.ts)
const EVENT_CAMPUS_VERANO_FEB_ID = "20000000-0000-4000-8000-000000000121";

// UUID prefixes (avoid conflicts with existing 20/30/31/32/33/40/41/42/50 prefixes)
const REGISTRATION_UUID_PREFIX = "60000000-0000-4000-8000";
const EVENT_PAYMENT_UUID_PREFIX = "61000000-0000-4000-8000";
const NEW_ATHLETE_UUID_PREFIX = "34000000-0000-4000-8000";
const NEW_USER_UUID_PREFIX = "35000000-0000-4000-8000";
const NEW_MEMBER_UUID_PREFIX = "36000000-0000-4000-8000";
const NEW_ACCOUNT_UUID_PREFIX = "37000000-0000-4000-8000";

// Pricing tier and discounts
const PRICING_TIER_ID = "62000000-0000-4000-8000-000000000001";
const DISCOUNT_MEMBER_ID = "63000000-0000-4000-8000-000000000001";
const DISCOUNT_SIBLINGS_ID = "63000000-0000-4000-8000-000000000002";
const DISCOUNT_SIBLINGS_MEMBER_ID = "63000000-0000-4000-8000-000000000003";
const DISCOUNT_GROUP_ID = "63000000-0000-4000-8000-000000000004";

// Existing athlete prefixes (matches real-life.ts)
const ATHLETE_UUID_PREFIX = "30000000-0000-4000-8000";
const ATHLETE_USER_UUID_PREFIX = "31000000-0000-4000-8000";

// Athlete password for new athletes
const ATHLETE_PASSWORD = "Goat2025";

// UUID generators
function registrationUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${REGISTRATION_UUID_PREFIX}-${indexHex}`;
}

function eventPaymentUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${EVENT_PAYMENT_UUID_PREFIX}-${indexHex}`;
}

function newAthleteUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${NEW_ATHLETE_UUID_PREFIX}-${indexHex}`;
}

function newUserUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${NEW_USER_UUID_PREFIX}-${indexHex}`;
}

function newMemberUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${NEW_MEMBER_UUID_PREFIX}-${indexHex}`;
}

function newAccountUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${NEW_ACCOUNT_UUID_PREFIX}-${indexHex}`;
}

function existingAthleteUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${ATHLETE_UUID_PREFIX}-${indexHex}`;
}

function existingAthleteUserUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${ATHLETE_USER_UUID_PREFIX}-${indexHex}`;
}

// Generate email from athlete name (matches real-life.ts)
function generateAthleteEmail(
	firstName: string,
	lastName: string,
	index: number,
): string {
	const normalizedFirst = firstName
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z]/g, "");
	const normalizedLast = lastName
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z]/g, "");

	if (normalizedLast) {
		return `${normalizedFirst}.${normalizedLast}@goat-academy.local`;
	}
	return `${normalizedFirst}${index}@goat-academy.local`;
}

// Find athlete index by name (normalized search) - same pattern as real-life-payments.ts
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

		if (normalizedName === normalizedSearch) {
			return i;
		}

		if (normalizedName.includes(normalizedSearch)) {
			return i;
		}
	}

	return -1;
}

type PaymentMethod = "cash" | "bank_transfer";
type DiscountType =
	| "none"
	| "member"
	| "siblings"
	| "siblings_member"
	| "group";

interface CampusFebRegistrant {
	firstName: string;
	lastName: string;
	birthYear: number;
	email: string;
	phone: string;
	parentName: string;
	position: string;
	club: string;
	group: "grupo1" | "grupo2";
	price: number; // Final price in pesos
	paymentMethod: PaymentMethod;
	discountType: DiscountType;
	paidAmount?: number; // Defaults to price if not set
	paidCash?: number; // For split payments
	paidTransfer?: number; // For split payments
	notes?: string;
	/** Name to match against REAL_LIFE_ATHLETES (if different from firstName+lastName) */
	existingAthleteName?: string;
	registrationDate: Date;
}

// 85 registrants from CSV (rows 2-86)
const REGISTRANTS: CampusFebRegistrant[] = [
	{
		firstName: "Lucia",
		lastName: "Rivas",
		birthYear: 2016,
		email: "regulojose1986@gmail.com",
		phone: "1140583033",
		parentName: "Régulo Rivas",
		position: "volante",
		club: "Arquitectura",
		group: "grupo1",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "member",
		registrationDate: new Date(2026, 0, 14),
	},
	{
		firstName: "Ludmila",
		lastName: "Comandú Badgen",
		birthYear: 2014,
		email: "pamelabadgen@gmail.com",
		phone: "+541566874933",
		parentName: "Pamela Badgen",
		position: "defensor",
		club: "Ferrocarril Oeste",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "member",
		existingAthleteName: "Ludmila Comandu",
		registrationDate: new Date(2026, 0, 16),
	},
	{
		firstName: "Paloma",
		lastName: "Rodriguez",
		birthYear: 2009,
		email: "lautirodriguez14@gmail.com",
		phone: "+5492901606011",
		parentName: "Andrea Hernandez",
		position: "volante",
		club: "Club colegio del sur",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 18),
	},
	{
		firstName: "Maia",
		lastName: "Luoni",
		birthYear: 2012,
		email: "pzelwianski@gmail.com",
		phone: "+541151776240",
		parentName: "Paula Zelwianski",
		position: "delantero",
		club: "Club Ferrocarril Oeste",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 18),
	},
	{
		firstName: "Guadalupe",
		lastName: "Arroyo",
		birthYear: 2015,
		email: "roxanaarzuagaok@gmail.com",
		phone: "2216376138",
		parentName: "Roxana Arzuaga",
		position: "delantero",
		club: "",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 19),
	},
	{
		firstName: "Emma",
		lastName: "Bavio",
		birthYear: 2015,
		email: "pedrobavio@gmail.com",
		phone: "2915711580",
		parentName: "Pedro Ignacio Bavio",
		position: "volante",
		club: "GEBA",
		group: "grupo1",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "group",
		registrationDate: new Date(2026, 0, 19),
	},
	{
		firstName: "Martina",
		lastName: "De Oto",
		birthYear: 2010,
		email: "flagianlu@hotmail.com",
		phone: "1169603775",
		parentName: "Flavia Ledesma",
		position: "delantero",
		club: "Club Mitre",
		group: "grupo2",
		price: 100000,
		paymentMethod: "bank_transfer",
		discountType: "member",
		existingAthleteName: "Martina de Otto",
		notes: "50% off!",
		registrationDate: new Date(2026, 0, 20),
	},
	{
		firstName: "Isabela",
		lastName: "Koutoudjian",
		birthYear: 2017,
		email: "anapaulabragulat@gmail.com",
		phone: "1553889577",
		parentName: "Ana Paula Bragulat",
		position: "delantero",
		club: "Liceo Naval",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 21),
	},
	{
		firstName: "Francisca",
		lastName: "Nores",
		birthYear: 2012,
		email: "carolina@soychef.com",
		phone: "1159717555",
		parentName: "Carolina Palacios",
		position: "delantero",
		club: "Liceo Naval",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 22),
	},
	{
		firstName: "Emilia",
		lastName: "Bruno",
		birthYear: 2012,
		email: "noguera_lorena@hotmail.com",
		phone: "+5491158086550",
		parentName: "María Lorena Noguera",
		position: "volante",
		club: "Liceo Naval",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 22),
	},
	{
		firstName: "Maria Juana",
		lastName: "Giménez Gundín",
		birthYear: 2015,
		email: "nangundin@hotmail.com",
		phone: "54 11 41886382",
		parentName: "Nancy Gundin",
		position: "delantero",
		club: "Banco Provincia",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 22),
	},
	{
		firstName: "Catalina",
		lastName: "Piras",
		birthYear: 2011,
		email: "antoniopiras@yahoo.com",
		phone: "+541151626073",
		parentName: "Antonio Piras",
		position: "delantero",
		club: "San Cirano",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 22),
	},
	{
		firstName: "Catalina",
		lastName: "De Ambrosi",
		birthYear: 2013,
		email: "alonsoiara10@gmail.com",
		phone: "1153119637",
		parentName: "Iara Alonso",
		position: "defensor",
		club: "GEBA",
		group: "grupo2",
		price: 200000,
		paymentMethod: "cash",
		discountType: "none",
		registrationDate: new Date(2026, 0, 23),
	},
	{
		firstName: "Lara",
		lastName: "Sanguinetti",
		birthYear: 2010,
		email: "laruchisanguinetti@gmail.com",
		phone: "+54 9 11 5022-5682",
		parentName: "Matías Sanguinetti",
		position: "delantero",
		club: "Ferrocarril Mitre",
		group: "grupo2",
		price: 180000,
		paymentMethod: "cash",
		discountType: "member",
		existingAthleteName: "Lara Sanguinetti Serain",
		registrationDate: new Date(2026, 0, 24),
	},
	{
		firstName: "Julieta",
		lastName: "Taillade",
		birthYear: 2016,
		email: "sonia_a83@hotmail.com",
		phone: "1132014932",
		parentName: "Sonia Acosta",
		position: "defensor",
		club: "GEBA",
		group: "grupo1",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "group",
		registrationDate: new Date(2026, 0, 24),
	},
	{
		firstName: "Nala",
		lastName: "Krasny",
		birthYear: 2015,
		email: "nicolas.krasny@gmail.com",
		phone: "5491132834957",
		parentName: "Nicolas Krasny",
		position: "defensor",
		club: "CISSAB",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 25),
	},
	{
		firstName: "Camila",
		lastName: "Raffin Davobe",
		birthYear: 2010,
		email: "DABOVE.CLAUDIA@GMAIL.COM",
		phone: "+54911 40840862",
		parentName: "Claudia Dabove",
		position: "volante",
		club: "Club Banco Ciudad",
		group: "grupo2",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "member",
		existingAthleteName: "Camila Raffin Dabove",
		registrationDate: new Date(2026, 0, 26),
	},
	{
		firstName: "Martina",
		lastName: "Oliveras",
		birthYear: 2012,
		email: "bertotticlara@gmail.com",
		phone: "+5491144736800",
		parentName: "Clara Bertotti",
		position: "delantero",
		club: "GEBA",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		paidAmount: 150000,
		notes: "tenia 30 a favor",
		registrationDate: new Date(2026, 0, 26),
	},
	{
		firstName: "Mayra Sol",
		lastName: "Zubiri",
		birthYear: 2009,
		email: "birimartin@hotmail.com",
		phone: "1169979834",
		parentName: "Martin Zubiri",
		position: "defensor",
		club: "Banco Ciudad",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 27),
	},
	{
		firstName: "Abril",
		lastName: "Ivanoff Rossi",
		birthYear: 2014,
		email: "rossilorenap@hotmail.com",
		phone: "1156546340",
		parentName: "Lorena Rossi",
		position: "volante",
		club: "Mitre",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 27),
	},
	{
		firstName: "Agustina",
		lastName: "Finochietto",
		birthYear: 2009,
		email: "finochietto@gmail.com",
		phone: "+54 9 11 5994-6763",
		parentName: "Enrique Finochietto",
		position: "defensor",
		club: "Olivos Rugby Club",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 27),
	},
	{
		firstName: "Paz",
		lastName: "Amillano Sruoga",
		birthYear: 2013,
		email: "ignacioamillanocuesta@gmail.com",
		phone: "+5491138287437",
		parentName: "Ignacio Amillano Cuesta",
		position: "volante",
		club: "GEBA",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 27),
	},
	{
		firstName: "Emilia",
		lastName: "Uzcudun",
		birthYear: 2013,
		email: "euge_lee@yahoo.com",
		phone: "1158657998",
		parentName: "Eugenia Lee",
		position: "volante",
		club: "Belgrano Athletic Club",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 27),
	},
	{
		firstName: "Juana",
		lastName: "Urrutia",
		birthYear: 2009,
		email: "f.urrutia.arq@gmail.com",
		phone: "+54 1166605666",
		parentName: "Federico Urrutia",
		position: "volante",
		club: "Banco Ciudad",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 27),
	},
	{
		firstName: "Josefina",
		lastName: "Sendon",
		birthYear: 2013,
		email: "silvana@lado-c.com",
		phone: "1144016565",
		parentName: "Silvana Patane",
		position: "defensor",
		club: "Belgrano",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 28),
	},
	{
		firstName: "Felicitas",
		lastName: "Barbuto",
		birthYear: 2015,
		email: "mariavictorialeidner@gmail.com",
		phone: "2215110529",
		parentName: "Victoria Leidner",
		position: "volante",
		club: "GEBA",
		group: "grupo1",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "group",
		registrationDate: new Date(2026, 0, 28),
	},
	{
		firstName: "Helena",
		lastName: "Schön",
		birthYear: 2012,
		email: "argentomercedes@gmail.com",
		phone: "1151497917",
		parentName: "Mercedes Argento",
		position: "volante",
		club: "GEBA",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 0, 29),
	},
	{
		firstName: "Antonia",
		lastName: "Digiovanni",
		birthYear: 2016,
		email: "hhadigiovanni@hotmail.com",
		phone: "1130652680",
		parentName: "Hernan Digiovanni",
		position: "delantero",
		club: "GEBA",
		group: "grupo1",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "siblings",
		registrationDate: new Date(2026, 0, 30),
	},
	{
		firstName: "Allegra",
		lastName: "Digiovanni",
		birthYear: 2018,
		email: "hhadigiovanni@hotmail.com",
		phone: "1130652680",
		parentName: "Hernan Digiovanni",
		position: "defensor",
		club: "GEBA",
		group: "grupo1",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "siblings",
		registrationDate: new Date(2026, 0, 30),
	},
	{
		firstName: "Renata",
		lastName: "Torres",
		birthYear: 2012,
		email: "akuzucca@hotmail.com",
		phone: "1156051245",
		parentName: "Agustina Zucca",
		position: "volante",
		club: "VILO",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		existingAthleteName: "Rena Torres",
		registrationDate: new Date(2026, 0, 30),
	},
	{
		firstName: "Guadalupe",
		lastName: "Berlanga",
		birthYear: 2014,
		email: "javierberlanga1407@icloud.com",
		phone: "1252201919",
		parentName: "Lorena Miguez",
		position: "volante",
		club: "Vilo Hockey",
		group: "grupo1",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "member",
		registrationDate: new Date(2026, 1, 1),
	},
	{
		firstName: "Victoria",
		lastName: "Bono Perera",
		birthYear: 2015,
		email: "laura.pererataricco@gmail.com",
		phone: "1131943075",
		parentName: "Maria Laura Perera Taricco",
		position: "delantero",
		club: "GEBA",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 1),
	},
	{
		firstName: "Miranda",
		lastName: "Caian",
		birthYear: 2013,
		email: "marugraetz@yahoo.com.ar",
		phone: "1144712937",
		parentName: "Marina Graetz",
		position: "defensor",
		club: "GEBA",
		group: "grupo2",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "siblings",
		registrationDate: new Date(2026, 1, 1),
	},
	{
		firstName: "Helena",
		lastName: "Caian",
		birthYear: 2016,
		email: "marugraetz@yahoo.com.ar",
		phone: "1144712937",
		parentName: "Marina Graetz",
		position: "delantero",
		club: "GEBA",
		group: "grupo1",
		price: 0,
		paymentMethod: "bank_transfer",
		discountType: "none",
		paidAmount: 0,
		notes: "BONIFICADA MEJOR DISFRAZ DICIEMBRE",
		registrationDate: new Date(2026, 1, 2),
	},
	{
		firstName: "Juana",
		lastName: "Hernandez Udrizar",
		birthYear: 2010,
		email: "ximenaudrizar@hotmail.com",
		phone: "+5491134941970",
		parentName: "Ximena Laura Udrizar",
		position: "delantero",
		club: "Vilo",
		group: "grupo2",
		price: 0,
		paymentMethod: "bank_transfer",
		discountType: "none",
		paidAmount: 0,
		notes: "BONIFICADA AMIGA POCHO",
		registrationDate: new Date(2026, 1, 2),
	},
	{
		firstName: "Emilia",
		lastName: "De Martino",
		birthYear: 2012,
		email: "andrea.gonzalez@sanofi.com",
		phone: "1141897467",
		parentName: "Andrea Gonzalez",
		position: "defensor",
		club: "GEBA",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 2),
	},
	{
		firstName: "Trinidad",
		lastName: "Olaizola",
		birthYear: 2015,
		email: "me.cautelier@hotmail.com",
		phone: "+541164833302",
		parentName: "Eugenia Cautelier",
		position: "delantero",
		club: "GEBA",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 3),
	},
	{
		firstName: "Lucio",
		lastName: "Sobry",
		birthYear: 2015,
		email: "Sobryfrancis@hotmail.com",
		phone: "91122830648",
		parentName: "Francis Sobry",
		position: "volante",
		club: "GEBA",
		group: "grupo1",
		price: 170000,
		paymentMethod: "bank_transfer",
		discountType: "siblings_member",
		existingAthleteName: "Lucho Sorby",
		registrationDate: new Date(2026, 1, 3),
	},
	{
		firstName: "Pablo",
		lastName: "Sobry",
		birthYear: 2012,
		email: "Sobryfrancis@hotmail.com",
		phone: "91122830648",
		parentName: "Francis Sobry",
		position: "delantero",
		club: "GEBA",
		group: "grupo2",
		price: 170000,
		paymentMethod: "bank_transfer",
		discountType: "siblings_member",
		existingAthleteName: "Pablo Sorby",
		registrationDate: new Date(2026, 1, 3),
	},
	{
		firstName: "Pierina",
		lastName: "Casati",
		birthYear: 2015,
		email: "marcecasati@gmail.com",
		phone: "5491157066620",
		parentName: "Marcela Casati",
		position: "delantero",
		club: "CARP",
		group: "grupo1",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "member",
		registrationDate: new Date(2026, 1, 3),
	},
	{
		firstName: "Jazmín",
		lastName: "Salas",
		birthYear: 2014,
		email: "mechufontan@hotmail.com",
		phone: "1144165200",
		parentName: "Mercedes Rodríguez Fontan",
		position: "volante",
		club: "ORC",
		group: "grupo1",
		price: 170000,
		paymentMethod: "cash",
		discountType: "siblings_member",
		paidAmount: 0,
		existingAthleteName: "Jazmin Salas",
		notes: "Canje Barritas Lecker",
		registrationDate: new Date(2026, 1, 3),
	},
	{
		firstName: "Sofia",
		lastName: "Salas",
		birthYear: 2014,
		email: "mechufontan@hotmail.com",
		phone: "1144165200",
		parentName: "Mercedes Rodríguez Fontan",
		position: "delantero",
		club: "ORC",
		group: "grupo1",
		price: 170000,
		paymentMethod: "cash",
		discountType: "siblings_member",
		paidAmount: 0,
		notes: "Canje Barritas Lecker",
		registrationDate: new Date(2026, 1, 3),
	},
	{
		firstName: "Juana",
		lastName: "Glerean",
		birthYear: 2012,
		email: "eugeceretti@gmail.com",
		phone: "+541140466169",
		parentName: "Eugenia Ceretti",
		position: "volante",
		club: "GEBA",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 4),
	},
	{
		firstName: "Francesca",
		lastName: "Mollo",
		birthYear: 2012,
		email: "lalmiron72@gmail.com",
		phone: "11 5750 3174",
		parentName: "Lorena Almirón",
		position: "volante",
		club: "GEBA",
		group: "grupo2",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "member",
		registrationDate: new Date(2026, 1, 5),
	},
	{
		firstName: "Sofía",
		lastName: "Malatino",
		birthYear: 2014,
		email: "karen_pereira2000@yahoo.com.ar",
		phone: "1158374428",
		parentName: "Karen Pereira",
		position: "defensor",
		club: "Banco Provincia",
		group: "grupo2",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "member",
		existingAthleteName: "Sofia Malatino",
		registrationDate: new Date(2026, 1, 5),
	},
	{
		firstName: "Olivia",
		lastName: "Piris",
		birthYear: 2016,
		email: "hernan_piris@hotmail.com",
		phone: "+541160021074",
		parentName: "Hernan Alfredo Piris",
		position: "defensor",
		club: "GEBA",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 5),
	},
	{
		firstName: "Izaskun",
		lastName: "Quiñones",
		birthYear: 2015,
		email: "indianaquinones@gmail.com",
		phone: "+541164455006",
		parentName: "Indiana Quiñones",
		position: "delantero",
		club: "GEBA",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 5),
	},
	{
		firstName: "Delfina",
		lastName: "Alberto",
		birthYear: 2013,
		email: "alejandroalberto@gmail.com",
		phone: "3413526022",
		parentName: "Alejandro Alberto",
		position: "delantero",
		club: "Jockey",
		group: "grupo2",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "member",
		registrationDate: new Date(2026, 1, 5),
	},
	{
		firstName: "Emilia",
		lastName: "González Serra",
		birthYear: 2015,
		email: "mserra2209@gmail.com",
		phone: "1124777844",
		parentName: "Marcela Serra",
		position: "volante",
		club: "GEBA",
		group: "grupo1",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "member",
		existingAthleteName: "Emilia Gonzalez Serra",
		registrationDate: new Date(2026, 1, 6),
	},
	{
		firstName: "Emilia",
		lastName: "Portnoi",
		birthYear: 2015,
		email: "marianelazocco@hotmail.com",
		phone: "+541154832335",
		parentName: "Marianela Zocco",
		position: "volante",
		club: "GEBA",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 6),
	},
	{
		firstName: "Emilia",
		lastName: "Hernando",
		birthYear: 2015,
		email: "mvestebanez28@gmail.com",
		phone: "1149273446",
		parentName: "Tomas Hernando",
		position: "delantero",
		club: "GEBA",
		group: "grupo1",
		price: 170000,
		paymentMethod: "bank_transfer",
		discountType: "siblings_member",
		registrationDate: new Date(2026, 1, 7),
	},
	{
		firstName: "Hernando",
		lastName: "Hernando",
		birthYear: 2018,
		email: "mvestebanez28@gmail.com",
		phone: "1149273446",
		parentName: "Tomas Hernando",
		position: "delantero",
		club: "GEBA",
		group: "grupo1",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "siblings",
		registrationDate: new Date(2026, 1, 7),
	},
	{
		firstName: "Alma",
		lastName: "Grau",
		birthYear: 2011,
		email: "norbygrau@hotmail.com",
		phone: "+54 1167695542",
		parentName: "Norberto Grau",
		position: "delantero",
		club: "GEBA",
		group: "grupo2",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "member",
		registrationDate: new Date(2026, 1, 7),
	},
	{
		firstName: "Paloma",
		lastName: "Cordo Miranda",
		birthYear: 2014,
		email: "plantamurapau@gmail.com",
		phone: "+5491159956005",
		parentName: "Paula Plantamura",
		position: "volante",
		club: "Club Ferrocarril Gral San Martín",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 7),
	},
	{
		firstName: "Catalina",
		lastName: "Cuello",
		birthYear: 2015,
		email: "valerialf1803@gmail.com",
		phone: "+5491140425713",
		parentName: "Valeria Le Fosse",
		position: "volante",
		club: "San Martín",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 7),
	},
	{
		firstName: "Agustina",
		lastName: "Yovovich",
		birthYear: 2008,
		email: "agusyovo08@gmail.com",
		phone: "+54 9 2215 96-1905",
		parentName: "Jorge Yovovich",
		position: "volante",
		club: "Estudiantes de La Plata",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 8),
	},
	{
		firstName: "Maia",
		lastName: "Deluchi Marcellini",
		birthYear: 2008,
		email: "pablodeluchi@hotmail.com",
		phone: "+54 9 221 5898271",
		parentName: "Pablo Daniel Deluchi",
		position: "delantero",
		club: "EDLP",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 8),
	},
	{
		firstName: "Giovanna",
		lastName: "Fazio",
		birthYear: 2017,
		email: "aniusquia@hotmail.com",
		phone: "1133871978",
		parentName: "Analia Ahumada",
		position: "delantero",
		club: "Banco Ciudad",
		group: "grupo1",
		price: 180000,
		paymentMethod: "cash",
		discountType: "none",
		paidCash: 90000,
		paidTransfer: 90000,
		registrationDate: new Date(2026, 1, 8),
	},
	{
		firstName: "Kiara",
		lastName: "Fazio",
		birthYear: 2010,
		email: "aniusquia@hotmail.com",
		phone: "1133871978",
		parentName: "Analia Ahumada",
		position: "defensor",
		club: "Banco Ciudad",
		group: "grupo2",
		price: 180000,
		paymentMethod: "cash",
		discountType: "siblings",
		paidCash: 90000,
		paidTransfer: 90000,
		registrationDate: new Date(2026, 1, 8),
	},
	{
		firstName: "Salvador",
		lastName: "Knopoff Lupo",
		birthYear: 2017,
		email: "lupovictoria@gmail.com",
		phone: "1149381812",
		parentName: "Victoria Lupo",
		position: "defensor",
		club: "GEBA",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 9),
	},
	{
		firstName: "Julia",
		lastName: "Yannone",
		birthYear: 2013,
		email: "pferazza@gmail.com",
		phone: "1161023290",
		parentName: "Patricia Ferazza",
		position: "defensor",
		club: "Ciudad de Buenos Aires",
		group: "grupo2",
		price: 110000,
		paymentMethod: "bank_transfer",
		discountType: "member",
		notes: "SOLO LUNES",
		registrationDate: new Date(2026, 1, 9),
	},
	{
		firstName: "Guadalupe",
		lastName: "Lopez Pose",
		birthYear: 2014,
		email: "Charlylopez82@hotmail.com",
		phone: "1145656909",
		parentName: "Carlos Lopez",
		position: "volante",
		club: "San Martín",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		paidAmount: 180000,
		registrationDate: new Date(2026, 1, 9),
	},
	{
		firstName: "Delfina",
		lastName: "Lopez Pose",
		birthYear: 2012,
		email: "Charlylopez82@hotmail.com",
		phone: "1145656909",
		parentName: "Carlos Lopez",
		position: "volante",
		club: "San Martín",
		group: "grupo2",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "siblings",
		registrationDate: new Date(2026, 1, 9),
	},
	{
		firstName: "Isabella",
		lastName: "Gialleonardo",
		birthYear: 2008,
		email: "mlauramalacalza@hotmail.com",
		phone: "2215044615",
		parentName: "María Laura Malacalza",
		position: "delantero",
		club: "Estudiantes de La Plata",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 10),
	},
	{
		firstName: "Juana",
		lastName: "Macció",
		birthYear: 2013,
		email: "euge.repossi@gmail.com",
		phone: "1135776383",
		parentName: "María Eugenia Repossi",
		position: "delantero",
		club: "CASI",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		existingAthleteName: "Juana Maccio",
		registrationDate: new Date(2026, 1, 10),
	},
	{
		firstName: "Juana",
		lastName: "Portillo",
		birthYear: 2014,
		email: "paulapalazzo@yahoo.com.ar",
		phone: "+5491151371574",
		parentName: "Paula Palazzo",
		position: "volante",
		club: "GEBA",
		group: "grupo2",
		price: 200000,
		paymentMethod: "cash",
		discountType: "none",
		notes: "PAGA EN EFECTIVO",
		registrationDate: new Date(2026, 1, 10),
	},
	{
		firstName: "Lucia",
		lastName: "Devito",
		birthYear: 2011,
		email: "pilarpano@gmail.com",
		phone: "1150038150",
		parentName: "Pilar Pano",
		position: "delantero",
		club: "GEBA",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 10),
	},
	{
		firstName: "Elena",
		lastName: "Irrazabal",
		birthYear: 2010,
		email: "veronica_felice@hotmail.com",
		phone: "+542392615161",
		parentName: "Verónica Felice",
		position: "volante",
		club: "FBCA, Trenque Lauquen",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 11),
	},
	{
		firstName: "Felicitas",
		lastName: "Diaz Mayer",
		birthYear: 2010,
		email: "virmontana@gmail.com",
		phone: "1162808059",
		parentName: "Virginia Montanari",
		position: "defensor",
		club: "Pucará",
		group: "grupo2",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "group",
		registrationDate: new Date(2026, 1, 11),
	},
	{
		firstName: "Indio",
		lastName: "Diaz Marconi",
		birthYear: 2015,
		email: "rodrigodiazaran@gmail.com",
		phone: "+34665592819",
		parentName: "Rodrigo Diaz Aran",
		position: "volante",
		club: "Barcelona",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 12),
	},
	{
		firstName: "Delfina",
		lastName: "Tablado",
		birthYear: 2014,
		email: "Cristiantablado@gmail.com",
		phone: "+541158960396",
		parentName: "Cristian Tablado",
		position: "volante",
		club: "Club Italiano",
		group: "grupo1",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "siblings",
		registrationDate: new Date(2026, 1, 12),
	},
	{
		firstName: "Emilia",
		lastName: "Tablado",
		birthYear: 2017,
		email: "Cristiantablado@gmail.com",
		phone: "+541158960396",
		parentName: "Cristian Tablado",
		position: "defensor",
		club: "Club Italiano",
		group: "grupo1",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "siblings",
		registrationDate: new Date(2026, 1, 12),
	},
	{
		firstName: "Julieta Pilar",
		lastName: "Crudo",
		birthYear: 2014,
		email: "carolinaretamozo.jv@gmail.com",
		phone: "1165679103",
		parentName: "Carolina Retamozo",
		position: "defensor",
		club: "Club Italiano",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 12),
	},
	{
		firstName: "Mila",
		lastName: "Barloqui Vega",
		birthYear: 2015,
		email: "soymilabv@gmail.com",
		phone: "1154040893",
		parentName: "Manuela Vega",
		position: "defensor",
		club: "Italiano",
		group: "grupo1",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 12),
	},
	{
		firstName: "Bernardita",
		lastName: "Mori",
		birthYear: 2010,
		email: "gmacgaw@hotmail.com",
		phone: "54 11 61417562",
		parentName: "Georgina Mac Gaw",
		position: "defensor",
		club: "Pucará",
		group: "grupo2",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "group",
		registrationDate: new Date(2026, 1, 12),
	},
	{
		firstName: "Pilar",
		lastName: "Quinteros",
		birthYear: 2012,
		email: "lauraairoldi@yahoo.com.ar",
		phone: "+5491153111859",
		parentName: "Laura Airoldi",
		position: "delantero",
		club: "GEBA",
		group: "grupo2",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "siblings",
		registrationDate: new Date(2026, 1, 13),
	},
	{
		firstName: "Guadalupe",
		lastName: "Quinteros",
		birthYear: 2012,
		email: "lauraairoldi@yahoo.com.ar",
		phone: "+5491153111859",
		parentName: "Laura Airoldi",
		position: "delantero",
		club: "",
		group: "grupo2",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "siblings",
		registrationDate: new Date(2026, 1, 13),
	},
	{
		firstName: "Miranda",
		lastName: "Kovacs",
		birthYear: 2011,
		email: "karinagrasso@yahoo.com.ar",
		phone: "541134974973",
		parentName: "Karina Grasso",
		position: "volante",
		club: "GEBA",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 13),
	},
	{
		firstName: "Juan Martín",
		lastName: "Cerdeira",
		birthYear: 2014,
		email: "pablo.cerdeira@estudiocgl.com.ar",
		phone: "1154549681",
		parentName: "Pablo Anibal Cerdeira",
		position: "delantero",
		club: "GEBA",
		group: "grupo2",
		price: 180000,
		paymentMethod: "bank_transfer",
		discountType: "group",
		registrationDate: new Date(2026, 1, 13),
	},
	{
		firstName: "Farah",
		lastName: "Contador",
		birthYear: 2016,
		email: "fedecontador@hotmail.com",
		phone: "1137864817",
		parentName: "Federico Contador",
		position: "delantero",
		club: "BACRC",
		group: "grupo1",
		price: 180000,
		paymentMethod: "cash",
		discountType: "member",
		paidAmount: 0,
		notes: "NO PAGÓ",
		registrationDate: new Date(2026, 1, 13),
	},
	{
		firstName: "Gaston",
		lastName: "Villarreal",
		birthYear: 2013,
		email: "solerodriguezamaya@hotmail.com",
		phone: "1553144781",
		parentName: "Soledad Rodriguez",
		position: "delantero",
		club: "GEBA",
		group: "grupo2",
		price: 170000,
		paymentMethod: "bank_transfer",
		discountType: "siblings_member",
		registrationDate: new Date(2026, 1, 13),
	},
	{
		firstName: "Delfi",
		lastName: "Rubinska",
		birthYear: 2015,
		email: "selener.luciana@gmail.com",
		phone: "1131728444",
		parentName: "Luciana Selener",
		position: "delantero",
		club: "CISSAB",
		group: "grupo1",
		price: 200000,
		paymentMethod: "cash",
		discountType: "none",
		registrationDate: new Date(2026, 1, 13),
	},
	{
		firstName: "Renata",
		lastName: "Delger",
		birthYear: 2012,
		email: "majori13@hotmail.com",
		phone: "11 68651303",
		parentName: "Maria Josefina Rivero",
		position: "delantero",
		club: "St. Brendan's Hockey Club",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 13),
	},
	{
		firstName: "Antonio",
		lastName: "Teyechea Mendoza",
		birthYear: 2013,
		email: "mendoza.wendy@gmail.com",
		phone: "+5491131932938",
		parentName: "Wendy Mendoza",
		position: "volante",
		club: "GEBA",
		group: "grupo2",
		price: 180000,
		paymentMethod: "cash",
		discountType: "member",
		registrationDate: new Date(2026, 1, 14),
	},
	{
		firstName: "Juliana",
		lastName: "Sánchez",
		birthYear: 2013,
		email: "mairagonza@hotmail.com",
		phone: "1164771490",
		parentName: "Maira Gonzalez",
		position: "volante",
		club: "GEBA",
		group: "grupo2",
		price: 200000,
		paymentMethod: "bank_transfer",
		discountType: "none",
		registrationDate: new Date(2026, 1, 14),
	},
];

function getDiscountId(discountType: DiscountType): string | null {
	switch (discountType) {
		case "member":
			return DISCOUNT_MEMBER_ID;
		case "siblings":
			return DISCOUNT_SIBLINGS_ID;
		case "siblings_member":
			return DISCOUNT_SIBLINGS_MEMBER_ID;
		case "group":
			return DISCOUNT_GROUP_ID;
		default:
			return null;
	}
}

function getDiscountAmount(
	discountType: DiscountType,
	basePrice: number,
): number {
	switch (discountType) {
		case "member":
			return Math.round(basePrice * 0.1); // 10%
		case "siblings":
			return Math.round(basePrice * 0.1); // 10%
		case "siblings_member":
			return Math.round(basePrice * 0.15); // 15%
		case "group":
			return Math.round(basePrice * 0.1); // 10%
		default:
			return 0;
	}
}

/**
 * Seed Campus de Verano Febrero 2026 registrations and payments
 */
export async function seedRealLifeEventCampusFeb(): Promise<void> {
	const db = getDb();

	const spinner = p.spinner();
	spinner.start("Setting up Campus de Verano Febrero 2026 registrations...");

	// 1. Create pricing tier
	const existingTier = await db.query.eventPricingTierTable.findFirst({
		where: eq(schema.eventPricingTierTable.id, PRICING_TIER_ID),
	});

	if (!existingTier) {
		await db
			.insert(schema.eventPricingTierTable)
			.values({
				id: PRICING_TIER_ID,
				eventId: EVENT_CAMPUS_VERANO_FEB_ID,
				name: "General",
				description: "Precio general Campus de Verano Febrero 2026",
				tierType: "date_based",
				price: 20000000, // $200,000 ARS in centavos
				currency: "ARS",
				validFrom: new Date(2026, 0, 10),
				validUntil: new Date(2026, 1, 14),
				isActive: true,
				sortOrder: 1,
			})
			.onConflictDoNothing();
	}

	// 2. Create discounts
	const discountsToCreate = [
		{
			id: DISCOUNT_MEMBER_ID,
			name: "Jugadoras GOAT (10%)",
			description: "Descuento jugadoras GOAT (10%)",
			discountValue: 10,
		},
		{
			id: DISCOUNT_SIBLINGS_ID,
			name: "Hermanos (10%)",
			description: "Descuento por hermanos (10%)",
			discountValue: 10,
		},
		{
			id: DISCOUNT_SIBLINGS_MEMBER_ID,
			name: "Hermanos + GOAT (15%)",
			description: "Descuento por hermanos + jugadora GOAT (15%)",
			discountValue: 15,
		},
		{
			id: DISCOUNT_GROUP_ID,
			name: "Grupo grande (10%)",
			description: "Descuento por grupo grande (10%)",
			discountValue: 10,
		},
	];

	for (const discount of discountsToCreate) {
		const existing = await db.query.eventDiscountTable.findFirst({
			where: eq(schema.eventDiscountTable.id, discount.id),
		});

		if (!existing) {
			await db
				.insert(schema.eventDiscountTable)
				.values({
					id: discount.id,
					eventId: EVENT_CAMPUS_VERANO_FEB_ID,
					organizationId: REAL_LIFE_ORG_ID,
					name: discount.name,
					description: discount.description,
					discountMode: "automatic",
					discountValueType: "percentage",
					discountValue: discount.discountValue,
					isActive: true,
					priority: 1,
				})
				.onConflictDoNothing();
		}
	}

	// 3. Hash password for new athletes
	const { hashPassword } = await import("better-auth/crypto");
	const athleteHashedPassword = await hashPassword(ATHLETE_PASSWORD);

	let registrationsCreated = 0;
	let paymentsCreated = 0;
	let newAthletesCreated = 0;
	let newAthleteCounter = 0;

	const BASE_PRICE = 20000000; // $200,000 ARS in centavos
	const EVENT_NAME = "Campus de Verano Febrero 2026";

	for (let i = 0; i < REGISTRANTS.length; i++) {
		const reg = REGISTRANTS[i];
		if (!reg) continue;

		const regIndex = i + 1;
		const registrationId = registrationUUID(regIndex);

		// Check if registration already exists
		const existingReg = await db.query.eventRegistrationTable.findFirst({
			where: eq(schema.eventRegistrationTable.id, registrationId),
		});

		if (existingReg) continue;

		// Try to find existing athlete in the DB first
		const searchName =
			reg.existingAthleteName || `${reg.firstName} ${reg.lastName}`.trim();
		const existingAthleteIndex = findAthleteIndex(searchName);

		let athleteId: string;
		let athleteUserId: string;

		if (existingAthleteIndex >= 0) {
			// Known athlete from REAL_LIFE_ATHLETES - compute expected UUIDs
			const expectedAthleteId = existingAthleteUUID(existingAthleteIndex + 1);
			const expectedUserId = existingAthleteUserUUID(existingAthleteIndex + 1);

			// Verify athlete actually exists in DB
			const dbAthlete = await db.query.athleteTable.findFirst({
				where: eq(schema.athleteTable.id, expectedAthleteId),
			});

			if (dbAthlete) {
				athleteId = dbAthlete.id;
				athleteUserId = dbAthlete.userId ?? expectedUserId;
			} else {
				// Athlete not in DB - create user + account + member + athlete
				const knownAthlete = REAL_LIFE_ATHLETES[existingAthleteIndex]!;
				const knownName = knownAthlete.lastName
					? `${knownAthlete.firstName} ${knownAthlete.lastName}`
					: knownAthlete.firstName;
				const knownEmail = generateAthleteEmail(
					knownAthlete.firstName,
					knownAthlete.lastName,
					existingAthleteIndex,
				);

				// Check if user already exists by email
				const existingUser = await db.query.userTable.findFirst({
					where: eq(schema.userTable.email, knownEmail),
				});

				if (existingUser) {
					// User exists - find or create athlete record
					const existingAthRecord = await db.query.athleteTable.findFirst({
						where: and(
							eq(schema.athleteTable.organizationId, REAL_LIFE_ORG_ID),
							eq(schema.athleteTable.userId, existingUser.id),
						),
					});

					if (existingAthRecord) {
						athleteId = existingAthRecord.id;
						athleteUserId = existingUser.id;
					} else {
						await db
							.insert(schema.athleteTable)
							.values({
								id: expectedAthleteId,
								organizationId: REAL_LIFE_ORG_ID,
								userId: existingUser.id,
								sport: "Hockey",
								birthDate: new Date(reg.birthYear, 0, 1),
								level: "intermediate",
								status: "active",
								nationality: "Argentina",
							})
							.onConflictDoNothing();
						newAthletesCreated++;
						athleteId = expectedAthleteId;
						athleteUserId = existingUser.id;
					}
				} else {
					// Create full user + account + member + athlete
					const memberUUIDPrefix = "32000000-0000-4000-8000";
					const accountUUIDPrefix = "33000000-0000-4000-8000";
					const idx = existingAthleteIndex + 1;
					const idxHex = idx.toString(16).padStart(12, "0");
					const memberId = `${memberUUIDPrefix}-${idxHex}`;
					const accountId = `${accountUUIDPrefix}-${idxHex}`;

					await db
						.insert(schema.userTable)
						.values({
							id: expectedUserId,
							name: knownName,
							email: knownEmail,
							emailVerified: true,
							role: "user",
							onboardingComplete: true,
						})
						.onConflictDoNothing();

					await db
						.insert(schema.accountTable)
						.values({
							id: accountId,
							userId: expectedUserId,
							accountId: expectedUserId,
							providerId: "credential",
							password: athleteHashedPassword,
						})
						.onConflictDoNothing();

					await db
						.insert(schema.memberTable)
						.values({
							id: memberId,
							organizationId: REAL_LIFE_ORG_ID,
							userId: expectedUserId,
							role: "member",
						})
						.onConflictDoNothing();

					await db
						.insert(schema.athleteTable)
						.values({
							id: expectedAthleteId,
							organizationId: REAL_LIFE_ORG_ID,
							userId: expectedUserId,
							sport: "Hockey",
							birthDate: new Date(reg.birthYear, 0, 1),
							level: "intermediate",
							status: "active",
							nationality: "Argentina",
						})
						.onConflictDoNothing();
					newAthletesCreated++;

					athleteId = expectedAthleteId;
					athleteUserId = expectedUserId;
				}
			}
		} else {
			// Not in REAL_LIFE_ATHLETES - check if athlete already exists in DB
			// (e.g., from a previous run of this seed or created via the app)
			const registrantFullName = `${reg.firstName} ${reg.lastName}`.trim();
			const generatedEmail = generateAthleteEmail(
				reg.firstName,
				reg.lastName,
				0, // placeholder, we check by generated pattern
			);

			// Try to find an existing athlete by checking user table with the generated email pattern
			const existingUserByEmail = await db.query.userTable.findFirst({
				where: eq(schema.userTable.email, generatedEmail),
			});

			if (existingUserByEmail) {
				// User exists - find their athlete record in this org
				const existingAthleteRecord = await db.query.athleteTable.findFirst({
					where: and(
						eq(schema.athleteTable.organizationId, REAL_LIFE_ORG_ID),
						eq(schema.athleteTable.userId, existingUserByEmail.id),
					),
				});

				if (existingAthleteRecord) {
					// Athlete already exists in DB - reuse them
					athleteId = existingAthleteRecord.id;
					athleteUserId = existingUserByEmail.id;
				} else {
					// User exists but no athlete record - create athlete only
					newAthleteCounter++;
					const newAthId = newAthleteUUID(newAthleteCounter);

					await db
						.insert(schema.athleteTable)
						.values({
							id: newAthId,
							organizationId: REAL_LIFE_ORG_ID,
							userId: existingUserByEmail.id,
							sport: "Hockey",
							birthDate: new Date(reg.birthYear, 0, 1),
							level: "intermediate",
							status: "active",
							nationality: "Argentina",
						})
						.onConflictDoNothing();
					newAthletesCreated++;

					athleteId = newAthId;
					athleteUserId = existingUserByEmail.id;
				}
			} else {
				// Completely new athlete - create user, account, member, athlete
				newAthleteCounter++;
				const newUserId = newUserUUID(newAthleteCounter);
				const newMemberId = newMemberUUID(newAthleteCounter);
				const newAccountId = newAccountUUID(newAthleteCounter);
				const newAthId = newAthleteUUID(newAthleteCounter);

				await db
					.insert(schema.userTable)
					.values({
						id: newUserId,
						name: registrantFullName,
						email: generatedEmail,
						emailVerified: true,
						role: "user",
						onboardingComplete: true,
					})
					.onConflictDoNothing();

				await db
					.insert(schema.accountTable)
					.values({
						id: newAccountId,
						userId: newUserId,
						accountId: newUserId,
						providerId: "credential",
						password: athleteHashedPassword,
					})
					.onConflictDoNothing();

				await db
					.insert(schema.memberTable)
					.values({
						id: newMemberId,
						organizationId: REAL_LIFE_ORG_ID,
						userId: newUserId,
						role: "member",
					})
					.onConflictDoNothing();

				await db
					.insert(schema.athleteTable)
					.values({
						id: newAthId,
						organizationId: REAL_LIFE_ORG_ID,
						userId: newUserId,
						sport: "Hockey",
						birthDate: new Date(reg.birthYear, 0, 1),
						level: "intermediate",
						status: "active",
						nationality: "Argentina",
					})
					.onConflictDoNothing();
				newAthletesCreated++;

				athleteId = newAthId;
				athleteUserId = newUserId;
			}
		}

		// Calculate discount
		const discountId = getDiscountId(reg.discountType);
		const discountAmount = getDiscountAmount(reg.discountType, BASE_PRICE);

		// Convert price from pesos to centavos
		const price = reg.price * 100;

		// Determine paid amount (convert from pesos to centavos)
		let paidAmount: number;
		if (reg.paidAmount !== undefined) {
			paidAmount = reg.paidAmount * 100;
		} else if (reg.paidCash !== undefined && reg.paidTransfer !== undefined) {
			paidAmount = (reg.paidCash + reg.paidTransfer) * 100;
		} else {
			paidAmount = price;
		}

		// Determine registration status
		let status: "confirmed" | "pending_payment";
		if (reg.notes === "NO PAGÓ") {
			status = "pending_payment";
		} else {
			status = "confirmed";
		}

		const registrantName = `${reg.firstName} ${reg.lastName}`.trim();

		// Create registration
		await db
			.insert(schema.eventRegistrationTable)
			.values({
				id: registrationId,
				eventId: EVENT_CAMPUS_VERANO_FEB_ID,
				organizationId: REAL_LIFE_ORG_ID,
				registrationNumber: regIndex,
				athleteId,
				userId: athleteUserId,
				registrantName,
				registrantEmail: reg.email.toLowerCase(),
				registrantPhone: reg.phone,
				registrantBirthDate: new Date(reg.birthYear, 0, 1),
				emergencyContactName: reg.parentName,
				emergencyContactPhone: reg.phone,
				status,
				appliedPricingTierId: PRICING_TIER_ID,
				price,
				currency: "ARS",
				paidAmount,
				appliedDiscountId: discountId,
				discountAmount,
				notes: reg.notes || null,
				internalNotes: reg.group === "grupo1" ? "Grupo 1" : "Grupo 2",
				termsAcceptedAt: reg.registrationDate,
				registrationSource: "admin",
				registeredAt: reg.registrationDate,
				confirmedAt: status === "confirmed" ? reg.registrationDate : null,
			})
			.onConflictDoNothing();

		registrationsCreated++;

		// Create payment(s) if paid amount > 0
		if (paidAmount > 0) {
			if (reg.paidCash !== undefined && reg.paidTransfer !== undefined) {
				// Split payment: cash
				const cashPaymentId = eventPaymentUUID(regIndex * 2 - 1);
				const existingCashPayment =
					await db.query.trainingPaymentTable.findFirst({
						where: eq(schema.trainingPaymentTable.id, cashPaymentId),
					});

				if (!existingCashPayment) {
					await db
						.insert(schema.trainingPaymentTable)
						.values({
							id: cashPaymentId,
							type: "event",
							registrationId,
							athleteId,
							organizationId: REAL_LIFE_ORG_ID,
							amount: reg.paidCash! * 100,
							paidAmount: reg.paidCash! * 100,
							currency: "ARS",
							status: "paid",
							paymentMethod: "cash",
							paymentDate: reg.registrationDate,
							description: `${EVENT_NAME} - ${registrantName} (efectivo)`,
							notes: `Pago efectivo - ${registrantName}`,
						})
						.onConflictDoNothing();
					paymentsCreated++;
				}

				// Split payment: transfer
				const transferPaymentId = eventPaymentUUID(regIndex * 2);
				const existingTransferPayment =
					await db.query.trainingPaymentTable.findFirst({
						where: eq(schema.trainingPaymentTable.id, transferPaymentId),
					});

				if (!existingTransferPayment) {
					await db
						.insert(schema.trainingPaymentTable)
						.values({
							id: transferPaymentId,
							type: "event",
							registrationId,
							athleteId,
							organizationId: REAL_LIFE_ORG_ID,
							amount: reg.paidTransfer! * 100,
							paidAmount: reg.paidTransfer! * 100,
							currency: "ARS",
							status: "paid",
							paymentMethod: "bank_transfer",
							paymentDate: reg.registrationDate,
							description: `${EVENT_NAME} - ${registrantName} (transferencia)`,
							notes: `Pago transferencia - ${registrantName}`,
						})
						.onConflictDoNothing();
					paymentsCreated++;
				}
			} else {
				// Single payment
				const paymentId = eventPaymentUUID(regIndex * 2 - 1);
				const existingPayment = await db.query.trainingPaymentTable.findFirst({
					where: eq(schema.trainingPaymentTable.id, paymentId),
				});

				if (!existingPayment) {
					await db
						.insert(schema.trainingPaymentTable)
						.values({
							id: paymentId,
							type: "event",
							registrationId,
							athleteId,
							organizationId: REAL_LIFE_ORG_ID,
							amount: paidAmount,
							paidAmount,
							currency: "ARS",
							status: "paid",
							paymentMethod: reg.paymentMethod,
							paymentDate: reg.registrationDate,
							description: `${EVENT_NAME} - ${registrantName}`,
							notes: `Pago ${reg.paymentMethod === "cash" ? "efectivo" : "transferencia"} - ${registrantName}`,
						})
						.onConflictDoNothing();
					paymentsCreated++;
				}
			}
		}
	}

	// 4. Update event currentRegistrations count
	await db
		.update(schema.sportsEventTable)
		.set({ currentRegistrations: REGISTRANTS.length })
		.where(eq(schema.sportsEventTable.id, EVENT_CAMPUS_VERANO_FEB_ID));

	spinner.stop(
		`Campus Verano Feb: ${registrationsCreated} registrations, ${paymentsCreated} payments, ${newAthletesCreated} new athletes`,
	);
}
