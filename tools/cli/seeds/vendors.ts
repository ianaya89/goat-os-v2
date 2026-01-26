import { eq } from "drizzle-orm";
import type { DrizzleClient } from "@/lib/db/types";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";
import { ENTITY_VENDOR, seedUUID } from "./utils";

const vendorNames = [
	"Catering El Buen Sabor",
	"Transporte Rápido SA",
	"Seguridad Integral",
	"Audio Visual Pro",
	"Impresiones Express",
	"Carpas y Estructuras",
	"Limpieza Total",
	"Fotografía Deportiva",
	"Medical Team SA",
	"Logística Eventos",
	"Iluminación Pro",
	"Generadores Norte",
];

const vendorDescriptions = [
	"Servicio de catering para eventos deportivos",
	"Transporte de equipos y participantes",
	"Seguridad privada y control de acceso",
	"Equipamiento audiovisual profesional",
	"Impresión de credenciales y cartelería",
	"Estructuras temporales y carpas",
	"Servicios de limpieza pre y post evento",
	"Cobertura fotográfica y video",
	"Servicio médico y ambulancias",
	"Gestión logística integral",
	"Sistemas de iluminación profesional",
	"Alquiler de grupos electrógenos",
];

const vendorCategories = [
	"catering",
	"transporte",
	"seguridad",
	"audiovisual",
	"impresion",
	"estructuras",
	"limpieza",
	"fotografia",
	"medico",
	"logistica",
	"iluminacion",
	"equipamiento",
];

const contactFirstNames = [
	"Jorge",
	"Silvia",
	"Eduardo",
	"Patricia",
	"Ricardo",
	"Claudia",
	"Gustavo",
	"Mónica",
];

const contactLastNames = [
	"Ramírez",
	"Morales",
	"Suárez",
	"Castro",
	"Vargas",
	"Mendoza",
	"Herrera",
	"Acosta",
];

const cities = [
	"Buenos Aires",
	"Córdoba",
	"Rosario",
	"Mendoza",
	"La Plata",
	"Mar del Plata",
];

const paymentTermsOptions = [
	"50% anticipo, 50% contra entrega",
	"Pago a 30 días",
	"Contado contra factura",
	"30% anticipo, 70% post evento",
	"Pago completo anticipado",
];

function generateEmail(vendorName: string, index: number): string {
	const domain = vendorName
		.toLowerCase()
		.replace(/\s+/g, "")
		.replace(/[^a-z0-9]/g, "");
	return `contacto@${domain}${index > 0 ? index : ""}.com.ar`;
}

function generatePhone(): string {
	return `+54 11 ${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateTaxId(): string {
	// Argentine CUIT format: XX-XXXXXXXX-X
	const prefix = 20 + Math.floor(Math.random() * 10);
	const body = Math.floor(10000000 + Math.random() * 90000000);
	const suffix = Math.floor(Math.random() * 10);
	return `${prefix}-${body}-${suffix}`;
}

export async function seedVendors(
	db: DrizzleClient,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	// Check for existing vendors
	const existingVendors = await db.query.eventVendorTable.findMany({
		where: eq(schema.eventVendorTable.organizationId, context.organizationId),
	});

	if (existingVendors.length >= count) {
		return existingVendors.slice(0, count).map((v: any) => v.id);
	}

	const existingNames = new Set(existingVendors.map((v: any) => v.name));
	const vendors: Array<typeof schema.eventVendorTable.$inferInsert> = [];

	const vendorIds: string[] = existingVendors.map((v: any) => v.id);

	for (let i = 0; i < count; i++) {
		const baseName = vendorNames[i % vendorNames.length] ?? "Proveedor";
		const name =
			i >= vendorNames.length
				? `${baseName} ${Math.floor(i / vendorNames.length) + 1}`
				: baseName;

		if (existingNames.has(name)) continue;

		const vendorId = seedUUID(ENTITY_VENDOR, i + 1);
		const firstName = contactFirstNames[i % contactFirstNames.length] ?? "Juan";
		const lastName = contactLastNames[i % contactLastNames.length] ?? "Pérez";
		const city = cities[i % cities.length] ?? "Buenos Aires";
		const category = vendorCategories[i % vendorCategories.length];

		// Rating distribution: mostly 4-5 stars
		const rating = i % 5 === 0 ? 3 : i % 3 === 0 ? 4 : 5;

		// Some vendors inactive
		const isActive = i % 7 !== 0;

		vendors.push({
			id: vendorId,
			organizationId: context.organizationId,
			name,
			description: vendorDescriptions[i % vendorDescriptions.length],
			contactName: `${firstName} ${lastName}`,
			email: generateEmail(baseName, Math.floor(i / vendorNames.length)),
			phone: generatePhone(),
			address: `Av. ${lastName} ${1000 + i * 100}`,
			city,
			websiteUrl:
				i % 2 === 0
					? `https://www.${baseName
							.toLowerCase()
							.replace(/\s+/g, "")
							.replace(/[^a-z0-9]/g, "")}.com.ar`
					: null,
			categories: JSON.stringify([category]),
			rating,
			taxId: generateTaxId(),
			paymentTerms: paymentTermsOptions[i % paymentTermsOptions.length] ?? null,
			notes:
				i % 4 === 0
					? "Proveedor preferente - excelente servicio"
					: i % 4 === 1
						? "Requiere reserva con 15 días de anticipación"
						: i % 4 === 2
							? "Descuento del 10% para eventos de más de 3 días"
							: null,
			isActive,
			createdBy: context.seedUserId,
		});

		vendorIds.push(vendorId);
	}

	// Insert all data
	if (vendors.length > 0) {
		await db
			.insert(schema.eventVendorTable)
			.values(vendors)
			.onConflictDoNothing();
	}

	return vendorIds;
}
