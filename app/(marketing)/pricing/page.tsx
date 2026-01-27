import { RocketIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CtaSection } from "@/components/marketing/sections/cta-section";
import { FaqSection } from "@/components/marketing/sections/faq-section";
import { PricingSection } from "@/components/marketing/sections/pricing-section";
import { appConfig } from "@/config/app.config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Precios",
	description: `Precios simples y transparentes para ${appConfig.appName}. Elige el plan que mejor se adapte a tus necesidades.`,
};

const pricingFaq = {
	headline: "Preguntas Frecuentes",
	items: [
		{
			question: "Necesito tarjeta de credito para la prueba gratuita?",
			answer:
				"No se requiere tarjeta de credito para comenzar tu prueba gratuita. Puedes explorar todas las funcionalidades durante 14 dias antes de elegir un plan.",
		},
		{
			question: "Todo mi equipo puede usar la misma cuenta?",
			answer:
				"Si! Todos los planes soportan multiples miembros del equipo. El numero de usuarios varia segun el plan y puedes agregar mas miembros a medida que tu equipo crece.",
		},
		{
			question: "Que metodos de pago aceptan?",
			answer:
				"Aceptamos las principales tarjetas de credito (Visa, Mastercard y American Express) y podemos gestionar facturacion para planes anuales en nuestro nivel Pro.",
		},
		{
			question: "Puedo cambiar de plan despues?",
			answer:
				"Por supuesto. Puedes actualizar o reducir tu plan en cualquier momento. Los cambios se aplican inmediatamente y ajustaremos la facturacion de forma proporcional.",
		},
	],
};

const ctaContent = {
	headline: "Tienes mas preguntas?",
	description:
		"Habla con alguien de nuestro equipo de ventas que puede ayudarte a encontrar el plan adecuado para tus necesidades.",
	primaryCta: {
		text: "Contactanos",
		href: `mailto:${appConfig.contact.email}`,
	},
	secondaryCta: {
		text: "Agendar demo",
		href: "/contact",
	},
};

export default function PricingPage() {
	return (
		<main className="isolate overflow-clip">
			{/* Hero Section */}
			<section className="py-16 pt-32 lg:pt-40" id="pricing">
				<div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 text-center md:max-w-3xl lg:max-w-7xl lg:px-10">
					<h1
						className={cn(
							"text-balance font-display text-5xl leading-12 tracking-tight",
							"text-marketing-fg",
							"sm:text-[5rem] sm:leading-20",
						)}
					>
						Precios
					</h1>
					<div className="max-w-xl text-lg leading-8 text-marketing-fg-muted">
						<p>
							Precios simples y transparentes que escalan con tu organizacion.
							Comienza gratis y actualiza cuando lo necesites.
						</p>
					</div>
				</div>
			</section>

			{/* Pricing Cards with Beta Overlay */}
			<section className="relative py-8">
				{/* Beta Overlay */}
				<div className="absolute inset-0 z-10 flex items-center justify-center">
					<div className="mx-6 max-w-2xl rounded-2xl bg-white/95 dark:bg-slate-900/95 p-8 md:p-12 text-center shadow-2xl border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
						<div className="flex justify-center mb-6">
							<div className="flex size-16 items-center justify-center rounded-full bg-[#6b8fa3]/10">
								<RocketIcon className="size-8 text-[#6b8fa3]" />
							</div>
						</div>
						<div className="inline-flex items-center gap-2 rounded-full bg-[#6b8fa3]/10 px-4 py-1.5 text-sm font-semibold text-[#6b8fa3] mb-4">
							Beta Activa
						</div>
						<h2
							className={cn(
								"text-pretty font-display text-2xl leading-8 tracking-tight",
								"text-marketing-fg",
								"sm:text-3xl sm:leading-10",
							)}
						>
							Acceso Gratuito Durante la Beta
						</h2>
						<p className="mt-4 text-marketing-fg-muted max-w-lg mx-auto">
							Estamos en fase beta activa. Durante este periodo, todas las
							funcionalidades estan disponibles de forma gratuita. Crea tu
							cuenta y comienza a usar {appConfig.appName} sin costo.
						</p>
						<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
							<Link
								href="/athlete-signup"
								className={cn(
									"inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold",
									"bg-[#6b8fa3] text-white hover:bg-[#5a7a8a]",
									"transition-colors",
								)}
							>
								Crear Cuenta Gratis
							</Link>
							<Link
								href={`mailto:${appConfig.contact.email}?subject=Consulta Beta`}
								className={cn(
									"inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold",
									"text-marketing-fg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800",
									"transition-colors",
								)}
							>
								Contactar
							</Link>
						</div>
					</div>
				</div>

				{/* Blurred Pricing Behind */}
				<div
					className="blur-sm opacity-40 pointer-events-none select-none"
					aria-hidden="true"
				>
					<PricingSection
						headline=""
						showFreePlans={true}
						showEnterprisePlans={false}
						defaultInterval="month"
					/>
				</div>
			</section>

			{/* FAQ */}
			<FaqSection content={pricingFaq} />

			{/* CTA */}
			<CtaSection content={ctaContent} centered />
		</main>
	);
}
