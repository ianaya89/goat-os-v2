import { CtaSection } from "@/components/marketing/sections/cta-section";
import { FaqSection } from "@/components/marketing/sections/faq-section";
import { FeaturesSection } from "@/components/marketing/sections/features-section";
import { HeroSection } from "@/components/marketing/sections/hero-section";
import { HowItWorksSection } from "@/components/marketing/sections/how-it-works-section";
import { StatsSection } from "@/components/marketing/sections/stats-section";
import { appConfig } from "@/config/app.config";

function OrganizationJsonLd() {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: appConfig.appName,
		description: appConfig.description,
		url: appConfig.baseUrl,
		logo: `${appConfig.baseUrl}/favicon.svg`,
		contactPoint: {
			"@type": "ContactPoint",
			email: appConfig.contact.email,
			telephone: appConfig.contact.phone,
			contactType: "customer service",
		},
		address: {
			"@type": "PostalAddress",
			streetAddress: appConfig.contact.address,
		},
	};

	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	);
}

function WebSiteJsonLd() {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: appConfig.appName,
		description: appConfig.description,
		url: appConfig.baseUrl,
		potentialAction: {
			"@type": "SearchAction",
			target: {
				"@type": "EntryPoint",
				urlTemplate: `${appConfig.baseUrl}/blog?q={search_term_string}`,
			},
			"query-input": "required name=search_term_string",
		},
	};

	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	);
}

export default function HomePage() {
	const faqContent = {
		headline: "Preguntas Frecuentes",
		items: [
			{
				question: "Como empiezo a usar GOAT OS?",
				answer:
					"Comenzar es simple. Crea tu cuenta gratuita, completa el proceso de onboarding y configura tu equipo en minutos.",
			},
			{
				question: "Ofrecen periodo de prueba?",
				answer:
					"Si, ofrecemos 14 dias de prueba gratuita con acceso completo a todas las funcionalidades. No requiere tarjeta de credito.",
			},
			{
				question: "Puedo gestionar multiples equipos?",
				answer:
					"Por supuesto. GOAT OS esta disenado para organizaciones multi-equipo. Puedes gestionar divisiones, categorias y grupos desde una sola cuenta.",
			},
			{
				question: "Que deportes soporta la plataforma?",
				answer:
					"Soportamos futbol, basquet, voleibol, rugby, hockey, atletismo, natacion y mas. Cada deporte tiene metricas y modulos especializados.",
			},
			{
				question: "Como protegen los datos de mis atletas?",
				answer:
					"La seguridad es nuestra prioridad. Usamos encriptacion de grado empresarial y cumplimos con normativas de proteccion de datos deportivos.",
			},
		],
	};

	const ctaContent = {
		headline: "Listo para transformar tu gestion deportiva?",
		description: "Crea tu cuenta gratuita hoy. No requiere tarjeta de credito.",
		primaryCta: {
			text: "Comenzar Prueba Gratis",
			href: "/auth/sign-up",
		},
		secondaryCta: {
			text: "Ver Precios",
			href: "/pricing",
		},
	};

	return (
		<>
			<OrganizationJsonLd />
			<WebSiteJsonLd />
			<HeroSection />
			<FeaturesSection />
			<HowItWorksSection />
			<StatsSection />
			<FaqSection content={faqContent} />
			<CtaSection content={ctaContent} />
		</>
	);
}
