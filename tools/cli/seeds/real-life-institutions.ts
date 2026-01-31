/**
 * Real-life institutions data for Hockey in Argentina
 * - Clubs from Torneo Metropolitano de Hockey (AAHBA)
 * - Provincial and National team selections
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RealLifeClub {
	id: string;
	name: string;
	shortName?: string;
	city: string;
	country: string;
	website?: string;
	notes?: string;
}

export interface RealLifeNationalTeam {
	id: string;
	name: string;
	country: string;
	category?: string;
	notes?: string;
}

// ============================================================================
// DETERMINISTIC UUIDs (prefix 40xxxxxx to avoid conflicts)
// ============================================================================

// Club UUIDs (40000000-40000100)
const CLUB_UUID_PREFIX = "40000000-0000-4000-8000";
function clubUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${CLUB_UUID_PREFIX}-${indexHex}`;
}

// National Team UUIDs (40001000-40002000)
const NATIONAL_TEAM_UUID_PREFIX = "40001000-0000-4000-8000";
function nationalTeamUUID(index: number): string {
	const indexHex = index.toString(16).padStart(12, "0");
	return `${NATIONAL_TEAM_UUID_PREFIX}-${indexHex}`;
}

// ============================================================================
// CLUBS - TORNEO METROPOLITANO DE HOCKEY (AAHBA)
// ============================================================================

/**
 * Clubs participating in the Torneo Metropolitano de Hockey
 * organized by Asociación Amateur de Hockey de Buenos Aires (AAHBA)
 */
export const METROPOLITANO_CLUBS: RealLifeClub[] = [
	// === ZONA NORTE ===
	{
		id: clubUUID(1),
		name: "Club Atlético San Isidro",
		shortName: "CASI",
		city: "San Isidro",
		country: "AR",
		website: "https://www.casi.org.ar",
		notes: "Fundado en 1902. Club tradicional de la zona norte.",
	},
	{
		id: clubUUID(2),
		name: "San Fernando Club",
		shortName: "San Fernando",
		city: "San Fernando",
		country: "AR",
		website: "https://www.sanfernandoclub.com.ar",
	},
	{
		id: clubUUID(3),
		name: "Club Newman",
		shortName: "Newman",
		city: "Benavídez",
		country: "AR",
		website: "https://www.clubnewman.com.ar",
		notes: "Uno de los clubes más importantes del hockey argentino.",
	},
	{
		id: clubUUID(4),
		name: "Hindú Club",
		shortName: "Hindú",
		city: "Don Torcuato",
		country: "AR",
		website: "https://www.hinduclub.com.ar",
		notes: "Club tradicional con fuerte presencia en hockey y rugby.",
	},
	{
		id: clubUUID(5),
		name: "Club Banco Provincia",
		shortName: "Banco Provincia",
		city: "San Isidro",
		country: "AR",
		website: "https://www.clubbancop.com.ar",
	},
	{
		id: clubUUID(6),
		name: "Club Universitario de Buenos Aires",
		shortName: "CUBA",
		city: "San Isidro",
		country: "AR",
		website: "https://www.cuba.org.ar",
	},
	{
		id: clubUUID(7),
		name: "Belgrano Athletic Club",
		shortName: "BAC",
		city: "Virreyes",
		country: "AR",
		website: "https://www.belgranoathletic.org.ar",
		notes: "Fundado en 1896. Uno de los clubes más antiguos.",
	},
	{
		id: clubUUID(8),
		name: "Club San Andrés",
		shortName: "San Andrés",
		city: "San Fernando",
		country: "AR",
		website: "https://www.clubsanandres.com.ar",
	},
	{
		id: clubUUID(9),
		name: "Olivos Rugby Club",
		shortName: "Olivos RC",
		city: "Olivos",
		country: "AR",
	},
	{
		id: clubUUID(10),
		name: "Club Municipalidad de Vicente López",
		shortName: "Municip. V. López",
		city: "Vicente López",
		country: "AR",
	},
	{
		id: clubUUID(11),
		name: "Tigre Rugby Club",
		shortName: "Tigre RC",
		city: "Tigre",
		country: "AR",
	},
	{
		id: clubUUID(12),
		name: "Regatas de Bella Vista",
		shortName: "Regatas BV",
		city: "Bella Vista",
		country: "AR",
	},
	// === ZONA OESTE ===
	{
		id: clubUUID(13),
		name: "Hurlingham Club",
		shortName: "Hurlingham",
		city: "Hurlingham",
		country: "AR",
		website: "https://www.hurlinghamclub.org.ar",
		notes: "Club tradicional del oeste, sede de importantes torneos.",
	},
	{
		id: clubUUID(14),
		name: "Club de Campo de Moreno",
		shortName: "CC Moreno",
		city: "Moreno",
		country: "AR",
	},
	{
		id: clubUUID(15),
		name: "DAOM",
		shortName: "DAOM",
		city: "Moreno",
		country: "AR",
		notes: "Defensores Argentina Oeste Moreno",
	},
	{
		id: clubUUID(16),
		name: "Club Los Matreros",
		shortName: "Los Matreros",
		city: "Moreno",
		country: "AR",
	},
	{
		id: clubUUID(17),
		name: "Santa Bárbara",
		shortName: "Santa Bárbara",
		city: "Pilar",
		country: "AR",
	},
	{
		id: clubUUID(18),
		name: "Italiano",
		shortName: "Italiano",
		city: "Palomar",
		country: "AR",
	},
	// === CAPITAL FEDERAL ===
	{
		id: clubUUID(19),
		name: "Club Ciudad de Buenos Aires",
		shortName: "CCBA",
		city: "Buenos Aires",
		country: "AR",
		website: "https://www.ccba.com.ar",
	},
	{
		id: clubUUID(20),
		name: "Gimnasia y Esgrima de Buenos Aires",
		shortName: "GEBA",
		city: "Buenos Aires",
		country: "AR",
		website: "https://www.gfreba.org.ar",
		notes: "Club Gimnasia y Esgrima Buenos Aires. Fundado en 1880.",
	},
	{
		id: clubUUID(21),
		name: "Buenos Aires Cricket & Rugby Club",
		shortName: "BACRC",
		city: "Buenos Aires",
		country: "AR",
	},
	{
		id: clubUUID(22),
		name: "Club Arquitectura",
		shortName: "Arquitectura",
		city: "Buenos Aires",
		country: "AR",
	},
	{
		id: clubUUID(23),
		name: "Club Comunicaciones",
		shortName: "Comunicaciones",
		city: "Buenos Aires",
		country: "AR",
	},
	{
		id: clubUUID(24),
		name: "Mitre",
		shortName: "Mitre",
		city: "Buenos Aires",
		country: "AR",
	},
	{
		id: clubUUID(25),
		name: "Club Atlético Vélez Sársfield",
		shortName: "Vélez",
		city: "Buenos Aires",
		country: "AR",
		website: "https://www.vfrlezsarsfield.com.ar",
	},
	{
		id: clubUUID(26),
		name: "Club Atlético River Plate",
		shortName: "River",
		city: "Buenos Aires",
		country: "AR",
		website: "https://www.cariverplate.com.ar",
		notes: "Sección Hockey del Club Atlético River Plate.",
	},
	// === ZONA SUR ===
	{
		id: clubUUID(27),
		name: "Lomas Athletic Club",
		shortName: "Lomas AC",
		city: "Lomas de Zamora",
		country: "AR",
		website: "https://www.lomasac.org.ar",
		notes: "Fundado en 1891. Uno de los clubes más tradicionales del sur.",
	},
	{
		id: clubUUID(28),
		name: "Quilmes Athletic Club",
		shortName: "Quilmes AC",
		city: "Quilmes",
		country: "AR",
	},
	{
		id: clubUUID(29),
		name: "Club San Cirano",
		shortName: "San Cirano",
		city: "Quilmes",
		country: "AR",
	},
	{
		id: clubUUID(30),
		name: "Club San Patricio",
		shortName: "San Patricio",
		city: "Quilmes",
		country: "AR",
	},
	{
		id: clubUUID(31),
		name: "SUTERH",
		shortName: "SUTERH",
		city: "Claypole",
		country: "AR",
		notes:
			"Sindicato Único de Trabajadores de Edificios de Renta y Horizontal.",
	},
	// === ZONA SUR - LA PLATA ===
	{
		id: clubUUID(32),
		name: "Club de Gimnasia y Esgrima La Plata",
		shortName: "GELP",
		city: "La Plata",
		country: "AR",
		website: "https://www.gimnasia.org.ar",
		notes: "El Lobo. Club tradicional de La Plata.",
	},
	{
		id: clubUUID(33),
		name: "Club Estudiantes de La Plata",
		shortName: "EDLP",
		city: "La Plata",
		country: "AR",
		website: "https://www.estudiantesdelaplata.com",
		notes: "El Pincha. Club tradicional de La Plata.",
	},
	{
		id: clubUUID(34),
		name: "Club Universitario de La Plata",
		shortName: "CULP",
		city: "La Plata",
		country: "AR",
	},
	{
		id: clubUUID(35),
		name: "La Plata Rugby Club",
		shortName: "LPRC",
		city: "La Plata",
		country: "AR",
	},
	// === OTROS CLUBES METROPOLITANO ===
	{
		id: clubUUID(36),
		name: "Club San Martín de Tours",
		shortName: "San Martín",
		city: "Bella Vista",
		country: "AR",
	},
	{
		id: clubUUID(37),
		name: "Sint Joris",
		shortName: "Sint Joris",
		city: "Moreno",
		country: "AR",
	},
	{
		id: clubUUID(38),
		name: "San Diego",
		shortName: "San Diego",
		city: "Buenos Aires",
		country: "AR",
	},
	{
		id: clubUUID(39),
		name: "Club Jockey de Buenos Aires",
		shortName: "Jockey",
		city: "San Isidro",
		country: "AR",
	},
	{
		id: clubUUID(40),
		name: "Villa Meglioli",
		shortName: "V. Meglioli",
		city: "Moreno",
		country: "AR",
	},
	{
		id: clubUUID(41),
		name: "Club El Nacional",
		shortName: "El Nacional",
		city: "Buenos Aires",
		country: "AR",
	},
	{
		id: clubUUID(42),
		name: "Club Banfield",
		shortName: "Banfield",
		city: "Banfield",
		country: "AR",
	},
	{
		id: clubUUID(43),
		name: "Club Lanús",
		shortName: "Lanús",
		city: "Lanús",
		country: "AR",
	},
	{
		id: clubUUID(44),
		name: "Club Atlético Belgrano",
		shortName: "Belgrano Zárate",
		city: "Zárate",
		country: "AR",
		notes: "Belgrano de Zárate",
	},
	{
		id: clubUUID(45),
		name: "Club Náutico Zárate",
		shortName: "Náutico Zárate",
		city: "Zárate",
		country: "AR",
	},
	// === INTERIOR - CLUBES DESTACADOS ===
	{
		id: clubUUID(46),
		name: "Jockey Club Córdoba",
		shortName: "Jockey Cba",
		city: "Córdoba",
		country: "AR",
		notes: "Principal club de hockey de Córdoba.",
	},
	{
		id: clubUUID(47),
		name: "Universidad Nacional de Córdoba",
		shortName: "UNC",
		city: "Córdoba",
		country: "AR",
	},
	{
		id: clubUUID(48),
		name: "Jockey Club Rosario",
		shortName: "Jockey Ros",
		city: "Rosario",
		country: "AR",
	},
	{
		id: clubUUID(49),
		name: "Duendes Rugby Club",
		shortName: "Duendes",
		city: "Rosario",
		country: "AR",
	},
	{
		id: clubUUID(50),
		name: "Gimnasia y Esgrima de Rosario",
		shortName: "GER",
		city: "Rosario",
		country: "AR",
	},
	{
		id: clubUUID(51),
		name: "Club Mendoza de Regatas",
		shortName: "Regatas Mza",
		city: "Mendoza",
		country: "AR",
	},
	{
		id: clubUUID(52),
		name: "Los Tordos Hockey Club",
		shortName: "Los Tordos",
		city: "Mendoza",
		country: "AR",
	},
	{
		id: clubUUID(53),
		name: "Jockey Club Tucumán",
		shortName: "Jockey Tuc",
		city: "San Miguel de Tucumán",
		country: "AR",
	},
	{
		id: clubUUID(54),
		name: "Cardenales Rugby Club",
		shortName: "Cardenales",
		city: "San Miguel de Tucumán",
		country: "AR",
	},
	{
		id: clubUUID(55),
		name: "Santa Fe Rugby Club",
		shortName: "Santa Fe RC",
		city: "Santa Fe",
		country: "AR",
	},
	{
		id: clubUUID(56),
		name: "CRAI",
		shortName: "CRAI",
		city: "Santa Fe",
		country: "AR",
		notes: "Club de Rugby Ateneo Inmaculada.",
	},
	{
		id: clubUUID(57),
		name: "Paraná Rowing Club",
		shortName: "Rowing Paraná",
		city: "Paraná",
		country: "AR",
	},
	{
		id: clubUUID(58),
		name: "Jockey Club Mar del Plata",
		shortName: "Jockey MdP",
		city: "Mar del Plata",
		country: "AR",
	},
	{
		id: clubUUID(59),
		name: "Mar del Plata Club",
		shortName: "MdP Club",
		city: "Mar del Plata",
		country: "AR",
	},
	{
		id: clubUUID(60),
		name: "Universitario de Bahía Blanca",
		shortName: "Uni BB",
		city: "Bahía Blanca",
		country: "AR",
	},
];

// ============================================================================
// NATIONAL TEAMS - SELECCIONADOS
// ============================================================================

/**
 * National and Provincial team selections for hockey
 */
export const NATIONAL_TEAMS: RealLifeNationalTeam[] = [
	// === SELECCIÓN ARGENTINA (CAH) ===
	{
		id: nationalTeamUUID(1),
		name: "Selección Argentina Femenina",
		country: "AR",
		category: "Senior",
		notes: "Las Leonas - Selección Argentina de Hockey sobre Césped Femenino.",
	},
	{
		id: nationalTeamUUID(2),
		name: "Selección Argentina Masculina",
		country: "AR",
		category: "Senior",
		notes: "Los Leones - Selección Argentina de Hockey sobre Césped Masculino.",
	},
	{
		id: nationalTeamUUID(3),
		name: "Selección Argentina Junior Femenina",
		country: "AR",
		category: "Junior",
		notes: "Las Leoncitas - Categoría Sub-21 Femenino.",
	},
	{
		id: nationalTeamUUID(4),
		name: "Selección Argentina Junior Masculina",
		country: "AR",
		category: "Junior",
		notes: "Los Leoncitos - Categoría Sub-21 Masculino.",
	},
	{
		id: nationalTeamUUID(5),
		name: "Selección Argentina Sub-18 Femenina",
		country: "AR",
		category: "Juvenil A",
		notes: "Categoría Sub-18 Femenino - Juvenil A.",
	},
	{
		id: nationalTeamUUID(6),
		name: "Selección Argentina Sub-18 Masculina",
		country: "AR",
		category: "Juvenil A",
		notes: "Categoría Sub-18 Masculino - Juvenil A.",
	},
	{
		id: nationalTeamUUID(7),
		name: "Selección Argentina Sub-16 Femenina",
		country: "AR",
		category: "Juvenil B",
		notes: "Categoría Sub-16 Femenino - Juvenil B.",
	},
	{
		id: nationalTeamUUID(8),
		name: "Selección Argentina Sub-16 Masculina",
		country: "AR",
		category: "Juvenil B",
		notes: "Categoría Sub-16 Masculino - Juvenil B.",
	},
	{
		id: nationalTeamUUID(9),
		name: "Selección Argentina Sub-14 Femenina",
		country: "AR",
		category: "Menor",
		notes: "Categoría Sub-14 Femenino - Menores.",
	},
	{
		id: nationalTeamUUID(10),
		name: "Selección Argentina Sub-14 Masculina",
		country: "AR",
		category: "Menor",
		notes: "Categoría Sub-14 Masculino - Menores.",
	},
	// === SELECCIONADOS PROVINCIALES ===
	{
		id: nationalTeamUUID(20),
		name: "Selección Buenos Aires",
		country: "AR",
		category: "Provincial",
		notes: "AAHBA - Asociación Amateur de Hockey de Buenos Aires.",
	},
	{
		id: nationalTeamUUID(21),
		name: "Selección Santa Fe",
		country: "AR",
		category: "Provincial",
		notes: "Asociación Santafesina de Hockey.",
	},
	{
		id: nationalTeamUUID(22),
		name: "Selección Córdoba",
		country: "AR",
		category: "Provincial",
		notes: "Asociación Cordobesa de Hockey.",
	},
	{
		id: nationalTeamUUID(23),
		name: "Selección Mendoza",
		country: "AR",
		category: "Provincial",
		notes: "Asociación Mendocina de Hockey.",
	},
	{
		id: nationalTeamUUID(24),
		name: "Selección Tucumán",
		country: "AR",
		category: "Provincial",
		notes: "Asociación Tucumana de Hockey.",
	},
	{
		id: nationalTeamUUID(25),
		name: "Selección Entre Ríos",
		country: "AR",
		category: "Provincial",
		notes: "Asociación Entrerriana de Hockey.",
	},
	{
		id: nationalTeamUUID(26),
		name: "Selección Litoral",
		country: "AR",
		category: "Provincial",
		notes: "Asociación de Hockey del Litoral (Santa Fe capital y alrededores).",
	},
	{
		id: nationalTeamUUID(27),
		name: "Selección Mar del Plata",
		country: "AR",
		category: "Provincial",
		notes: "Asociación Marplatense de Hockey.",
	},
	{
		id: nationalTeamUUID(28),
		name: "Selección Bahía Blanca",
		country: "AR",
		category: "Provincial",
		notes: "Asociación Bahiense de Hockey.",
	},
	{
		id: nationalTeamUUID(29),
		name: "Selección Sur",
		country: "AR",
		category: "Provincial",
		notes: "Asociación de Hockey del Sur (Patagonia).",
	},
	{
		id: nationalTeamUUID(30),
		name: "Selección Salta",
		country: "AR",
		category: "Provincial",
		notes: "Asociación Salteña de Hockey.",
	},
	{
		id: nationalTeamUUID(31),
		name: "Selección Nordeste",
		country: "AR",
		category: "Provincial",
		notes:
			"Asociación de Hockey del Nordeste (Corrientes, Chaco, Misiones, Formosa).",
	},
	{
		id: nationalTeamUUID(32),
		name: "Selección Cuyo",
		country: "AR",
		category: "Provincial",
		notes: "Asociación de Hockey de Cuyo (San Juan, San Luis).",
	},
	{
		id: nationalTeamUUID(33),
		name: "Selección Río Negro",
		country: "AR",
		category: "Provincial",
		notes: "Asociación Rionegrina de Hockey.",
	},
	{
		id: nationalTeamUUID(34),
		name: "Selección Neuquén",
		country: "AR",
		category: "Provincial",
		notes: "Asociación Neuquina de Hockey.",
	},
];

// Export counts for reference
export const METROPOLITANO_CLUBS_COUNT = METROPOLITANO_CLUBS.length;
export const NATIONAL_TEAMS_COUNT = NATIONAL_TEAMS.length;
