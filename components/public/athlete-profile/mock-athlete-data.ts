import type {
	AchievementScope,
	AchievementType,
	AthleteOpportunityType,
	LanguageProficiencyLevel,
} from "@/lib/db/schema/enums";

/**
 * Mock data: Catalina "Cata" Domínguez Etcheverry
 * 16 años - Defensora Central - Hockey Femenino Alto Rendimiento
 * Selección Argentina Sub-17
 */
export const MOCK_ATHLETE_DATA = {
	athlete: {
		id: "fa4e0000-0000-4000-8000-000000000001",
		sport: "hockey",
		birthDate: new Date("2010-04-17T00:00:00Z"),
		level: "elite",
		status: "active",
		height: 168,
		weight: 58,
		dominantFoot: "right",
		dominantHand: "right",
		nationality: "Argentina",
		position: "Defensora Central",
		secondaryPosition: "Volante",
		jerseyNumber: 4,
		bio: "Defensora central con gran capacidad de lectura de juego y excelente salida desde el fondo. Capitana de la Sub-17 de mi club y convocada a la Selección Argentina Sub-17. Destaco por mi liderazgo, temple bajo presión y habilidad en córners cortos defensivos. 8 años de experiencia en hockey competitivo, con participación internacional desde 2025. Mi objetivo es llegar a Las Leonas y conseguir una beca universitaria en el exterior para combinar deporte y estudios.",
		yearsOfExperience: 8,
		currentClub: {
			id: "fa4e0000-0000-4000-8000-000000000010",
			name: "Club Atlético San Andrés",
		},
		currentNationalTeam: {
			id: "fa4e0000-0000-4000-8000-000000000011",
			name: "Selección Argentina Femenina Sub-17",
			category: "Sub-17",
		},
		category: "Sub-17",
		residenceCity: "San Isidro",
		residenceCountry: "Argentina",
		youtubeVideos: [
			"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		],
		educationInstitution: "Colegio Nacional de Buenos Aires",
		educationYear: "4to año",
		gpa: "8.75",
		socialInstagram: "cata.dominguez.hockey",
		socialTwitter: "catadominguez04",
		socialTiktok: "cata.hockey4",
		socialLinkedin: null,
		socialFacebook: null,
		coverPhotoUrl: null,
		isPublicProfile: true,
		opportunityTypes: [
			"professional_team",
			"university_scholarship",
			"tryouts",
		] as AthleteOpportunityType[],
		user: {
			id: "fa4e0000-0000-4000-8000-000000000002",
			name: "Catalina Domínguez Etcheverry",
			image: null,
		},
	},

	careerHistory: [
		{
			id: "ch-001",
			club: null,
			nationalTeam: {
				id: "fa4e0000-0000-4000-8000-000000000011",
				name: "Selección Argentina Femenina Sub-17",
				category: "Sub-17",
			},
			startDate: new Date("2025-04-01T00:00:00Z"),
			endDate: null,
			position: "Defensora Central",
			achievements:
				"Primera convocatoria abril 2025. Titular en Sudamericano Sub-17 Chile 2025. 8 caps internacionales. Campeona sudamericana.",
		},
		{
			id: "ch-002",
			club: {
				id: "fa4e0000-0000-4000-8000-000000000010",
				name: "Club Atlético San Andrés",
			},
			nationalTeam: null,
			startDate: new Date("2023-07-01T00:00:00Z"),
			endDate: null,
			position: "Defensora Central",
			achievements:
				"Capitana Sub-17. Campeona Metropolitano Sub-16 (2024). MVP Final Metropolitano Sub-16. Mejor defensora Metropolitano Sub-17 (2025). Defensa menos vencida del torneo.",
		},
		{
			id: "ch-003",
			club: {
				id: "ch-club-gelp",
				name: "Gimnasia y Esgrima La Plata",
			},
			nationalTeam: null,
			startDate: new Date("2021-01-01T00:00:00Z"),
			endDate: new Date("2023-06-30T00:00:00Z"),
			position: "Volante / Defensora",
			achievements:
				"Campeona Sub-12 Provincial 2022. Formación en divisiones infantiles. Seleccionada para campus provincial.",
		},
		{
			id: "ch-004",
			club: {
				id: "ch-club-inicio",
				name: "Club Social y Deportivo Acassuso",
			},
			nationalTeam: null,
			startDate: new Date("2018-03-01T00:00:00Z"),
			endDate: new Date("2020-12-31T00:00:00Z"),
			position: "Mediocampista",
			achievements:
				"Inicio en hockey a los 8 años. Mejor compañera 2019. Participación en torneos interclub zona norte.",
		},
	],

	languages: [
		{
			id: "lang-001",
			language: "es",
			level: "native" as LanguageProficiencyLevel,
		},
		{
			id: "lang-002",
			language: "en",
			level: "intermediate" as LanguageProficiencyLevel,
		},
		{
			id: "lang-003",
			language: "pt",
			level: "basic" as LanguageProficiencyLevel,
		},
	],

	references: [
		{
			id: "ref-001",
			name: "Alejandra Gulla",
			relationship: "Head Coach",
			organization: "Club Atlético San Andrés",
			position: "DT Hockey Femenino Sub-17 y Sub-19",
			testimonial:
				"Catalina es la defensora más completa que entrené en mis 15 años de carrera en formativas. Combina inteligencia táctica con una determinación feroz. Tiene todo para llegar a la Selección Mayor.",
			skillsHighlighted: [
				"Liderazgo",
				"Lectura de juego",
				"Salida desde el fondo",
				"Córner corto",
				"Comunicación",
			],
			isVerified: true,
		},
		{
			id: "ref-002",
			name: "Carlos Retegui",
			relationship: "Coordinador de Selecciones Juveniles",
			organization: "Confederación Argentina de Hockey",
			position: "Coordinador de Selecciones Juveniles",
			testimonial:
				"Una jugadora con madurez impropia para su edad. En el Sudamericano Sub-17 demostró que puede resolver bajo presión. La tenemos en el radar para el proceso Sub-21.",
			skillsHighlighted: [
				"Temple",
				"Anticipación",
				"Pase largo",
				"Marca",
				"Versatilidad",
			],
			isVerified: true,
		},
		{
			id: "ref-003",
			name: "Prof. Marcela Insúa",
			relationship: "Preparadora Física",
			organization: "CeNARD",
			position: "Preparadora Física Selecciones Juveniles",
			testimonial:
				"Catalina tiene valores físicos excepcionales para su edad. Su VO2max y potencia de piernas están en el percentil 95 para jugadoras Sub-17. Además, es muy disciplinada con el plan de trabajo.",
			skillsHighlighted: [
				"Resistencia aeróbica",
				"Potencia",
				"Agilidad",
				"Disciplina",
				"Recuperación",
			],
			isVerified: false,
		},
	],

	sponsors: [
		{
			id: "sp-001",
			name: "Adidas Hockey",
			logoKey: null,
			logoUrl: null,
			website: "https://www.adidas.com.ar",
			description: "Sponsor técnico - Indumentaria y calzado de hockey",
			partnershipType: "technical",
			startDate: new Date("2025-06-01T00:00:00Z"),
			endDate: new Date("2026-12-31T00:00:00Z"),
		},
		{
			id: "sp-002",
			name: "Grays Hockey",
			logoKey: null,
			logoUrl: null,
			website: "https://www.grays-hockey.com",
			description: "Palos y equipamiento de hockey",
			partnershipType: "equipment",
			startDate: new Date("2025-01-01T00:00:00Z"),
			endDate: new Date("2026-06-30T00:00:00Z"),
		},
	],

	achievements: [
		{
			id: "ach-001",
			title: "Campeona Sudamericano Sub-17",
			type: "championship" as AchievementType,
			scope: "collective" as AchievementScope,
			year: 2025,
			organization: "Confederación Sudamericana de Hockey",
			team: "Selección Argentina Sub-17",
			competition: "Sudamericano Femenino Sub-17 - Santiago, Chile",
			position: "1er lugar",
			description:
				"Titular en los 5 partidos. Argentina venció a Brasil 2-1 en la final. 0 goles en contra en fase de grupos.",
		},
		{
			id: "ach-002",
			title: "Convocatoria Selección Argentina Sub-17",
			type: "selection" as AchievementType,
			scope: "individual" as AchievementScope,
			year: 2025,
			organization: "Confederación Argentina de Hockey",
			team: "Selección Argentina Sub-17",
			competition: null,
			position: null,
			description:
				"Seleccionada entre +200 jugadoras evaluadas a nivel nacional. Una de las 22 convocadas para el proceso Sub-17.",
		},
		{
			id: "ach-003",
			title: "Mejor Defensora - Metropolitano Sub-17",
			type: "best_player" as AchievementType,
			scope: "individual" as AchievementScope,
			year: 2025,
			organization: "Asociación de Hockey de Buenos Aires",
			team: "Club Atlético San Andrés",
			competition: "Torneo Metropolitano Femenino Sub-17 - AHB",
			position: "Mejor defensora",
			description:
				"Elegida por el panel de coaches como la mejor defensora del torneo. Lideró la defensa menos vencida del campeonato.",
		},
		{
			id: "ach-004",
			title: "Campeona Metropolitano Sub-16",
			type: "championship" as AchievementType,
			scope: "collective" as AchievementScope,
			year: 2024,
			organization: "Asociación de Hockey de Buenos Aires",
			team: "Club Atlético San Andrés",
			competition: "Torneo Metropolitano Femenino Sub-16 - AHB",
			position: "1er lugar",
			description:
				"Invictas todo el torneo. 32 goles a favor, 4 en contra en 12 partidos.",
		},
		{
			id: "ach-005",
			title: "MVP Final Metropolitano Sub-16",
			type: "mvp" as AchievementType,
			scope: "individual" as AchievementScope,
			year: 2024,
			organization: "Asociación de Hockey de Buenos Aires",
			team: "Club Atlético San Andrés",
			competition: "Final Metropolitano Femenino Sub-16",
			position: "MVP del partido",
			description:
				"Gol de córner corto y asistencia en la final. Designada jugadora del partido por árbitros.",
		},
		{
			id: "ach-006",
			title: "Beca Deportiva CNBA",
			type: "scholarship" as AchievementType,
			scope: "individual" as AchievementScope,
			year: 2025,
			organization: "Colegio Nacional de Buenos Aires",
			team: null,
			competition: null,
			position: null,
			description:
				"Beca del 50% por mérito deportivo y académico. Promedio superior a 8.5 y representación internacional.",
		},
		{
			id: "ach-007",
			title: "Promesa del Hockey Argentino",
			type: "recognition" as AchievementType,
			scope: "individual" as AchievementScope,
			year: 2025,
			organization: "Revista El Gráfico",
			team: null,
			competition: null,
			position: null,
			description:
				"Incluida en el listado de '10 Promesas del Hockey Femenino Argentino'.",
		},
		{
			id: "ach-008",
			title: "Campeona Provincial Sub-12",
			type: "championship" as AchievementType,
			scope: "collective" as AchievementScope,
			year: 2022,
			organization: "Federación de Hockey de Buenos Aires",
			team: "Gimnasia y Esgrima La Plata",
			competition: "Torneo Provincial Sub-12 Femenino",
			position: "1er lugar",
			description:
				"Primer título provincial con GELP. Goleadora del equipo con 6 goles en el torneo.",
		},
	],
};
